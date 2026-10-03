import subprocess
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

FONT_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "fonts", "NotoSansDevanagari-Regular.ttf")

def write_srt(transcript, start, end, srt_path):
    lines = []
    index = 1
    for seg in transcript:
        if seg["end"] > start and seg["start"] < end:
            seg_start = max(0, seg["start"] - start)
            seg_end = max(0, seg["end"] - start)

            def fmt(t):
                h = int(t // 3600)
                m = int((t % 3600) // 60)
                s = int(t % 60)
                ms = int((t - int(t)) * 1000)
                return f"{h:02}:{m:02}:{s:02},{ms:03}"

            lines.append(str(index))
            lines.append(f"{fmt(seg_start)} --> {fmt(seg_end)}")
            lines.append(seg["text"].strip())
            lines.append("")
            index += 1

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def build_watermark_filter(watermark_text):
    safe_text = watermark_text.replace("'", "").replace(":", "").replace("\\", "")
    return (
        f"drawtext=text='{safe_text}'"
        f":fontsize=18"
        f":fontcolor=white@0.42"
        f":x=(w-text_w)/2"
        f":y=(h-text_h)/2"
        f":box=0"
        f":shadowcolor=black@0.15"
        f":shadowx=1"
        f":shadowy=1"
        f":font=Arial"
    )

def export_clip(video_path, start, end, output_path, transcript, format="16:9", burn_subtitles=True, watermark_on=False, watermark_text=None, clip_index=0):
    print(f"Exporting clip: {output_path}")
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("temp", exist_ok=True)

    duration = end - start
    vertical_filter = "scale=1080:-2,pad=1080:1920:0:(1920-ih)/2:black"

    filters = []

    if format == "9:16":
        filters.append(vertical_filter)

    if burn_subtitles:
        srt_path = os.path.join("temp", f"subtitles_{clip_index}.srt")
        write_srt(transcript, start, end, srt_path)
        srt_escaped = srt_path.replace("\\", "/").replace(":", "\\:")
        subtitle_filter = f"subtitles={srt_escaped}:force_style='FontName=Arial,FontSize=18,PrimaryColour=&Hffffff,OutlineColour=&H000000,Outline=2,Alignment=2'"
        filters.append(subtitle_filter)

    if watermark_on and watermark_text:
        filters.append(build_watermark_filter(watermark_text))

    if filters:
        video_filter = ",".join(filters)
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-i", video_path,
            "-t", str(duration),
            "-vf", video_filter,
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "ultrafast",
            output_path
        ]
    else:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-i", video_path,
            "-t", str(duration),
            "-c:v", "libx264",
            "-c:a", "aac",
            "-preset", "ultrafast",
            output_path
        ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"FFmpeg error on clip {clip_index}: {result.stderr[-500:]}")
        return None

    print(f"Clip saved: {output_path}")
    return {
        "path": output_path,
        "clip_index": clip_index
    }

def export_all_clips(video_path, scored_moments, transcript, format="16:9", burn_subtitles=True, watermark_on=False, watermark_text=None):
    video_name = os.path.splitext(os.path.basename(video_path))[0]

    tasks = []
    for i, clip in enumerate(scored_moments):
        import re
        clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', video_name)
        filename = f"{clean_name}_clip{i+1}_{clip['label']}.mp4"
        output_path = os.path.join("outputs", filename)
        tasks.append((i, clip, output_path))

    exported = []

    print(f"Exporting {len(tasks)} clips in parallel...")

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(
                export_clip,
                video_path=video_path,
                start=task[1]["start"],
                end=task[1]["end"],
                output_path=task[2],
                transcript=transcript,
                format=format,
                burn_subtitles=burn_subtitles,
                watermark_on=watermark_on,
                watermark_text=watermark_text,
                clip_index=task[0]
            ): task
            for task in tasks
        }

        for future in as_completed(futures):
            task = futures[future]
            i, clip, output_path = task
            result = future.result()
            if result:
                exported.append({
                    "path": output_path,
                    "label": clip["label"],
                    "score": clip["score"],
                    "start": clip["start"],
                    "end": clip["end"]
                })

    exported.sort(key=lambda x: x["path"])
    print(f"\nExport complete. {len(exported)} clips saved to outputs folder.")
    return exported