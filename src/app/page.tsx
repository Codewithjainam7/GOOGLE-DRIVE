"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, Puzzle, Folder, FileSearch } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import MobileTabBar from "@/components/MobileTabBar";
import DriveConnectionHero from "@/components/DriveConnectionHero";
import OAuthFlowTracker from "@/components/OAuthFlowTracker";
import ConnectedAccount from "@/components/ConnectedAccount";
import DriveFilesViewer from "@/components/DriveFilesViewer";
import ActivityLogs, { LogEntry } from "@/components/ActivityLogs";
import SecurityStatus from "@/components/SecurityStatus";
import TaxAutomationPOC from "@/components/TaxAutomationPOC";

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
  folder_id?: string | null;
  folder_name?: string | null;
  folder_link?: string | null;
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

  // Folder lock state
  const [folderLocked, setFolderLocked] = useState(false);
  const [lockedFolderId, setLockedFolderId] = useState<string | null>(null);
  const [lockedFolderName, setLockedFolderName] = useState<string | null>(null);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: timestamp(), message, type }]);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    addLog("Polling Google Drive API for updates...", "system");
  }, [addLog]);

  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/google/profile");
      const data = await res.json();
      if (data.connected) {
        setProfile(data);
        setConnectionStatus("connected");
        setOauthStep(data.folder_id ? 9 : 8);
        setShowOAuthFlow(true);
        addLog(`Authenticated as ${data.email}`, "success");
        if (data.folder_id) {
          setFolderLocked(true);
          setLockedFolderId(data.folder_id);
          setLockedFolderName(data.folder_name);
          addLog(`Folder locked: ${data.folder_name}`, "success");
        }
      }
    } catch {
      // Not connected
    }
  }, [addLog]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected === "true") {
      addLog("OAuth callback received — verifying session...", "system");
      setShowOAuthFlow(true);
      setConnectionStatus("connecting");
      let step = 1;
      const interval = setInterval(() => {
        setOauthStep(step);
        const msgs = [
          "Redirected to Google OAuth",
          "Google login completed",
          "OAuth consent approved",
          "Authorization code received",
          "Access token generated",
          "Refresh token stored",
          "Google Drive API connected",
        ];
        addLog(msgs[step - 1] || "", step <= 4 ? "info" : "success");
        step++;
        if (step > 8) {
          clearInterval(interval);
          checkConnection();
        }
      }, 400);
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
        setTimeout(() => { window.location.href = data.url; }, 600);
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
      setFolderLocked(false);
      setLockedFolderId(null);
      setLockedFolderName(null);
      addLog("Google Drive disconnected", "success");
    } catch {
      addLog("Failed to disconnect", "error");
    }
  }, [addLog]);

  const handleLockFolder = useCallback(async (link: string) => {
    addLog(`Verifying folder: ${link.substring(0, 60)}...`, "system");
    setErrorMessage(undefined);
    try {
      const res = await fetch("/api/google/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderLink: link }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error);
        addLog(`Folder lock failed: ${data.error}`, "error");
        return;
      }
      setFolderLocked(true);
      setLockedFolderId(data.folder.id);
      setLockedFolderName(data.folder.name);
      setOauthStep(9);
      addLog(`Folder locked: ${data.folder.name}`, "success");
      addLog("Access restricted to selected folder tree only", "success");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setErrorMessage(msg);
      addLog(`Folder lock error: ${msg}`, "error");
    }
  }, [addLog]);

  const handleUnlockFolder = useCallback(async () => {
    addLog("Unlocking folder...", "system");
    try {
      await fetch("/api/google/lock", { method: "DELETE" });
      setFolderLocked(false);
      setLockedFolderId(null);
      setLockedFolderName(null);
      setOauthStep(8);
      addLog("Folder unlocked — select a new folder", "success");
    } catch {
      addLog("Failed to unlock folder", "error");
    }
  }, [addLog]);

  const isConnected = connectionStatus === "connected";

  return (
    <div className="flex min-h-screen bg-[#050a14] relative overflow-hidden select-none">
      {/* Background orbs */}
      <div className="absolute top-[8%] left-[8%] w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full bg-blue-500/8 blur-[120px] animate-float-1 pointer-events-none z-0" />
      <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-indigo-500/8 blur-[140px] animate-float-2 pointer-events-none z-0" />
      <div className="absolute top-[45%] right-[30%] w-[250px] h-[250px] rounded-full bg-purple-500/5 blur-[100px] animate-pulse-slow pointer-events-none z-0" />

      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} isConnected={isConnected} folderName={lockedFolderName} />
      <MobileTabBar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex-1 md:pl-[248px] flex flex-col min-h-screen relative z-10 transition-all duration-300 pb-28 md:pb-0">
        <Navbar isConnected={isConnected} folderName={lockedFolderName} />

        <main className="flex-1 p-3 sm:p-5 lg:p-8 overflow-y-auto">
          {/* Dashboard */}
          {activeSection === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Control Deck</h1>
                <p className="text-[11px] sm:text-[13px] text-text-muted font-bold mt-0.5">Google Cloud services status & integrations overview.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Access Mode", value: isConnected ? "Read Only" : "Disabled", dot: isConnected },
                  { label: "Folder Lock", value: folderLocked ? "Active" : isConnected ? "Pending" : "—", dot: folderLocked },
                  { label: "API Status", value: isConnected ? "Secure SSL" : "Offline", dot: isConnected },
                  { label: "Documents", value: folderLocked ? "Scoped" : "None", dot: folderLocked },
                ].map((stat) => (
                  <div key={stat.label} className="p-3.5 sm:p-4 rounded-2xl glass-surface group hover:border-white/[0.12] transition-all">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${stat.dot ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-text-muted"}`} />
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className={`text-sm sm:text-base font-black tracking-tight ${stat.dot ? "text-emerald-400" : "text-white"}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <DriveConnectionHero status={connectionStatus} onConnect={handleConnect} onDisconnect={handleDisconnect} onRefresh={handleRefresh} onLockFolder={handleLockFolder} onUnlockFolder={handleUnlockFolder} errorMessage={errorMessage} folderName={lockedFolderName} folderLocked={folderLocked} />
              <OAuthFlowTracker currentStep={oauthStep} visible={showOAuthFlow} />
              <ConnectedAccount profile={isConnected ? profile : null} onDisconnect={handleDisconnect} />
              <DriveFilesViewer isConnected={isConnected} refreshTrigger={refreshTrigger} folderLocked={folderLocked} lockedFolderId={lockedFolderId} lockedFolderName={lockedFolderName} />
            </motion.div>
          )}

          {/* Drive Panel */}
          {activeSection === "drive" && (
            <motion.div key="drive" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Cloud Files</h1>
                <p className="text-[11px] sm:text-[13px] text-text-muted font-bold mt-0.5">Browse your locked folder securely. Read-only access.</p>
              </div>
              <DriveFilesViewer isConnected={isConnected} refreshTrigger={refreshTrigger} folderLocked={folderLocked} lockedFolderId={lockedFolderId} lockedFolderName={lockedFolderName} />
            </motion.div>
          )}

          {/* Tax Automation */}
          {activeSection === "tax" && (
            <motion.div key="tax" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Tax Report Automation</h1>
                <p className="text-[11px] sm:text-[13px] text-text-muted font-bold mt-0.5">AI-powered document analysis and tax categorization from your Drive.</p>
              </div>
              <TaxAutomationPOC isConnected={isConnected} folderLocked={folderLocked} />
            </motion.div>
          )}

          {/* Integrations */}
          {activeSection === "integrations" && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Integrations Hub</h1>
                <p className="text-[11px] sm:text-[13px] text-text-muted font-bold mt-0.5">Manage credentials, API scopes, and third-party links.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <IntCard name="Google Drive API" connected={isConnected} icon={<HardDrive className="w-4 h-4" />} onClick={() => setActiveSection("dashboard")} />
                <IntCard name="Tax Automation" connected={folderLocked} icon={<FileSearch className="w-4 h-4" />} onClick={() => setActiveSection("tax")} />
                <IntCard name="Google Sheets DB" connected={false} icon={<Folder className="w-4 h-4" />} />
                <IntCard name="Slack API Bridge" connected={false} icon={<Puzzle className="w-4 h-4" />} />
              </div>
            </motion.div>
          )}

          {/* Logs */}
          {activeSection === "logs" && (
            <motion.div key="logs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Activity Feed</h1>
                <p className="text-[11px] sm:text-[13px] text-text-muted font-bold mt-0.5">Real-time logs, requests, and network metrics.</p>
              </div>
              <ActivityLogs logs={logs} />
            </motion.div>
          )}

          {/* Settings */}
          {activeSection === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">Console Settings</h1>
                <p className="text-[11px] sm:text-[13px] text-text-muted font-bold mt-0.5">Security & access control configuration.</p>
              </div>
              <SecurityStatus />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

function IntCard({ name, connected, icon, onClick }: { name: string; connected: boolean; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`p-4 rounded-2xl glass-surface flex items-center justify-between transition-all group ${connected ? "border-emerald-500/15" : ""} ${onClick ? "cursor-pointer hover:border-white/[0.12]" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-text-muted group-hover:text-white transition-colors">{icon}</div>
        <div>
          <p className="text-[12px] font-bold text-white tracking-tight">{name}</p>
          <p className="text-[10px] text-text-muted font-medium mt-0.5">{connected ? "Online" : "Not Configured"}</p>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" : "bg-text-muted"}`} />
    </div>
  );
}
