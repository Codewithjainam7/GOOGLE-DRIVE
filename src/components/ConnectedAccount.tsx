"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Mail, Calendar, Key, CheckCircle, Unlink, Lock, Eye } from "lucide-react";

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
  folder_id?: string | null;
  folder_name?: string | null;
  folder_link?: string | null;
}

interface ConnectedAccountProps {
  profile: ProfileData | null;
  onDisconnect: () => void;
}

function DetailRow({ icon, label, value, mono, highlight }: {
  icon: React.ReactNode; label: string; value: string; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass-surface text-[12px]">
      <span className="text-[#7a8ba3] flex items-center gap-2">{icon}{label}</span>
      <span className={`font-semibold truncate max-w-[140px] sm:max-w-[180px] ${highlight ? "text-[#00d68f]" : mono ? "font-mono text-[11px] text-[#b8c5d6] tracking-wider" : "text-white"}`}>{value}</span>
    </div>
  );
}

export default function ConnectedAccount({ profile, onDisconnect }: ConnectedAccountProps) {
  if (!profile) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="glass-card p-5 sm:p-7 rounded-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3.5">
          {profile.picture ? (
            <img src={profile.picture} alt={profile.name} className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover border border-white/[0.1] shadow-lg shadow-[#6C63FF]/5" />
          ) : (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#6C63FF] to-purple-600 flex items-center justify-center text-white font-bold text-lg border border-white/[0.1] shadow-lg">{profile.name?.[0] || "U"}</div>
          )}
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-[14px] sm:text-base font-extrabold text-white tracking-tight truncate">{profile.name || "User"}</h3>
            <p className="text-[11px] text-[#7a8ba3] flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-[#857dff] flex-shrink-0" /><span className="truncate">{profile.email}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00d68f]/8 border border-[#00d68f]/15">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00d68f]" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#00d68f]">Secure</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C63FF]/8 border border-[#6C63FF]/15">
            <Eye className="w-3.5 h-3.5 text-[#857dff]" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#857dff]">Read Only</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#4a5a72]">Session Details</h4>
          <div className="space-y-2">
            <DetailRow icon={<Calendar className="w-3.5 h-3.5 text-[#857dff]" />} label="Connected" value={profile.connected_at ? new Date(profile.connected_at).toLocaleString() : "Just now"} />
            <DetailRow icon={<Key className="w-3.5 h-3.5 text-purple-400" />} label="Bearer Token" value={profile.token_masked || "••••••••"} mono />
            {profile.folder_name && <DetailRow icon={<Lock className="w-3.5 h-3.5 text-[#00d68f]" />} label="Locked Folder" value={profile.folder_name} highlight />}
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#4a5a72]">Granted Scopes</h4>
          <div className="p-3.5 rounded-xl glass-surface space-y-2">
            {profile.scopes && profile.scopes.length > 0 ? profile.scopes.map((scope) => (
              <div key={scope} className="flex items-center gap-2.5 text-[11px] text-[#b8c5d6] font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-[#00d68f] flex-shrink-0" />
                <span className="truncate" title={scope}>{scope.replace("https://www.googleapis.com/auth/", "")}</span>
              </div>
            )) : <div className="text-[11px] text-[#4a5a72]">No scopes.</div>}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-5 sm:hidden">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onDisconnect} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-bold text-[#ff5c5c] bg-[#ff5c5c]/8 border border-[#ff5c5c]/20 hover:bg-[#ff5c5c]/15 transition-all cursor-pointer">
          <Unlink className="w-3.5 h-3.5" />Disconnect
        </motion.button>
      </div>
    </motion.div>
  );
}
