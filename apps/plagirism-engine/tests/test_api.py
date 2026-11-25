import io
import zipfile

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


def make_repository_zip(filename, code):
    buffer = io.BytesIO()

    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr(filename, code)

    return buffer.getvalue()


def test_repository_upload_fields_are_file_inputs_in_openapi():
    schema = client.get("/openapi.json").json()
    request_schema = schema["paths"]["/analyze/repository"]["post"][
        "requestBody"
    ]["content"]["multipart/form-data"]["schema"]
    request_schema = schema["components"]["schemas"][
        request_schema["$ref"].split("/")[-1]
    ]

    assert request_schema["properties"]["repository_a"]["format"] == "binary"
    assert request_schema["properties"]["repository_b"]["format"] == "binary"


def test_analyze_repository_accepts_zip_uploads():
    response = client.post(
        "/analyze/repository",
        files={
            "repository_a": (
                "repository-a.zip",
                make_repository_zip("main.py", "def solve(): return 1\n"),
                "application/zip",
            ),
            "repository_b": (
                "repository-b.zip",
                make_repository_zip("main.py", "def solve(): return 1\n"),
                "application/zip",
            ),
        },
    )

    assert response.status_code == 200
    assert response.json()["files_analyzed"] == {
        "repository_a": 1,
        "repository_b": 1,
    }
