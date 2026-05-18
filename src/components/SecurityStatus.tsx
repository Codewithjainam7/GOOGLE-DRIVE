"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Eye, KeyRound, RefreshCw, Globe, CheckCircle2 } from "lucide-react";

const features = [
  { icon: KeyRound, label: "OAuth 2.0 Active", description: "Using latest OAuth 2.0 protocol with PKCE flow" },
  { icon: Globe, label: "HTTPS Enabled", description: "All API traffic encrypted via TLS 1.3" },
  { icon: Lock, label: "Refresh Token Encrypted", description: "Tokens encrypted at rest using AES-256-GCM" },
  { icon: Eye, label: "Minimal Scope Access", description: "Only drive.readonly and drive.file scopes requested" },
  { icon: Shield, label: "Backend Managed Auth", description: "Token exchange happens server-side only" },
  { icon: RefreshCw, label: "Auto Token Refresh", description: "Tokens refreshed automatically before expiration" },
];

export default function SecurityStatus() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-text-muted" />
          <div>
            <h3 className="text-[14px] font-semibold text-text-primary">Security & Token Status</h3>
            <p className="text-[12px] text-text-muted mt-0.5">Architecture security overview</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-success-muted text-success border border-success/20">
          <CheckCircle2 className="w-2.5 h-2.5" />
          All Secure
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="flex items-start gap-3 p-3.5 rounded-lg bg-white/[0.02] border border-border"
            >
              <div className="w-7 h-7 rounded-lg bg-success-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-success" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-[12px] font-medium text-text-primary">{f.label}</h4>
                  <div className="w-1 h-1 rounded-full bg-success" />
                </div>
                <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
