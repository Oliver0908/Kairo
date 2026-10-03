FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PORT=7860

# Install system dependencies (FFmpeg and Unicode fonts for subtitles)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-noto-core \
    fonts-dejavu-core \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user (UID 1000 required by Hugging Face Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install CPU-only PyTorch first to keep the image lightweight and fast
RUN pip install --no-cache-dir --user torch --index-url https://download.pytorch.org/whl/cpu

# Install application requirements
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application code and models
COPY --chown=user . .

# Ensure storage directories exist with proper write permissions
RUN mkdir -p inputs outputs temp

EXPOSE 7860

CMD ["python", "app.py"]
