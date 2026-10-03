import yt_dlp
import json

def get_most_replayed(youtube_url):
    print("Fetching YouTube most replayed data...")

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)

            heatmap = None
            if "heatmap" in info and info["heatmap"]:
                heatmap = info["heatmap"]

            if not heatmap:
                print("No most replayed data found. Falling back to AI only.")
                return []

            peaks = []
            for entry in heatmap:
                start_time = entry.get("start_time", 0)
                value = entry.get("value", 0)

                if value >= 0.7:
                    peak_type = "high"
                    score_boost = 30
                elif value >= 0.4:
                    peak_type = "moderate"
                    score_boost = 15
                else:
                    continue

                peaks.append({
                    "start": round(start_time, 2),
                    "value": round(value, 3),
                    "peak_type": peak_type,
                    "score_boost": score_boost
                })

            print(f"Found {len(peaks)} YouTube peak moments.")
            return peaks

    except Exception as e:
        print(f"Could not fetch YouTube data: {str(e)}")
        print("Falling back to AI only analysis.")
        return []


def get_video_title(youtube_url):
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=False)
            return info.get("title", "Unknown Title")
    except:
        return "Unknown Title"