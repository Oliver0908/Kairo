import time
import json
import os
from db import supabase
from modules.transcriber import transcribe_video
from modules.video_analyser import analyse_video
from modules.moment_detector import find_candidate_moments
from modules.scorer import score_moments
from modules.clip_editor import export_all_clips
from modules.youtube_analyser import get_most_replayed
from modules.caption_generator import generate_all_captions

def run_pipeline(video_path, format="16:9", burn_subtitles=True, youtube_url=None, watermark_on=False, watermark_text=None, progress_callback=None, session_id=None):
    total_start = time.time()

    def update(msg):
        print(msg)
        if progress_callback:
            progress_callback(msg)

    youtube_peaks = []

    if youtube_url and youtube_url.strip():
        update("Fetching YouTube most replayed data...")
        youtube_peaks = get_most_replayed(youtube_url.strip())
        if youtube_peaks:
            update(f"Found {len(youtube_peaks)} YouTube peak moments.")
        else:
            update("No YouTube peak data found. Using AI analysis only.")

    update("Step 1/5: Transcribing audio...")
    transcript = transcribe_video(video_path)

    update("Step 2/5: Analysing video content...")
    analysis = analyse_video(video_path, transcript)

    update("Step 3/5: Detecting moments...")
    candidates = find_candidate_moments(transcript, analysis)

    update("Step 4/5: Scoring clips...")
    scored = score_moments(candidates, analysis, youtube_peaks=youtube_peaks)

    update("Step 5/5: Cutting and exporting clips...")
    exported = export_all_clips(
        video_path=video_path,
        scored_moments=scored,
        transcript=transcript,
        format=format,
        burn_subtitles=burn_subtitles,
        watermark_on=watermark_on,
        watermark_text=watermark_text
    )

    update("Generating Twitter captions...")
    captions = generate_all_captions(exported, transcript)

    clips_metadata = [
        {
            "path": clip["path"].replace("\\", "/"),
            "start": clip["start"],
            "end": clip["end"],
            "label": clip["label"],
            "score": clip["score"]
        }
        for clip in exported
    ]

    if session_id:
        supabase.table("video_sessions").update({
            "clips_metadata": clips_metadata
        }).eq("id", session_id).execute()

    total_end = time.time()
    total_seconds = int(total_end - total_start)
    minutes = total_seconds // 60
    seconds = total_seconds % 60

    if minutes > 0:
        time_str = f"{minutes} minutes {seconds} seconds"
    else:
        time_str = f"{seconds} seconds"

    update(f"Total processing time: {time_str}")
    update("Done! All clips exported.")

    return exported, captions