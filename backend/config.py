import os
from dotenv import load_dotenv

# Load local environment variables if available
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Support either single GROQ_API_KEY or comma-separated list GROQ_API_KEYS
_raw_groq_keys = os.getenv("GROQ_API_KEYS", "")
if _raw_groq_keys:
    GROQ_API_KEYS = [k.strip() for k in _raw_groq_keys.split(",") if k.strip()]
elif os.getenv("GROQ_API_KEY"):
    GROQ_API_KEYS = [os.getenv("GROQ_API_KEY").strip()]
else:
    GROQ_API_KEYS = []

GROQ_API_KEY = GROQ_API_KEYS[0] if GROQ_API_KEYS else os.getenv("GROQ_API_KEY", "")

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")

WATERMARK_OPTIONS = [
    "No Watermark",
    "@BigBullInvesting",
    "@yourhandle2",
    "@yourhandle3",
    "@yourhandle4",
    "@yourhandle5"
]