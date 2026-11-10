
from collections import Counter


def calculate_token_similarity(
    source_a: str,
    source_b: str,
    n: int = 5,
) -> float:
    if not source_a.strip() or not source_b.strip():
        return 0.0

    tokens_a = source_a.split()
    tokens_b = source_b.split()

    if len(tokens_a) < n or len(tokens_b) < n:
        return 0.0

    ngrams_a = Counter(
        tuple(tokens_a[i:i + n])
        for i in range(len(tokens_a) - n + 1)
    )

    ngrams_b = Counter(
        tuple(tokens_b[i:i + n])
        for i in range(len(tokens_b) - n + 1)
    )

    common = sum((ngrams_a & ngrams_b).values())

    total_a = sum(ngrams_a.values())
    total_b = sum(ngrams_b.values())

    denominator = total_a + total_b

    if denominator == 0:
        return 0.0

    return round((2 * common) / denominator, 4)
