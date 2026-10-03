"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Video,
  Film,
  Subtitles,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  Check,
  AlertCircle,
  FileVideo,
  X,
  Sliders
} from "lucide-react";
import { getBackendUrl } from "../lib/config";

interface UploadZoneProps {
  onSessionStarted: (sessionId: string) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onSessionStarted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [formatChoice, setFormatChoice] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [watermarkOn, setWatermarkOn] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type.startsWith("video/") || selected.name.match(/\.(mp4|mov|mkv|webm|avi)$/i)) {
        setFile(selected);
        setErrorMessage(null);
      } else {
        setErrorMessage("Please drop a valid video file (.mp4, .mov, .mkv, .webm, .avi)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select or drop a video file to begin.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("video", file);
    formData.append("format_choice", formatChoice);
    formData.append("burn_subtitles", String(burnSubtitles));
    if (youtubeUrl.trim()) {
      formData.append("youtube_url", youtubeUrl.trim());
    }
    formData.append("watermark_on", String(watermarkOn));
    if (watermarkOn && watermarkText.trim()) {
      formData.append("watermark_text", watermarkText.trim());
    }

    try {
      const res = await fetch(`${getBackendUrl()}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (data.session_id) {
        onSessionStarted(data.session_id);
      } else {
        throw new Error("Invalid response from server: Missing session ID.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please ensure the FastAPI backend is running.";
      setErrorMessage(msg);
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300 mb-3 shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>AI-Powered Viral Video Repurposing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
          Turn Long Videos into <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 bg-clip-text text-transparent">Viral Shorts</span>
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
          Whisper transcription, Gemini multimodal understanding, and data-trained viral scoring automatically find, rank, and crop your highest potential moments.
        </p>
      </div>

      {/* Main Upload Box */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 backdrop-blur-sm ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10 shadow-2xl shadow-indigo-500/20 scale-[1.01]"
              : file
              ? "border-emerald-500/50 bg-emerald-500/[0.03]"
              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.mov,.mkv,.webm,.avi"
            className="hidden"
            onChange={handleFileChange}
          />

          {!file ? (
            <div className="flex flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/60 shadow-xl group-hover:scale-110 transition duration-300">
                <Upload className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="text-base font-semibold text-zinc-200 mb-1">
                Drop your video here, or <span className="text-indigo-400 underline decoration-indigo-400/50 underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-zinc-400">
                Supports MP4, MOV, MKV, WebM up to local storage limit ($0 cloud cost)
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <FileVideo className="h-7 w-7" />
              </div>
              <div className="flex items-center gap-2 max-w-md">
                <p className="text-sm font-semibold text-zinc-200 truncate">{file.name}</p>
                <span className="text-xs text-zinc-400 font-mono">({formatFileSize(file.size)})</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="mt-3 flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 transition"
              >
                <X className="h-3 w-3" /> Remove & Choose Another
              </button>
            </div>
          )}
        </div>

        {/* Options Card */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md space-y-6">
          {/* Format Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 block">
              Target Aspect Ratio
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 9:16 */}
              <button
                type="button"
                onClick={() => setFormatChoice("9:16")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                  formatChoice === "9:16"
                    ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm shadow-indigo-500/20"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className={`p-2 rounded-lg ${formatChoice === "9:16" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    9:16 Vertical
                    {formatChoice === "9:16" && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-zinc-400">Shorts, Reels, TikTok</div>
                </div>
              </button>

              {/* 16:9 */}
              <button
                type="button"
                onClick={() => setFormatChoice("16:9")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                  formatChoice === "16:9"
                    ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm shadow-indigo-500/20"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className={`p-2 rounded-lg ${formatChoice === "16:9" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
                  <Tv className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    16:9 Landscape
                    {formatChoice === "16:9" && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-zinc-400">Standard YouTube Clips</div>
                </div>
              </button>

              {/* 1:1 */}
              <button
                type="button"
                onClick={() => setFormatChoice("1:1")}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition ${
                  formatChoice === "1:1"
                    ? "border-indigo-500 bg-indigo-500/10 text-white shadow-sm shadow-indigo-500/20"
                    : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className={`p-2 rounded-lg ${formatChoice === "1:1" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>
                  <Square className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-1.5">
                    1:1 Square
                    {formatChoice === "1:1" && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-zinc-400">Instagram & LinkedIn</div>
                </div>
              </button>
            </div>
          </div>

          {/* YouTube URL optional input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-rose-500" />
                YouTube Source Link (Optional)
              </label>
              <span className="text-[11px] text-zinc-400">
                Pulls real viewer retention & &quot;most replayed&quot; spikes
              </span>
            </div>
            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
          </div>

          {/* Advanced options toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
            >
              <Sliders className="h-3.5 w-3.5" />
              {showAdvanced ? "Hide Subtitles & Watermark Settings" : "Configure Subtitles & Watermark"}
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-800/80">
                {/* Burn Subtitles */}
                <div
                  onClick={() => setBurnSubtitles(!burnSubtitles)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-950/40 cursor-pointer hover:border-zinc-700 transition"
                >
                  <input
                    type="checkbox"
                    checked={burnSubtitles}
                    onChange={() => {}}
                    className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                      <Subtitles className="h-4 w-4 text-indigo-400" />
                      Burn Dynamic Subtitles
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Generates word-timed yellow/white subtitles via Whisper SRT.
                    </div>
                  </div>
                </div>

                {/* Watermark */}
                <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-2">
                  <div
                    onClick={() => setWatermarkOn(!watermarkOn)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={watermarkOn}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-zinc-200">Overlay Custom Watermark</span>
                  </div>
                  {watermarkOn && (
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="@yourhandle or Brand"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className={`w-full relative group overflow-hidden rounded-2xl py-4 px-6 font-bold text-sm tracking-wide text-white transition duration-300 shadow-xl ${
            !file || isUploading
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40"
              : "bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-500 shadow-indigo-600/30 hover:shadow-indigo-600/50 cursor-pointer"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isUploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <span>Uploading & Starting Kairo AI Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-200" />
                <span>Generate Viral Clips Now</span>
              </>
            )}
          </div>
        </button>
      </form>
    </div>
  );
};
