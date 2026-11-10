
from fastapi import FastAPI, HTTPException, UploadFile, File

from app.detector import analyze_pair
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
)

from app.repository.parser import parse_repository_zip
from app.similarity.repository import compare_repositories

import judge0


app = FastAPI(
    title="HackGuard Plagiarism Engine",
    description="Code similarity analysis API",
    version="0.1.0",
)

MAX_UPLOAD_SIZE = 20 * 1024 * 1024  # 20 MB


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "plagiarism-engine",
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    return analyze_pair(request)


@app.post("/analyze/batch", response_model=BatchAnalyzeResponse)
def analyze_batch(request: BatchAnalyzeRequest):
    target = request.target

    if any(
        c.participant_id == target.participant_id
        for c in request.candidates
    ):
        raise HTTPException(
            status_code=400,
            detail="Candidates must be different participants",
        )

    results = []

    for candidate in request.candidates:
        pair = AnalyzeRequest(
            submission_a=target,
            submission_b=candidate,
        )
        results.append(analyze_pair(pair))

    return BatchAnalyzeResponse(
        target_submission_id=target.submission_id,
        results=results,
    )


@app.post("/analyze/repository")
async def analyze_repository(
    repository_a: UploadFile = File(...),
    repository_b: UploadFile = File(...),
):
    if not repository_a.filename or not repository_b.filename:
        raise HTTPException(
            status_code=400,
            detail="Both repository ZIP files are required",
        )

    if not repository_a.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Repository A must be a ZIP file",
        )

    if not repository_b.filename.lower().endswith(".zip"):
        raise HTTPException(
            status_code=400,
            detail="Repository B must be a ZIP file",
        )

    zip_a = await repository_a.read(MAX_UPLOAD_SIZE + 1)
    zip_b = await repository_b.read(MAX_UPLOAD_SIZE + 1)

    if len(zip_a) > MAX_UPLOAD_SIZE or len(zip_b) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Repository ZIP files must be smaller than 20 MB",
        )

    try:
        files_a = parse_repository_zip(zip_a)
        files_b = parse_repository_zip(zip_b)

        comparison = compare_repositories(files_a, files_b)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    score = comparison.repository_similarity

    if score >= 0.70:
        risk = "high"
    elif score >= 0.35:
        risk = "medium"
    else:
        risk = "low"

    return {
        "message": "Repository analysis completed",
        "repository_a": repository_a.filename,
        "repository_b": repository_b.filename,
        "repository_similarity": score,
        "risk_level": risk,
        "files_analyzed": {
            "repository_a": len(files_a),
            "repository_b": len(files_b),
        },
        "matched_files": [
            {
                "file_a": match.file_a,
                "file_b": match.file_b,
                "language": match.language,
                "similarity": match.similarity,
            }
            for match in comparison.file_matches
        ],
    }
