
from app.repository.preprocessor import preprocess_source


def test_identifier_normalization():
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

    result_a = preprocess_source(code_a, "cpp")
    result_b = preprocess_source(code_b, "cpp")

    assert result_a == result_b


def test_comments_are_removed():
    code = """
    int main() {
        // This is a comment
        int value = 10;
        /* Another comment */
        return value;
    }
    """

    result = preprocess_source(code, "cpp")

    assert "This is a comment" not in result
    assert "Another comment" not in result
    assert "ID_0" in result


def test_string_literals_are_normalized():
    code_a = 'print("Hello World")'
    code_b = 'print("Something Else")'

    result_a = preprocess_source(code_a, "python")
    result_b = preprocess_source(code_b, "python")

    assert result_a == result_b
    assert "STRING_LITERAL" in result_a


def test_python_comments():
    code = """
    def calculate(x):
        # comment
        return x + 10
    """

    result = preprocess_source(code, "python")

    assert "comment" not in result
    assert "return" in result


def test_different_languages():
    code = "const x = 10;"

    result = preprocess_source(code, "javascript")

    assert "const" in result
    assert "NUMBER_LITERAL" in result


def test_unsupported_language():
    import pytest

    with pytest.raises(ValueError):
        preprocess_source("some code", "ruby")
