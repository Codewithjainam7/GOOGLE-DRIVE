"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";

const steps = [
  "Redirecting to Google",
  "Google Login Completed",
  "OAuth Consent Approved",
  "Authorization Code Received",
  "Access Token Generated",
  "Refresh Token Stored",
  "Google Drive API Connected",
];

interface OAuthFlowTrackerProps {
  currentStep: number; // 0 = not started, 1-7 = in progress, 8 = all done
  visible: boolean;
}

export default function OAuthFlowTracker({ currentStep, visible }: OAuthFlowTrackerProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="glass-card p-6 sm:p-7 rounded-2xl relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[14px] sm:text-base font-bold text-white tracking-tight">Authentication Pipeline</h3>
          <p className="text-[12px] text-text-muted mt-0.5 font-medium">OAuth 2.0 handshake handshake tracker</p>
        </div>
        {currentStep > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
            Stage {Math.min(currentStep, 7)} / 7
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          let state: "done" | "active" | "pending" = "pending";
          if (stepNum < currentStep) state = "done";
          else if (stepNum === currentStep) state = currentStep > 7 ? "done" : "active";

          return (
            <div key={index} className="flex items-center gap-4">
              {/* Vertical line + Icon */}
              <div className="flex flex-col items-center flex-shrink-0">
                {index > 0 && (
                  <div className={`w-[2px] h-4 transition-colors duration-500 ${
                    state !== "pending" ? "bg-emerald-500/40" : "bg-white/[0.06]"
                  }`} />
                )}
                
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  state === "done" ? "bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                  state === "active" ? "bg-blue-500/10 border border-blue-500/35 shadow-[0_0_12px_rgba(59,130,246,0.15)] animate-pulse" :
                  "bg-white/[0.02] border border-white/[0.06]"
                }`}>
                  {state === "done" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {state === "active" && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />}
                  {state === "pending" && <Circle className="w-2.5 h-2.5 text-text-muted" />}
                </div>

                {index < steps.length - 1 && (
                  <div className={`w-[2px] h-4 transition-colors duration-500 ${
                    state === "done" ? "bg-emerald-500/40" : "bg-white/[0.06]"
                  }`} />
                )}
              </div>

              {/* Label */}
              <span className={`text-[13px] font-medium transition-colors duration-500 ${
                state === "done" ? "text-emerald-400 font-semibold" :
                state === "active" ? "text-blue-400 font-semibold" :
                "text-text-muted"
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-6 h-[4px] rounded-full bg-white/[0.04] border border-white/[0.02] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min((currentStep / 7) * 100, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
