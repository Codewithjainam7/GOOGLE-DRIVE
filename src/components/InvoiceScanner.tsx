"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch, Loader2, CheckCircle2, FolderSearch, Receipt,
  FileSpreadsheet, ExternalLink, RefreshCw, Scan, FolderTree,
  DollarSign, ChevronDown, ChevronUp, AlertCircle, Sparkles,
  Eye, X, ShieldCheck, HelpCircle, HardDrive
} from "lucide-react";

interface ScannedInvoice {
  id: string;
  name: string;
  mimeType: string;
  folderPath: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  extractedAmount?: number | null;
  // Rich AI parsed details from Groq
  company?: string | null;
  invoiceNumber?: string | null;
  date?: string | null;
  dueDate?: string | null;
  subtotal?: number | null;
  taxPercent?: number | null;
  taxAmount?: number | null;
  total?: number | null;
  currency?: string;
  items?: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  aiParsed?: boolean;
}

interface ScanSummary {
  totalInvoices: number;
  totalFoldersScanned: number;
  totalAmount: number;
  rootFolder: string;
  scanTime?: string;
}

interface InvoiceScannerProps {
  isConnected: boolean;
  folderLocked: boolean;
}

export default function InvoiceScanner({ isConnected, folderLocked }: InvoiceScannerProps) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "complete">("idle");
  const [invoices, setInvoices] = useState<ScannedInvoice[]>([]);
  const [summary, setSummary] = useState<ScanSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI parsing progress states
  const [aiParsingId, setAiParsingId] = useState<string | null>(null);
  const [backgroundParsing, setBackgroundParsing] = useState(false);
  const [bgProgress, setBgProgress] = useState({ current: 0, total: 0 });

  // Export state
  const [exportPhase, setExportPhase] = useState<"idle" | "exporting" | "done">("idle");
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string | null>(null);

  // Table expand/collapse
  const [showAll, setShowAll] = useState(false);

  // Lightbox Modal state
  const [activeLightboxInv, setActiveLightboxInv] = useState<ScannedInvoice | null>(null);

  // Reference to cancel background scanner if re-scanned
  const isParsingRef = useRef(false);

  // 🕒 Load History from localStorage on mount
  useEffect(() => {
    try {
      const storedInvoices = localStorage.getItem("invoice_scanner_results");
      const storedSummary = localStorage.getItem("invoice_scanner_summary");
      const storedUrl = localStorage.getItem("invoice_scanner_sheet_url");
      const storedTitle = localStorage.getItem("invoice_scanner_sheet_title");

      if (storedInvoices && storedSummary) {
        setInvoices(JSON.parse(storedInvoices));
        setSummary(JSON.parse(storedSummary));
        setPhase("complete");
      }
      if (storedUrl && storedTitle) {
        setSheetUrl(storedUrl);
        setSheetTitle(storedTitle);
        setExportPhase("done");
      }
    } catch (e) {
      console.error("Failed to load scanner history:", e);
    }
  }, []);

  // 💾 Save to localStorage helper
  const saveStateToStorage = (updatedInvoices: ScannedInvoice[], updatedSummary: ScanSummary) => {
    try {
      localStorage.setItem("invoice_scanner_results", JSON.stringify(updatedInvoices));
      localStorage.setItem("invoice_scanner_summary", JSON.stringify(updatedSummary));
    } catch (e) {
      console.error("Failed to persist scanner state:", e);
    }
  };

  const clearHistory = () => {
    try {
      isParsingRef.current = false;
      localStorage.removeItem("invoice_scanner_results");
      localStorage.removeItem("invoice_scanner_summary");
      localStorage.removeItem("invoice_scanner_sheet_url");
      localStorage.removeItem("invoice_scanner_sheet_title");
      setInvoices([]);
      setSummary(null);
      setSheetUrl(null);
      setSheetTitle(null);
      setExportPhase("idle");
      setPhase("idle");
      setBackgroundParsing(false);
    } catch (e) {
      console.error("Failed to clear scanner history:", e);
    }
  };

  // AI parsing helper for single invoice
  const parseSingleInvoice = async (invoiceId: string, currentInvoicesList: ScannedInvoice[]) => {
    setAiParsingId(invoiceId);
    setError(null);
    try {
      const res = await fetch("/api/google/parse-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: invoiceId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI Parsing failed");
      }

      const parsedData = data.parsed;

      // Update invoice in our list
      const updatedInvoices = currentInvoicesList.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            company: parsedData.company,
            invoiceNumber: parsedData.invoiceNumber,
            date: parsedData.date,
            dueDate: parsedData.dueDate,
            subtotal: parsedData.subtotal,
            taxPercent: parsedData.taxPercent,
            taxAmount: parsedData.taxAmount,
            total: parsedData.total,
            currency: parsedData.currency,
            items: parsedData.items,
            extractedAmount: parsedData.total || inv.extractedAmount,
            aiParsed: true,
          };
        }
        return inv;
      });

      // Update state
      setInvoices(updatedInvoices);

      // Reset export state to allow re-export with newly enriched AI data!
      setExportPhase("idle");

      // Update Active Lightbox if it matches
      if (activeLightboxInv && activeLightboxInv.id === invoiceId) {
        const found = updatedInvoices.find(i => i.id === invoiceId);
        if (found) setActiveLightboxInv(found);
      }

      // Compute new summary total
      const newTotal = updatedInvoices.reduce((sum, inv) => sum + (inv.total != null ? inv.total : (inv.extractedAmount || 0)), 0);
      const updatedSummary: ScanSummary = {
        ...summary!,
        totalAmount: newTotal,
      };
      setSummary(updatedSummary);

      // Persist
      saveStateToStorage(updatedInvoices, updatedSummary);
      return updatedInvoices;
    } catch (err: unknown) {
      console.error("AI parse single invoice failed:", err);
      return currentInvoicesList;
    } finally {
      setAiParsingId(null);
    }
  };

  // Background Automatic AI Scanning Process
  const startBackgroundAiParsing = async (initialList: ScannedInvoice[]) => {
    isParsingRef.current = true;
    setBackgroundParsing(true);
    setBgProgress({ current: 0, total: initialList.length });

    let currentList = [...initialList];
    let processed = 0;

    for (let i = 0; i < currentList.length; i++) {
      if (!isParsingRef.current) break; // exit if aborted

      const inv = currentList[i];
      if (inv.aiParsed) {
        processed++;
        setBgProgress({ current: processed, total: currentList.length });
        continue;
      }

      setBgProgress({ current: processed + 1, total: currentList.length });
      const updatedList = await parseSingleInvoice(inv.id, currentList);
      currentList = updatedList;
      processed++;
      setBgProgress({ current: processed, total: currentList.length });

      // Small throttle delay
      await new Promise((r) => setTimeout(r, 300));
    }

    setBackgroundParsing(false);
    isParsingRef.current = false;
  };

  const scanInvoices = useCallback(async () => {
    // Terminate existing background parser
    isParsingRef.current = false;
    setBackgroundParsing(false);

    setPhase("scanning");
    setError(null);
    setInvoices([]);
    setSummary(null);
    setSheetUrl(null);
    setSheetTitle(null);
    setExportPhase("idle");
    setShowAll(false);

    try {
      const res = await fetch("/api/google/scan-invoices", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }

      const scanTime = new Date().toLocaleTimeString("en-AU", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }) + `, ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`;

      const newSummary: ScanSummary = { ...data.summary, scanTime };

      setInvoices(data.invoices);
      setSummary(newSummary);
      setPhase("complete");

      saveStateToStorage(data.invoices, newSummary);

      // 🤖 Automatically kick off Groq AI Background Extraction!
      if (data.invoices.length > 0) {
        startBackgroundAiParsing(data.invoices);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
      setPhase("idle");
    }
  }, [summary]);

  const exportToSheets = useCallback(async () => {
    if (invoices.length === 0) return;
    setExportPhase("exporting");
    setError(null);

    try {
      const res = await fetch("/api/google/export-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoices,
          rootFolderName: summary?.rootFolder || "Drive",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Export failed");
      }

      setSheetUrl(data.spreadsheetUrl);
      setSheetTitle(data.title);
      setExportPhase("done");

      // Persist Sheet Details
      localStorage.setItem("invoice_scanner_sheet_url", data.spreadsheetUrl);
      localStorage.setItem("invoice_scanner_sheet_title", data.title);
    } catch (err: unknown) {
      setError((err as Error).message);
      setExportPhase("idle");
    }
  }, [invoices, summary]);

  // Not ready state
  if (!isConnected || !folderLocked) {
    return (
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border border-white/[0.04] max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#6C63FF]/5 blur-[60px]" />
        <FileSearch className="w-12 h-12 text-[#6C63FF] opacity-60 mx-auto mb-5" />
        <h3 className="text-base sm:text-lg font-black text-white mb-2 tracking-tight">Invoice AI Scanner</h3>
        <p className="text-[12px] text-[#7a8ba3] max-w-md mx-auto leading-relaxed">
          Connect your Google Drive and lock a workspace folder. Our system will recursively index files and run Llama 4 Scout Vision parsing.
        </p>
      </div>
    );
  }

  const visibleInvoices = showAll ? invoices : invoices.slice(0, 10);

  return (
    <div className="space-y-6 w-full max-w-[1400px] mx-auto">
      {/* ═══ Top Controls Panel ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card p-6 rounded-[24px] border border-white/[0.06] relative overflow-hidden shadow-2xl"
      >
        {/* Sleek futuristic glow */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#6C63FF]/6 blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/10 border border-[#6C63FF]/15 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-[#6C63FF]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                  Invoice & Expense AI Extractor
                </h2>
                <p className="text-[11px] sm:text-[12px] text-[#7a8ba3] mt-0.5 font-medium">
                  Autonomous OCR engine powered by **Llama 4 Scout Vision** to parse taxes & amounts.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={scanInvoices}
              disabled={phase === "scanning"}
              className="px-5 py-3.5 rounded-xl text-[12px] font-black tracking-wide uppercase transition-all bg-gradient-to-r from-[#6C63FF] to-[#857dff] hover:from-[#5A52E0] hover:to-[#7a72ff] text-white disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 flex-1 sm:flex-none shadow-[0_4px_20px_rgba(108,99,255,0.35)] border border-white/[0.12]"
            >
              {phase === "scanning" ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Scan className="w-4 h-4 text-white" />
              )}
              {phase === "scanning" ? "Scanning Drive..." : invoices.length > 0 ? "Scan & Refresh" : "Scan Invoices"}
            </motion.button>

            {invoices.length > 0 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportToSheets}
                  disabled={exportPhase === "exporting"}
                  className="px-5 py-3 rounded-xl text-[12px] font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none border cursor-pointer"
                  style={{
                    background:
                      exportPhase === "done"
                        ? "rgba(0,214,143,0.1)"
                        : "rgba(255,255,255,0.03)",
                    borderColor:
                      exportPhase === "done"
                        ? "rgba(0,214,143,0.25)"
                        : "rgba(255,255,255,0.08)",
                    color: exportPhase === "done" ? "#00d68f" : "white",
                  }}
                >
                  {exportPhase === "exporting" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : exportPhase === "done" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  {exportPhase === "exporting"
                    ? "Exporting..."
                    : exportPhase === "done"
                    ? "Sheet Created!"
                    : "Export to Sheets"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearHistory}
                  className="px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#ff5c5c] hover:bg-[#ff5c5c]/5 border border-[#ff5c5c]/10 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                >
                  Reset History
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Scan Folder Progress Indicator */}
        {phase === "scanning" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 space-y-3"
          >
            <div className="flex items-center gap-2.5 text-[12px]">
              <Loader2 className="w-4 h-4 text-[#6C63FF] animate-spin" />
              <span className="text-[#7a8ba3] font-semibold">
                Searching Drive subfolders and gathering files...
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#857dff]"
                animate={{ width: ["0%", "50%", "80%", "95%"] }}
                transition={{ duration: 6, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* AI Background Auto-parsing Status */}
        {backgroundParsing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 border-t border-white/[0.06] pt-4.5 space-y-2.5"
          >
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 font-black text-white uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#ffb547] animate-pulse" />
                <span>Running Llama 4 Scout background OCR parsing...</span>
              </div>
              <span className="text-[#6C63FF] font-black">
                {bgProgress.current} / {bgProgress.total} Complete
              </span>
            </div>
            <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#ffb547] to-[#6C63FF]"
                style={{ width: `${(bgProgress.current / bgProgress.total) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ═══ Error Panel ═══ */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-[#ff5c5c]/8 border border-[#ff5c5c]/20 text-[12px] text-[#ff7b7b] font-semibold"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Summary Cards ═══ */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-3"
          >
            {/* Total Amount — Hero Card (full-width on mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-5 rounded-2xl border border-[#00d68f]/20 bg-[#00d68f]/5 relative overflow-hidden shadow-[0_0_30px_rgba(0,214,143,0.08)]"
            >
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#00d68f]/8 blur-[50px] pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <DollarSign className="w-4 h-4 text-[#00d68f]" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#7a8ba3]">Total Amount</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-[#00d68f] block">
                    ${(summary?.totalAmount ?? 0).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#7a8ba3] block">Scanned at</span>
                  <span className="text-[11px] font-bold text-[#b8c5d6] block mt-0.5">{summary?.scanTime || "—"}</span>
                </div>
              </div>
            </motion.div>

            {/* Other 3 metric cards in a row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Invoices Found",
                  value: (summary?.totalInvoices ?? invoices.length).toString(),
                  icon: Receipt,
                  color: "text-[#ffb547]",
                  bg: "bg-[#ffb547]/5 border-[#ffb547]/10",
                },
                {
                  label: "Folders Crawled",
                  value: (summary?.totalFoldersScanned ?? 1).toString(),
                  icon: FolderTree,
                  color: "text-[#6C63FF]",
                  bg: "bg-[#6C63FF]/5 border-[#6C63FF]/10",
                },
                {
                  label: "Locked Dir",
                  value: summary?.rootFolder || "Drive",
                  icon: HardDrive,
                  color: "text-[#857dff]",
                  bg: "bg-[#857dff]/5 border-[#857dff]/10",
                },
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className={`p-3 sm:p-4.5 rounded-2xl border ${card.bg} relative overflow-hidden`}
                  >
                    <div className="flex items-center gap-1 mb-1.5">
                      <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#7a8ba3]">
                        {card.label}
                      </span>
                    </div>
                    <span className={`text-xs sm:text-base font-black tracking-tight ${card.color} truncate block`}>
                      {card.value}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Google Sheet Export Result Notification ═══ */}
      <AnimatePresence>
        {sheetUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-[#00d68f]/6 border border-[#00d68f]/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00d68f]/10 border border-[#00d68f]/20 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-5 h-5 text-[#00d68f]" />
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-black text-white truncate max-w-[280px] sm:max-w-none">
                  {sheetTitle}
                </p>
                <p className="text-[10px] text-[#7a8ba3] mt-0.5 font-bold uppercase tracking-wider">
                  Report Generated Successfully • {invoices.length} rows written
                </p>
              </div>
            </div>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-[12px] font-black text-[#00d68f] bg-[#00d68f]/10 hover:bg-[#00d68f]/15 border border-[#00d68f]/20 cursor-pointer w-full sm:w-auto text-center"
            >
              <ExternalLink className="w-4 h-4" />
              Open Report Sheet
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Scanned Invoices Grid Table ═══ */}
      <AnimatePresence>
        {invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[24px] border border-white/[0.06] overflow-hidden shadow-2xl"
          >
            {/* Header section inside card */}
            <div className="px-5.5 py-4.5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-black text-white uppercase tracking-wider">
                  Identified Tax Documents
                </h3>
                <p className="text-[10px] text-[#7a8ba3] mt-0.5 font-bold uppercase tracking-wider">
                  {invoices.length} files • {invoices.filter(i => i.aiParsed).length} processed with Groq Vision AI
                </p>
              </div>
              {backgroundParsing && (
                <div className="flex items-center gap-1 text-[10px] text-[#ffb547] font-black uppercase tracking-wider animate-pulse bg-[#ffb547]/5 border border-[#ffb547]/10 px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Parsing Live</span>
                </div>
              )}
            </div>

            {/* ═══ Desktop Table (hidden on mobile) ═══ */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px] table-fixed">
                <colgroup>
                  <col className="w-12" />
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.01]">
                    <th className="px-4 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-[#7a8ba3]">#</th>
                    <th className="px-3 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-[#7a8ba3]">Folder Path</th>
                    <th className="px-3 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-[#7a8ba3]">File Name</th>
                    <th className="px-3 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-[#7a8ba3]">Vendor / Company</th>
                    <th className="px-3 py-3.5 text-left text-[10px] font-black uppercase tracking-wider text-[#7a8ba3]">Invoice Date</th>
                    <th className="px-3 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-[#7a8ba3]">Amount</th>
                    <th className="px-4 py-3.5 text-right text-[10px] font-black uppercase tracking-wider text-[#7a8ba3]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleInvoices.map((inv, idx) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.015 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-all duration-250 group"
                    >
                      <td className="px-4 py-4 text-[11px] text-[#4a5a72] font-black">{idx + 1}</td>
                      <td className="px-3 py-4 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <FolderTree className="w-3.5 h-3.5 text-[#857dff] flex-shrink-0" />
                          <span className="text-[12px] text-[#b8c5d6] font-bold truncate block" title={inv.folderPath}>
                            {inv.folderPath}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <Receipt className="w-3.5 h-3.5 text-[#ffb547] flex-shrink-0" />
                          <span className="text-[12px] text-white font-extrabold truncate block" title={inv.name}>
                            {inv.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 overflow-hidden">
                        {inv.aiParsed ? (
                          <span className="text-[12px] text-white font-bold truncate block" title={inv.company || "Unknown Vendor"}>
                            🏢 {inv.company || "Unknown Vendor"}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#4a5a72] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3 h-3 text-[#ffb547]" /> Scanning...
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 overflow-hidden">
                        <span className="text-[12px] text-[#7a8ba3] font-bold block truncate">
                          {inv.aiParsed ? (inv.date || "—") : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <div className="flex flex-col items-end">
                          {inv.extractedAmount != null ? (
                            <span className={`text-[12px] font-black ${inv.aiParsed ? "text-[#00d68f]" : "text-[#ffb547]"}`}>
                              ${inv.extractedAmount.toLocaleString("en-AU", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          ) : (
                            <span className="text-[12px] text-[#4a5a72] font-black">—</span>
                          )}
                          <span className="text-[8px] font-black uppercase tracking-wider text-[#4a5a72] mt-0.5">
                            {inv.aiParsed ? "✨ AI Parsed" : "Filename"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveLightboxInv(inv)}
                            className="p-1.5 rounded-lg border bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] text-[#7a8ba3] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                            title="Verify Details Side-by-Side"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </motion.button>

                          {inv.webViewLink && (
                            <a
                              href={inv.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg border bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] text-[#7a8ba3] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                              title="Open original Drive PDF"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ═══ Mobile Card List (visible only on mobile) ═══ */}
            <div className="block md:hidden divide-y divide-white/[0.04]">
              {visibleInvoices.map((inv, idx) => (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.25 }}
                  className="px-4 py-3.5 flex items-center gap-3 active:bg-white/[0.02] transition-colors"
                  onClick={() => setActiveLightboxInv(inv)}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                    inv.aiParsed
                      ? "bg-[#00d68f]/8 border-[#00d68f]/15"
                      : "bg-[#ffb547]/8 border-[#ffb547]/15"
                  }`}>
                    {inv.aiParsed
                      ? <Receipt className="w-4.5 h-4.5 text-[#00d68f]" />
                      : <Sparkles className="w-4 h-4 text-[#ffb547] animate-pulse" />
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-extrabold text-white truncate" title={inv.name}>
                      {inv.name}
                    </p>
                    <p className="text-[10px] text-[#7a8ba3] font-bold truncate mt-0.5">
                      {inv.aiParsed ? (inv.company || "Unknown Vendor") : "AI Scanning..."}
                      {inv.date ? ` • ${inv.date}` : ""}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    {inv.extractedAmount != null ? (
                      <span className={`text-[13px] font-black ${inv.aiParsed ? "text-[#00d68f]" : "text-[#ffb547]"}`}>
                        ${inv.extractedAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-[12px] text-[#4a5a72] font-black">—</span>
                    )}
                    <span className="text-[8px] font-black uppercase tracking-wider text-[#4a5a72] mt-0.5">
                      {inv.aiParsed ? "✨ Parsed" : "Pending"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Show more / less toggler */}
            {invoices.length > 10 && (
              <div className="p-3 text-center border-t border-white/[0.06]">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center justify-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-[11px] font-bold text-[#7a8ba3] hover:text-white bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all cursor-pointer font-black uppercase tracking-wider"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show All {invoices.length} Invoices
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Table Footer Total amount */}
            {summary && summary.totalAmount > 0 && (
              <div className="px-5.5 py-4 border-t border-white/[0.08] bg-[#00d68f]/4 flex items-center justify-between">
                <span className="text-[11px] font-black text-[#7a8ba3] uppercase tracking-wider">
                  Total Calculated Expenses
                </span>
                <span className="text-[14px] font-black text-[#00d68f]">
                  ${summary.totalAmount.toLocaleString("en-AU", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State scan result */}
      {phase === "complete" && invoices.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[24px] p-10 text-center border border-white/[0.06]"
        >
          <Receipt className="w-12 h-12 text-[#4a5a72] mx-auto mb-4" />
          <h3 className="text-base font-bold text-white mb-2">No Invoices Detected</h3>
          <p className="text-[12px] text-[#7a8ba3] max-w-sm mx-auto leading-relaxed">
            No bills, receipts, or statement files could be identified inside this locked folder. Ensure your document names contain keywords like "bill", "invoice", "receipt", "strata", or "council".
          </p>
        </motion.div>
      )}

      {/* ═══ Visual Lightbox Review Modal ═══ */}
      <AnimatePresence>
        {activeLightboxInv && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 select-none">
            {/* Backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#06080f]/80 backdrop-filter blur-md"
              onClick={() => setActiveLightboxInv(null)}
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-5xl h-[85vh] sm:h-[80vh] rounded-[24px] overflow-hidden flex flex-col md:flex-row border border-white/[0.08] relative z-10 shadow-2xl"
              style={{ background: "rgba(10, 14, 28, 0.92)", backdropFilter: "blur(40px)" }}
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveLightboxInv(null)}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/40 border border-white/[0.08] hover:bg-white/[0.05] text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Left Side: Invoice Preview (Zoomable Image) */}
              <div className="flex-1 bg-black/40 flex items-center justify-center p-4 relative overflow-hidden border-b md:border-b-0 md:border-r border-white/[0.06] h-[45%] md:h-full">
                <img
                  src={`/api/google/thumbnail?fileId=${activeLightboxInv.id}`}
                  alt="Invoice Large"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none select-all"
                  style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))" }}
                />
                <div className="absolute bottom-3 left-3 text-[10px] text-[#7a8ba3] bg-black/50 px-3 py-1.5 rounded-full border border-white/[0.03]">
                  👁️ Click View Full PDF to inspect full document
                </div>
              </div>

              {/* Right Side: Structured Metadata Panel */}
              <div className="w-full md:w-[400px] flex flex-col h-[55%] md:h-full select-text">
                <div className="p-5.5 sm:p-7 overflow-y-auto flex-1 space-y-5">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#6C63FF] bg-[#6C63FF]/10 border border-[#6C63FF]/15 px-2.5 py-0.5 rounded-full inline-block">
                      Structured Review
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white truncate leading-snug mt-2">
                      {activeLightboxInv.name}
                    </h3>
                    <p className="text-[11px] text-[#7a8ba3] truncate mt-0.5 flex items-center gap-1">
                      <FolderTree className="w-3 h-3 flex-shrink-0" />
                      {activeLightboxInv.folderPath}
                    </p>
                  </div>

                  {/* AI Status Banner */}
                  {activeLightboxInv.aiParsed ? (
                    <div className="p-3.5 rounded-xl bg-[#00d68f]/5 border border-[#00d68f]/12 flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#00d68f] flex-shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Vision AI Extraction Complete</h4>
                        <p className="text-[10px] text-[#7a8ba3] mt-0.5">Highly precise OCR parsed with Groq Llama 4 Scout.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#ffb547]/5 border border-[#ffb547]/12 flex items-start gap-3">
                      <Loader2 className="w-4 h-4 text-[#ffb547] animate-spin flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider">AI Extraction In Progress</h4>
                        <p className="text-[10px] text-[#7a8ba3] mt-0.5 font-medium">Downloading and processing with Vision AI. Please wait...</p>
                      </div>
                    </div>
                  )}

                  {/* Main Fields */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#7a8ba3] block">Vendor / Company</span>
                      <span className="text-[12px] font-bold text-white truncate block mt-1">
                        {activeLightboxInv.company || "—"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#7a8ba3] block">Invoice #</span>
                      <span className="text-[12px] font-bold text-white truncate block mt-1">
                        {activeLightboxInv.invoiceNumber || "—"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#7a8ba3] block">Invoice Date</span>
                      <span className="text-[12px] font-bold text-white truncate block mt-1">
                        {activeLightboxInv.date || "—"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#7a8ba3] block">Due Date</span>
                      <span className="text-[12px] font-bold text-white truncate block mt-1">
                        {activeLightboxInv.dueDate || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Amounts */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7a8ba3] font-bold">Subtotal</span>
                      <span className="text-white font-extrabold">
                        {activeLightboxInv.subtotal != null
                          ? `$${activeLightboxInv.subtotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#7a8ba3] font-bold">
                        Tax {activeLightboxInv.taxPercent != null ? `(${activeLightboxInv.taxPercent}%)` : ""}
                      </span>
                      <span className="text-white font-extrabold">
                        {activeLightboxInv.taxAmount != null
                          ? `$${activeLightboxInv.taxAmount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </span>
                    </div>
                    <div className="h-[1px] bg-white/[0.06]" />
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="text-white font-black">Total Expense</span>
                      <span className="text-[12px] font-black text-[#00d68f]">
                        ${(activeLightboxInv.total != null ? activeLightboxInv.total : (activeLightboxInv.extractedAmount || 0)).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Items List extracted */}
                  {activeLightboxInv.items && activeLightboxInv.items.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#7a8ba3]">Line Items Extracted</span>
                      <div className="divide-y divide-white/[0.04] max-h-[140px] overflow-y-auto pr-1">
                        {activeLightboxInv.items.map((item, idx) => (
                          <div key={idx} className="py-2 flex items-start justify-between gap-3 text-[10px]">
                            <div className="min-w-0">
                              <p className="text-white font-bold truncate">{item.description}</p>
                              <p className="text-[#7a8ba3] mt-0.5">Qty: {item.quantity} • Rate: ${item.rate.toLocaleString("en-AU")}</p>
                            </div>
                            <span className="text-white font-bold flex-shrink-0">${item.amount.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer buttons inside Right panel */}
                <div className="p-4 sm:p-5 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between gap-3 flex-shrink-0">
                  {activeLightboxInv.webViewLink && (
                    <a
                      href={activeLightboxInv.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-[11px] font-black text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] cursor-pointer flex-1 text-center transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Full PDF
                    </a>
                  )}
                  <button
                    onClick={() => setActiveLightboxInv(null)}
                    className="px-4.5 py-2.5 rounded-xl text-[11px] font-black text-black bg-[#00d68f] hover:bg-emerald-500 cursor-pointer flex-1 transition-all"
                  >
                    Done Reviewing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
