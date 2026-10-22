
from fastapi import FastAPI

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
