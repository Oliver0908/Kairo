---
title: Kairo Backend
emoji: 🎬
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Kairo Backend Engine

FastAPI backend for Kairo AI video repurposing studio.

## API Endpoints
- `GET /api/health`: Health status check
- `POST /api/upload`: Upload video and trigger AI processing pipeline
- `POST /api/export-trim`: Cut and export trimmed video segments
- `GET /outputs/{filename}`: Static video clip files
