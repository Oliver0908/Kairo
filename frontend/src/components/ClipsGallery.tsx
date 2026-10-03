"use client";

import React, { useState } from "react";
import { VideoSession, ClipMetadata } from "../lib/supabase";
import {
  Flame,
  Download,
  Sliders,
  Copy,
  Check,
  Play,
  Film,
  Sparkles,
  Share2,
  Clock,
  ExternalLink
} from "lucide-react";
import { getBackendUrl } from "../lib/config";

interface ClipsGalleryProps {
  session: VideoSession;
  onOpenTrim: (clip: ClipMetadata) => void;
}

export const ClipsGallery: React.FC<ClipsGalleryProps> = ({ session, onOpenTrim }) => {
  const clips = session.clips_metadata || [];
  const [selectedClip, setSelectedClip] = useState<ClipMetadata | null>(
    clips.length > 0 ? clips[0] : null
  );
  const [copiedCaptionIndex, setCopiedCaptionIndex] = useState<number | null>(null);

  const getFullVideoUrl = (path: string) => {
    const cleanPath = path.replace(/\\/g, "/");
    const baseUrl = getBackendUrl();
    if (cleanPath.startsWith("outputs/")) {
      return `${baseUrl}/${cleanPath}`;
    }
    return `${baseUrl}/outputs/${cleanPath}`;
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) {
      return {
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        label: "🔥 Ultra Viral",
      };
    } else if (score >= 75) {
      return {
        bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        label: "⚡ High Impact",
      };
    } else {
      return {
        bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
        label: "✨ Solid Clip",
      };
    }
  };

  const handleCopyCaption = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCaptionIndex(index);
    setTimeout(() => setCopiedCaptionIndex(null), 2500);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Stats */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Processing Complete • {clips.length} Clips Exported</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {session.video_name || "Generated Clips"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Ranked by Kairo&apos;s custom AI viral scoring model. Preview, trim, copy captions, and download.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-center min-w-[100px]">
            <div className="text-2xl font-black text-white">{clips.length}</div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Clips Ready</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-center min-w-[100px]">
            <div className="text-2xl font-black text-amber-400">
              {clips.length > 0 ? Math.max(...clips.map((c) => c.score)) : 0}
            </div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Peak Score</div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Player & Detail: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {selectedClip ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-xl shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                    Previewing Clip
                  </span>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {selectedClip.label}
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                        getScoreBadge(selectedClip.score).bg
                      }`}
                    >
                      Score: {selectedClip.score}/100
                    </span>
                  </h3>
                </div>
                <div className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatSeconds(selectedClip.start)} - {formatSeconds(selectedClip.end)} (
                    {Math.round(selectedClip.end - selectedClip.start)}s)
                  </span>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-zinc-800 shadow-inner group">
                <video
                  key={selectedClip.path}
                  controls
                  playsInline
                  className="max-h-full max-w-full object-contain"
                  src={getFullVideoUrl(selectedClip.path)}
                >
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => onOpenTrim(selectedClip)}
                  className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2.5 text-xs font-semibold text-indigo-300 transition"
                >
                  <Sliders className="h-4 w-4" />
                  <span>Fine-Tune in Timeline Editor</span>
                </button>

                <a
                  href={getFullVideoUrl(selectedClip.path)}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2.5 text-xs font-bold transition shadow-md shadow-white/5"
                >
                  <Download className="h-4 w-4" />
                  <span>Download MP4</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-12 text-center text-zinc-500">
              <Film className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No clip selected. Pick a clip from the list to preview.</p>
            </div>
          )}

          {/* Social Media Caption Card */}
          {session.captions && (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">AI-Generated Social Media Captions</h3>
                </div>
                <span className="text-[11px] text-zinc-400">Crafted for viral reach</span>
              </div>

              <div className="space-y-3">
                {Object.entries(session.captions).map(([key, captionText], idx) => (
                  <div
                    key={key}
                    className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs text-zinc-300 relative group flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
                        {key}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{captionText}</p>
                    </div>
                    <button
                      onClick={() => handleCopyCaption(captionText, idx)}
                      className="flex-shrink-0 flex items-center gap-1 text-[11px] rounded-lg bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 text-zinc-300 font-medium transition"
                    >
                      {copiedCaptionIndex === idx ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Clips List: 5 cols */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Ranked Clips ({clips.length})
            </h3>
            <span className="text-xs text-zinc-400">Click to preview</span>
          </div>

          <div className="space-y-3">
            {clips.map((clip, index) => {
              const isSelected = selectedClip?.path === clip.path;
              const badge = getScoreBadge(clip.score);

              return (
                <div
                  key={clip.path}
                  onClick={() => setSelectedClip(clip)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 backdrop-blur-md relative overflow-hidden ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 scale-[1.01]"
                      : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {clip.label}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                          <span>
                            {formatSeconds(clip.start)} - {formatSeconds(clip.end)}
                          </span>
                          <span>•</span>
                          <span>{Math.round(clip.end - clip.start)}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${badge.bg}`}>
                        <Flame className="h-3 w-3" />
                        <span>{clip.score}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1">{badge.label}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3 fill-indigo-300" /> Currently Playing
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrim(clip);
                        }}
                        className="underline hover:text-white"
                      >
                        Edit boundaries &rarr;
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
