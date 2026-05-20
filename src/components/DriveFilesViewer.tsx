"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileText, Folder, Image as ImageIcon, Film, Table2,
  Presentation, FileArchive, Grid3X3, List,
  ExternalLink, Info, X, Download, Share2, FileCode, RefreshCw, Lock, ChevronRight
} from "lucide-react";

interface DriveFile {
  id: string; name: string; mimeType: string; modifiedTime?: string;
  size?: string; owners?: { displayName?: string; emailAddress?: string }[];
  webViewLink?: string; parents?: string[];
}

interface DriveFilesViewerProps {
  isConnected: boolean;
  refreshTrigger?: number;
  folderLocked?: boolean;
  lockedFolderId?: string | null;
  lockedFolderName?: string | null;
}

const mimeTypeMap: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  "application/vnd.google-apps.folder": { icon: Folder, label: "Folder", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  "application/vnd.google-apps.document": { icon: FileText, label: "Doc", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  "application/vnd.google-apps.spreadsheet": { icon: Table2, label: "Sheet", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  "application/vnd.google-apps.presentation": { icon: Presentation, label: "Slides", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  "application/pdf": { icon: FileText, label: "PDF", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  "image/": { icon: ImageIcon, label: "Image", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  "video/": { icon: Film, label: "Video", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  "application/zip": { icon: FileArchive, label: "Archive", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

function getFileStyle(mimeType: string) {
  for (const [key, val] of Object.entries(mimeTypeMap)) {
    if (mimeType.startsWith(key)) return val;
  }
  return { icon: FileCode, label: "File", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" };
}

function formatDate(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(b?: string) {
  if (!b) return "—";
  const n = parseInt(b);
  if (isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

export default function DriveFilesViewer({ isConnected, refreshTrigger, folderLocked, lockedFolderId, lockedFolderName }: DriveFilesViewerProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 1024);
    r(); window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  const fetchFiles = useCallback(async (query?: string, pageToken?: string, folderId?: string) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (pageToken) params.set("pageToken", pageToken);
      if (folderId) params.set("folderId", folderId);
      params.set("pageSize", "20");
      const res = await fetch(`/api/google/files?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.requiresLock) throw new Error("Please lock a folder first.");
        if (res.status === 401) throw new Error("Session expired. Please reconnect.");
        throw new Error(data.error || "Failed to load files");
      }
      const data = await res.json();
      setFiles(pageToken ? (prev) => [...prev, ...data.files] : data.files);
      setNextPageToken(data.nextPageToken);
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isConnected && folderLocked) {
      setBreadcrumb([{ id: lockedFolderId || "", name: lockedFolderName || "Root" }]);
      fetchFiles();
    }
  }, [isConnected, folderLocked, fetchFiles, refreshTrigger, lockedFolderId, lockedFolderName]);

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => fetchFiles(v, undefined, breadcrumb[breadcrumb.length - 1]?.id), 400);
    setSearchTimeout(t);
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setBreadcrumb(prev => [...prev, { id: folderId, name: folderName }]);
    setFiles([]);
    fetchFiles(searchQuery, undefined, folderId);
  };

  const navigateBreadcrumb = (index: number) => {
    const newBc = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBc);
    setFiles([]);
    fetchFiles(searchQuery, undefined, newBc[newBc.length - 1].id);
  };

  if (!isConnected) {
    return (
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center border-dashed border-white/[0.06]">
        <Folder className="w-10 h-10 text-text-muted mx-auto mb-4" />
        <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">No Drive Connected</h3>
        <p className="text-[11px] text-text-muted max-w-sm mx-auto">Connect your Google Drive above to begin.</p>
      </div>
    );
  }

  if (!folderLocked) {
    return (
      <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
        <Lock className="w-10 h-10 text-blue-400 mx-auto mb-4" />
        <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">Select a Folder</h3>
        <p className="text-[11px] text-text-muted max-w-sm mx-auto">Paste a Google Drive folder link above to lock access and view files securely.</p>
      </div>
    );
  }

  const currentFolderId = breadcrumb[breadcrumb.length - 1]?.id;

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="flex-1 glass-card rounded-2xl overflow-hidden w-full">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06]">
          {/* Breadcrumb */}
          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-1 mb-3 text-[11px] overflow-x-auto pb-1">
              {breadcrumb.map((bc, i) => (
                <span key={bc.id} className="flex items-center gap-1 flex-shrink-0">
                  {i > 0 && <ChevronRight className="w-3 h-3 text-text-muted" />}
                  <button onClick={() => navigateBreadcrumb(i)} className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${i === breadcrumb.length - 1 ? "text-blue-400 font-semibold" : "text-text-muted hover:text-white"}`}>{bc.name}</button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-[13px] sm:text-[15px] font-extrabold text-white tracking-tight">Secure Explorer</h3>
              <p className="text-[11px] text-text-muted mt-0.5 font-medium">{loading ? "Loading..." : `${files.length} items`}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl glass-input text-[11px] w-full sm:w-44">
                <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <input type="text" placeholder="Filter..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="bg-transparent border-none outline-none text-text-primary placeholder-text-muted text-[11px] w-full" />
              </div>
              <div className="flex items-center border border-white/[0.06] rounded-xl overflow-hidden p-0.5 bg-white/[0.02]">
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-white/[0.06] text-blue-400" : "text-text-muted"}`}><List className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white/[0.06] text-blue-400" : "text-text-muted"}`}><Grid3X3 className="w-3.5 h-3.5" /></button>
              </div>
              <button onClick={() => fetchFiles(searchQuery, undefined, currentFolderId)} disabled={loading} className="p-2 rounded-xl border border-white/[0.06] bg-white/[0.02] text-text-muted hover:text-white transition-colors cursor-pointer disabled:opacity-50" title="Refresh"><RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} /></button>
            </div>
          </div>
        </div>

        {error && <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/8 border border-red-500/15 text-[11px] text-red-400 font-medium flex items-center gap-2"><X className="w-3.5 h-3.5" />{error}</div>}

        {loading && files.length === 0 && (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5"><div className="skeleton w-8 h-8 rounded-xl" /><div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-44 rounded-md" /><div className="skeleton h-2.5 w-20 rounded-md" /></div></div>
          ))}</div>
        )}

        {/* List View */}
        {!loading && files.length > 0 && viewMode === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/[0.06] bg-white/[0.01]">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">Name</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hidden md:table-cell">Type</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hidden lg:table-cell">Size</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-muted hidden sm:table-cell">Modified</th>
                <th className="px-4 py-2.5 w-14"></th>
              </tr></thead>
              <tbody>{files.map((file, idx) => {
                const style = getFileStyle(file.mimeType);
                const Icon = style.icon;
                const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                return (
                  <motion.tr key={file.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02, duration: 0.2 }}
                    onClick={() => isFolder ? navigateToFolder(file.id, file.name) : setSelectedFile(file)}
                    className={`border-b border-white/[0.03] transition-colors cursor-pointer group ${selectedFile?.id === file.id ? "bg-white/[0.04]" : "hover:bg-white/[0.015]"}`}>
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${style.bg}`}><Icon className={`w-3.5 h-3.5 ${style.color}`} /></div><span className="text-[12px] text-white font-semibold truncate max-w-[180px] sm:max-w-[300px]">{file.name}</span>{isFolder && <ChevronRight className="w-3 h-3 text-text-muted" />}</div></td>
                    <td className="px-3 py-2.5 hidden md:table-cell"><span className="text-[10px] font-bold text-text-muted bg-white/[0.03] border border-white/[0.05] px-1.5 py-0.5 rounded-md">{style.label}</span></td>
                    <td className="px-3 py-2.5 text-[11px] text-text-secondary font-medium hidden lg:table-cell">{formatSize(file.size)}</td>
                    <td className="px-3 py-2.5 text-[11px] text-text-secondary font-medium hidden sm:table-cell">{formatDate(file.modifiedTime)}</td>
                    <td className="px-4 py-2.5 text-right"><button onClick={(e) => { e.stopPropagation(); setSelectedFile(file); }} className="p-1 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-white transition-all"><Info className="w-3 h-3" /></button></td>
                  </motion.tr>
                );
              })}</tbody>
            </table>
          </div>
        )}

        {/* Grid View */}
        {!loading && files.length > 0 && viewMode === "grid" && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{files.map((file, idx) => {
            const style = getFileStyle(file.mimeType);
            const Icon = style.icon;
            const isFolder = file.mimeType === "application/vnd.google-apps.folder";
            return (
              <motion.div key={file.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.02, duration: 0.2 }}
                onClick={() => isFolder ? navigateToFolder(file.id, file.name) : setSelectedFile(file)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col items-start justify-between h-[110px] ${selectedFile?.id === file.id ? "bg-white/[0.05] border-blue-500/25" : "bg-white/[0.015] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.025]"}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${style.bg}`}><Icon className={`w-4 h-4 ${style.color}`} /></div>
                <div className="w-full"><p className="text-[11px] text-white font-bold truncate">{file.name}</p><div className="flex items-center justify-between mt-0.5 text-[9px] text-text-muted font-medium"><span>{formatDate(file.modifiedTime)}</span><span>{formatSize(file.size)}</span></div></div>
              </motion.div>
            );
          })}</div>
        )}

        {!loading && files.length === 0 && !error && (
          <div className="p-10 text-center"><Folder className="w-10 h-10 text-text-muted mx-auto mb-3" /><p className="text-[12px] text-text-muted font-bold">This folder is empty.</p></div>
        )}

        {nextPageToken && (
          <div className="p-3 text-center border-t border-white/[0.06]">
            <button onClick={() => fetchFiles(searchQuery, nextPageToken, currentFolderId)} disabled={loading} className="px-4 py-2 rounded-xl text-[11px] font-bold text-text-secondary bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-all disabled:opacity-50 cursor-pointer">{loading ? "Loading..." : "Load More"}</button>
          </div>
        )}
      </motion.div>

      {/* Detail Panel */}
      <AnimatePresence>{selectedFile && (
        <>
          {isMobile && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setSelectedFile(null)} className="fixed inset-0 bg-black/60 z-40 lg:hidden" />}
          <motion.div initial={isMobile ? { y: "100%" } : { opacity: 0, x: 100 }} animate={isMobile ? { y: 0 } : { opacity: 1, x: 0 }} exit={isMobile ? { y: "100%" } : { opacity: 0, x: 100 }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={isMobile ? "fixed bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl glass-floating p-5 z-50 overflow-y-auto safe-bottom" : "w-full lg:w-[260px] flex-shrink-0 z-10"}>
            <div className={isMobile ? "space-y-5" : "glass-card rounded-2xl p-4 space-y-5 sticky top-24"}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Details</span>
                <button onClick={() => setSelectedFile(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-white transition-all cursor-pointer"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex flex-col items-center py-5 glass-surface rounded-2xl">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-2.5 ${getFileStyle(selectedFile.mimeType).bg}`}>
                  {(() => { const s = getFileStyle(selectedFile.mimeType); const I = s.icon; return <I className={`w-6 h-6 ${s.color}`} />; })()}
                </div>
                <h4 className="text-[12px] font-bold text-white text-center px-3 line-clamp-2 w-full">{selectedFile.name}</h4>
                <p className="text-[9px] text-text-muted uppercase tracking-wider mt-1 font-bold">{getFileStyle(selectedFile.mimeType).label}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-white/[0.04]"><span className="text-text-muted">Size</span><span className="text-white font-semibold">{formatSize(selectedFile.size)}</span></div>
                <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-white/[0.04]"><span className="text-text-muted">Modified</span><span className="text-white font-semibold">{formatDate(selectedFile.modifiedTime)}</span></div>
                {selectedFile.owners?.[0] && <div className="flex items-center justify-between text-[11px]"><span className="text-text-muted">Owner</span><span className="text-white font-semibold truncate max-w-[100px]">{selectedFile.owners[0].displayName}</span></div>}
              </div>
              <div className="space-y-1.5 pt-1">
                {selectedFile.webViewLink && <a href={selectedFile.webViewLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10 cursor-pointer text-center"><ExternalLink className="w-3 h-3" />Open in Drive</a>}
              </div>
            </div>
          </motion.div>
        </>
      )}</AnimatePresence>
    </div>
  );
}
