"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { VideoSession, ClipMetadata, supabase } from "../lib/supabase";
import {
  Scissors,
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronLeft,
  Sliders,
  AlertCircle,
  Download,
  Flame,
  Clock
} from "lucide-react";
import { getBackendUrl } from "../lib/config";

interface TimelineEditorProps {
  session: VideoSession;
  initialClip: ClipMetadata;
  onClose: () => void;
  onClipUpdated: (newClip: ClipMetadata) => void;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  session,
  initialClip,
  onClose,
  onClipUpdated,
}) => {
  const [startTime, setStartTime] = useState(initialClip.start);
  const [endTime, setEndTime] = useState(initialClip.end);
  const [label, setLabel] = useState(initialClip.label || "custom_trimmed");
  const [formatChoice, setFormatChoice] = useState(session.format || "9:16");
  const [burnSubtitles, setBurnSubtitles] = useState(session.burn_subtitles ?? true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialClip.start);
  const [duration, setDuration] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Load the original input video, or fallback to clip
  const videoSrc = `${getBackendUrl()}/inputs/${session.id}.mp4`;

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      videoRef.current.currentTime = startTime;
    }
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const curr = videoRef.current.currentTime;
      setCurrentTime(curr);
      // Auto-loop within clip bounds during preview
      if (curr >= endTime) {
        videoRef.current.currentTime = startTime;
      }
    }
  }, [startTime, endTime]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.addEventListener("timeupdate", handleTimeUpdate);
      return () => v.removeEventListener("timeupdate", handleTimeUpdate);
    }
  }, [handleTimeUpdate]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(t, duration || 9999));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const setStartToCurrent = () => {
    const cur = videoRef.current ? videoRef.current.currentTime : currentTime;
    if (cur < endTime) {
      setStartTime(cur);
    }
  };

  const setEndToCurrent = () => {
    const cur = videoRef.current ? videoRef.current.currentTime : currentTime;
    if (cur > startTime) {
      setEndTime(cur);
    }
  };

  const handleExport = async () => {
    if (startTime >= endTime) {
      setErrorMessage("Start time must be strictly before end time.");
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setExportSuccess(null);

    try {
      const res = await fetch(`${getBackendUrl()}/api/export-trim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          start: startTime,
          end: endTime,
          label: label,
          format: formatChoice,
          burn_subtitles: burnSubtitles,
          watermark_on: session.watermark_on || false,
          watermark_text: session.watermark_text || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || `Export failed with status ${res.status}`);
      }

      const data = await res.json();
      const newClip: ClipMetadata = {
        path: data.output_path,
        start: startTime,
        end: endTime,
        label: label,
        score: initialClip.score,
      };

      // Append new clip to Supabase session metadata
      const currentClips = session.clips_metadata || [];
      const updatedClips = [...currentClips, newClip];

      await supabase
        .from("video_sessions")
        .update({ clips_metadata: updatedClips })
        .eq("id", session.id);

      onClipUpdated(newClip);
      setExportSuccess(`Exported successfully: ${data.filename}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to export trimmed clip";
      setErrorMessage(msg);
    } finally {
      setIsExporting(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec - Math.floor(sec)) * 10);
    return `${m}:${s < 10 ? "0" : ""}${s}.${ms}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Clips Gallery</span>
        </button>

        <div className="text-right">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" />
            Timeline Trimmer & Editor
          </h2>
          <p className="text-xs text-zinc-400">Drag or adjust boundary timestamps</p>
        </div>
      </div>

      {/* Main Studio View */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl space-y-6">
        {/* Video Canvas Container */}
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-zinc-800 shadow-2xl">
          <video
            ref={videoRef}
            src={videoSrc}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => {
              // If inputs/{session_id}.mp4 fails, fallback to initialClip.path
              if (videoRef.current && !videoRef.current.src.includes("outputs")) {
                videoRef.current.src = `${getBackendUrl()}/${initialClip.path.replace(/\\/g, "/")}`;
              }
            }}
            className="max-h-full max-w-full object-contain"
            playsInline
          />

          {/* Center Play Button Overlay */}
          <button
            onClick={togglePlay}
            className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-2xl hover:scale-110 hover:bg-indigo-500 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </button>
        </div>

        {/* Timeline Control Bar */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-4 space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              Current: <strong className="text-white">{formatSeconds(currentTime)}</strong>
            </span>
            <span>
              Duration:{" "}
              <strong className="text-indigo-400">
                {Math.max(0, endTime - startTime).toFixed(1)}s
              </strong>{" "}
              ({formatSeconds(startTime)} &rarr; {formatSeconds(endTime)})
            </span>
          </div>

          {/* Interactive Scrub Track */}
          <div className="relative h-12 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center px-1 select-none">
            {/* Visual gradient audio-wave representation */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:8px_8px]" />

            {/* Selected boundary highlight */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 bg-indigo-500/25 border-l-2 border-r-2 border-indigo-400 pointer-events-none"
                style={{
                  left: `${(startTime / duration) * 100}%`,
                  width: `${Math.max(2, ((endTime - startTime) / duration) * 100)}%`,
                }}
              />
            )}

            {/* Playhead */}
            {duration > 0 && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-10"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
            )}

            {/* Slider track for seeking */}
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
            />
          </div>

          {/* Fine Tuning Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Start point controls */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Clip Start</span>
                <span className="font-mono text-indigo-400 font-bold">{formatSeconds(startTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = Math.max(0, startTime - 1);
                    setStartTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  -1.0s
                </button>
                <button
                  onClick={() => {
                    const next = Math.max(0, startTime - 0.2);
                    setStartTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  -0.2s
                </button>
                <button
                  onClick={setStartToCurrent}
                  className="flex-1 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-[11px] font-semibold rounded text-indigo-200 transition"
                >
                  Mark Start Here
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(endTime - 0.5, startTime + 0.2);
                    setStartTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  +0.2s
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(endTime - 0.5, startTime + 1);
                    setStartTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  +1.0s
                </button>
              </div>
            </div>

            {/* End point controls */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-300">Clip End</span>
                <span className="font-mono text-indigo-400 font-bold">{formatSeconds(endTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = Math.max(startTime + 0.5, endTime - 1);
                    setEndTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  -1.0s
                </button>
                <button
                  onClick={() => {
                    const next = Math.max(startTime + 0.5, endTime - 0.2);
                    setEndTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  -0.2s
                </button>
                <button
                  onClick={setEndToCurrent}
                  className="flex-1 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-[11px] font-semibold rounded text-indigo-200 transition"
                >
                  Mark End Here
                </button>
                <button
                  onClick={() => {
                    const next = endTime + 0.2;
                    setEndTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  +0.2s
                </button>
                <button
                  onClick={() => {
                    const next = endTime + 1;
                    setEndTime(next);
                    seekTo(next);
                  }}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] rounded text-zinc-300 transition"
                >
                  +1.0s
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Export Configuration Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Clip Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. key_insight"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">Aspect Ratio</label>
            <select
              value={formatChoice}
              onChange={(e) => setFormatChoice(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="9:16">9:16 Vertical (Shorts/TikTok)</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg ${
                isExporting
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer"
              }`}
            >
              {isExporting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>FFmpeg Rendering...</span>
                </>
              ) : (
                <>
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Export Trimmed Clip</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback banners */}
        {exportSuccess && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
