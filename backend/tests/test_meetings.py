from fastapi.testclient import TestClient


class TestMeetings:
    """Tests for meeting CRUD operations."""

    def test_create_meeting(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        payload = {"title": "Q3 Planning Sync", "platform": "google_meet"}
        response = client.post("/meetings", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Q3 Planning Sync"
        assert data["platform"] == "google_meet"
        assert data["status"] == "ready"
        assert data["task_count"] == 0

    def test_list_meetings(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        client.post(
            "/meetings",
            json={"title": "Meeting A", "platform": "zoom"},
            headers=auth_headers,
        )
        client.post(
            "/meetings",
            json={"title": "Meeting B", "platform": "teams"},
            headers=auth_headers,
        )

        response = client.get("/meetings", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2

    def test_get_meeting_detail(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        create_res = client.post(
            "/meetings",
            json={"title": "Detail Test", "platform": "browser"},
            headers=auth_headers,
        )
        meeting_id = create_res.json()["id"]

        detail_res = client.get(
            f"/meetings/{meeting_id}", headers=auth_headers
        )
        assert detail_res.status_code == 200
        data = detail_res.json()
        assert data["title"] == "Detail Test"
        assert "tasks" in data

    def test_update_meeting(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        create_res = client.post(
            "/meetings",
            json={"title": "Original Title", "platform": "zoom"},
            headers=auth_headers,
        )
        meeting_id = create_res.json()["id"]

        patch_res = client.patch(
            f"/meetings/{meeting_id}",
            json={"title": "Updated Title"},
            headers=auth_headers,
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Updated Title"

    def test_delete_meeting(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        create_res = client.post(
            "/meetings",
            json={"title": "To Delete", "platform": "zoom"},
            headers=auth_headers,
        )
        meeting_id = create_res.json()["id"]

        del_res = client.delete(
            f"/meetings/{meeting_id}", headers=auth_headers
        )
        assert del_res.status_code == 204

        get_res = client.get(f"/meetings/{meeting_id}", headers=auth_headers)
        assert get_res.status_code == 404
