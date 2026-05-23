"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, Unlink, RefreshCw, CheckCircle2, AlertCircle, Lock, Link2, Shield, FolderLock } from "lucide-react";

interface DriveConnectionHeroProps {
  status: "disconnected" | "connecting" | "connected" | "error";
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh?: () => void;
  onLockFolder?: (link: string) => void;
  onUnlockFolder?: () => void;
  errorMessage?: string;
  folderName?: string | null;
  folderLocked?: boolean;
}

function GoogleDriveLogo() {
  return (
    <svg width="36" height="32" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-110 transition-transform duration-500">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-20.4 35.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.4 9.35z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53-13.75 23.8h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-10.1-17.5c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 23.8h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

export default function DriveConnectionHero({
  status,
  onConnect,
  onDisconnect,
  onRefresh,
  onLockFolder,
  onUnlockFolder,
  errorMessage,
  folderName,
  folderLocked,
}: DriveConnectionHeroProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isError = status === "error";
  const [folderLink, setFolderLink] = useState("");
  const [lockLoading, setLockLoading] = useState(false);

  const handleLock = async () => {
    if (!folderLink.trim() || !onLockFolder) return;
    setLockLoading(true);
    await onLockFolder(folderLink.trim());
    setLockLoading(false);
    setFolderLink("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-card p-5 sm:p-7 rounded-2xl relative overflow-hidden ${
        isConnected && folderLocked ? "border-[#00d68f]/20" : isConnected ? "border-[#6C63FF]/20" : isError ? "border-[#ff5c5c]/20" : "border-white/[0.07]"
      }`}
    >
      {/* Decorative ambient glow */}
      <div className={`absolute -top-12 -right-12 w-48 h-48 sm:w-64 sm:h-64 rounded-full blur-[80px] pointer-events-none opacity-15 transition-colors duration-700 ${
        isConnected && folderLocked ? "bg-[#00d68f]" : isConnected ? "bg-[#6C63FF]" : isError ? "bg-[#ff5c5c]" : "bg-[#6C63FF]"
      }`} />

      <div className="flex flex-col gap-6 relative z-10">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center justify-center flex-shrink-0 group"
            >
              <GoogleDriveLogo />
            </motion.div>
            
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">Google Drive</h2>
                <StatusBadge status={status} folderLocked={folderLocked} />
              </div>
              <p className="text-[12px] sm:text-[13px] text-[#7a8ba3] leading-relaxed max-w-md">
                {isConnected && !folderLocked
                  ? "Connected! Now select a folder to lock access to. We only process files inside your chosen folder."
                  : isConnected && folderLocked
                  ? "Securely locked to your selected folder. Only files within this folder tree are accessible."
                  : "Choose a specific folder from your Google Drive to securely connect and process."
                }
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
            {isConnected ? (
              <>
                {folderLocked && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRefresh}
                    className="btn-ghost flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold cursor-pointer select-none"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDisconnect}
                  className="btn-danger flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold cursor-pointer select-none"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Disconnect
                </motion.button>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConnect}
                disabled={isConnecting}
                className="btn-primary flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold cursor-pointer select-none w-full sm:w-auto disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                {isConnecting ? "Connecting..." : "Connect Google Drive"}
              </motion.button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {isError && errorMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#ff5c5c]/8 border border-[#ff5c5c]/20 text-[12px] text-[#ff7b7b] font-semibold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* FOLDER LOCK SECTION — shown after OAuth, before folder is locked */}
        {isConnected && !folderLocked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 sm:p-5 rounded-2xl glass-surface space-y-4"
          >
            {/* Privacy badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#857dff]" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">Select Your Folder</p>
                <p className="text-[10px] text-[#7a8ba3]">We only access files inside the folder you choose.</p>
              </div>
            </div>

            {/* Paste Link Input */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl glass-input text-[12px] sm:text-[13px]">
                <Link2 className="w-4 h-4 text-[#4a5a72] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Paste Google Drive folder link here..."
                  value={folderLink}
                  onChange={(e) => setFolderLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLock()}
                  className="bg-transparent border-none outline-none text-[#f0f4f8] placeholder-[#4a5a72] w-full text-[12px] sm:text-[13px]"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLock}
                disabled={!folderLink.trim() || lockLoading}
                className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none whitespace-nowrap"
              >
                {lockLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FolderLock className="w-3.5 h-3.5" />
                )}
                Lock Folder
              </motion.button>
            </div>

            {/* Format hint */}
            <p className="text-[10px] text-[#4a5a72] leading-relaxed">
              Accepted: <span className="text-[#7a8ba3] font-mono">https://drive.google.com/drive/folders/...</span> or a raw folder ID.
            </p>
          </motion.div>
        )}

        {/* LOCKED FOLDER DISPLAY */}
        {isConnected && folderLocked && folderName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#00d68f]/5 border border-[#00d68f]/15"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[#00d68f]/10 border border-[#00d68f]/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-[#00d68f]" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#00d68f]/70">Secured Access — Read Only</p>
                <p className="text-[13px] font-bold text-white">{folderName}</p>
              </div>
            </div>
            <button
              onClick={onUnlockFolder}
              className="text-[11px] font-bold text-[#7a8ba3] hover:text-[#ff5c5c] transition-colors cursor-pointer px-3.5 py-1.5 rounded-xl hover:bg-[#ff5c5c]/8 border border-transparent hover:border-[#ff5c5c]/15"
            >
              Change Folder
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status, folderLocked }: { status: string; folderLocked?: boolean }) {
  const config: Record<string, { text: string; className: string; icon?: React.ReactNode }> = {
    disconnected: {
      text: "Offline",
      className: "bg-white/[0.03] text-[#4a5a72] border-white/[0.06]",
    },
    connecting: {
      text: "Connecting",
      className: "bg-[#ffb547]/10 text-[#ffb547] border-[#ffb547]/20",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />,
    },
    connected: {
      text: folderLocked ? "Locked" : "Select Folder",
      className: folderLocked
        ? "bg-[#00d68f]/10 text-[#00d68f] border-[#00d68f]/20"
        : "bg-[#6C63FF]/10 text-[#6C63FF] border-[#6C63FF]/20",
      icon: folderLocked
        ? <CheckCircle2 className="w-2.5 h-2.5 text-[#00d68f]" />
        : <Lock className="w-2.5 h-2.5 text-[#6C63FF]" />,
    },
    error: {
      text: "Failed",
      className: "bg-[#ff5c5c]/10 text-[#ff5c5c] border-[#ff5c5c]/20",
      icon: <AlertCircle className="w-2.5 h-2.5" />,
    },
  };

  const c = config[status] || config.disconnected;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.className}`}>
      {c.icon}
      {c.text}
    </span>
  );
}
