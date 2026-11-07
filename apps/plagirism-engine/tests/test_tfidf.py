
from app.similarity.tfidf import calculate_tfidf_similarity
from app.repository.preprocessor import preprocess_source


def test_identical_code():
    code = """
    int calculate(int a, int b) {
        return a + b;
    }
    """

    normalized = preprocess_source(code, "cpp")

    score = calculate_tfidf_similarity(
        normalized,
        normalized,
    )

    assert score == 1.0


def test_renamed_identifiers():
    code_a = """
    int calculateSum(int a, int b) {
        int result = a + b;
        return result;
    }
    """

    code_b = """
    int getTotal(int x, int y) {
        int answer = x + y;
        return answer;
    }
    """

    normalized_a = preprocess_source(code_a, "cpp")
    normalized_b = preprocess_source(code_b, "cpp")

    score = calculate_tfidf_similarity(
        normalized_a,
        normalized_b,
    )

    assert score == 1.0


def test_unrelated_code():
    code_a = """
    int calculate(int a, int b) {
        return a + b;
    }
    """

    code_b = """
    void printMessage() {
        std::cout << "Hello World";
    }
    """

    normalized_a = preprocess_source(code_a, "cpp")
    normalized_b = preprocess_source(code_b, "cpp")

    score = calculate_tfidf_similarity(
        normalized_a,
        normalized_b,
    )

    assert 0 <= score <= 1


def test_empty_input():
    assert calculate_tfidf_similarity("", "") == 0.0


def test_short_input():
    assert calculate_tfidf_similarity("ab", "ab") == 0.0


def test_similarity_symmetry():
    a = "int ID_0 = NUMBER_LITERAL ;"
    b = "return ID_0 + NUMBER_LITERAL ;"

    score_ab = calculate_tfidf_similarity(a, b)
    score_ba = calculate_tfidf_similarity(b, a)

    assert score_ab == score_ba
