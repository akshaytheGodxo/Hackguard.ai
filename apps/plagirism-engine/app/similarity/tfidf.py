
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def calculate_tfidf_similarity(
    source_a: str,
    source_b: str,
) -> float:
    """
    Calculate TF-IDF cosine similarity between two
    preprocessed source-code strings.
    """

    if not source_a.strip() or not source_b.strip():
        return 0.0

    if len(source_a) < 3 or len(source_b) < 3:
        return 0.0

    vectorizer = TfidfVectorizer(
        analyzer="char",
        ngram_range=(3, 5),
        sublinear_tf=True,
        lowercase=False,
        norm="l2",
    )

    try:
        vectors = vectorizer.fit_transform([
            source_a,
            source_b,
        ])

        similarity = cosine_similarity(
            vectors[0],
            vectors[1],
        )[0][0]

        return round(float(similarity), 4)

    except ValueError:
        return 0.0
