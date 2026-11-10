
from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.repository.parser import RepositoryFile
from app.repository.preprocessor import preprocess_source
from app.similarity.token import calculate_token_similarity
from scipy.optimize import linear_sum_assignment
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
    reference_files: list[RepositoryFile] | None = None,
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

        
        reference_texts = [
            preprocess_source(file.content, file.language)
            for file in (reference_files or [])
            if file.language == language
        ]
        
        reference_count = len(reference_texts)
                
        # Reference documents come first.
        texts = reference_texts + [
            doc["content"] for doc in documents
        ]

        max_document_frequency = (
            0.85 if reference_count >= 5 else 1.0
        )

        vectorizer = TfidfVectorizer(
            analyzer="char",
            ngram_range=(3, 5),
            sublinear_tf=True,
            lowercase=False,
            max_df=max_document_frequency,
        )

        try:
            vectors = vectorizer.fit_transform(texts)
        except ValueError:
            continue
        
        a_positions = [
            reference_count + position
            for position, _ in a_docs
        ]

        b_positions = [
            reference_count + position
            for position, _ in b_docs
        ]


        similarity_matrix = cosine_similarity(
            vectors[a_positions],
            vectors[b_positions],
        )


        # Globally assign files using maximum-weight matching.
        row_indices, col_indices = linear_sum_assignment(
            similarity_matrix,
            maximize=True,
        )

        for row, col in zip(row_indices, col_indices):

            score = float(similarity_matrix[row, col])

            doc_a = a_docs[row][1]
            doc_b = b_docs[col][1]

            original_index_a = doc_a["index"]
            original_index_b = doc_b["index"]

            # Ignore weak matches.
            # This threshold is provisional and needs calibration.
            if score < 0.15:
                continue

            best_a[original_index_a] = score
            best_b[original_index_b] = score

            key = (
                doc_a["path"],
                doc_b["path"],
                language,
            )

            matched_pairs[key] = round(score, 4)

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
