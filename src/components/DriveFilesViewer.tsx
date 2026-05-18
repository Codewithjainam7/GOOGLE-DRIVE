"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, FileText, Folder, Image as ImageIcon, Film, Table2,
  Presentation, FileArchive, MoreHorizontal, Grid3X3, List,
  ChevronLeft, ChevronRight, ExternalLink, UploadCloud, Info, X,
  Download, Share2, FileCode, CheckCircle2, RefreshCw
} from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  owners?: { displayName?: string; emailAddress?: string; photoLink?: string }[];
  iconLink?: string;
  webViewLink?: string;
  parents?: string[];
}

interface DriveFilesViewerProps {
  isConnected: boolean;
  refreshTrigger?: number;
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

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes?: string) {
  if (!bytes) return "—";
  const b = parseInt(bytes);
  if (isNaN(b)) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DriveFilesViewer({ isConnected, refreshTrigger }: DriveFilesViewerProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadState, setUploadState] = useState<{ active: boolean; progress: number; name: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchFiles = useCallback(async (query?: string, pageToken?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (pageToken) params.set("pageToken", pageToken);
      params.set("pageSize", "20");

      const res = await fetch(`/api/google/files?${params}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Session expired. Please reconnect.");
        throw new Error("Failed to load files");
      }
      const data = await res.json();
      setFiles(pageToken ? (prev) => [...prev, ...data.files] : data.files);
      setNextPageToken(data.nextPageToken);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected) fetchFiles();
  }, [isConnected, fetchFiles, refreshTrigger]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => fetchFiles(value), 400);
    setSearchTimeout(timeout);
  };

  // Real file upload to Google Drive API
  const uploadFile = async (file: File) => {
    setUploadState({ active: true, progress: 0, name: file.name });
    try {
      const formData = new FormData();
      formData.append("file", file);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/google/files");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadState((prev) => prev ? { ...prev, progress: percent } : null);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            if (response.success && response.file) {
              setUploadState((prev) => prev ? { ...prev, progress: 100 } : null);
              const newFile: DriveFile = {
                id: response.file.id,
                name: response.file.name,
                mimeType: response.file.mimeType,
                modifiedTime: response.file.modifiedTime || new Date().toISOString(),
                size: response.file.size,
                owners: response.file.owners || [{ displayName: "You", emailAddress: "jainjainam@412gmail.com" }],
                webViewLink: response.file.webViewLink,
              };
              setFiles((current) => [newFile, ...current]);
              setTimeout(() => setUploadState(null), 1000);
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          } else {
            reject(new Error("Upload failed with status " + xhr.status));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error"));
        };

        xhr.send(formData);
      });
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
      setUploadState(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center border-dashed border-white/[0.08]">
        <Folder className="w-10 h-10 text-text-muted mx-auto mb-4" />
        <h3 className="text-sm sm:text-base font-bold text-white mb-1.5">No Drive Connected</h3>
        <p className="text-[12px] text-text-muted max-w-sm mx-auto">Connect your Google Drive account above to explore and manage your files.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* Main Files Area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex-1 glass-card rounded-2xl overflow-hidden w-full"
      >
        {/* Drag/Drop and Header */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`p-5 pb-4 border-b border-white/[0.08] transition-all relative ${
            isDragOver ? "bg-blue-500/5 border-blue-500/30" : ""
          }`}
        >
          {/* Simulated Upload Status Overlay */}
          <AnimatePresence>
            {uploadState && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20"
              >
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-white truncate max-w-[180px]">{uploadState.name}</span>
                    <span className="font-bold text-blue-400">{uploadState.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-150"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted text-center font-semibold">
                    {uploadState.progress < 100 ? "Syncing with cloud API..." : "Upload Successful!"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-[14px] sm:text-base font-bold text-white tracking-tight">Cloud Storage Explorer</h3>
              <p className="text-[12px] text-text-muted mt-0.5 font-semibold">
                {loading ? "Refreshing..." : `${files.length} active documents`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[12px] w-full sm:w-48 focus-within:border-blue-500/40 transition-all">
                <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-text-primary placeholder-text-muted text-[12px] w-full"
                />
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between sm:justify-start gap-2">
                {/* Grid/List toggler */}
                <div className="flex items-center border border-white/[0.08] rounded-xl overflow-hidden p-0.5 bg-white/[0.02]">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list" ? "bg-white/[0.06] text-blue-400" : "text-text-muted hover:text-text-tertiary"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white/[0.06] text-blue-400" : "text-text-muted hover:text-text-tertiary"}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Live Sync Refresh button */}
                  <button
                    onClick={() => fetchFiles(searchQuery)}
                    disabled={loading}
                    className="p-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-text-muted hover:text-white transition-colors cursor-pointer select-none disabled:opacity-50"
                    title="Refresh Cloud Drive"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
                  </button>

                  {/* Upload Trigger button */}
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-white bg-blue-500 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10 cursor-pointer select-none">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" className="hidden" onChange={handleFileSelect} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mx-5 mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 font-semibold flex items-center gap-2">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && files.length === 0 && (
          <div className="p-5 space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 py-3 border-b border-white/[0.02]">
                <div className="skeleton w-9 h-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-48 rounded-md" />
                  <div className="skeleton h-2.5 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List Mode view */}
        {!loading && files.length > 0 && viewMode === "list" && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.01]">
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">Item Name</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted hidden md:table-cell">Kind</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted hidden lg:table-cell">Size</th>
                  <th className="text-left px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted hidden sm:table-cell">Modified</th>
                  <th className="px-5 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, idx) => {
                  const style = getFileStyle(file.mimeType);
                  const Icon = style.icon;
                  const activeSelected = selectedFile?.id === file.id;

                  return (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                      onClick={() => setSelectedFile(file)}
                      className={`border-b border-white/[0.03] transition-colors cursor-pointer group ${
                        activeSelected ? "bg-white/[0.04]" : "hover:bg-white/[0.015]"
                      }`}
                    >
                      {/* Name & Icon */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${style.bg}`}>
                            <Icon className={`w-4 h-4 ${style.color}`} />
                          </div>
                          <span className="text-[13px] text-white font-semibold truncate max-w-[240px] sm:max-w-[340px]">{file.name}</span>
                        </div>
                      </td>

                      {/* Kind */}
                      <td className="px-3 py-3 hidden md:table-cell">
                        <span className="text-[11px] font-bold text-text-muted bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">
                          {style.label}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="px-3 py-3 text-[12px] text-text-secondary font-medium hidden lg:table-cell">
                        {formatSize(file.size)}
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-[12px] text-text-secondary font-medium hidden sm:table-cell">
                        {formatDate(file.modifiedTime)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(file);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-text-secondary transition-all"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-blue-400 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Grid Mode view */}
        {!loading && files.length > 0 && viewMode === "grid" && (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {files.map((file, idx) => {
              const style = getFileStyle(file.mimeType);
              const Icon = style.icon;
              const activeSelected = selectedFile?.id === file.id;

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  onClick={() => setSelectedFile(file)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group flex flex-col items-start justify-between h-[120px] ${
                    activeSelected
                      ? "bg-white/[0.05] border-blue-500/30 shadow-lg shadow-blue-500/5"
                      : "bg-white/[0.015] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.025]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${style.bg}`}>
                    <Icon className={`w-5 h-5 ${style.color}`} />
                  </div>
                  <div className="w-full">
                    <p className="text-[12px] text-white font-bold truncate group-hover:text-blue-400 transition-colors">{file.name}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-text-muted font-semibold">
                      <span>{formatDate(file.modifiedTime)}</span>
                      <span>{formatSize(file.size)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && files.length === 0 && !error && (
          <div className="p-12 text-center">
            <Folder className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <p className="text-[13px] text-text-muted font-bold">No cloud files verified.</p>
          </div>
        )}

        {/* Load More pagination button */}
        {nextPageToken && (
          <div className="p-4 text-center border-t border-white/[0.08] bg-white/[0.01]">
            <button
              onClick={() => fetchFiles(searchQuery, nextPageToken)}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-[12px] font-bold text-text-secondary bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-all disabled:opacity-50 cursor-pointer select-none"
            >
              {loading ? "Refreshing List..." : "Load Next Documents"}
            </button>
          </div>
        )}
      </motion.div>

      {/* iPadOS-style Details Inspection Drawer / Mobile bottom sheet */}
      <AnimatePresence>
        {selectedFile && (
          <>
            {/* Backdrop overlay for mobile bottom sheet */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedFile(null)}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
              />
            )}

            <motion.div
              initial={isMobile ? { y: "100%", opacity: 1 } : { opacity: 0, x: 200, width: 0 }}
              animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, x: 0, width: "100%" }}
              exit={isMobile ? { y: "100%", opacity: 1 } : { opacity: 0, x: 200, width: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={
                isMobile
                  ? "fixed bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl bg-[#090d1a] border-t border-white/[0.12] p-6 z-50 overflow-y-auto select-none shadow-[0_-12px_40px_rgba(0,0,0,0.6)]"
                  : "w-full lg:w-[280px] flex-shrink-0 select-none z-10"
              }
            >
              <div className={isMobile ? "space-y-6" : "glass-card rounded-2xl p-5 space-y-6 relative sticky top-24 border border-white/[0.08]"}>
                {/* Header Close button */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Document Details</span>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-muted hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Large File Preview Icon Block */}
                <div className="flex flex-col items-center justify-center py-6 bg-white/[0.015] border border-white/[0.05] rounded-2xl">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-3 ${getFileStyle(selectedFile.mimeType).bg}`}>
                    {(() => {
                      const style = getFileStyle(selectedFile.mimeType);
                      const Icon = style.icon;
                      return <Icon className={`w-7 h-7 ${style.color}`} />;
                    })()}
                  </div>
                  <h4 className="text-[13px] font-bold text-white text-center px-4 line-clamp-2 w-full">{selectedFile.name}</h4>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1 font-bold">
                    {getFileStyle(selectedFile.mimeType).label}
                  </p>
                </div>

                {/* Metadata details fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[12px] pb-2 border-b border-white/[0.04]">
                    <span className="text-text-muted font-medium">Data Size</span>
                    <span className="text-white font-semibold">{formatSize(selectedFile.size)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] pb-2 border-b border-white/[0.04]">
                    <span className="text-text-muted font-medium">Last Modified</span>
                    <span className="text-white font-semibold">{formatDate(selectedFile.modifiedTime)}</span>
                  </div>
                  {selectedFile.owners?.[0] && (
                    <div className="flex items-center justify-between text-[12px] pb-2 border-b border-white/[0.04]">
                      <span className="text-text-muted font-medium">Owner Identity</span>
                      <span className="text-white font-semibold truncate max-w-[120px]">{selectedFile.owners[0].displayName}</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions Panel */}
                <div className="space-y-2 pt-2">
                  {selectedFile.webViewLink && (
                    <a
                      href={selectedFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-white bg-blue-500 hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/10 cursor-pointer select-none text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Drive
                    </a>
                  )}
                  
                  <button
                    onClick={() => alert("Downloading from secure Google API API is simulated!")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-text-secondary bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer select-none"
                  >
                    <Download className="w-3.5 h-3.5 text-text-muted" />
                    Request Download
                  </button>

                  <button
                    onClick={() => alert("Share link copied to clipboard!")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold text-text-secondary bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer select-none"
                  >
                    <Share2 className="w-3.5 h-3.5 text-text-muted" />
                    Create Share Link
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
