def find_candidate_moments(transcript, groq_analysis):
    print("Detecting candidate moments...")

    high_energy_words = [
        "never", "always", "secret", "truth", "mistake", "million",
        "shocking", "incredible", "worst", "best", "biggest", "honest",
        "actually", "nobody", "everybody", "changed", "surprised",
        "failed", "warning", "dangerous", "powerful", "finally",
        "important", "critical", "amazing", "terrible", "unbelievable",
        "seriously", "literally", "exactly", "absolutely", "definitely"
    ]

    analysis_lower = groq_analysis.lower()

    candidates = []

    for i, segment in enumerate(transcript):
        text = segment["text"].lower()
        start = segment["start"]
        end = segment["end"]

        keyword_score = sum(1 for word in high_energy_words if word in text)
        question_bonus = 1 if "?" in segment["text"] else 0

        groq_score = 0
        if "high" in analysis_lower:
            groq_score += 2
        if "tense" in analysis_lower:
            groq_score += 2
        if "inspiring" in analysis_lower:
            groq_score += 2
        if "engaging" in analysis_lower:
            groq_score += 1
        if "yes" in analysis_lower:
            groq_score += 1

        raw_score = keyword_score + question_bonus + groq_score

        clip_start = max(0, start - 2.5)
        clip_end = end + 1.5

        j = i + 1
        while j < len(transcript):
            next_end = transcript[j]["end"]
            projected_duration = next_end - clip_start
            if projected_duration > 90:
                break
            clip_end = next_end + 1.5
            raw_score += 0.3
            j += 1

        clip_duration = clip_end - clip_start

        if clip_duration < 10:
            if i + 1 < len(transcript):
                clip_end = transcript[min(i + 3, len(transcript) - 1)]["end"] + 1.5
            clip_duration = clip_end - clip_start

        if clip_duration > 90:
            clip_end = clip_start + 60

        clip_duration = clip_end - clip_start

        if clip_duration < 10:
            continue

        candidates.append({
            "start": round(clip_start, 2),
            "end": round(clip_end, 2),
            "duration": round(clip_duration, 2),
            "anchor_text": segment["text"],
            "raw_score": round(raw_score, 2),
            "anchor_time": start
        })

    candidates = remove_overlapping(candidates)
    candidates = ensure_spread(candidates, transcript)
    candidates = ensure_minimum(candidates, transcript, target=10)

    print(f"Found {len(candidates)} candidate moments.")
    return candidates


def remove_overlapping(candidates, min_gap=15):
    if not candidates:
        return candidates

    candidates.sort(key=lambda x: x["raw_score"], reverse=True)
    kept = []

    for candidate in candidates:
        overlap = False
        for kept_clip in kept:
            overlap_start = max(candidate["start"], kept_clip["start"])
            overlap_end = min(candidate["end"], kept_clip["end"])
            if overlap_end - overlap_start > min_gap:
                overlap = True
                break
        if not overlap:
            kept.append(candidate)

    kept.sort(key=lambda x: x["start"])
    return kept


def ensure_spread(candidates, transcript):
    if len(transcript) == 0:
        return candidates

    video_start = transcript[0]["start"]
    video_end = transcript[-1]["end"]
    video_duration = video_end - video_start

    if video_duration < 60:
        return candidates

    num_sections = 5
    section_length = video_duration / num_sections
    covered_sections = set()

    for clip in candidates:
        section = int((clip["start"] - video_start) / section_length)
        covered_sections.add(min(section, num_sections - 1))

    for section in range(num_sections):
        if section in covered_sections:
            continue

        section_start = video_start + section * section_length
        section_end = section_start + section_length

        for seg in transcript:
            if seg["start"] >= section_start and seg["end"] <= section_end:
                clip_start = max(0, seg["start"] - 2.5)
                clip_end = min(seg["end"] + 30, section_end)
                clip_duration = clip_end - clip_start

                if clip_duration < 10:
                    continue

                if clip_duration > 90:
                    clip_end = clip_start + 60

                candidates.append({
                    "start": round(clip_start, 2),
                    "end": round(clip_end, 2),
                    "duration": round(clip_end - clip_start, 2),
                    "anchor_text": seg["text"],
                    "raw_score": 1.0,
                    "anchor_time": seg["start"]
                })
                covered_sections.add(section)
                break

    candidates.sort(key=lambda x: x["start"])
    return candidates


def ensure_minimum(candidates, transcript, target=10):
    if len(candidates) >= target:
        return candidates

    used_starts = set(round(c["start"]) for c in candidates)

    for seg in transcript:
        if len(candidates) >= target:
            break

        clip_start = max(0, seg["start"] - 2.5)

        if round(clip_start) in used_starts:
            continue

        clip_end = seg["end"] + 20
        clip_duration = clip_end - clip_start

        if clip_duration < 10:
            continue

        if clip_duration > 90:
            clip_end = clip_start + 60

        candidates.append({
            "start": round(clip_start, 2),
            "end": round(clip_end, 2),
            "duration": round(clip_end - clip_start, 2),
            "anchor_text": seg["text"],
            "raw_score": 0.5,
            "anchor_time": seg["start"]
        })
        used_starts.add(round(clip_start))

    candidates.sort(key=lambda x: x["start"])
    return candidates