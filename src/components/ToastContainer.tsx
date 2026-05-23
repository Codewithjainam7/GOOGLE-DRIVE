"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X, FolderLock, Unlink, Wifi } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  icon?: "connect" | "disconnect" | "folder" | "default";
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const iconMap = {
  connect: Wifi,
  disconnect: Unlink,
  folder: FolderLock,
  default: Info,
};

const styleMap = {
  success: {
    bg: "from-[#00d68f]/20 via-[#00d68f]/10 to-transparent",
    border: "border-[#00d68f]/25",
    icon: "bg-[#00d68f]/15 text-[#00d68f]",
    text: "text-emerald-200",
    glow: "shadow-[0_0_30px_rgba(0,214,143,0.15)]",
    progress: "bg-[#00d68f]/40",
  },
  error: {
    bg: "from-[#ff5c5c]/20 via-[#ff5c5c]/10 to-transparent",
    border: "border-[#ff5c5c]/25",
    icon: "bg-[#ff5c5c]/15 text-[#ff5c5c]",
    text: "text-red-200",
    glow: "shadow-[0_0_30px_rgba(255,92,92,0.15)]",
    progress: "bg-[#ff5c5c]/40",
  },
  info: {
    bg: "from-[#6C63FF]/20 via-[#6C63FF]/10 to-transparent",
    border: "border-[#6C63FF]/25",
    icon: "bg-[#6C63FF]/15 text-[#857dff]",
    text: "text-[#d1d5db]",
    glow: "shadow-[0_0_30px_rgba(108,99,255,0.15)]",
    progress: "bg-[#6C63FF]/40",
  },
  warning: {
    bg: "from-[#ffb547]/20 via-[#ffb547]/10 to-transparent",
    border: "border-[#ffb547]/25",
    icon: "bg-[#ffb547]/15 text-[#ffb547]",
    text: "text-amber-200",
    glow: "shadow-[0_0_30px_rgba(255,181,71,0.15)]",
    progress: "bg-[#ffb547]/40",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const s = styleMap[toast.type];
  const IconComp = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? AlertCircle : iconMap[toast.icon || "default"];

  useEffect(() => {
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-2xl bg-gradient-to-r ${s.bg} ${s.border} ${s.glow} max-w-[360px] sm:max-w-[420px] w-full cursor-pointer group`}
      onClick={onDismiss}
    >
      {/* Icon */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}>
        <IconComp className="w-4 h-4" />
      </div>

      {/* Message */}
      <p className={`text-[12px] sm:text-[13px] font-bold leading-snug flex-1 ${s.text}`}>
        {toast.message}
      </p>

      {/* Close */}
      <button className="p-1 rounded-lg text-white/30 hover:text-white/60 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 4.5, ease: "linear" }}
        className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full origin-left ${s.progress}`}
      />
    </motion.div>
  );
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4 w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full flex justify-center">
            <ToastItem toast={toast} onDismiss={() => onDismiss(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
