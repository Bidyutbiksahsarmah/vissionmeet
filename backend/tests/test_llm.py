import json
import pytest

from app.llm import LLMClient, MockLLMClient, extract_tasks
from app.schemas import ExtractionResult


class TestLLMExtraction:
    """Tests for LLMClient and extract_tasks functionality."""

    def test_mock_client_extraction(self) -> None:
        client = MockLLMClient()
        transcript = "[00:01:00] Alice will check the deployment pipeline."
        result = extract_tasks(transcript, client=client)

        assert isinstance(result, ExtractionResult)
        assert len(result.tasks) >= 1
        assert result.tasks[0].description
        assert result.summary

    def test_extraction_retry_on_initial_failure(self) -> None:
        class FlakyClient(LLMClient):
            attempts = 0

            def generate_json(self, prompt: str, system_instruction=None):
                self.attempts += 1
                if self.attempts == 1:
                    # Return invalid structure
                    return {"invalid": "data"}
                # Second attempt succeeds
                return {
                    "summary": "Recovered summary",
                    "decisions": [],
                    "tasks": [
                        {
                            "description": "Recovered task",
                            "confidence": 0.9,
                        }
                    ],
                }

        flaky = FlakyClient()
        result = extract_tasks("Dummy transcript", client=flaky)
        assert flaky.attempts == 2
        assert result.summary == "Recovered summary"
        assert len(result.tasks) == 1

    def test_extraction_raises_after_two_failures(self) -> None:
        class FailingClient(LLMClient):
            def generate_json(self, prompt: str, system_instruction=None):
                raise ValueError("Permanent LLM error")

        with pytest.raises(RuntimeError):
            extract_tasks("Dummy transcript", client=FailingClient())
