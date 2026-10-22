
from fastapi import HTTPException

from app.normalize import normalize_code, calculate_similarity
from app.schemas import AnalyzeRequest, AnalyzeResponse


def analyze_pair(request: AnalyzeRequest) -> AnalyzeResponse:
    a = request.submission_a
    b = request.submission_b

    if a.submission_id == b.submission_id:
        raise HTTPException(400, "Submissions must be different")

    if a.participant_id == b.participant_id:
        raise HTTPException(400, "Participants must be different")

    if a.problem_id != b.problem_id:
        raise HTTPException(400, "Submissions must target the same problem")

    if a.language != b.language:
        raise HTTPException(400, "Submissions must use the same language")

    tokens_a = normalize_code(a.source_code)
    tokens_b = normalize_code(b.source_code)

    score, matched = calculate_similarity(tokens_a, tokens_b)

    # These thresholds are provisional and must be calibrated.
    if len(tokens_a) < 10 or len(tokens_b) < 10:
        risk = "low"
        warnings = ["Short submissions provide weak similarity evidence."]
    elif score >= 0.70:
        risk = "high"
        warnings = ["High token overlap; manual review is recommended."]
    elif score >= 0.35:
        risk = "medium"
        warnings = ["Moderate token overlap; inspect matched regions."]
    else:
        risk = "low"
        warnings = []

    return AnalyzeResponse(
        submission_a_id=a.submission_id,
        submission_b_id=b.submission_id,
        language=a.language,
        token_similarity=round(score, 4),
        matched_ngrams=matched,
        risk_level=risk,
        warnings=warnings,
    )
