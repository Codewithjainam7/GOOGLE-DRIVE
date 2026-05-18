"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Mail, Calendar, Key, CheckCircle, Unlink } from "lucide-react";

interface ProfileData {
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
  connected_at?: string;
  scopes?: string[];
  token_masked?: string;
  refresh_token_present?: boolean;
  expiry_date?: number;
}

interface ConnectedAccountProps {
  profile: ProfileData | null;
  onDisconnect: () => void;
}

export default function ConnectedAccount({ profile, onDisconnect }: ConnectedAccountProps) {
  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
        {/* User Card Info */}
        <div className="flex items-center gap-4">
          {profile.picture ? (
            <img
              src={profile.picture}
              alt={profile.name}
              className="w-14 h-14 rounded-2xl object-cover border border-white/[0.12] shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg border border-white/[0.12] shadow-lg">
              {profile.name?.[0] || "U"}
            </div>
          )}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{profile.name || "Authenticated User"}</h3>
            <p className="text-[12px] text-text-tertiary flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              {profile.email}
            </p>
          </div>
        </div>

        {/* Security Summary Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-fit">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Connection Secure</p>
            <p className="text-[11px] text-emerald-300/80 font-medium">Encrypted SSL Session</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Session Info */}
        <div className="space-y-3.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Security Parameters</h4>
          
          <div className="space-y-2">
            {/* Connected At */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[13px]">
              <span className="text-text-tertiary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Linked At
              </span>
              <span className="text-white font-medium">
                {profile.connected_at ? new Date(profile.connected_at).toLocaleString() : "Just now"}
              </span>
            </div>

            {/* Token Masked */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[13px]">
              <span className="text-text-tertiary flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                Bearer Token
              </span>
              <span className="text-text-secondary font-mono tracking-wider font-semibold text-[12px]">
                {profile.token_masked || "••••••••••••••••"}
              </span>
            </div>
          </div>
        </div>

        {/* Scopes & Permissions */}
        <div className="space-y-3.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Granted Permissions</h4>
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            {profile.scopes && profile.scopes.length > 0 ? (
              profile.scopes.map((scope) => (
                <div key={scope} className="flex items-center gap-2 text-[12px] text-text-secondary font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate" title={scope}>
                    {scope.replace("https://www.googleapis.com/auth/", "")}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[12px] text-text-muted">No custom scopes verified.</div>
            )}
          </div>
        </div>
      </div>

      {/* Disconnect Button (Mobile Layout Helper) */}
      <div className="flex justify-end mt-6 md:hidden">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDisconnect}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
        >
          <Unlink className="w-4 h-4" />
          Disconnect Google Account
        </motion.button>
      </div>
    </motion.div>
  );
}
