
from typing import Literal
from pydantic import BaseModel, Field


Language = Literal["cpp", "python", "java", "javascript"]


class CodeSubmission(BaseModel):
    submission_id: str = Field(min_length=1, max_length=100)
    participant_id: str = Field(min_length=1, max_length=100)
    problem_id: str = Field(min_length=1, max_length=100)
    language: Language
    source_code: str = Field(min_length=1, max_length=100_000)


class AnalyzeRequest(BaseModel):
    submission_a: CodeSubmission
    submission_b: CodeSubmission


class AnalyzeResponse(BaseModel):
    submission_a_id: str
    submission_b_id: str
    language: str
    token_similarity: float = Field(ge=0, le=1)
    matched_ngrams: int = Field(ge=0)
    risk_level: Literal["low", "medium", "high"]
    warnings: list[str] = []
