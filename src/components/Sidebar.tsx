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
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "drive", label: "Google Drive", icon: HardDrive },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "logs", label: "Activity Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
  isConnected: boolean;
}

export default function Sidebar({ activeSection, onSectionChange, isConnected }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 240 }}
      transition={{ duration: 0.3, ease: [0.25, 0.8, 0.25, 1] }}
      className="fixed left-0 top-0 h-screen z-40 hidden md:flex flex-col bg-slate-950/45 backdrop-blur-2xl border-r border-white/[0.08] select-none"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 h-16 px-5 border-b border-white/[0.08] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="text-[14px] font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent whitespace-nowrap tracking-tight">
                IntegrateFlow
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 cursor-pointer select-none
                ${active
                  ? "text-blue-400 font-semibold"
                  : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.02]"
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {/* Sliding Active Indicator Back Pill */}
              {active && (
                <motion.div
                  layoutId="activeTabSidebar"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-white/[0.06] border border-white/[0.08] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.08)]"
                />
              )}

              <Icon className={`w-[18px] h-[18px] flex-shrink-0 relative z-10 ${active ? "text-blue-400" : "text-text-tertiary"}`} />
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Connection Status Badge */}
      <div className="px-3 pb-3">
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
          isConnected ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.02] border border-white/[0.04]"
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
                className={`text-[11px] font-semibold tracking-wider uppercase relative z-10 ${
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
      <div className="px-3 pb-4">
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
