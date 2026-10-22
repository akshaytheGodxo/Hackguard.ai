import re

KEYWORDS = {
    "int", "long", "double", "float", "bool", "char",
    "void", "if", "else", "for", "while", "do",
    "return", "class", "struct", "const", "auto",
    "using", "namespace", "public", "private",
    "static", "true", "false", "null", "nullptr",
    "def", "import", "from", "in", "not", "and", "or",
    "function", "let", "var", "new", "this",
}


def normalize_code(source: str) -> list[str]:
    # Remove common comments for the initial prototype.
    source = re.sub(r"//[^\n]*|/\*[\s\S]*?\*/", " ", source)
    source = re.sub(r"#[^\n]*", " ", source)

    # Preserve operators and punctuation as individual tokens.
    tokens = re.findall(
        r"[A-Za-z_]\w*|\d+(?:\.\d+)?|"
        r"==|!=|<=|>=|&&|\|\||\+\+|--|"
        r"\+=|-=|->|::|.",
        source,
    )

    identifiers: dict[str, str] = {}
    normalized = []

    for token in tokens:
        if token.isspace():
            continue

        if re.fullmatch(r"[A-Za-z_]\w*", token):
            if token in KEYWORDS:
                normalized.append(token)
            else:
                if token not in identifiers:
                    identifiers[token] = f"ID_{len(identifiers)}"
                normalized.append(identifiers[token])
        else:
            normalized.append(token)

    return normalized


def make_ngrams(tokens: list[str], n: int = 5) -> set[tuple[str, ...]]:
    return {
        tuple(tokens[i:i + n])
        for i in range(len(tokens) - n + 1)
    }


def calculate_similarity(
    tokens_a: list[str],
    tokens_b: list[str],
    n: int = 5,
) -> tuple[float, int]:
    grams_a = make_ngrams(tokens_a, n)
    grams_b = make_ngrams(tokens_b, n)

    if not grams_a or not grams_b:
        return 0.0, 0

    intersection = grams_a & grams_b
    union = grams_a | grams_b

    return len(intersection) / len(union), len(intersection)
