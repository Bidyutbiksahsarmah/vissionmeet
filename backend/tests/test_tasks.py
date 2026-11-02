from fastapi.testclient import TestClient


class TestTasks:
    """Tests for task extraction review, confirmation, and status updates."""

    def _create_meeting(self, client: TestClient, auth_headers: dict) -> int:
        res = client.post(
            "/meetings",
            json={"title": "Task Test Meeting", "platform": "browser"},
            headers=auth_headers,
        )
        return res.json()["id"]

    def test_create_and_confirm_task(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        meeting_id = self._create_meeting(client, auth_headers)

        payload = {
            "description": "Prepare release notes",
            "assigner_name": "Bob",
            "assignee_name": "Alice",
            "evidence_quote": "Alice, please prepare the release notes.",
            "evidence_timestamp": "00:03:10",
            "confidence": 0.9,
            "needs_review": True,
        }
        res = client.post(
            f"/meetings/{meeting_id}/tasks",
            json=payload,
            headers=auth_headers,
        )
        assert res.status_code == 201
        task_id = res.json()["id"]

        # Confirm task
        confirm_res = client.post(
            f"/tasks/{task_id}/confirm", headers=auth_headers
        )
        assert confirm_res.status_code == 200
        assert confirm_res.json()["status"] == "confirmed"
        assert confirm_res.json()["needs_review"] is False

    def test_update_task_status(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        meeting_id = self._create_meeting(client, auth_headers)
        res = client.post(
            f"/meetings/{meeting_id}/tasks",
            json={"description": "Fix bug in auth"},
            headers=auth_headers,
        )
        task_id = res.json()["id"]

        # Update to in_progress
        patch_res = client.patch(
            f"/tasks/{task_id}",
            json={"status": "in_progress"},
            headers=auth_headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "in_progress"

        # Update to done
        patch_res = client.patch(
            f"/tasks/{task_id}",
            json={"status": "done"},
            headers=auth_headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "done"

    def test_add_and_list_comments(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        meeting_id = self._create_meeting(client, auth_headers)
        res = client.post(
            f"/meetings/{meeting_id}/tasks",
            json={"description": "Integrate payment gateway"},
            headers=auth_headers,
        )
        task_id = res.json()["id"]

        # Add comment
        comment_res = client.post(
            f"/tasks/{task_id}/comments",
            json={"body": "Waiting on API credentials from finance."},
            headers=auth_headers,
        )
        assert comment_res.status_code == 201
        assert "Waiting on API credentials" in comment_res.json()["body"]

        # List comments
        list_res = client.get(
            f"/tasks/{task_id}/comments", headers=auth_headers
        )
        assert list_res.status_code == 200
        assert len(list_res.json()) == 1

    def test_assigned_queries(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        to_me = client.get("/tasks/assigned-to-me", headers=auth_headers)
        assert to_me.status_code == 200
        assert isinstance(to_me.json(), list)

        by_me = client.get("/tasks/assigned-by-me", headers=auth_headers)
        assert by_me.status_code == 200
        assert isinstance(by_me.json(), list)
