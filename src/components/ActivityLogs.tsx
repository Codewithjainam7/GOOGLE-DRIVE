"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "debug" | "system";
}

interface ActivityLogsProps {
  logs: LogEntry[];
}

const typeStyles: Record<string, { color: string; tag: string }> = {
  info: { color: "text-blue-400", tag: "INFO" },
  success: { color: "text-green-400", tag: " OK " },
  warning: { color: "text-amber-400", tag: "WARN" },
  error: { color: "text-red-400", tag: " ERR" },
  debug: { color: "text-violet-400", tag: "DBUG" },
  system: { color: "text-cyan-400", tag: " SYS" },
};

export default function ActivityLogs({ logs }: ActivityLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-4 h-4 text-text-muted" />
          <div>
            <h3 className="text-[13px] font-semibold text-text-primary">Activity Logs</h3>
            <p className="text-[11px] text-text-muted">{logs.length} entries</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] font-medium text-success">LIVE</span>
        </div>
      </div>

      {/* Log Output */}
      <div
        ref={scrollRef}
        className="p-4 max-h-[320px] overflow-y-auto bg-surface-1 font-mono text-[11px] leading-5"
      >
        {logs.length === 0 ? (
          <div className="text-text-muted text-center py-8">
            Waiting for activity...<span className="cursor-blink">▋</span>
          </div>
        ) : (
          <>
            {logs.map((log, i) => {
              const style = typeStyles[log.type] || typeStyles.info;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex gap-2.5 px-1 py-0.5 rounded hover:bg-white/[0.02]"
                >
                  <span className="text-text-muted flex-shrink-0 select-none">{log.timestamp}</span>
                  <span className={`font-semibold flex-shrink-0 ${style.color}`}>[{style.tag}]</span>
                  <span className="text-text-secondary">{log.message}</span>
                </motion.div>
              );
            })}
            <span className="text-text-muted cursor-blink">▋</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
