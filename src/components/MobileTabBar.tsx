"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  HardDrive,
  Puzzle,
  Activity,
  Settings,
  FileSearch,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "drive", label: "Drive", icon: HardDrive },
  { id: "tax", label: "Tax", icon: FileSearch },
  { id: "logs", label: "Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

interface MobileTabBarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function MobileTabBar({ activeSection, onSectionChange }: MobileTabBarProps) {
  return (
    <div className="fixed bottom-4 left-3 right-3 z-50 md:hidden safe-bottom">
      <nav className="glass-floating rounded-[20px] py-1.5 px-1 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="relative py-2 px-3 flex flex-col items-center justify-center gap-0.5 cursor-pointer select-none min-w-[52px]"
            >
              {active && (
                <motion.div
                  layoutId="activeTabMobile"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute inset-0 rounded-2xl bg-white/[0.07] border border-white/[0.09] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]"
                />
              )}

              <Icon
                className={`w-[20px] h-[20px] transition-colors relative z-10 duration-200 ${
                  active ? "text-blue-400" : "text-text-muted"
                }`}
              />
              <span
                className={`text-[9px] font-semibold tracking-wide relative z-10 transition-colors duration-200 ${
                  active ? "text-blue-400" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
