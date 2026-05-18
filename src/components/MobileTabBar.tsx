"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  HardDrive,
  Puzzle,
  Activity,
  Settings,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "drive", label: "Drive", icon: HardDrive },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "logs", label: "Logs", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

interface MobileTabBarProps {
  activeSection: string;
  onSectionChange: (id: string) => void;
}

export default function MobileTabBar({ activeSection, onSectionChange }: MobileTabBarProps) {
  return (
    <div className="fixed bottom-5 left-4 right-4 z-50 md:hidden">
      <nav className="glass-container rounded-2xl py-2 px-3 flex items-center justify-around shadow-[0_12px_40px_0_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="relative py-2.5 px-3 flex flex-col items-center justify-center gap-1 cursor-pointer select-none"
            >
              {/* Active Back Pill */}
              {active && (
                <motion.div
                  layoutId="activeTabMobile"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-white/[0.06] border border-white/[0.08]"
                />
              )}

              <Icon
                className={`w-5 h-5 transition-colors relative z-10 duration-200 ${
                  active ? "text-blue-400" : "text-text-muted hover:text-text-tertiary"
                }`}
              />
              <span
                className={`text-[9px] font-medium tracking-wider relative z-10 transition-colors duration-200 ${
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
