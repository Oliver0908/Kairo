from groq import Groq
from config import GROQ_API_KEYS
from concurrent.futures import ThreadPoolExecutor, as_completed

client = Groq(api_key=GROQ_API_KEYS[0])

def generate_caption(clip_transcript_segments):
    if not clip_transcript_segments:
        return "No caption available."

    text = " ".join([seg["text"] for seg in clip_transcript_segments])

    prompt = (
        "You are a social media expert who writes viral Twitter captions.\n\n"
        "Below is a transcript of a short video clip. The speaker says:\n\n"
        f"{text}\n\n"
        "Write a short, punchy, attention-grabbing Twitter caption for this clip.\n"
        "Rules:\n"
        "- Maximum 4 lines\n"
        "- Do not use hashtags\n"
        "- Do not identify the speaker by name — refer to them as 'Speaker'\n"
        "- Make it feel like something people would stop scrolling to read\n"
        "- Capture the most interesting or surprising thing being said\n"
        "- Write in plain English, no emojis unless they add impact\n"
        "Just write the caption. Nothing else."
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Caption unavailable: {str(e)[:50]}"

def generate_caption_for_clip(args):
    index, clip, transcript = args
    clip_segments = [
        seg for seg in transcript
        if seg["end"] > clip["start"] and seg["start"] < clip["end"]
    ]
    caption = generate_caption(clip_segments)
    return index, caption

def generate_all_captions(exported_clips, transcript):
    print("Generating Twitter captions in parallel...")

    args_list = [
        (i, clip, transcript)
        for i, clip in enumerate(exported_clips)
    ]

    captions = [""] * len(exported_clips)

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(generate_caption_for_clip, args): args
            for args in args_list
        }
        for future in as_completed(futures):
            index, caption = future.result()
            captions[index] = caption
            print(f"Caption ready for clip {index + 1}")

    print("All captions generated.")
    return captions