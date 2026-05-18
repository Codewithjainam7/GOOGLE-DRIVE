"use client";

import { motion } from "framer-motion";
import { ExternalLink, Loader2, Unlink, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface DriveConnectionHeroProps {
  status: "disconnected" | "connecting" | "connected" | "error";
  onConnect: () => void;
  onDisconnect: () => void;
  errorMessage?: string;
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

export default function DriveConnectionHero({ status, onConnect, onDisconnect, errorMessage }: DriveConnectionHeroProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isError = status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden ${
        isConnected ? "border-emerald-500/20" : isError ? "border-red-500/20" : "border-white/[0.08]"
      }`}
    >
      {/* Decorative inner ambient glow */}
      <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-20 transition-colors duration-500 ${
        isConnected ? "bg-emerald-500" : isError ? "bg-red-500" : "bg-blue-500"
      }`} />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        {/* Left Section */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.15)] flex items-center justify-center flex-shrink-0"
          >
            <GoogleDriveLogo />
          </motion.div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Google Drive Integration</h2>
              <StatusBadge status={status} />
            </div>
            <p className="text-[13px] text-text-tertiary leading-relaxed max-w-lg">
              Securely connect and authorize IntegrateFlow to access your files, sync changes, and visualize file insights with zero local footprint.
            </p>
            {isError && errorMessage && (
              <p className="text-[12px] text-red-400 flex items-center gap-1.5 mt-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg w-fit">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Right Action Section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isConnected ? (
            <>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-text-secondary bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all cursor-pointer select-none"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Sync
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDisconnect}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer select-none"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 border border-blue-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {isConnecting ? "Connecting Account..." : "Connect Google Drive"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; className: string; icon?: React.ReactNode }> = {
    disconnected: {
      text: "Offline",
      className: "bg-white/[0.03] text-text-muted border-white/[0.06]",
    },
    connecting: {
      text: "Handshaking",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    connected: {
      text: "Synchronized",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
    },
    error: {
      text: "OAuth Failed",
      className: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const c = config[status] || config.disconnected;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${c.className}`}>
      {c.icon}
      {c.text}
    </span>
  );
}
