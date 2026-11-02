from fastapi.testclient import TestClient


class TestRegister:
    """Tests for POST /auth/register."""

    def test_register_success(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register",
            json={
                "email": "alice@example.com",
                "name": "Alice",
                "password": "strongpassword1",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "alice@example.com"
        assert data["name"] == "Alice"
        assert "id" in data
        assert "created_at" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_register_duplicate_email(self, client: TestClient) -> None:
        payload = {
            "email": "dup@example.com",
            "name": "First",
            "password": "strongpassword1",
        }
        client.post("/auth/register", json=payload)
        response = client.post("/auth/register", json=payload)
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    def test_register_short_password(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register",
            json={
                "email": "short@example.com",
                "name": "Short",
                "password": "abc",
            },
        )
        assert response.status_code == 422

    def test_register_invalid_email(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register",
            json={
                "email": "not-an-email",
                "name": "Bad Email",
                "password": "strongpassword1",
            },
        )
        assert response.status_code == 422

    def test_register_empty_name(self, client: TestClient) -> None:
        response = client.post(
            "/auth/register",
            json={
                "email": "empty@example.com",
                "name": "",
                "password": "strongpassword1",
            },
        )
        assert response.status_code == 422


class TestLogin:
    """Tests for POST /auth/login."""

    def test_login_success(
        self, client: TestClient, registered_user: dict
    ) -> None:
        response = client.post(
            "/auth/login",
            json={
                "email": registered_user["email"],
                "password": registered_user["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(
        self, client: TestClient, registered_user: dict
    ) -> None:
        response = client.post(
            "/auth/login",
            json={
                "email": registered_user["email"],
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401

    def test_login_nonexistent_user(self, client: TestClient) -> None:
        response = client.post(
            "/auth/login",
            json={
                "email": "nobody@example.com",
                "password": "doesnotmatter",
            },
        )
        assert response.status_code == 401


class TestProtectedRoutes:
    """Tests for authenticated endpoints."""

    def test_me_authenticated(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        response = client.get("/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"

    def test_me_no_token(self, client: TestClient) -> None:
        response = client.get("/me")
        assert response.status_code == 403

    def test_me_invalid_token(self, client: TestClient) -> None:
        response = client.get(
            "/me", headers={"Authorization": "Bearer invalidtoken"}
        )
        assert response.status_code == 401

    def test_health_check(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
