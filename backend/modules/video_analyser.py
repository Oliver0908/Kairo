import cv2
import base64
import json
import os
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def extract_frames(video_path, max_frames=5):
    print("Extracting frames from video...")
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps

    interval_seconds = duration / max_frames

    frames = []
    timestamp = 0
    while timestamp < duration and len(frames) < max_frames:
        cap.set(cv2.CAP_PROP_POS_MSEC, timestamp * 1000)
        ret, frame = cap.read()
        if ret:
            _, buffer = cv2.imencode('.jpg', frame)
            frame_b64 = base64.b64encode(buffer).decode('utf-8')
            frames.append({
                "timestamp": round(timestamp, 2),
                "data": frame_b64
            })
        timestamp += interval_seconds

    cap.release()
    print(f"Extracted {len(frames)} frames.")
    return frames

def analyse_video(video_path, transcript):
    cache_path = video_path + ".analysis.txt"

    if os.path.exists(cache_path):
        print("Loading saved analysis...")
        with open(cache_path, "r", encoding="utf-8") as f:
            return f.read()

    frames = extract_frames(video_path)

    transcript_text = "\n".join([
        f"[{seg['start']}s - {seg['end']}s] {seg['text']}"
        for seg in transcript
    ])

    prompt = "You are analysing a video to find the most engaging moments for social media short clips.\n\n"
    prompt += "Here is the transcript:\n" + transcript_text + "\n\n"
    prompt += "I am also providing frames from the video taken at evenly spaced intervals.\n\n"
    prompt += "For each frame, describe:\n"
    prompt += "1. The energy level of the speaker (low / medium / high)\n"
    prompt += "2. The emotional tone (neutral / excited / tense / inspiring / funny / shocking)\n"
    prompt += "3. Any notable visual moments (gestures, expressions, scene changes)\n"
    prompt += "4. Whether this moment could be the start of an engaging short clip\n\n"
    prompt += "Be specific and concise. Focus on what would make someone stop scrolling."

    content = [{"type": "text", "text": prompt}]

    for frame in frames:
        content.append({"type": "text", "text": f"\n[Frame at {frame['timestamp']}s]"})
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{frame['data']}"}
        })

    print("Sending frames to Groq for analysis...")
    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[{"role": "user", "content": content}],
        max_tokens=2000
    )

    analysis = response.choices[0].message.content

    with open(cache_path, "w", encoding="utf-8") as f:
        f.write(analysis)
    print("Analysis saved for future use.")

    return analysis