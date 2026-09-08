"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Share2 } from "lucide-react";

export function TrackingLinkActions({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/track/${token}`);
  }, [token]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — fall back to manual selection
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Track your delivery", url });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">{url}</code>
      <button
        onClick={copyLink}
        type="button"
        className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy Tracking Link"}
      </button>
      <button
        onClick={shareLink}
        type="button"
        className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share Tracking Link
      </button>
    </div>
  );
}
