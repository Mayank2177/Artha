"""
Money Health Score calculator — Feature 01
Pure Python scoring logic: Quiz answers → dimension scores → overall score
No AI, no external calls — just math.
"""
from typing import Dict, List
from models.health_models import QuizInput, DimensionScore


# ─── DIMENSION MAPPING ───────────────────────────────────────────────────────
# Maps question IDs to their financial health dimension

DIMENSION_MAP = {
    "Emergency Fund":   [1, 2],   # Questions 1-2
    "Debt Management":  [3, 4],   # Questions 3-4
    "Insurance":        [5, 6],   # Questions 5-6
    "Savings":          [7, 8],   # Questions 7-8
    "Investments":      [9, 10],  # Questions 9-10
    "Expenses":        [11, 12],  # Questions 11-12
}


# ─── SCORING RUBRIC ──────────────────────────────────────────────────────────
# Maps answer options to point values (0-100 scale per question)

ANSWER_POINTS = {
    'A': 100,  # Best practice / Excellent
    'B': 75,   # Good / On track
    'C': 50,   # Needs improvement / Average
    'D': 25,   # Critical / Needs urgent attention
}


# ─── STATUS THRESHOLDS ───────────────────────────────────────────────────────

def get_status_label(score: int) -> str:
    """Convert numeric score to status label"""
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Average"
    else:
        return "Needs Attention"


def get_overall_grade(score: int) -> str:
    """Convert overall score to letter grade"""
    if score >= 95:
        return "A+"
    elif score >= 85:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 55:
        return "C"
    elif score >= 40:
        return "D"
    else:
        return "F"


# ─── MAIN CALCULATION ────────────────────────────────────────────────────────

def calculate_health_score(quiz_input: QuizInput) -> Dict:
    """
    Core scoring engine for Money Health Score.

    Takes 12 quiz answers → returns:
    - 6 dimension scores (0-100 each)
    - overall score (0-100)
    - overall grade (A+ to F)
    - weakest dimensions (for AI to focus on)

    Returns dict ready for HealthScoreResponse + AI prompt building.
    """
    # Build answer lookup: question_id → selected_option
    answer_map = {ans.question_id: ans.selected_option for ans in quiz_input.answers}

    # Calculate score for each dimension
    dimension_scores: List[DimensionScore] = []
    all_scores = []

    for dimension_name, question_ids in DIMENSION_MAP.items():
        # Get points for both questions in this dimension
        points = [
            ANSWER_POINTS[answer_map[qid]]
            for qid in question_ids
        ]

        # Average the two questions to get dimension score
        dimension_score = sum(points) // len(points)
        all_scores.append(dimension_score)

        # Create DimensionScore object
        dimension_scores.append(
            DimensionScore(
                dimension_name = dimension_name,
                score          = dimension_score,
                max_score      = 100,
                status         = get_status_label(dimension_score),
            )
        )

    # Calculate overall score (average of all 6 dimensions)
    overall_score = sum(all_scores) // len(all_scores)
    overall_grade = get_overall_grade(overall_score)

    # Identify weakest dimensions (lowest 3 scores) for AI to prioritize
    sorted_dimensions = sorted(dimension_scores, key=lambda d: d.score)
    weakest_3 = [d.dimension_name for d in sorted_dimensions[:3]]

    return {
        "dimension_scores": dimension_scores,
        "overall_score":    overall_score,
        "overall_grade":    overall_grade,
        "weakest_3":        weakest_3,
    }