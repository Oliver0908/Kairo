"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase, VideoSession } from "../lib/supabase";
import {
  Mic,
  Brain,
  Search,
  Flame,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Loader2
} from "lucide-react";

interface ProcessingTrackerProps {
  sessionId: string;
  onCompleted: (session: VideoSession) => void;
  onFailed: (errorMsg: string) => void;
}

export const ProcessingTracker: React.FC<ProcessingTrackerProps> = ({
  sessionId,
  onCompleted,
  onFailed,
}) => {
  const [session, setSession] = useState<VideoSession | null>(null);
  const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);

  // Fetch initial session state
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      const { data, error } = await supabase
        .from("video_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) {
        console.error("Error fetching session:", error);
        return;
      }

      if (data && isMounted) {
        setSession(data as VideoSession);
        if (data.progress_message) {
          setLogs([{ time: new Date().toLocaleTimeString(), msg: data.progress_message }]);
        }
        if (data.status === "completed") {
          onCompleted(data as VideoSession);
        } else if (data.status === "failed") {
          onFailed(data.progress_message || "Video processing failed");
        }
      }
    };

    fetchSession();

    // Subscribe to Supabase Realtime channel
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as VideoSession;
          setSession(updated);

          if (updated.progress_message) {
            setLogs((prev) => [
              ...prev,
              { time: new Date().toLocaleTimeString(), msg: updated.progress_message || "" },
            ]);
          }

          if (updated.status === "completed") {
            onCompleted(updated);
          } else if (updated.status === "failed") {
            onFailed(updated.progress_message || "Video processing failed");
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId, onCompleted, onFailed]);

  // Determine current active pipeline step
  const currentStep = useMemo(() => {
    const msg = (session?.progress_message || "").toLowerCase();
    if (session?.status === "completed") return 6;
    if (msg.includes("step 5") || msg.includes("cutting") || msg.includes("export")) return 5;
    if (msg.includes("step 4") || msg.includes("scoring")) return 4;
    if (msg.includes("step 3") || msg.includes("detecting")) return 3;
    if (msg.includes("step 2") || msg.includes("analysing") || msg.includes("analyzing")) return 2;
    if (msg.includes("step 1") || msg.includes("transcribing") || msg.includes("audio")) return 1;
    return 1;
  }, [session]);

  const steps = [
    { num: 1, title: "Audio Transcription", desc: "OpenAI Whisper", icon: Mic },
    { num: 2, title: "Visual & Content AI", desc: "Gemini Flash Multimodal", icon: Brain },
    { num: 3, title: "Moment Detection", desc: "Pacing & Speech Flow", icon: Search },
    { num: 4, title: "AI Viral Scoring", desc: "Custom ML Ridge Regressor", icon: Flame },
    { num: 5, title: "FFmpeg Clip Export", desc: "Auto-Crop & Subtitles", icon: Scissors },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header status */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Processing Video
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate max-w-md">
              {session?.video_name || "Input Video"}
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">Session: {sessionId}</p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950/70 border border-zinc-800 rounded-xl px-4 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-300">
              {session?.progress_message || "Initializing pipeline..."}
            </span>
          </div>
        </div>

        {/* 5-Step Pipeline Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
          {steps.map((st) => {
            const isCompleted = currentStep > st.num || session?.status === "completed";
            const isActive = currentStep === st.num && session?.status !== "completed";
            const Icon = st.icon;

            return (
              <div
                key={st.num}
                className={`relative flex flex-col items-center text-center p-3.5 rounded-xl border transition-all duration-300 ${
                  isCompleted
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/10"
                    : isActive
                    ? "border-indigo-500 bg-indigo-500/15 text-indigo-300 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                    : "border-zinc-800/80 bg-zinc-950/40 text-zinc-500"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${
                    isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isActive
                      ? "bg-indigo-500/30 text-indigo-300 animate-pulse"
                      : "bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="text-xs font-semibold leading-tight mb-0.5">{st.title}</div>
                <div className="text-[10px] text-zinc-400">{st.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, Math.max(10, (currentStep / 5) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Terminal Live Activity Log */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 font-mono shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold text-zinc-300">Live Engine Console</span>
          </div>
          <span className="text-[11px] text-zinc-400">Supabase Realtime Feed</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs pr-2">
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic">Waiting for initial engine message...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-zinc-400 select-none">[{log.time}]</span>
                <span className="text-indigo-400 select-none">&gt;</span>
                <span className="text-zinc-300">{log.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
