import abc
import json
import logging
import os
from typing import Any, Dict, Optional

from pydantic import ValidationError

from app.config import settings
from app.schemas import ExtractionResult

logger = logging.getLogger(__name__)


EXTRACTION_SYSTEM_PROMPT = """You are a strict, objective meeting-intelligence analyst.
Extract actionable tasks, meeting summary, and key decisions from the provided meeting transcript.

Guidelines:
1. Every task must be concrete and actionable.
2. Assigner is the speaker giving or requesting the task.
3. Assignee is the person or role addressed to do the task.
4. Always provide the exact or closest quote as evidence_quote.
5. Provide the exact timestamp if available in the transcript (e.g. 00:12:40).
6. Set confidence score between 0.0 and 1.0. If ambiguous, set lower confidence (< 0.7).
7. If a verbal deadline was mentioned, capture it in deadline_suggestion.
8. Do not invent tasks that were not discussed.
9. Return pure JSON without markdown code fences or conversational text.
"""

EXTRACTION_USER_PROMPT_TEMPLATE = """Analyze the following meeting transcript and return a JSON object with this exact structure:
{{
  "summary": "Concise overview of the meeting",
  "decisions": ["Key decision 1", "Key decision 2"],
  "tasks": [
    {{
      "description": "Clear actionable task description",
      "assigner": "Person who assigned the task or null",
      "assignee": "Person tasked with doing it or null",
      "evidence_quote": "Direct quote from transcript",
      "evidence_timestamp": "MM:SS or HH:MM:SS timestamp from transcript",
      "confidence": 0.95,
      "deadline_suggestion": "by Friday 5pm or null"
    }}
  ]
}}

TRANSCRIPT:
{transcript}
"""


class LLMClient(abc.ABC):
    """Abstract interface for LLM providers."""

    @abc.abstractmethod
    def generate_json(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a response from the LLM parsed as a dictionary."""
        pass


class GeminiClient(LLMClient):
    """Gemini API implementation of LLMClient."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (
            api_key
            or os.environ.get("GEMINI_API_KEY")
            or settings.gemini_api_key
        )
        self._model = None

    def _get_model(self):
        if self._model is not None:
            return self._model

        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY is not configured in the environment."
            )

        import google.generativeai as genai

        genai.configure(api_key=self.api_key)
        self._model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"response_mime_type": "application/json"},
        )
        return self._model

    def generate_json(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Call Gemini and parse JSON output."""
        full_prompt = prompt
        if system_instruction:
            full_prompt = f"{system_instruction}\n\n{prompt}"

        model = self._get_model()
        response = model.generate_content(full_prompt)
        text = response.text.strip()

        # Clean markdown fences if present
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()

        return json.loads(text)


class MockLLMClient(LLMClient):
    """Deterministic mock client for offline development and testing."""

    def __init__(self, stub_response: Optional[Dict[str, Any]] = None):
        self.stub_response = stub_response or {
            "summary": "Team sync discussing Q3 roadmap and infrastructure deployment.",
            "decisions": [
                "Approved backend tech stack: FastAPI and SQLite.",
                "Agreed to finish Milestone 1 before moving to frontend.",
            ],
            "tasks": [
                {
                    "description": "Review the design guide and tokens",
                    "assigner": "Lead",
                    "assignee": "Alex",
                    "evidence_quote": "Alex, please review the design guide by tomorrow morning.",
                    "evidence_timestamp": "00:01:15",
                    "confidence": 0.95,
                    "deadline_suggestion": "tomorrow morning",
                },
                {
                    "description": "Deploy backend staging services",
                    "assigner": "Alex",
                    "assignee": "Sam",
                    "evidence_quote": "Sam, can you take care of the staging deployment by Friday?",
                    "evidence_timestamp": "00:04:30",
                    "confidence": 0.9,
                    "deadline_suggestion": "by Friday",
                },
            ],
        }

    def generate_json(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        return self.stub_response


def get_default_llm_client() -> LLMClient:
    """Instantiate the configured LLM client.

    Falls back to MockLLMClient if GEMINI_API_KEY is not set.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or settings.gemini_api_key
    if api_key and api_key.strip() and api_key != "your-gemini-api-key":
        return GeminiClient(api_key=api_key)
    logger.info("No valid GEMINI_API_KEY found. Using MockLLMClient.")
    return MockLLMClient()


def extract_tasks(
    transcript: str, client: Optional[LLMClient] = None
) -> ExtractionResult:
    """Extract tasks and summary from a transcript using the LLMClient interface.

    Validates output with Pydantic and performs one retry on failure.
    """
    if client is None:
        client = get_default_llm_client()

    prompt = EXTRACTION_USER_PROMPT_TEMPLATE.format(transcript=transcript)

    last_error: Optional[Exception] = None
    # Maximum 2 attempts (initial attempt + 1 retry)
    for attempt in range(2):
        try:
            raw_data = client.generate_json(
                prompt=prompt, system_instruction=EXTRACTION_SYSTEM_PROMPT
            )
            validated = ExtractionResult.model_validate(raw_data)
            return validated
        except (json.JSONDecodeError, ValidationError, Exception) as err:
            last_error = err
            logger.warning(
                f"Task extraction attempt {attempt + 1} failed: {err}. Retrying once if available."
            )
            # On retry, append an explicit reminder
            prompt = (
                f"{prompt}\n\nIMPORTANT: Previous attempt failed with: {err}. "
                "Ensure valid JSON matching the exact schema."
            )

    raise RuntimeError(
        f"Task extraction failed after retry: {last_error}"
    ) from last_error
