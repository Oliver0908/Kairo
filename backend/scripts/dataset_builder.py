import os
import json
import csv

def build_dataset(input_dir="dataset", output_file="viral_dataset.csv"):
    print(f"Building dataset from {input_dir}...")
    
    data_rows = []
    
    for filename in os.listdir(input_dir):
        if not filename.endswith(".json"):
            continue
            
        filepath = os.path.join(input_dir, filename)
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                
                title = data.get("title", "")
                views = data.get("view_count", 0)
                likes = data.get("like_count", 0)
                duration = data.get("duration", 0)
                tags = data.get("tags", [])
                
                # Simple metric: views per second of duration (or just total views)
                viral_score = views if views else 0
                
                data_rows.append({
                    "id": data.get("id"),
                    "title": title,
                    "views": views,
                    "likes": likes,
                    "duration": duration,
                    "num_tags": len(tags),
                    "viral_score": viral_score
                })
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            
    # Sort by viral score descending
    data_rows.sort(key=lambda x: x["viral_score"], reverse=True)
    
    if not data_rows:
        print("No valid data found.")
        return
        
    keys = data_rows[0].keys()
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data_rows)
        
    print(f"Successfully built dataset with {len(data_rows)} rows. Saved to {output_file}.")

if __name__ == "__main__":
    build_dataset()
