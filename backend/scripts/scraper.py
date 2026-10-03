import yt_dlp
import json
import os
import time

def scrape_shorts(query, max_results=10):
    print(f"Scraping YouTube for: {query}")
    
    ydl_opts = {
        "quiet": False,
        "extract_flat": "in_playlist",
        "skip_download": True,
        "dump_single_json": True,
        "extract_flat": True,
        "default_search": "ytsearch",
    }
    
    # We want to extract video metadata
    fetch_opts = {
        "quiet": True,
        "skip_download": True,
        "writesubtitles": True,
        "writeautomaticsub": True,
        "subtitleslangs": ["en"],
    }
    
    results = []
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            # Search for shorts
            search_query = f"ytsearch{max_results}:{query} #shorts"
            search_results = ydl.extract_info(search_query, download=False)
            
            entries = search_results.get("entries", [])
            print(f"Found {len(entries)} videos. Fetching details...")
            
            os.makedirs("dataset", exist_ok=True)
            
            for entry in entries:
                video_url = entry.get("url")
                if not video_url:
                    continue
                
                print(f"Fetching details for {video_url}...")
                with yt_dlp.YoutubeDL(fetch_opts) as fetch_ydl:
                    try:
                        info = fetch_ydl.extract_info(video_url, download=False)
                        
                        data = {
                            "id": info.get("id"),
                            "title": info.get("title"),
                            "view_count": info.get("view_count", 0),
                            "like_count": info.get("like_count", 0),
                            "duration": info.get("duration", 0),
                            "description": info.get("description", ""),
                            "tags": info.get("tags", []),
                            "subtitles": info.get("subtitles", {}),
                            "automatic_captions": info.get("automatic_captions", {})
                        }
                        
                        results.append(data)
                        
                        # Save incrementally
                        with open(f"dataset/{data['id']}.json", "w", encoding="utf-8") as f:
                            json.dump(data, f, ensure_ascii=False, indent=2)
                            
                        time.sleep(1) # Be nice to YouTube
                    except Exception as e:
                        print(f"Failed to fetch details for {video_url}: {e}")
                        
        except Exception as e:
            print(f"Search failed: {e}")
            
    print(f"Successfully scraped {len(results)} videos.")
    return results

if __name__ == "__main__":
    scrape_shorts("podcast clips", max_results=5)
