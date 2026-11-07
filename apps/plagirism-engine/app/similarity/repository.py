
from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.repository.parser import RepositoryFile
from app.repository.preprocessor import preprocess_source


@dataclass
class FileMatch:
    file_a: str
    file_b: str
    language: str
    similarity: float


@dataclass
class RepositoryComparison:
    repository_similarity: float
    file_matches: list[FileMatch]


def compare_repositories(
    files_a: list[RepositoryFile],
    files_b: list[RepositoryFile],
) -> RepositoryComparison:

    if not files_a or not files_b:
        raise ValueError("Both repositories must contain source files")

    # Preprocess every file and group by language.
    groups = {}

    for side, files in [("a", files_a), ("b", files_b)]:
        for index, file in enumerate(files):

            normalized = preprocess_source(
                file.content,
                file.language,
            )

            groups.setdefault(file.language, []).append({
                "side": side,
                "index": index,
                "path": file.path,
                "content": normalized,
            })

    # Best similarity for each file in both repositories.
    best_a = [0.0] * len(files_a)
    best_b = [0.0] * len(files_b)

    matched_pairs = {}

    for language, documents in groups.items():

        a_docs = [
            (i, doc) for i, doc in enumerate(documents)
            if doc["side"] == "a"
        ]

        b_docs = [
            (i, doc) for i, doc in enumerate(documents)
            if doc["side"] == "b"
        ]

        if not a_docs or not b_docs:
            continue

        texts = [doc["content"] for doc in documents]

        vectorizer = TfidfVectorizer(
            analyzer="char",
            ngram_range=(3, 5),
            sublinear_tf=True,
            lowercase=False,
        )

        try:
            vectors = vectorizer.fit_transform(texts)
        except ValueError:
            # No usable character features.
            continue

        a_positions = [position for position, _ in a_docs]
        b_positions = [position for position, _ in b_docs]

        similarity_matrix = cosine_similarity(
            vectors[a_positions],
            vectors[b_positions],
        )

        # Find the strongest match for every A file.
        for row, (position_a, doc_a) in enumerate(a_docs):

            col = int(similarity_matrix[row].argmax())
            score = float(similarity_matrix[row, col])

            doc_b = b_docs[col][1]

            original_index = doc_a["index"]
            best_a[original_index] = score

            key = (
                doc_a["path"],
                doc_b["path"],
                language,
            )

            matched_pairs[key] = max(
                matched_pairs.get(key, 0.0),
                score,
            )

        # Find the strongest match for every B file.
        for col, (position_b, doc_b) in enumerate(b_docs):

            row = int(similarity_matrix[:, col].argmax())
            score = float(similarity_matrix[row, col])

            doc_a = a_docs[row][1]

            original_index = doc_b["index"]
            best_b[original_index] = score

            key = (
                doc_a["path"],
                doc_b["path"],
                language,
            )

            matched_pairs[key] = max(
                matched_pairs.get(key, 0.0),
                score,
            )

    # Weight each file by its normalized source size.
    # Cap weights so one enormous file cannot dominate.
    weights_a = [
        min(max(len(preprocess_source(f.content, f.language)), 1), 10000)
        for f in files_a
    ]

    weights_b = [
        min(max(len(preprocess_source(f.content, f.language)), 1), 10000)
        for f in files_b
    ]

    total_weight = sum(weights_a) + sum(weights_b)

    weighted_score = (
        sum(s * w for s, w in zip(best_a, weights_a))
        + sum(s * w for s, w in zip(best_b, weights_b))
    )

    repository_score = (
        weighted_score / total_weight
        if total_weight
        else 0.0
    )

    file_matches = [
        FileMatch(
            file_a=path_a,
            file_b=path_b,
            language=language,
            similarity=round(score, 4),
        )
        for (path_a, path_b, language), score
        in matched_pairs.items()
    ]

    file_matches.sort(
        key=lambda match: match.similarity,
        reverse=True,
    )

    return RepositoryComparison(
        repository_similarity=round(repository_score, 4),
        file_matches=file_matches,
    )
