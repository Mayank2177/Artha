"""
Money Health Score models — Feature 01
Pydantic schemas for quiz input and health score response.
"""
from typing import List, Dict
from pydantic import BaseModel, Field, field_validator


# ─── INPUT SCHEMA ────────────────────────────────────────────────────────────

class QuizAnswer(BaseModel):
    """Single quiz answer (option A, B, C, or D)"""
    question_id: int = Field(..., ge=1, le=12, description="Question number (1-12)")
    selected_option: str = Field(..., description="Selected option: A, B, C, or D")

    @field_validator('selected_option')
    @classmethod
    def validate_option(cls, v: str) -> str:
        v = v.strip().upper()
        if v not in ['A', 'B', 'C', 'D']:
            raise ValueError("Option must be A, B, C, or D")
        return v


class QuizInput(BaseModel):
    """Complete quiz submission with 12 answers"""
    answers: List[QuizAnswer] = Field(..., min_length=12, max_length=12)
    user_name: str | None = Field(None, max_length=50, description="Optional name for personalized response")

    @field_validator('answers')
    @classmethod
    def validate_all_questions_answered(cls, v: List[QuizAnswer]) -> List[QuizAnswer]:
        """Ensure all 12 questions are answered exactly once"""
        question_ids = [ans.question_id for ans in v]
        if sorted(question_ids) != list(range(1, 13)):
            raise ValueError("Must answer all 12 questions (1-12) exactly once")
        return v


# ─── OUTPUT SCHEMA ───────────────────────────────────────────────────────────

class DimensionScore(BaseModel):
    """Score for one of the 6 financial health dimensions"""
    dimension_name: str = Field(..., description="Emergency Fund, Debt Management, Insurance, Savings, Investments, Expenses")
    score: int = Field(..., ge=0, le=100, description="Score out of 100")
    max_score: int = Field(100, description="Maximum possible score")
    status: str = Field(..., description="Excellent, Good, Average, Needs Attention")


class ActionItem(BaseModel):
    """Single action recommendation"""
    priority: int = Field(..., ge=1, le=3, description="1=High, 2=Medium, 3=Low")
    area: str = Field(..., description="Which dimension needs work")
    action: str = Field(..., description="Specific action to take")


class HealthScoreResponse(BaseModel):
    """Complete Money Health Score response"""
    # Overall score
    overall_score: int = Field(..., ge=0, le=100, description="Total score out of 100")
    overall_grade: str = Field(..., description="A+, A, B, C, D, F")

    # 6 dimension scores (for radar chart)
    dimension_scores: List[DimensionScore] = Field(..., min_length=6, max_length=6)

    # AI-generated insights
    ai_assessment: str = Field(..., description="Natural language assessment paragraph")
    top_3_areas_to_fix: List[str] = Field(..., min_length=3, max_length=3)
    action_plan: List[ActionItem] = Field(..., min_length=3, max_length=5)

    # Metadata
    total_questions: int = Field(12, description="Always 12 questions")
    personalized_for: str | None = Field(None, description="User name if provided")