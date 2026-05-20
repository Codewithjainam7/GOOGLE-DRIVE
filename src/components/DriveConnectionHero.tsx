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
    <svg width="36" height="32" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
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
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`glass-card p-5 sm:p-7 rounded-2xl relative overflow-hidden ${
        isConnected && folderLocked ? "border-emerald-500/20" : isConnected ? "border-blue-500/20" : isError ? "border-red-500/20" : "border-white/[0.07]"
      }`}
    >
      {/* Decorative ambient glow */}
      <div className={`absolute top-0 right-0 w-40 h-40 sm:w-56 sm:h-56 rounded-full blur-[80px] pointer-events-none opacity-15 transition-colors duration-700 ${
        isConnected && folderLocked ? "bg-emerald-500" : isConnected ? "bg-blue-500" : isError ? "bg-red-500" : "bg-blue-500"
      }`} />

      <div className="flex flex-col gap-5 relative z-10">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-[0_6px_20px_rgba(0,0,0,0.15)] flex items-center justify-center flex-shrink-0"
            >
              <GoogleDriveLogo />
            </motion.div>
            
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">Google Drive</h2>
                <StatusBadge status={status} folderLocked={folderLocked} />
              </div>
              <p className="text-[12px] sm:text-[13px] text-text-tertiary leading-relaxed max-w-md">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {isConnected ? (
              <>
                {folderLocked && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRefresh}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold text-text-secondary bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all cursor-pointer select-none"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Refresh</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onDisconnect}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-semibold text-red-400 bg-red-500/8 border border-red-500/20 hover:bg-red-500/15 transition-all cursor-pointer select-none"
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
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 border border-blue-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none w-full sm:w-auto"
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
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-[12px] text-red-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* FOLDER LOCK SECTION — shown after OAuth, before folder is locked */}
        {isConnected && !folderLocked && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-4 sm:p-5 rounded-2xl glass-surface space-y-4"
          >
            {/* Privacy badge */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">Select Your Folder</p>
                <p className="text-[10px] text-text-muted">We only access files inside the folder you choose.</p>
              </div>
            </div>

            {/* Paste Link Input */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl glass-input text-[12px] sm:text-[13px]">
                <Link2 className="w-4 h-4 text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Paste Google Drive folder link here..."
                  value={folderLink}
                  onChange={(e) => setFolderLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLock()}
                  className="bg-transparent border-none outline-none text-text-primary placeholder-text-muted w-full text-[12px] sm:text-[13px]"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLock}
                disabled={!folderLink.trim() || lockLoading}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/15 border border-blue-400/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none whitespace-nowrap"
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
            <p className="text-[10px] text-text-muted leading-relaxed">
              Accepted: <span className="text-text-tertiary font-mono">https://drive.google.com/drive/folders/...</span> or a raw folder ID.
            </p>
          </motion.div>
        )}

        {/* LOCKED FOLDER DISPLAY */}
        {isConnected && folderLocked && folderName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">Secured Access — Read Only</p>
                <p className="text-[13px] font-bold text-emerald-300">{folderName}</p>
              </div>
            </div>
            <button
              onClick={onUnlockFolder}
              className="text-[11px] font-semibold text-text-muted hover:text-red-400 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-500/8 border border-transparent hover:border-red-500/15"
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
      className: "bg-white/[0.03] text-text-muted border-white/[0.06]",
    },
    connecting: {
      text: "Handshaking",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: <Loader2 className="w-2.5 h-2.5 animate-spin" />,
    },
    connected: {
      text: folderLocked ? "Locked" : "Select Folder",
      className: folderLocked
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-blue-500/10 text-blue-400 border-blue-500/20",
      icon: folderLocked
        ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
        : <Lock className="w-2.5 h-2.5 text-blue-400" />,
    },
    error: {
      text: "Failed",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: <AlertCircle className="w-2.5 h-2.5" />,
    },
  };

  const c = config[status] || config.disconnected;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.className}`}>
      {c.icon}
      {c.text}
    </span>
  );
}
