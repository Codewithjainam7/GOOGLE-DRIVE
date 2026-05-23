"use client";

import { Search, Bell, User, Lock, Folder } from "lucide-react";

interface NavbarProps {
  isConnected: boolean;
  folderName?: string | null;
}

export default function Navbar({ isConnected, folderName }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-[#06080f]/60 backdrop-blur-2xl border-b border-white/[0.06] flex items-center justify-between px-4 sm:px-8 select-none">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[11px] sm:text-[13px] min-w-0 flex-1">
        <span className="text-[#7a8ba3] font-medium hidden sm:inline">Integrations</span>
        <span className="text-[#7a8ba3] hidden sm:inline">/</span>
        <span className="text-white font-semibold whitespace-nowrap">Google Drive</span>
        {folderName && (
          <>
            <span className="text-[#7a8ba3] hidden sm:inline">/</span>
            <span className="hidden sm:flex items-center gap-1 text-[#6C63FF] font-semibold truncate max-w-[200px]">
              <Lock className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{folderName}</span>
            </span>
          </>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Desktop Search */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[12px] text-[#7a8ba3] cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
          <Search className="w-3.5 h-3.5" />
          <span>Search files...</span>
          <kbd className="ml-4 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[9px] font-mono">⌘K</kbd>
        </div>

        {/* Locked Folder Badge (mobile compact) */}
        {folderName && (
          <div className="flex lg:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#6C63FF]/10 border border-[#6C63FF]/20 max-w-[120px]">
            <Folder className="w-3.5 h-3.5 text-[#857dff] flex-shrink-0" />
            <span className="text-[10px] font-bold text-white truncate">{folderName}</span>
          </div>
        )}

        {/* Connection indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
          isConnected ? "bg-[#00d68f]/8 border-[#00d68f]/20" : "bg-white/[0.02] border-white/[0.06]"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? "bg-[#00d68f] shadow-[0_0_8px_#00d68f] animate-pulse" : "bg-[#4a5a72]"
          }`} />
          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
            isConnected ? "text-[#00d68f]" : "text-[#4a5a72]"
          }`}>
            {isConnected ? "Live" : "Offline"}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-white/[0.04] text-[#7a8ba3] hover:text-[#b8c5d6] border border-transparent hover:border-white/[0.06] transition-all cursor-pointer hidden sm:flex">
          <Bell className="w-4 h-4" />
          {isConnected && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#6C63FF] rounded-full shadow-[0_0_6px_#6C63FF]" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.06] hidden sm:block" />

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full bg-slate-900/60 border flex items-center justify-center cursor-pointer transition-all ${
          isConnected ? "border-[#00d68f]/30 hover:ring-2 hover:ring-[#00d68f]/15" : "border-white/[0.08] hover:ring-2 hover:ring-white/[0.04]"
        }`}>
          <User className="w-3.5 h-3.5 text-[#7a8ba3]" />
        </div>
      </div>
    </header>
  );
}
