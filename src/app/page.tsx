"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, Activity as ActivityIcon, Shield as ShieldIcon, Puzzle, Settings as SettingsIcon, Folder, Cloud } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import DriveConnectionHero from "@/components/DriveConnectionHero";
import OAuthFlowTracker from "@/components/OAuthFlowTracker";
import ConnectedAccount from "@/components/ConnectedAccount";
import DriveFilesViewer from "@/components/DriveFilesViewer";
import ActivityLogs, { LogEntry } from "@/components/ActivityLogs";
import SecurityStatus from "@/components/SecurityStatus";

function timestamp() {
  return new Date().toTimeString().split(" ")[0];
}

interface ProfileData {
  connected: boolean;
  email?: string;
  name?: string;
  picture?: string;
  connected_at?: string;
  scopes?: string[];
  token_masked?: string;
  refresh_token_present?: boolean;
  expiry_date?: number;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [oauthStep, setOauthStep] = useState(0);
  const [showOAuthFlow, setShowOAuthFlow] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: timestamp(), message, type }]);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    addLog("Polling Google Drive API for updates...", "system");
  }, [addLog]);

  // Check connection on mount and after redirect
  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/google/profile");
      const data = await res.json();
      if (data.connected) {
        setProfile(data);
        setConnectionStatus("connected");
        setOauthStep(8);
        setShowOAuthFlow(true);
        addLog(`Authenticated as ${data.email}`, "success");
        addLog("Google Drive API connected", "success");
      }
    } catch {
      // Not connected, that's fine
    }
  }, [addLog]);

  useEffect(() => {
    // Check URL params for OAuth callback result
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected === "true") {
      addLog("OAuth callback received — verifying session...", "system");
      // Animate the OAuth steps
      setShowOAuthFlow(true);
      setConnectionStatus("connecting");
      let step = 1;
      const interval = setInterval(() => {
        setOauthStep(step);
        const stepMessages = [
          "Redirected to Google OAuth",
          "Google login completed",
          "OAuth consent approved",
          "Authorization code received",
          "Access token generated",
          "Refresh token stored",
          "Google Drive API connected",
        ];
        addLog(stepMessages[step - 1] || "", step <= 4 ? "info" : "success");
        step++;
        if (step > 8) {
          clearInterval(interval);
          checkConnection();
        }
      }, 400);

      // Clean URL
      window.history.replaceState({}, "", "/");
      return () => clearInterval(interval);
    } else if (error) {
      setConnectionStatus("error");
      setErrorMessage(error);
      addLog(`OAuth error: ${error}`, "error");
      window.history.replaceState({}, "", "/");
    } else {
      checkConnection();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = useCallback(async () => {
    setConnectionStatus("connecting");
    setShowOAuthFlow(true);
    setOauthStep(1);
    setErrorMessage(undefined);
    addLog("Initiating Google OAuth 2.0 flow...", "system");

    try {
      const res = await fetch("/api/google/connect");
      const data = await res.json();

      if (data.url) {
        addLog("Redirecting to Google consent screen...", "info");
        // Small delay so user sees the first step
        setTimeout(() => {
          window.location.href = data.url;
        }, 600);
      } else {
        throw new Error("No auth URL received");
      }
    } catch (err: unknown) {
      setConnectionStatus("error");
      setErrorMessage((err as Error).message);
      addLog(`Connection failed: ${(err as Error).message}`, "error");
      setShowOAuthFlow(false);
    }
  }, [addLog]);

  const handleDisconnect = useCallback(async () => {
    addLog("Disconnecting Google Drive...", "warning");
    try {
      await fetch("/api/google/disconnect", { method: "POST" });
      setConnectionStatus("disconnected");
      setProfile(null);
      setShowOAuthFlow(false);
      setOauthStep(0);
      addLog("Google Drive disconnected", "success");
      addLog("Session cleared", "debug");
    } catch {
      addLog("Failed to disconnect", "error");
    }
  }, [addLog]);

  const isConnected = connectionStatus === "connected";

  return (
    <div className="flex min-h-screen bg-[#030712] relative overflow-hidden select-none">
      
      {/* BACKGROUND DECORATIVE GLOWING ORBS (iOS Style) */}
      <div className="absolute top-[10%] left-[10%] w-[380px] h-[380px] rounded-full bg-blue-500/10 blur-[130px] animate-float-1 pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[5%] w-[480px] h-[480px] rounded-full bg-indigo-500/10 blur-[150px] animate-float-2 pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[35%] w-[280px] h-[280px] rounded-full bg-purple-500/5 blur-[100px] animate-pulse-slow pointer-events-none z-0" />

      {/* Desktop Sidebar navigation */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} isConnected={isConnected} />

      {/* Mobile Tab Bar bottom navigation */}
      <MobileTabBar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-[240px] flex flex-col min-h-screen relative z-10 transition-all duration-300 pb-24 md:pb-0">
        
        {/* Top Navbar */}
        <Navbar isConnected={isConnected} />

        {/* Content Body with slide-up transitions */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* Dashboard Panel */}
          {activeSection === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              {/* Header Title */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  Control Deck
                </h1>
                <p className="text-[12px] sm:text-[13px] text-text-muted font-bold mt-0.5">Google Cloud services status & integrations overview.</p>
              </div>

              {/* Advanced glass statistics grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Storage Engine", value: isConnected ? "Active" : "Disabled", dot: isConnected, type: "status" },
                  { label: "Sync Latency", value: isConnected ? "4ms" : "—", dot: isConnected, type: "stat" },
                  { label: "API Pipeline", value: isConnected ? "Secure SSL" : "Offline", dot: isConnected, type: "health" },
                  { label: "Secure Cache", value: isConnected ? "Enabled" : "None", dot: isConnected, type: "cache" },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-slate-900/20 backdrop-blur-xl relative overflow-hidden group hover:border-white/[0.16] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${stat.dot ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-text-muted"}`} />
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className={`text-base sm:text-lg font-black tracking-tight ${stat.dot ? "text-emerald-400" : "text-white"}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Main components */}
              <DriveConnectionHero
                status={connectionStatus}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onRefresh={handleRefresh}
                errorMessage={errorMessage}
              />

              <OAuthFlowTracker currentStep={oauthStep} visible={showOAuthFlow} />
              <ConnectedAccount profile={isConnected ? profile : null} onDisconnect={handleDisconnect} />
              <DriveFilesViewer isConnected={isConnected} refreshTrigger={refreshTrigger} />
            </motion.div>
          )}

          {/* Drive Panel */}
          {activeSection === "drive" && (
            <motion.div
              key="drive"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  Cloud Files
                </h1>
                <p className="text-[12px] sm:text-[13px] text-text-muted font-bold mt-0.5">Explore, search, and manage your cloud drive storage securely.</p>
              </div>
              <DriveFilesViewer isConnected={isConnected} refreshTrigger={refreshTrigger} />
            </motion.div>
          )}

          {/* Integrations Panel */}
          {activeSection === "integrations" && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  Integrations Hub
                </h1>
                <p className="text-[12px] sm:text-[13px] text-text-muted font-bold mt-0.5">Manage credentials, API scopes, and third-party links.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IntegrationCard name="Google Drive API" connected={isConnected} icon={<HardDrive className="w-5 h-5" />} onClick={() => setActiveSection("dashboard")} />
                <IntegrationCard name="Google Sheets DB" connected={false} icon={<Folder className="w-5 h-5" />} />
                <IntegrationCard name="Slack API Bridge" connected={false} icon={<Puzzle className="w-5 h-5" />} />
                <IntegrationCard name="GitHub Actions Deploy" connected={false} icon={<Puzzle className="w-5 h-5" />} />
              </div>
            </motion.div>
          )}

          {/* Activity Logs Panel */}
          {activeSection === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  Activity Feed
                </h1>
                <p className="text-[12px] sm:text-[13px] text-text-muted font-bold mt-0.5">Real-time synchronization logs, requests, and network metrics.</p>
              </div>
              <ActivityLogs logs={logs} />
            </motion.div>
          )}

          {/* Settings Panel */}
          {activeSection === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 max-w-5xl mx-auto"
            >
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
                  Console Settings
                </h1>
                <p className="text-[12px] sm:text-[13px] text-text-muted font-bold mt-0.5">Configure authentication encryption parameters and local storage cache.</p>
              </div>
              <SecurityStatus />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

function IntegrationCard({ name, connected, icon, onClick }: { name: string; connected: boolean; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border bg-slate-900/20 backdrop-blur-xl flex items-center justify-between transition-all group ${
        connected ? "border-emerald-500/20" : "border-white/[0.08]"
      } ${onClick ? "cursor-pointer hover:border-white/[0.16] hover:bg-white/[0.02]" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-text-muted group-hover:text-white transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-bold text-white tracking-tight">{name}</p>
          <p className="text-[11px] text-text-muted font-semibold mt-0.5">{connected ? "Pipeline Online" : "Configuration Required"}</p>
        </div>
      </div>
      <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-text-muted"}`} />
    </div>
  );
}
