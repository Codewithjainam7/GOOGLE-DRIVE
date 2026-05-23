"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import InvoiceScanner from "@/components/InvoiceScanner";
import ToastContainer, { Toast } from "@/components/ToastContainer";

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

let toastId = 0;

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [oauthStep, setOauthStep] = useState(0);
  const [showOAuthFlow, setShowOAuthFlow] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Folder lock state
  const [folderLocked, setFolderLocked] = useState(false);
  const [lockedFolderId, setLockedFolderId] = useState<string | null>(null);
  const [lockedFolderName, setLockedFolderName] = useState<string | null>(null);

  // Refs for auto-scroll
  const filesRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((message: string, type: Toast["type"], icon?: Toast["icon"]) => {
    const id = String(++toastId);
    setToasts(prev => [...prev, { id, message, type, icon }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: timestamp(), message, type }]);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
    addLog("Polling Google Drive API for updates...", "system");
  }, [addLog]);

  const scrollToFiles = useCallback(() => {
    setTimeout(() => {
      filesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 600);
  }, []);

  const scrollToHero = useCallback(() => {
    setTimeout(() => {
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }, []);

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
          checkConnection().then(() => {
            addToast("Google Drive connected successfully!", "success", "connect");
            scrollToHero();
          });
        }
      }, 400);
      window.history.replaceState({}, "", "/");
      return () => clearInterval(interval);
    } else if (error) {
      setConnectionStatus("error");
      setErrorMessage(error);
      addLog(`OAuth error: ${error}`, "error");
      addToast(`Connection failed: ${error}`, "error");
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
    addToast("Redirecting to Google for authentication...", "info", "connect");
    try {
      const res = await fetch("/api/google/connect");
      const data = await res.json();
      if (data.url) {
        addLog("Redirecting to Google consent screen...", "info");
        setTimeout(() => { window.location.href = data.url; }, 800);
      } else {
        throw new Error("No auth URL received");
      }
    } catch (err: unknown) {
      setConnectionStatus("error");
      setErrorMessage((err as Error).message);
      addLog(`Connection failed: ${(err as Error).message}`, "error");
      addToast(`Connection failed: ${(err as Error).message}`, "error");
      setShowOAuthFlow(false);
    }
  }, [addLog, addToast]);

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
      addToast("Google Drive disconnected successfully", "warning", "disconnect");
    } catch {
      addLog("Failed to disconnect", "error");
      addToast("Failed to disconnect. Please try again.", "error");
    }
  }, [addLog, addToast]);

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
        addToast(data.error, "error", "folder");
        return;
      }
      setFolderLocked(true);
      setLockedFolderId(data.folder.id);
      setLockedFolderName(data.folder.name);
      setOauthStep(9);
      addLog(`Folder locked: ${data.folder.name}`, "success");
      addLog("Access restricted to selected folder tree only", "success");
      addToast(`Folder "${data.folder.name}" locked successfully!`, "success", "folder");
      setRefreshTrigger(prev => prev + 1);
      scrollToFiles();
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setErrorMessage(msg);
      addLog(`Folder lock error: ${msg}`, "error");
      addToast(msg, "error");
    }
  }, [addLog, addToast, scrollToFiles]);

  const handleUnlockFolder = useCallback(async () => {
    addLog("Unlocking folder...", "system");
    try {
      await fetch("/api/google/lock", { method: "DELETE" });
      setFolderLocked(false);
      setLockedFolderId(null);
      setLockedFolderName(null);
      setOauthStep(8);
      addLog("Folder unlocked — select a new folder", "success");
      addToast("Folder unlocked. Select a new folder.", "info", "folder");
      scrollToHero();
    } catch {
      addLog("Failed to unlock folder", "error");
    }
  }, [addLog, addToast, scrollToHero]);

  const isConnected = connectionStatus === "connected";

  return (
    <div className="flex min-h-screen bg-[#050a14] relative overflow-hidden select-none">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Background orbs */}
      <div className="absolute top-[8%] left-[8%] w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] rounded-full bg-[#6C63FF]/8 blur-[120px] animate-float-1 pointer-events-none z-0" />
      <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full bg-purple-500/8 blur-[140px] animate-float-2 pointer-events-none z-0" />
      <div className="absolute top-[45%] right-[30%] w-[250px] h-[250px] rounded-full bg-[#6C63FF]/5 blur-[100px] animate-pulse pointer-events-none z-0" />

      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} isConnected={isConnected} folderName={lockedFolderName} />
      <MobileTabBar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex-1 min-w-0 md:pl-[248px] flex flex-col min-h-screen relative z-10 transition-all duration-300 pb-28 md:pb-0">
        <Navbar isConnected={isConnected} folderName={lockedFolderName} />

        <main className="flex-1 min-w-0 w-full p-4 sm:p-5 lg:p-8 overflow-y-auto overflow-x-hidden">
          {/* Dashboard */}
          {activeSection === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-normal">Control Deck</h1>
                <p className="text-[11px] sm:text-[13px] text-[#7a8ba3] font-bold mt-0.5">Google Cloud services status & integrations overview.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  { label: "Access Mode", value: isConnected ? "Read Only" : "Disabled", dot: isConnected },
                  { label: "Folder Lock", value: folderLocked ? "Active" : isConnected ? "Pending" : "—", dot: folderLocked },
                  { label: "API Status", value: isConnected ? "Secure SSL" : "Offline", dot: isConnected },
                  { label: "Documents", value: folderLocked ? "Scoped" : "None", dot: folderLocked },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-2xl glass-surface border border-white/[0.03] group hover:border-[#6C63FF]/30 transition-all duration-300">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${stat.dot ? "bg-[#00d68f] shadow-[0_0_6px_#00d68f]" : "bg-[#4a5a72]"}`} />
                      <span className="text-[9px] font-bold text-[#7a8ba3] uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <span className={`text-sm sm:text-base font-black tracking-tight ${stat.dot ? "text-[#00d68f]" : "text-white"}`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div ref={heroRef}>
                <DriveConnectionHero status={connectionStatus} onConnect={handleConnect} onDisconnect={handleDisconnect} onRefresh={handleRefresh} onLockFolder={handleLockFolder} onUnlockFolder={handleUnlockFolder} errorMessage={errorMessage} folderName={lockedFolderName} folderLocked={folderLocked} />
              </div>
              <OAuthFlowTracker currentStep={oauthStep} visible={showOAuthFlow} />
              <ConnectedAccount profile={isConnected ? profile : null} onDisconnect={handleDisconnect} />
              <div ref={filesRef}>
                <DriveFilesViewer isConnected={isConnected} refreshTrigger={refreshTrigger} folderLocked={folderLocked} lockedFolderId={lockedFolderId} lockedFolderName={lockedFolderName} />
              </div>
            </motion.div>
          )}

          {/* Drive Panel */}
          {activeSection === "drive" && (
            <motion.div key="drive" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-normal">Cloud Files</h1>
                <p className="text-[11px] sm:text-[13px] text-[#7a8ba3] font-bold mt-0.5">Browse your locked folder securely. Read-only access.</p>
              </div>
              <DriveFilesViewer isConnected={isConnected} refreshTrigger={refreshTrigger} folderLocked={folderLocked} lockedFolderId={lockedFolderId} lockedFolderName={lockedFolderName} />
            </motion.div>
          )}

          {/* Tax Automation */}
          {activeSection === "tax" && (
            <motion.div key="tax" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-normal">Invoice Scanner</h1>
                <p className="text-[11px] sm:text-[13px] text-[#7a8ba3] font-bold mt-0.5">Scan invoices, bills & receipts from your locked folder. Export to Google Sheets.</p>
              </div>
              <InvoiceScanner isConnected={isConnected} folderLocked={folderLocked} />
            </motion.div>
          )}

          {/* Integrations */}
          {activeSection === "integrations" && (
            <motion.div key="integrations" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-normal">Integrations Hub</h1>
                <p className="text-[11px] sm:text-[13px] text-[#7a8ba3] font-bold mt-0.5">Manage credentials, API scopes, and third-party links.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <IntCard name="Google Drive API" connected={isConnected} icon={<HardDrive className="w-4 h-4" />} onClick={() => setActiveSection("dashboard")} />
                <IntCard name="Invoice Scanner" connected={folderLocked} icon={<FileSearch className="w-4 h-4" />} onClick={() => setActiveSection("tax")} />
                <IntCard name="Google Sheets DB" connected={false} icon={<Folder className="w-4 h-4" />} />
                <IntCard name="Slack API Bridge" connected={false} icon={<Puzzle className="w-4 h-4" />} />
              </div>
            </motion.div>
          )}

          {/* Logs */}
          {activeSection === "logs" && (
            <motion.div key="logs" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-normal">Activity Feed</h1>
                <p className="text-[11px] sm:text-[13px] text-[#7a8ba3] font-bold mt-0.5">Real-time logs, requests, and network metrics.</p>
              </div>
              <ActivityLogs logs={logs} />
            </motion.div>
          )}

          {/* Settings */}
          {activeSection === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="space-y-5 max-w-5xl mx-auto">
              <div>
                <h1 className="text-lg sm:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight leading-normal">Console Settings</h1>
                <p className="text-[11px] sm:text-[13px] text-[#7a8ba3] font-bold mt-0.5">Security & access control configuration.</p>
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
    <div onClick={onClick} className={`p-4 rounded-2xl glass-surface flex items-center justify-between border border-white/[0.03] transition-all group ${connected ? "border-[#00d68f]/15" : ""} ${onClick ? "cursor-pointer hover:border-[#6C63FF]/30" : ""}`}>
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[#7a8ba3] group-hover:text-white transition-colors">{icon}</div>
        <div>
          <p className="text-[12px] font-bold text-white tracking-tight">{name}</p>
          <p className="text-[10px] text-[#7a8ba3] font-medium mt-0.5">{connected ? "Online" : "Not Configured"}</p>
        </div>
      </div>
      <div className={`w-2 h-2 rounded-full ${connected ? "bg-[#00d68f] shadow-[0_0_6px_#00d68f] animate-pulse" : "bg-[#4a5a72]"}`} />
    </div>
  );
}
