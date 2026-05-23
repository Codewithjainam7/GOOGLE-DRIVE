"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  HardDrive,
  Activity,
  Settings,
  FileSearch,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "drive", label: "Drive", icon: HardDrive },
  { id: "tax", label: "Invoices", icon: FileSearch },
  { id: "logs", label: "Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

interface MobileTabBarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function MobileTabBar({ activeSection, onSectionChange }: MobileTabBarProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden safe-bottom">
      <div className="relative rounded-2xl bg-[#0c101a]/80 backdrop-blur-2xl border border-white/[0.08] px-1.5 py-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="relative flex-1 py-2 flex flex-col items-center justify-center gap-1 cursor-pointer focus:outline-none touch-manipulation tap-highlight-transparent"
            >
              {active && (
                <motion.div
                  layoutId="mobileTabBubble"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 bg-gradient-to-b from-[#6C63FF]/25 to-[#6C63FF]/5 rounded-xl border-t border-[#6C63FF]/40 z-0"
                />
              )}

              <Icon
                className={`w-5 h-5 relative z-10 transition-colors duration-300 ${
                  active ? "text-white drop-shadow-[0_0_8px_rgba(108,99,255,0.8)]" : "text-[#4a5a72]"
                }`}
              />

              <span
                className={`text-[9px] font-bold tracking-wide relative z-10 transition-colors duration-300 ${
                  active ? "text-white" : "text-[#4a5a72]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
