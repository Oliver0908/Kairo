import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing in NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ClipMetadata {
  path: string;
  start: number;
  end: number;
  label: string;
  score: number;
}

export interface VideoSession {
  id: string;
  created_at: string;
  status: "processing" | "completed" | "failed";
  progress_message?: string;
  video_name?: string;
  clips_metadata?: ClipMetadata[];
  captions?: Record<string, string>;
  youtube_url?: string;
  format?: string;
  burn_subtitles?: boolean;
  watermark_on?: boolean;
  watermark_text?: string;
}
