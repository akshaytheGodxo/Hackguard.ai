from fastapi import FastAPI, HTTPException
from app.detector import analyze_pair
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse
)
import judge0
app = FastAPI(
    title="HackGuard Plagiarism Engine",
    description="Code similarity analysis API",
    version="0.1.0",
)


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

    if any(c.participant_id == target.participant_id
           for c in request.candidates):
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

  