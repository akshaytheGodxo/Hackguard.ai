from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def make_submission(sid, pid, code):
    return {
        "submission_id": sid,
        "participant_id": pid,
        "problem_id": "two-sum",
        "language": "cpp",
        "source_code": code,
    }


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_identical_code():
    code = (
        "int solve(int n) { "
        "int sum = 0; "
        "for (int i = 0; i < n; i++) "
        "{ sum += i; } return sum; }"
    )

    response = client.post("/analyze", json={
        "submission_a": make_submission("a", "user-a", code),
        "submission_b": make_submission("b", "user-b", code),
    })

    assert response.status_code == 200
    assert response.json()["token_similarity"] == 1.0


def test_different_problems_rejected():
    a = make_submission("a", "user-a", "int main() { return 0; }")
    b = make_submission("b", "user-b", "int main() { return 0; }")
    b["problem_id"] = "binary-search"

    response = client.post("/analyze", json={
        "submission_a": a,
        "submission_b": b,
    })

    assert response.status_code == 400


def test_same_participant_rejected():
    code = "int main() { return 0; }"

    response = client.post("/analyze", json={
        "submission_a": make_submission("a", "user-a", code),
        "submission_b": make_submission("b", "user-a", code),
    })

    assert response.status_code == 400


def test_invalid_language_rejected():
    a = make_submission("a", "user-a", "int main() {}")
    b = make_submission("b", "user-b", "int main() {}")
    b["language"] = "rust"

    response = client.post("/analyze", json={
        "submission_a": a,
        "submission_b": b,
    })

    assert response.status_code == 422
