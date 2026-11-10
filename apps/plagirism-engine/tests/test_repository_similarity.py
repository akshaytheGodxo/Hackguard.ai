
from app.repository.parser import RepositoryFile
from app.similarity.repository import compare_repositories


def test_identical_repositories():

    files_a = [
        RepositoryFile(
            path="src/main.cpp",
            language="cpp",
            content="int add(int a, int b) { return a + b; }",
        )
    ]

    files_b = [
        RepositoryFile(
            path="backend/main.cpp",
            language="cpp",
            content="int add(int a, int b) { return a + b; }",
        )
    ]

    result = compare_repositories(files_a, files_b)

    assert result.repository_similarity == 1.0
    assert len(result.file_matches) == 1


def test_renamed_identifiers():

    files_a = [
        RepositoryFile(
            path="src/main.cpp",
            language="cpp",
            content="""
                int calculateSum(int a, int b) {
                    int result = a + b;
                    return result;
                }
            """,
        )
    ]

    files_b = [
        RepositoryFile(
            path="src/math.cpp",
            language="cpp",
            content="""
                int getTotal(int x, int y) {
                    int answer = x + y;
                    return answer;
                }
            """,
        )
    ]

    result = compare_repositories(files_a, files_b)

    assert result.repository_similarity == 1.0
    assert result.file_matches[0].file_a == "src/main.cpp"
    assert result.file_matches[0].file_b == "src/math.cpp"


def test_different_languages():

    files_a = [
        RepositoryFile(
            path="main.cpp",
            language="cpp",
            content="int main() { return 0; }",
        )
    ]

    files_b = [
        RepositoryFile(
            path="main.py",
            language="python",
            content="print('hello world')",
        )
    ]

    result = compare_repositories(files_a, files_b)

    assert result.repository_similarity == 0.0
    assert result.file_matches == []


def test_empty_repository_rejected():

    files_a = []

    files_b = [
        RepositoryFile(
            path="main.py",
            language="python",
            content="print('hello')",
        )
    ]

    import pytest

    with pytest.raises(ValueError):
        compare_repositories(files_a, files_b)


def test_multiple_files():

    files_a = [
        RepositoryFile(
            path="main.py",
            language="python",
            content="def add(a, b): return a + b",
        ),
        RepositoryFile(
            path="utils.py",
            language="python",
            content="def multiply(a, b): return a * b",
        ),
    ]

    files_b = [
        RepositoryFile(
            path="app.py",
            language="python",
            content="def add(x, y): return x + y",
        ),
        RepositoryFile(
            path="helpers.py",
            language="python",
            content="def multiply(x, y): return x * y",
        ),
    ]

    result = compare_repositories(files_a, files_b)

    assert result.repository_similarity > 0.9
    assert len(result.file_matches) == 2

def test_one_to_one_file_matching():

    files_a = [
        RepositoryFile(
            path="main.py",
            language="python",
            content="def add(a, b): return a + b",
        ),
        RepositoryFile(
            path="utils.py",
            language="python",
            content="def add(a, b): return a + b",
        ),
    ]

    files_b = [
        RepositoryFile(
            path="app.py",
            language="python",
            content="def add(x, y): return x + y",
        ),
    ]

    result = compare_repositories(files_a, files_b)

    # Both A files cannot claim the same B file.
    assert len(result.file_matches) == 1

    assert result.repository_similarity < 1.0
    assert result.repository_similarity > 0.0

def test_reference_corpus_reduces_boilerplate_similarity():

    boilerplate = """
    #include <bits/stdc++.h>
    using namespace std;

    int main() {
        ios::sync_with_stdio(false);
        cin.tie(nullptr);
        return 0;
    }
    """

    files_a = [
        RepositoryFile(
            path="main.cpp",
            language="cpp",
            content=boilerplate + """
            int calculate(int x) {
                return x * 2;
            }
            """,
        )
    ]

    files_b = [
        RepositoryFile(
            path="main.cpp",
            language="cpp",
            content=boilerplate + """
            int calculate(int x) {
                return x + 2;
            }
            """,
        )
    ]

    # Other participants use the same starter template.
    reference_files = [
        RepositoryFile(
            path=f"participant_{i}/main.cpp",
            language="cpp",
            content=boilerplate + f"""
            int solution(int x) {{
                return x + {i};
            }}
            """,
        )
        for i in range(1, 6)
    ]

    without_references = compare_repositories(
        files_a,
        files_b,
    )

    with_references = compare_repositories(
        files_a,
        files_b,
        reference_files=reference_files,
    )

    assert (
        with_references.repository_similarity
        < without_references.repository_similarity
    )
