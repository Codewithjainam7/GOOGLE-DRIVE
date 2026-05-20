"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSearch, FileText, Table2, Receipt, TrendingUp, TrendingDown,
  Loader2, CheckCircle2, AlertCircle, BarChart3, DollarSign,
  FileSpreadsheet, Scan, Sparkles, ArrowRight, RefreshCw
} from "lucide-react";

interface TaxFile {
  id: string;
  name: string;
  mimeType: string;
  category: string;
  confidence: number;
  amount?: number;
  type?: "income" | "expense" | "deduction";
}

interface TaxSummary {
  totalIncome: number;
  totalExpenses: number;
  totalDeductions: number;
  estimatedTax: number;
  documentsScanned: number;
  categorized: number;
}

interface TaxAutomationPOCProps {
  isConnected: boolean;
  folderLocked: boolean;
}

const TAX_KEYWORDS = ["invoice", "receipt", "tax", "w2", "w-2", "1099", "expense", "statement", "payment", "salary", "deduction", "bill", "contract", "income"];

const CATEGORIES = [
  { name: "Invoices & Receipts", icon: Receipt, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { name: "Tax Forms (W-2/1099)", icon: FileSpreadsheet, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { name: "Income Statements", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { name: "Expense Reports", icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { name: "Contracts & Docs", icon: FileText, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
];

function categorizeFile(name: string): { category: string; type: "income" | "expense" | "deduction"; amount: number } {
  const lower = name.toLowerCase();
  if (lower.includes("w2") || lower.includes("w-2") || lower.includes("salary")) return { category: "Tax Forms (W-2/1099)", type: "income", amount: Math.floor(Math.random() * 80000) + 40000 };
  if (lower.includes("1099")) return { category: "Tax Forms (W-2/1099)", type: "income", amount: Math.floor(Math.random() * 30000) + 5000 };
  if (lower.includes("invoice") || lower.includes("receipt") || lower.includes("bill")) return { category: "Invoices & Receipts", type: "expense", amount: Math.floor(Math.random() * 2000) + 50 };
  if (lower.includes("expense")) return { category: "Expense Reports", type: "expense", amount: Math.floor(Math.random() * 5000) + 200 };
  if (lower.includes("income") || lower.includes("payment") || lower.includes("statement")) return { category: "Income Statements", type: "income", amount: Math.floor(Math.random() * 15000) + 1000 };
  if (lower.includes("deduction") || lower.includes("tax")) return { category: "Invoices & Receipts", type: "deduction", amount: Math.floor(Math.random() * 3000) + 100 };
  return { category: "Contracts & Docs", type: "expense", amount: Math.floor(Math.random() * 1000) + 50 };
}

export default function TaxAutomationPOC({ isConnected, folderLocked }: TaxAutomationPOCProps) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "analyzing" | "complete">("idle");
  const [taxFiles, setTaxFiles] = useState<TaxFile[]>([]);
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [allFiles, setAllFiles] = useState<{ id: string; name: string; mimeType: string }[]>([]);

  const fetchAllFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/google/files?pageSize=100");
      if (!res.ok) return [];
      const data = await res.json();
      return data.files || [];
    } catch { return []; }
  }, []);

  const runAnalysis = async () => {
    setPhase("scanning");
    setScanProgress(0);
    setTaxFiles([]);
    setSummary(null);

    // Step 1: Fetch files
    const files = await fetchAllFiles();
    setAllFiles(files);

    // Step 2: Simulate scanning progress
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 30));
      setScanProgress(i);
    }

    // Step 3: Filter tax-relevant files
    setPhase("analyzing");
    const relevant = files.filter((f: { name: string }) =>
      TAX_KEYWORDS.some(kw => f.name.toLowerCase().includes(kw))
    );

    // Step 4: Categorize with simulated AI
    const categorized: TaxFile[] = [];
    for (let i = 0; i < relevant.length; i++) {
      await new Promise(r => setTimeout(r, 150));
      const f = relevant[i];
      const cat = categorizeFile(f.name);
      categorized.push({
        id: f.id, name: f.name, mimeType: f.mimeType,
        category: cat.category, confidence: Math.floor(Math.random() * 15) + 85,
        amount: cat.amount, type: cat.type,
      });
      setTaxFiles([...categorized]);
    }

    // If no real tax files found, create demo data
    if (categorized.length === 0) {
      const demoFiles: TaxFile[] = [
        { id: "d1", name: "Invoice_Q1_2025.pdf", mimeType: "application/pdf", category: "Invoices & Receipts", confidence: 94, amount: 1250, type: "expense" },
        { id: "d2", name: "W2_2025_Employer.pdf", mimeType: "application/pdf", category: "Tax Forms (W-2/1099)", confidence: 98, amount: 85000, type: "income" },
        { id: "d3", name: "Receipt_Office_Supplies.pdf", mimeType: "application/pdf", category: "Invoices & Receipts", confidence: 91, amount: 340, type: "expense" },
        { id: "d4", name: "1099_Freelance_Work.pdf", mimeType: "application/pdf", category: "Tax Forms (W-2/1099)", confidence: 96, amount: 12500, type: "income" },
        { id: "d5", name: "Expense_Report_Travel.xlsx", mimeType: "application/vnd.google-apps.spreadsheet", category: "Expense Reports", confidence: 89, amount: 3200, type: "expense" },
        { id: "d6", name: "Tax_Deduction_Home_Office.pdf", mimeType: "application/pdf", category: "Invoices & Receipts", confidence: 92, amount: 2800, type: "deduction" },
      ];
      for (let i = 0; i < demoFiles.length; i++) {
        await new Promise(r => setTimeout(r, 200));
        setTaxFiles(prev => [...prev, demoFiles[i]]);
      }
      categorized.push(...demoFiles);
    }

    // Step 5: Compute summary
    const inc = categorized.filter(f => f.type === "income").reduce((s, f) => s + (f.amount || 0), 0);
    const exp = categorized.filter(f => f.type === "expense").reduce((s, f) => s + (f.amount || 0), 0);
    const ded = categorized.filter(f => f.type === "deduction").reduce((s, f) => s + (f.amount || 0), 0);
    setSummary({
      totalIncome: inc, totalExpenses: exp, totalDeductions: ded,
      estimatedTax: Math.round((inc - ded) * 0.22),
      documentsScanned: files.length, categorized: categorized.length,
    });
    setPhase("complete");
  };

  if (!isConnected || !folderLocked) {
    return (
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
        <FileSearch className="w-10 h-10 text-text-muted mx-auto mb-4" />
        <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">Tax Automation</h3>
        <p className="text-[11px] text-text-muted max-w-sm mx-auto">Connect Google Drive and lock a folder to run automated tax document analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 sm:p-7 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-500/8 blur-[80px] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">Tax Report Automation</h2>
                <span className="text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-1.5 py-0.5 rounded-md">POC</span>
              </div>
              <p className="text-[12px] text-text-tertiary mt-0.5">AI-powered document scanning & tax categorization from your locked folder.</p>
            </div>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={runAnalysis} disabled={phase === "scanning" || phase === "analyzing"}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/15 border border-amber-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto">
            {phase === "scanning" || phase === "analyzing" ? <Loader2 className="w-4 h-4 animate-spin" /> : phase === "complete" ? <RefreshCw className="w-4 h-4" /> : <Scan className="w-4 h-4" />}
            {phase === "scanning" ? "Scanning..." : phase === "analyzing" ? "Analyzing..." : phase === "complete" ? "Re-analyze" : "Run Tax Analysis"}
          </motion.button>
        </div>

        {/* Scan Progress */}
        {phase === "scanning" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-text-tertiary font-medium">Scanning locked folder tree...</span>
              <span className="text-amber-400 font-bold">{scanProgress}%</span>
            </div>
            <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${scanProgress}%` }} transition={{ duration: 0.1 }} />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Summary Metrics */}
      <AnimatePresence>
        {summary && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Income", value: `$${summary.totalIncome.toLocaleString()}`, icon: TrendingUp, color: "text-emerald-400", glow: "bg-emerald-500/8 border-emerald-500/15" },
              { label: "Total Expenses", value: `$${summary.totalExpenses.toLocaleString()}`, icon: TrendingDown, color: "text-red-400", glow: "bg-red-500/8 border-red-500/15" },
              { label: "Deductions", value: `$${summary.totalDeductions.toLocaleString()}`, icon: DollarSign, color: "text-blue-400", glow: "bg-blue-500/8 border-blue-500/15" },
              { label: "Est. Tax Liability", value: `$${summary.estimatedTax.toLocaleString()}`, icon: BarChart3, color: "text-amber-400", glow: "bg-amber-500/8 border-amber-500/15" },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className={`p-4 rounded-2xl border ${m.glow} relative overflow-hidden`}>
                  <div className="flex items-center gap-1.5 mb-2"><Icon className={`w-3.5 h-3.5 ${m.color}`} /><span className="text-[9px] font-bold uppercase tracking-wider text-text-muted">{m.label}</span></div>
                  <span className={`text-lg sm:text-xl font-black tracking-tight ${m.color}`}>{m.value}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Stats */}
      {summary && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl glass-surface text-[11px]">
          <span className="text-text-muted"><span className="text-white font-bold">{summary.documentsScanned}</span> documents scanned</span>
          <span className="text-text-muted">•</span>
          <span className="text-text-muted"><span className="text-amber-400 font-bold">{summary.categorized}</span> tax-relevant found</span>
          <span className="text-text-muted">•</span>
          <span className="text-text-muted">Tax rate: <span className="text-white font-bold">22%</span></span>
        </div>
      )}

      {/* Categorized Documents */}
      <AnimatePresence>
        {taxFiles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-extrabold text-white">Identified Tax Documents</h3>
                <p className="text-[10px] text-text-muted mt-0.5">{taxFiles.length} files categorized by AI</p>
              </div>
              {phase === "analyzing" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
              {phase === "complete" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="divide-y divide-white/[0.03]">
              {taxFiles.map((file, idx) => (
                <motion.div key={file.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between px-4 sm:px-5 py-3 hover:bg-white/[0.015] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${CATEGORIES.find(c => c.name === file.category)?.bg || "bg-slate-500/10 border-slate-500/20"}`}>
                      {(() => { const C = CATEGORIES.find(c => c.name === file.category); const Icon = C?.icon || FileText; return <Icon className={`w-3.5 h-3.5 ${C?.color || "text-slate-400"}`} />; })()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] text-white font-semibold truncate max-w-[180px] sm:max-w-[300px]">{file.name}</p>
                      <p className="text-[10px] text-text-muted">{file.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {file.amount && (
                      <span className={`text-[12px] font-bold ${file.type === "income" ? "text-emerald-400" : file.type === "deduction" ? "text-blue-400" : "text-red-400"}`}>
                        {file.type === "income" ? "+" : "-"}${file.amount.toLocaleString()}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-text-muted bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded-md">{file.confidence}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Breakdown */}
      {phase === "complete" && taxFiles.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-2xl">
          <h3 className="text-[13px] font-extrabold text-white mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {CATEGORIES.map(cat => {
              const count = taxFiles.filter(f => f.category === cat.name).length;
              const total = taxFiles.filter(f => f.category === cat.name).reduce((s, f) => s + (f.amount || 0), 0);
              if (count === 0) return null;
              const Icon = cat.icon;
              const pct = Math.round((count / taxFiles.length) * 100);
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2"><Icon className={`w-3.5 h-3.5 ${cat.color}`} /><span className="text-white font-semibold">{cat.name}</span></div>
                    <div className="flex items-center gap-2"><span className="text-text-muted">{count} files</span><span className={`font-bold ${cat.color}`}>${total.toLocaleString()}</span></div>
                  </div>
                  <div className="h-[3px] rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className={`h-full rounded-full ${cat.bg.includes("amber") ? "bg-amber-500" : cat.bg.includes("blue") ? "bg-blue-500" : cat.bg.includes("emerald") ? "bg-emerald-500" : cat.bg.includes("red") ? "bg-red-500" : "bg-purple-500"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
