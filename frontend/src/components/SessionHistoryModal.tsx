"use client";

import React, { useEffect, useState } from "react";
import { supabase, VideoSession } from "../lib/supabase";
import { X, History, Clock, Film, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (session: VideoSession) => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSession,
}) => {
  const [sessions, setSessions] = useState<VideoSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("video_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);

      if (!error && data) {
        setSessions(data as VideoSession[]);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Video Sessions History</h3>
              <p className="text-xs text-zinc-400">Cloud database synced via Supabase</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              <p className="text-xs">Fetching past video sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No sessions found yet. Upload a video to start your first session!
            </div>
          ) : (
            sessions.map((sess) => {
              const clipCount = sess.clips_metadata ? sess.clips_metadata.length : 0;
              const dateStr = new Date(sess.created_at).toLocaleString();

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    onSelectSession(sess);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                        {sess.video_name || "Unnamed Video"}
                      </h4>
                      {sess.status === "completed" ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      ) : sess.status === "processing" ? (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                          <Loader2 className="h-3 w-3 animate-spin" /> In Progress
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <AlertCircle className="h-3 w-3" /> Failed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {dateStr}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Film className="h-3 w-3" /> {clipCount} clips
                      </span>
                    </div>
                  </div>

                  <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                    Open &rarr;
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
