import json
import os
import subprocess
from groq import Groq
from config import GROQ_API_KEYS, DEEPGRAM_API_KEY

def extract_audio(video_path):
    audio_path = video_path + ".audio.mp3"
    if os.path.exists(audio_path):
        return audio_path

    print("Extracting audio from video...")
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "mp3",
        "-ar", "16000",
        "-ac", "1",
        "-b:a", "32k",
        audio_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Audio extraction failed: {result.stderr[-500:]}")
    print("Audio extracted.")
    return audio_path

def compress_audio(audio_path, video_path):
    print("Compressing audio further...")
    compressed_path = video_path + ".audio_small.mp3"
    cmd = [
        "ffmpeg", "-y",
        "-i", audio_path,
        "-b:a", "16k",
        compressed_path
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    return compressed_path

def transcribe_with_groq(audio_path, key):
    client = Groq(api_key=key, max_retries=0)
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), f),
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )
    transcript = []
    for segment in response.segments:
        if isinstance(segment, dict):
            entry = {
                "start": round(segment["start"], 2),
                "end": round(segment["end"], 2),
                "text": segment["text"].strip()
            }
        else:
            entry = {
                "start": round(segment.start, 2),
                "end": round(segment.end, 2),
                "text": segment.text.strip()
            }
        transcript.append(entry)
    return transcript

def transcribe_with_deepgram(audio_path):
    import requests
    print("Transcribing with Deepgram...")

    with open(audio_path, "rb") as f:
        audio_data = f.read()

    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "audio/mp3"
    }

    params = {
        "model": "nova-2",
        "smart_format": "true",
        "punctuate": "true",
        "utterances": "true",
        "language": "hi-en"
    }

    response = requests.post(
        "https://api.deepgram.com/v1/listen",
        headers=headers,
        params=params,
        data=audio_data,
        timeout=300
    )

    if response.status_code != 200:
        raise RuntimeError(f"Deepgram error: {response.text}")

    data = response.json()
    words = data["results"]["channels"][0]["alternatives"][0]["words"]

    transcript = []
    current_text = []
    seg_start = None
    seg_end = None

    for word in words:
        if seg_start is None:
            seg_start = word["start"]
        current_text.append(word["word"])
        seg_end = word["end"]

        if word["word"].endswith(('.', '?', '!')) or len(current_text) > 15:
            transcript.append({
                "start": round(seg_start, 2),
                "end": round(seg_end, 2),
                "text": " ".join(current_text).strip()
            })
            current_text = []
            seg_start = None

    if current_text:
        transcript.append({
            "start": round(seg_start, 2),
            "end": round(seg_end, 2),
            "text": " ".join(current_text).strip()
        })

    return transcript

def transcribe_video(video_path):
    cache_path = video_path + ".transcript.json"

    if os.path.exists(cache_path):
        print("Loading saved transcript...")
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)

    audio_path = extract_audio(video_path)

    file_size = os.path.getsize(audio_path)
    print(f"Audio file size: {round(file_size / 1024 / 1024, 1)} MB")

    if file_size > 24 * 1024 * 1024:
        audio_path = compress_audio(audio_path, video_path)

    transcript = None

    for i, key in enumerate(GROQ_API_KEYS):
        try:
            print(f"Transcribing with Groq key {i+1}...")
            transcript = transcribe_with_groq(audio_path, key)
            print(f"Groq key {i+1} succeeded.")
            break
        except Exception as e:
            error_msg = str(e)
            if "rate_limit" in error_msg.lower() or "429" in error_msg:
                print(f"Groq key {i+1} rate limited. Trying next key...")
                continue
            else:
                print(f"Groq key {i+1} failed with error: {error_msg}")
                continue

    if transcript is None:
        print("All Groq keys exhausted. Switching to Deepgram...")
        try:
            transcript = transcribe_with_deepgram(audio_path)
        except Exception as e:
            raise RuntimeError(f"All transcription services failed: {str(e)}")

    if not transcript:
        raise RuntimeError("Transcription returned empty result.")

    for entry in transcript:
        print(f"[{entry['start']}s - {entry['end']}s] {entry['text']}")

    print(f"\nTranscription complete. {len(transcript)} segments found.")

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(transcript, f, ensure_ascii=False, indent=2)
    print("Transcript saved for future use.")

    return transcript