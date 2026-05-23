"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "debug" | "system";
}

interface ActivityLogsProps { logs: LogEntry[]; }

const typeStyles: Record<string, { color: string; tag: string }> = {
  info: { color: "text-[#6C63FF]", tag: "INFO" },
  success: { color: "text-[#00d68f]", tag: " OK " },
  warning: { color: "text-[#ffb547]", tag: "WARN" },
  error: { color: "text-[#ff5c5c]", tag: " ERR" },
  debug: { color: "text-purple-400", tag: "DBUG" },
  system: { color: "text-cyan-400", tag: " SYS" },
};

export default function ActivityLogs({ logs }: ActivityLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current && (scrollRef.current.scrollTop = scrollRef.current.scrollHeight); }, [logs]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-[#7a8ba3]" />
          <div><h3 className="text-[12px] sm:text-[13px] font-extrabold text-white">Activity Logs</h3><p className="text-[10px] text-[#7a8ba3]">{logs.length} entries</p></div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg"><div className="w-1.5 h-1.5 rounded-full bg-[#00d68f] shadow-[0_0_6px_#00d68f] animate-pulse" /><span className="text-[9px] font-bold text-[#00d68f]">LIVE</span></div>
      </div>
      <div ref={scrollRef} className="p-3 sm:p-4 max-h-[280px] sm:max-h-[320px] overflow-y-auto bg-[#0a101e]/60 font-mono text-[10px] sm:text-[11px] leading-5">
        {logs.length === 0 ? (
          <div className="text-[#4a5a72] text-center py-10">Waiting for activity...▋</div>
        ) : (
          <div className="space-y-0.5">
            {logs.map((log, i) => {
              const style = typeStyles[log.type] || typeStyles.info;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="flex gap-2.5 px-1.5 py-0.5 rounded hover:bg-white/[0.02]">
                  <span className="text-[#4a5a72] flex-shrink-0 select-none">{log.timestamp}</span>
                  <span className={`font-semibold flex-shrink-0 ${style.color}`}>[{style.tag}]</span>
                  <span className="text-[#b8c5d6] break-all">{log.message}</span>
                </motion.div>
              );
            })}
            <span className="text-[#4a5a72] inline-block animate-pulse ml-1.5">▋</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
