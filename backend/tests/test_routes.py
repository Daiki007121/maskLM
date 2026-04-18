"""Tests for backend API routes.

Covers POST /api/mask, POST /api/unmask, and GET /api/health.
"""


class TestHealthEndpoint:
    """GET /api/health returns 200 with status ok."""

    def test_health_returns_200(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_response_body(self, client):
        response = client.get("/api/health")
        data = response.json()
        assert data["status"] == "ok"


class TestMaskEndpoint:
    """POST /api/mask accepts text and returns masked output."""

    def test_mask_happy_path(self, client):
        """Masking text with PII returns masked_text, mapping, session_id."""
        response = client.post(
            "/api/mask",
            json={"text": "John Smith works at Acme Corp."},
        )
        assert response.status_code == 200
        data = response.json()
        assert "masked_text" in data
        assert "mapping" in data
        assert "session_id" in data
        # Original PII should not appear in masked text
        assert "John Smith" not in data["masked_text"]

    def test_mask_returns_typed_placeholders(self, client):
        """Masked text uses typed placeholders like [NAME_1]."""
        response = client.post(
            "/api/mask",
            json={"text": "Contact Jane Doe at jane@example.com"},
        )
        data = response.json()
        assert "[NAME_" in data["masked_text"] or "[EMAIL_" in data["masked_text"]

    def test_mask_empty_text_returns_400(self, client):
        """Empty text should be rejected with 400."""
        response = client.post("/api/mask", json={"text": ""})
        assert response.status_code == 400

    def test_mask_already_masked_text_returns_400(self, client):
        """Text containing existing placeholders should be rejected."""
        response = client.post(
            "/api/mask",
            json={"text": "Hello [NAME_1], your email is [EMAIL_1]."},
        )
        assert response.status_code == 400


class TestUnmaskEndpoint:
    """POST /api/unmask accepts masked text + mapping, returns original."""

    def test_unmask_happy_path(self, client):
        """Unmasking with valid mapping returns original text."""
        response = client.post(
            "/api/unmask",
            json={
                "masked_text": "Hello [NAME_1], your email is [EMAIL_1].",
                "mapping": {
                    "[NAME_1]": "Jane Doe",
                    "[EMAIL_1]": "jane@example.com",
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["text"] == "Hello Jane Doe, your email is jane@example.com."

    def test_unmask_empty_mapping_returns_400(self, client):
        """Empty mapping dict should be rejected."""
        response = client.post(
            "/api/unmask",
            json={
                "masked_text": "Hello [NAME_1].",
                "mapping": {},
            },
        )
        assert response.status_code == 400

    def test_round_trip_mask_then_unmask(self, client):
        """Masking then unmasking recovers the original text."""
        original = "Dr. Alice Johnson works at BetaCorp. Email: alice@beta.com"

        # Step 1: mask
        mask_resp = client.post("/api/mask", json={"text": original})
        assert mask_resp.status_code == 200
        mask_data = mask_resp.json()

        # Step 2: unmask using the returned mapping
        unmask_resp = client.post(
            "/api/unmask",
            json={
                "masked_text": mask_data["masked_text"],
                "mapping": mask_data["mapping"],
            },
        )
        assert unmask_resp.status_code == 200
        assert unmask_resp.json()["text"] == original


class TestCORSHeaders:
    """Backend should include CORS headers for frontend."""

    def test_cors_allows_origin(self, client):
        """OPTIONS preflight should return CORS headers."""
        response = client.options(
            "/api/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
