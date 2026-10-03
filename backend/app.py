import os
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from main import run_pipeline
from db import supabase

app = FastAPI(title="Kairo Backend")

os.makedirs("outputs", exist_ok=True)
os.makedirs("inputs", exist_ok=True)

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/inputs", StaticFiles(directory="inputs"), name="inputs")

# Allow Next.js frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_video_task(session_id: str, video_path: str, format_choice: str, burn_subtitles: bool, youtube_url: str, watermark_on: bool, watermark_text: str):
    def update_status(msg):
        print(f"[{session_id}] {msg}")
        supabase.table("video_sessions").update({
            "progress_message": msg
        }).eq("id", session_id).execute()

    try:
        supabase.table("video_sessions").update({
            "status": "processing",
            "progress_message": "Starting pipeline..."
        }).eq("id", session_id).execute()

        exported, captions = run_pipeline(
            video_path=video_path,
            format=format_choice,
            burn_subtitles=burn_subtitles,
            youtube_url=youtube_url,
            watermark_on=watermark_on,
            watermark_text=watermark_text,
            progress_callback=update_status,
            session_id=session_id # Pass session_id to save metadata to DB
        )

        supabase.table("video_sessions").update({
            "status": "completed",
            "progress_message": "Done! All clips exported.",
            "captions": captions
        }).eq("id", session_id).execute()

    except Exception as e:
        print(f"Error processing {session_id}: {e}")
        supabase.table("video_sessions").update({
            "status": "failed",
            "progress_message": f"Failed: {str(e)}"
        }).eq("id", session_id).execute()

@app.post("/api/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    format_choice: str = Form("16:9"),
    burn_subtitles: bool = Form(True),
    youtube_url: str = Form(None),
    watermark_on: bool = Form(False),
    watermark_text: str = Form(None)
):
    os.makedirs("inputs", exist_ok=True)
    file_extension = os.path.splitext(video.filename)[1]
    
    # Create DB session first to get UUID
    res = supabase.table("video_sessions").insert({
        "video_name": video.filename,
        "youtube_url": youtube_url,
        "format": format_choice,
        "burn_subtitles": burn_subtitles,
        "watermark_on": watermark_on,
        "watermark_text": watermark_text
    }).execute()
    
    session_id = res.data[0]["id"]
    
    input_path = os.path.join("inputs", f"{session_id}{file_extension}")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)

    background_tasks.add_task(
        process_video_task, 
        session_id=session_id, 
        video_path=input_path, 
        format_choice=format_choice, 
        burn_subtitles=burn_subtitles, 
        youtube_url=youtube_url, 
        watermark_on=watermark_on, 
        watermark_text=watermark_text
    )

    return JSONResponse(status_code=202, content={
        "message": "Upload successful. Processing started.",
        "session_id": session_id
    })

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "kairo-backend"}

from pydantic import BaseModel
import glob
from modules.clip_editor import export_clip

class TrimRequest(BaseModel):
    session_id: str
    start: float
    end: float
    label: str = "custom_trim"
    format: str = "16:9"
    burn_subtitles: bool = False
    watermark_on: bool = False
    watermark_text: str | None = None

@app.post("/api/export-trim")
async def export_trimmed_clip(payload: TrimRequest):
    matching = glob.glob(os.path.join("inputs", f"{payload.session_id}.*"))
    if not matching:
        return JSONResponse({"error": "Original input video not found"}, status_code=404)
    video_path = matching[0]
    
    clean_label = "".join(c for c in payload.label if c.isalnum() or c in "_-")
    out_name = f"{payload.session_id}_trim_{int(payload.start)}_{int(payload.end)}_{clean_label}.mp4"
    output_path = os.path.join("outputs", out_name)
    
    result = export_clip(
        video_path=video_path,
        start=payload.start,
        end=payload.end,
        output_path=output_path,
        transcript=[],
        format=payload.format,
        burn_subtitles=payload.burn_subtitles,
        watermark_on=payload.watermark_on,
        watermark_text=payload.watermark_text,
        clip_index=999
    )
    
    if not result:
        return JSONResponse({"error": "FFmpeg failed to export clip"}, status_code=500)
    
    return JSONResponse({
        "status": "success",
        "output_path": output_path.replace("\\", "/"),
        "filename": out_name
    })

def cleanup_old_files(max_age_seconds: int = 86400):
    """Auto-clean files older than 24 hours to prevent container disk exhaustion."""
    import time
    now = time.time()
    purged_count = 0
    for folder in ["inputs", "outputs", "temp"]:
        if not os.path.exists(folder):
            continue
        for fname in os.listdir(folder):
            fpath = os.path.join(folder, fname)
            try:
                if os.path.isfile(fpath):
                    file_age = now - os.path.getmtime(fpath)
                    if file_age > max_age_seconds:
                        os.remove(fpath)
                        purged_count += 1
            except Exception as e:
                print(f"Error purging {fpath}: {e}")
    if purged_count > 0:
        print(f"[Cleanup] Purged {purged_count} files older than {max_age_seconds // 3600} hours.")

@app.on_event("startup")
async def on_startup():
    cleanup_old_files()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Kairo backend on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)