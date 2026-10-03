"use client";

import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { UploadZone } from "../components/UploadZone";
import { ProcessingTracker } from "../components/ProcessingTracker";
import { ClipsGallery } from "../components/ClipsGallery";
import { TimelineEditor } from "../components/TimelineEditor";
import { SessionHistoryModal } from "../components/SessionHistoryModal";
import { VideoSession, ClipMetadata } from "../lib/supabase";

export default function Home() {
  const [mode, setMode] = useState<"upload" | "processing" | "gallery" | "timeline">("upload");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<VideoSession | null>(null);
  const [activeTrimClip, setActiveTrimClip] = useState<ClipMetadata | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleSessionStarted = (id: string) => {
    setSessionId(id);
    setMode("processing");
  };

  const handleProcessingCompleted = (session: VideoSession) => {
    setCurrentSession(session);
    setMode("gallery");
  };

  const handleProcessingFailed = (errorMsg: string) => {
    console.error("Processing failed:", errorMsg);
  };

  const handleOpenTrim = (clip: ClipMetadata) => {
    setActiveTrimClip(clip);
    setMode("timeline");
  };

  const handleTrimClipUpdated = (newClip: ClipMetadata) => {
    if (currentSession) {
      const updatedClips = [...(currentSession.clips_metadata || []), newClip];
      setCurrentSession({
        ...currentSession,
        clips_metadata: updatedClips,
      });
    }
  };

  const handleSelectHistorySession = (session: VideoSession) => {
    setSessionId(session.id);
    setCurrentSession(session);
    if (session.status === "completed") {
      setMode("gallery");
    } else {
      setMode("processing");
    }
  };

  const handleReset = () => {
    setMode("upload");
    setSessionId(null);
    setCurrentSession(null);
    setActiveTrimClip(null);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onReset={handleReset}
        activeSessionId={sessionId}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {mode === "upload" && (
          <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <UploadZone onSessionStarted={handleSessionStarted} />
          </div>
        )}

        {mode === "processing" && sessionId && (
          <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ProcessingTracker
              sessionId={sessionId}
              onCompleted={handleProcessingCompleted}
              onFailed={handleProcessingFailed}
            />
          </div>
        )}

        {mode === "gallery" && currentSession && (
          <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ClipsGallery
              session={currentSession}
              onOpenTrim={handleOpenTrim}
            />
          </div>
        )}

        {mode === "timeline" && currentSession && activeTrimClip && (
          <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <TimelineEditor
              session={currentSession}
              initialClip={activeTrimClip}
              onClose={() => setMode("gallery")}
              onClipUpdated={handleTrimClipUpdated}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Kairo AI Video Studio • Data-Driven Viral Short Engine</p>
          <p className="font-mono text-[11px] text-zinc-600">
            Next.js App Router + Supabase Realtime + FastAPI Engine
          </p>
        </div>
      </footer>

      {/* Sessions History Drawer */}
      <SessionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectHistorySession}
      />
    </div>
  );
}
