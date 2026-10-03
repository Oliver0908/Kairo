"use client";

import React, { useState, useEffect } from "react";
import {
  Server,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Zap,
  RotateCcw
} from "lucide-react";
import { getBackendUrl, setCustomBackendUrl, resetBackendUrl, DEFAULT_BACKEND_URL } from "../lib/config";

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated?: (newUrl: string) => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  onUrlUpdated,
}) => {
  const [urlInput, setUrlInput] = useState<string>("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getBackendUrl());
      setTestStatus("idle");
      setLatency(null);
      setErrorMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl?: string) => {
    const testUrl = (targetUrl || urlInput).trim().replace(/\/$/, "");
    if (!testUrl) {
      setTestStatus("error");
      setErrorMessage("Please enter a valid backend URL.");
      return;
    }

    setTestStatus("testing");
    setErrorMessage("");
    setLatency(null);

    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(`${testUrl}/api/health`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const endTime = performance.now();
      const durationMs = Math.round(endTime - startTime);

      if (res.ok) {
        setLatency(durationMs);
        setTestStatus("success");
      } else {
        setTestStatus("error");
        setErrorMessage(`Server responded with HTTP status ${res.status}`);
      }
    } catch (err: unknown) {
      setTestStatus("error");
      if (err instanceof Error && err.name === "AbortError") {
        setErrorMessage("Request timed out (7s). Make sure your backend and tunnel are running.");
      } else {
        setErrorMessage(
          testUrl.startsWith("http://localhost") && window.location.protocol === "https:"
            ? "Mixed Content blocked by browser! On HTTPS (Vercel), you must use an HTTPS tunnel URL (e.g. Cloudflare Tunnel)."
            : "Cannot reach backend. Check your tunnel URL and verify FastAPI is running on your laptop."
        );
      }
    }
  };

  const handleSave = () => {
    const trimmed = urlInput.trim().replace(/\/$/, "");
    if (trimmed) {
      setCustomBackendUrl(trimmed);
      if (onUrlUpdated) onUrlUpdated(trimmed);
      onClose();
    }
  };

  const handleReset = () => {
    resetBackendUrl();
    setUrlInput(DEFAULT_BACKEND_URL);
    if (onUrlUpdated) onUrlUpdated(DEFAULT_BACKEND_URL);
    handleTestConnection(DEFAULT_BACKEND_URL);
  };

  const handleCopyTunnelCmd = () => {
    navigator.clipboard.writeText("npx cloudflared tunnel --url http://localhost:8000");
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-indigo-500/10 flex flex-col gap-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Backend Connection Settings
              </h2>
              <p className="text-xs text-zinc-400">
                Connect your Vercel frontend to your laptop&apos;s AI backend
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* URL Input */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-300">
            Target Backend API URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setTestStatus("idle");
              }}
              placeholder="https://your-tunnel-name.trycloudflare.com"
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleTestConnection()}
              disabled={testStatus === "testing"}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition disabled:opacity-50"
            >
              {testStatus === "testing" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-400" />
              ) : (
                <Zap className="h-4 w-4 text-amber-400" />
              )}
              <span>Test</span>
            </button>
          </div>

          {/* Test Status feedback */}
          {testStatus === "success" && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Backend is reachable and healthy! Response time: <strong>{latency} ms</strong>
              </span>
            </div>
          )}

          {testStatus === "error" && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-950/40 border border-rose-500/30 px-3 py-2 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold">Connection failed</span>
                <span className="text-zinc-300">{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Guide: Cloudflare Tunnel */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
              Free Cloudflare Quick Tunnel command
            </span>
            <span className="text-[11px] text-zinc-500">Run on your laptop</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 font-mono text-xs text-cyan-300 border border-zinc-800">
            <span className="truncate pr-2">npx cloudflared tunnel --url http://localhost:8000</span>
            <button
              onClick={handleCopyTunnelCmd}
              title="Copy command"
              className="p-1 text-zinc-400 hover:text-white transition"
            >
              {copiedCmd ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Or double-click the included <code>start_backend_tunnel.bat</code> file in your Kairo project root. It prints an HTTPS URL—paste it above and click Save.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/30"
            >
              Save &amp; Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
