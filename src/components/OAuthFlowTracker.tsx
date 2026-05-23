"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Circle, FolderLock } from "lucide-react";

const steps = [
  "Redirecting to Google",
  "Google Login Completed",
  "OAuth Consent Approved",
  "Authorization Code Received",
  "Access Token Generated",
  "Refresh Token Stored",
  "Google Drive API Connected",
  "Folder Access Locked",
];

interface OAuthFlowTrackerProps {
  currentStep: number; // 0 = not started, 1-8 = in progress, 9 = all done
  visible: boolean;
}

export default function OAuthFlowTracker({ currentStep, visible }: OAuthFlowTrackerProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card p-5 sm:p-7 rounded-2xl relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-[13px] sm:text-base font-extrabold text-white tracking-tight">Authentication Pipeline</h3>
          <p className="text-[11px] text-[#7a8ba3] mt-0.5 font-medium">OAuth 2.0 → Folder Lock handshake</p>
        </div>
        {currentStep > 0 && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#6C63FF] bg-[#6C63FF]/8 border border-[#6C63FF]/20 px-2.5 py-1 rounded-xl w-fit">
            Stage {Math.min(currentStep, 8)} / 8
          </span>
        )}
      </div>

      {/* Steps — responsive grid on larger screens, vertical on mobile */}
      <div className="space-y-0">
        {steps.map((label, index) => {
          const stepNum = index + 1;
          let state: "done" | "active" | "pending" = "pending";
          if (stepNum < currentStep) state = "done";
          else if (stepNum === currentStep) state = currentStep > 8 ? "done" : "active";

          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex items-center gap-3 sm:gap-4">
              {/* Vertical line + Icon */}
              <div className="flex flex-col items-center flex-shrink-0">
                {index > 0 && (
                  <div className={`w-[1.5px] h-3 transition-colors duration-500 ${
                    state !== "pending" ? "bg-[#00d68f]/40" : "bg-white/[0.05]"
                  }`} />
                )}
                
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  state === "done" ? "bg-[#00d68f]/10 border border-[#00d68f]/25 shadow-[0_0_8px_rgba(0,214,143,0.15)]" :
                  state === "active" ? "bg-[#6C63FF]/10 border border-[#6C63FF]/30 shadow-[0_0_12px_rgba(108,99,255,0.2)] animate-pulse" :
                  "bg-white/[0.02] border border-white/[0.06]"
                }`}>
                  {state === "done" && <Check className="w-3 h-3 text-[#00d68f]" />}
                  {state === "active" && <Loader2 className="w-3 h-3 text-[#6C63FF] animate-spin" />}
                  {state === "pending" && <Circle className="w-2 h-2 text-[#4a5a72]" />}
                </div>

                {!isLast && (
                  <div className={`w-[1.5px] h-3 transition-colors duration-500 ${
                    state === "done" ? "bg-[#00d68f]/40" : "bg-white/[0.05]"
                  }`} />
                )}
              </div>

              {/* Label */}
              <span className={`text-[12px] sm:text-[13px] font-medium transition-colors duration-500 flex items-center gap-2 ${
                state === "done" ? "text-[#00d68f] font-bold" :
                state === "active" ? "text-[#6C63FF] font-bold" :
                "text-[#7a8ba3]"
              }`}>
                {isLast && <FolderLock className="w-3.5 h-3.5" />}
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-[3px] rounded-full bg-white/[0.03] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00d68f] shadow-[0_0_8px_rgba(108,99,255,0.4)]"
          initial={{ width: "0%" }}
          animate={{ width: `${Math.min((currentStep / 8) * 100, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}
