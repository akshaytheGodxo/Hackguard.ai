
from pygments import lex
from pygments.lexers import (
    CppLexer,
    PythonLexer,
    JavaLexer,
    JavascriptLexer,
)
from pygments.token import (
    Comment,
    Name,
    String,
    Number,
)


LEXERS = {
    "cpp": CppLexer,
    "python": PythonLexer,
    "java": JavaLexer,
    "javascript": JavascriptLexer,
    "typescript": JavascriptLexer,
}


def get_lexer(language: str):
    lexer_class = LEXERS.get(language)

    if lexer_class is None:
        raise ValueError(f"Unsupported language: {language}")

    return lexer_class()


def preprocess_source(source: str, language: str) -> str:
    lexer = get_lexer(language)

    identifiers = {}
    normalized_tokens = []

    for token_type, value in lex(source, lexer):

        if token_type in Comment or not value.strip():
            continue

        # Normalize identifiers consistently.
        if token_type in Name:
            # Preserve built-in names.
            if token_type in Name.Builtin:
                normalized_tokens.append(value)
            else:
                if value not in identifiers:
                    identifiers[value] = f"ID_{len(identifiers)}"

                normalized_tokens.append(identifiers[value])

        # Normalize string literals.
        elif token_type in String:
            normalized_tokens.append("STRING_LITERAL")

        # Normalize numerical literals.
        elif token_type in Number:
            normalized_tokens.append("NUMBER_LITERAL")

        # Preserve keywords, operators and punctuation.
        else:
            normalized_tokens.append(value)

    return " ".join(normalized_tokens)
