"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, KeyRound, RefreshCw, Globe, CheckCircle2 } from "lucide-react";

const features = [
  { icon: KeyRound, label: "OAuth 2.0 Active", description: "Using latest OAuth 2.0 protocol with PKCE flow" },
  { icon: Globe, label: "HTTPS Enabled", description: "All API traffic encrypted via TLS 1.3" },
  { icon: Lock, label: "Refresh Token Encrypted", description: "Tokens encrypted at rest using AES-256-GCM" },
  { icon: Eye, label: "Read-Only Access", description: "Only drive.readonly scope — no write or delete access" },
  { icon: Shield, label: "Folder-Level Firewall", description: "Backend enforces access strictly within your selected folder tree" },
  { icon: RefreshCw, label: "Auto Token Refresh", description: "Tokens refreshed automatically before expiration" },
];

export default function SecurityStatus() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="glass-card rounded-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[#7a8ba3]" />
          <div>
            <h3 className="text-[13px] sm:text-[14px] font-extrabold text-white">Security & Access Control</h3>
            <p className="text-[11px] text-[#7a8ba3] mt-0.5">Architecture security overview</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold bg-[#00d68f]/8 text-[#00d68f] border border-[#00d68f]/20 shadow-[0_0_8px_rgba(0,214,143,0.15)]">
          <CheckCircle2 className="w-3.5 h-3.5" />All Secure
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div key={f.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3.5 p-3.5 rounded-xl glass-surface border border-white/[0.03]">
              <div className="w-8 h-8 rounded-xl bg-[#00d68f]/8 border border-[#00d68f]/15 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon className="w-4 h-4 text-[#00d68f]" /></div>
              <div>
                <div className="flex items-center gap-1.5"><h4 className="text-[11px] font-semibold text-white">{f.label}</h4><div className="w-1 h-1 rounded-full bg-[#00d68f] shadow-[0_0_4px_#00d68f]" /></div>
                <p className="text-[10px] text-[#7a8ba3] mt-1 leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
