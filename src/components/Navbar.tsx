"use client";

import { Search, Bell, User, Lock, Folder } from "lucide-react";

interface NavbarProps {
  isConnected: boolean;
  folderName?: string | null;
}

export default function Navbar({ isConnected, folderName }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-[#050a14]/60 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-3 sm:px-6 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px] sm:text-[13px] min-w-0">
        <span className="text-text-muted font-medium hidden sm:inline">Integrations</span>
        <span className="text-text-muted hidden sm:inline">/</span>
        <span className="text-white font-semibold">Google Drive</span>
        {folderName && (
          <>
            <span className="text-text-muted">/</span>
            <span className="flex items-center gap-1 text-blue-400 font-semibold truncate max-w-[120px] sm:max-w-[200px]">
              <Lock className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{folderName}</span>
            </span>
          </>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Desktop Search */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[12px] text-text-muted cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
          <Search className="w-3.5 h-3.5" />
          <span>Search files...</span>
          <kbd className="ml-4 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[9px] font-mono">⌘K</kbd>
        </div>

        {/* Locked Folder Badge (mobile compact) */}
        {folderName && (
          <div className="flex lg:hidden items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 max-w-[100px]">
            <Folder className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-[9px] font-bold text-blue-400 truncate">{folderName}</span>
          </div>
        )}

        {/* Connection indicator */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 ${
          isConnected ? "bg-emerald-500/8 border-emerald-500/20" : "bg-white/[0.02] border-white/[0.06]"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-text-muted"
          }`} />
          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
            isConnected ? "text-emerald-400" : "text-text-muted"
          }`}>
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/[0.04] text-text-muted hover:text-text-secondary border border-transparent hover:border-white/[0.06] transition-all cursor-pointer hidden sm:flex">
          <Bell className="w-4 h-4" />
          {isConnected && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.06] hidden sm:block" />

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full bg-slate-900/60 border flex items-center justify-center cursor-pointer transition-all ${
          isConnected ? "border-emerald-500/30 hover:ring-2 hover:ring-emerald-500/15" : "border-white/[0.08] hover:ring-2 hover:ring-white/[0.04]"
        }`}>
          <User className="w-3.5 h-3.5 text-text-muted" />
        </div>
      </div>
    </header>
  );
}
