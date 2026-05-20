"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  HardDrive,
  Puzzle,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  FileSearch,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "drive", label: "Google Drive", icon: HardDrive },
  { id: "tax", label: "Tax Automation", icon: FileSearch },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "logs", label: "Activity Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  isConnected: boolean;
  folderName?: string | null;
}

export default function Sidebar({ activeSection, onSectionChange, isConnected, folderName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
      className="fixed left-0 top-0 h-screen z-40 hidden md:flex flex-col glass-deep select-none"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 animate-pulse-glow">
          <Zap className="w-4.5 h-4.5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="text-[14px] font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-nowrap tracking-tight">
                IntegrateFlow
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Section Label */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 pt-4 pb-1"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">Navigation</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav Items */}
      <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          const isTax = item.id === "tax";
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 cursor-pointer select-none
                ${active
                  ? "text-blue-400 font-semibold"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.03]"
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <motion.div
                  layoutId="activeTabSidebar"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-white/[0.06] border border-white/[0.08] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.06)]"
                />
              )}

              <Icon className={`w-[18px] h-[18px] flex-shrink-0 relative z-10 ${active ? "text-blue-400" : ""}`} />
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap relative z-10 flex items-center gap-2"
                  >
                    {item.label}
                    {isTax && (
                      <span className="text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-md leading-none">
                        POC
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Locked Folder + Connection Status */}
      <div className="px-2.5 pb-2 space-y-2">
        {/* Locked folder indicator */}
        {isConnected && folderName && !collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wider text-blue-400/70">Locked Folder</p>
              <p className="text-[11px] font-semibold text-blue-300 truncate">{folderName}</p>
            </div>
          </motion.div>
        )}

        {/* Connection Status */}
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
          isConnected ? "bg-emerald-500/8 border border-emerald-500/15" : "bg-white/[0.02] border border-white/[0.04]"
        }`}>
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isConnected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-text-muted"
          }`} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-[10px] font-bold tracking-wider uppercase relative z-10 ${
                  isConnected ? "text-emerald-400" : "text-text-muted"
                }`}
              >
                {isConnected ? "Connected" : "Offline"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="px-2.5 pb-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-xl text-text-muted border border-white/[0.04] hover:text-text-tertiary hover:bg-white/[0.03] transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
