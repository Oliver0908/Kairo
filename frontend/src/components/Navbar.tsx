"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Sparkles, History, PlusCircle, AlertCircle, RefreshCw, Settings } from "lucide-react";
import { getBackendUrl } from "../lib/config";
import { BackendSettingsModal } from "./BackendSettingsModal";

interface NavbarProps {
  onOpenHistory: () => void;
  onReset: () => void;
  activeSessionId?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenHistory, onReset, activeSessionId }) => {
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const checkBackend = useCallback(async () => {
    try {
      const res = await fetch(`${getBackendUrl()}/api/health`, { method: "GET" });
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  }, []);

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 10000);

    const handleUrlChange = () => {
      setBackendStatus("checking");
      checkBackend();
    };

    window.addEventListener("kairo_backend_url_changed", handleUrlChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("kairo_backend_url_changed", handleUrlChange);
    };
  }, [checkBackend]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-zinc-950">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">KAIRO</span>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-indigo-300">
                  AI VIRAL v2
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Data-Driven Short Video Repurposing
              </p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex items-center gap-2.5">
            {/* Backend Status indicator with Settings click */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Click to configure backend connection URL"
              className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300 hover:border-indigo-500/50 hover:bg-zinc-800/80 transition"
            >
              {backendStatus === "online" ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-400 font-medium hidden md:inline">Backend Live</span>
                </>
              ) : backendStatus === "checking" ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-zinc-400" />
                  <span className="text-zinc-400 hidden md:inline">Connecting...</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-rose-400 font-medium hidden md:inline">Backend Offline</span>
                </>
              )}
              <Settings className="h-3.5 w-3.5 text-zinc-500 group-hover:text-indigo-400 group-hover:rotate-45 transition-all duration-200" />
            </button>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            >
              <History className="h-4 w-4 text-zinc-400" />
              <span className="hidden sm:inline">Sessions</span>
            </button>

            {/* New Video Button */}
            {activeSessionId && (
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-sm shadow-indigo-600/30"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Video</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Backend Settings Modal */}
      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUrlUpdated={() => checkBackend()}
      />
    </>
  );
};

