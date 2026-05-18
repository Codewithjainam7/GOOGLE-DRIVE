"use client";

import { Search, Bell, User } from "lucide-react";

interface NavbarProps {
  isConnected: boolean;
}

export default function Navbar({ isConnected }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-950/20 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px]">
        <span className="text-text-muted font-medium">Integrations</span>
        <span className="text-text-muted">/</span>
        <span className="text-white font-semibold">Google Drive</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[12px] text-text-muted cursor-pointer hover:border-white/[0.16] hover:bg-white/[0.05] transition-all">
          <Search className="w-3.5 h-3.5" />
          <span>Search files...</span>
          <kbd className="ml-6 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] font-mono">⌘K</kbd>
        </div>

        {/* Connection Status Dot */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all duration-300 ${
          isConnected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.06]"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-text-muted"
          }`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${
            isConnected ? "text-emerald-400" : "text-text-muted"
          }`}>
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/[0.04] text-text-muted hover:text-text-secondary border border-transparent hover:border-white/[0.06] transition-all cursor-pointer">
          <Bell className="w-4 h-4" />
          {isConnected && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full bg-slate-900/60 border flex items-center justify-center cursor-pointer transition-all ${
          isConnected ? "border-emerald-500/40 hover:ring-2 hover:ring-emerald-500/20" : "border-white/[0.08] hover:ring-2 hover:ring-white/[0.05]"
        }`}>
          <User className="w-4 h-4 text-text-muted" />
        </div>
      </div>
    </header>
  );
}
