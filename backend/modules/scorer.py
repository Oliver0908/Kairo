import os
import sys

# Add the root directory to path so we can import from models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models.custom_scorer import score_candidates_with_ai

def score_moments(candidates, groq_analysis=None, youtube_peaks=None):
    """
    Scores candidates using the new custom AI model trained on viral datasets.
    """
    return score_candidates_with_ai(candidates)