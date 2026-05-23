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
  { id: "tax", label: "Invoice Scanner", icon: FileSearch },
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
      animate={{ width: collapsed ? 84 : 260 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 h-screen z-40 hidden md:flex flex-col glass-deep select-none overflow-visible"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-[72px] px-6 border-b border-white/[0.06] flex-shrink-0">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C63FF] via-[#857dff] to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#6C63FF]/20 relative overflow-hidden group">
          <Zap className="w-4.5 h-4.5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <span className="text-[15px] font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-nowrap tracking-tight">
                IntegrateFlow
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto flex flex-col relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          
          return (
            <div key={item.id} className="relative w-full">
              <button
                onClick={() => onSectionChange(item.id)}
                className={`
                  w-full relative flex items-center h-14 cursor-pointer select-none group
                  ${active
                    ? "text-white font-bold"
                    : "text-[#7a8ba3] hover:text-[#b8c5d6]"
                  }
                `}
                title={collapsed ? item.label : undefined}
              >
                {/* The Seamless Liquid Background */}
                {active && (
                  <motion.div
                    layoutId="activeTabSidebarLiquid"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className="absolute inset-y-0 left-4 -right-[1px] bg-[#050a14] rounded-l-full z-0"
                  >
                    {/* Top Flared Inverted Curve */}
                    <svg className="absolute -top-[24px] -right-[0.5px] w-[24px] h-[24px] pointer-events-none" viewBox="0 0 24 24">
                      <path d="M0 24C13.2548 24 24 13.2548 24 0V24H0Z" fill="#050a14" />
                    </svg>
                    {/* Bottom Flared Inverted Curve */}
                    <svg className="absolute -bottom-[24px] -right-[0.5px] w-[24px] h-[24px] pointer-events-none" viewBox="0 0 24 24">
                      <path d="M0 0C13.2548 0 24 10.7452 24 24V0H0Z" fill="#050a14" />
                    </svg>
                  </motion.div>
                )}

                {/* Content wrapper */}
                <div className="relative z-10 flex items-center pl-[30px] pr-4 w-full h-full">
                  <Icon 
                    className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${
                      active ? "text-[#6C63FF] scale-110 drop-shadow-[0_0_8px_rgba(108,99,255,0.8)]" : "group-hover:scale-105"
                    }`} 
                  />
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 whitespace-nowrap text-[13px] tracking-wide"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Locked Folder + Connection Status */}
      <div className="px-4 pb-4 space-y-3">
        {/* Connection Status */}
        <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 ${
          isConnected ? "bg-[#00d68f]/8 border border-[#00d68f]/15" : "bg-white/[0.02] border border-white/[0.04]"
        }`}>
          <div className="relative flex-shrink-0 flex items-center justify-center">
            {isConnected && (
              <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-[#00d68f] opacity-75 animate-ping" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? "bg-[#00d68f]" : "bg-[#4a5a72]"}`} />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-[11px] font-bold tracking-wider uppercase relative z-10 ${
                  isConnected ? "text-[#00d68f]" : "text-[#4a5a72]"
                }`}
              >
                {isConnected ? "Connected" : "Offline"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="px-4 pb-6">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2.5 rounded-2xl text-[#4a5a72] border border-white/[0.04] hover:text-[#b8c5d6] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
