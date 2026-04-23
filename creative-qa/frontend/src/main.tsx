import React, { useState, useEffect, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";

// ── Router ───────────────────────────────────────────────────────────────────
const BASE_PATH = "/" + (window.location.pathname.split("/").filter(Boolean)[0] || "");
const API = BASE_PATH + "/api";

function getPath() {
  const p = window.location.pathname;
  return p.startsWith(BASE_PATH) ? p.slice(BASE_PATH.length) || "/" : p;
}
function go(to: string) {
  history.pushState({}, "", BASE_PATH + to);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
function useRouter() {
  const [path, setPath] = useState(getPath);
  useEffect(() => {
    const h = () => setPath(getPath());
    window.addEventListener("popstate", h);
    return () => window.removeEventListener("popstate", h);
  }, []);
  return path;
}

// ── API ──────────────────────────────────────────────────────────────────────
async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      ...(opts.body && !(opts.body instanceof ArrayBuffer) && !(opts.body instanceof Uint8Array)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(opts.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(e.error || "Request failed");
  }
  return res.json();
}

// ── Type helpers ─────────────────────────────────────────────────────────────
const isVideo = (a: any) => a?.asset_type === "video" || a?.content_type?.startsWith("video/");
const isImage = (a: any) => a?.asset_type === "image" || a?.content_type?.startsWith("image/");

// Fetch image as base64 JSON and return a data URL — avoids proxy binary serialization
function useImageSrc(assetId: string | null): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!assetId) return;
    let cancelled = false;
    apiFetch(`/assets/${assetId}/data`)
      .then(({ data, mimeType }: { data: string; mimeType: string }) => {
        if (!cancelled) setSrc(`data:${mimeType};base64,${data}`);
      })
      .catch(() => { if (!cancelled) setSrc(""); });
    return () => { cancelled = true; };
  }, [assetId]);
  return src;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --gray-0: #ffffff; --gray-2: #f8f8f8; --gray-3: #f3f3f3; --gray-4: #ededed;
  --gray-6: #e2e2e2; --gray-7: #dbdbdb; --gray-9: #8f8f8f; --gray-11: #6f6f6f;
  --gray-12: #171717;
  --primary-3: #eafad1; --primary-9: #c1f14b; --primary-11: #627d20;
  --obj-bg: #eff6ff; --obj-border: #bfdbfe; --obj-text: #1d4ed8;
  --sub-bg: #fffbeb; --sub-border: #fde68a; --sub-text: #92400e;
  --error-9: #e5484d; --success-9: #30a46c;
  --font: 'Inter', -apple-system, sans-serif;
  --radius: 10px; --radius-card: 16px;
}
body { font-family: var(--font); background: var(--gray-0); color: var(--gray-12); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
button, input, textarea, select { font-family: var(--font); }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--gray-6); border-radius: 99px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes pinPop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.5); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
`;

// ── Layout helpers ────────────────────────────────────────────────────────────
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap });
const col = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap });

// ── Components ────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button", style }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md";
  disabled?: boolean; type?: "button" | "submit"; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", border: "1px solid transparent",
    borderRadius: "var(--radius)", fontSize: size === "sm" ? 12 : 14,
    padding: size === "sm" ? "4px 10px" : "7px 14px",
    opacity: disabled ? 0.5 : 1, transition: "background 75ms", whiteSpace: "nowrap" as const,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "var(--gray-12)", color: "var(--gray-0)", borderColor: "var(--gray-12)" },
    secondary: { background: "var(--gray-0)", color: "var(--gray-12)", borderColor: "var(--gray-6)" },
    ghost: { background: "transparent", color: "var(--gray-11)", borderColor: "transparent" },
    danger: { background: "var(--error-9)", color: "#fff", borderColor: "var(--error-9)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, required, type = "text", style }: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
      style={{ width: "100%", padding: "7px 10px", fontSize: 14, border: "1px solid var(--gray-6)", borderRadius: "var(--radius)", background: "var(--gray-0)", color: "var(--gray-12)", outline: "none", fontFamily: "var(--font)", ...style }}
      onFocus={e => e.target.style.borderColor = "var(--gray-12)"}
      onBlur={e => e.target.style.borderColor = "var(--gray-6)"} />
  );
}

function Textarea({ value, onChange, placeholder, style, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--gray-6)", borderRadius: "var(--radius)", background: "var(--gray-0)", color: "var(--gray-12)", outline: "none", resize: "vertical", minHeight: 72, fontFamily: "var(--font)", lineHeight: 1.5, ...style }}
      onFocus={e => e.target.style.borderColor = "var(--gray-12)"}
      onBlur={e => e.target.style.borderColor = "var(--gray-6)"} />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gray-11)" }}>{children}</span>;
}

function RoutingBadge({ routing }: { routing: "objective" | "subjective" }) {
  const isObj = routing === "objective";
  return (
    <span title={isObj ? "Objective — assign directly to team" : "Subjective — flag for Creative Strategist"}
      style={{
        display: "inline-flex", alignItems: "center", padding: "1px 6px", borderRadius: 5, fontSize: 10,
        fontWeight: 700, letterSpacing: "0.03em",
        background: isObj ? "var(--obj-bg)" : "var(--sub-bg)",
        color: isObj ? "var(--obj-text)" : "var(--sub-text)",
        border: `1px solid ${isObj ? "var(--obj-border)" : "var(--sub-border)"}`,
      }}>
      {isObj ? "O" : "S"}
    </span>
  );
}

function StatusPill({ label, variant }: { label: string; variant: "review" | "rework" | "done" | "runneth" | "human" | "pending" }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    review: { bg: "#FFF8E1", text: "#7C5700", border: "#FFE082" },
    rework: { bg: "#FFF0F0", text: "#9B1C1C", border: "#FCA5A5" },
    done: { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
    runneth: { bg: "var(--primary-3)", text: "var(--primary-11)", border: "#d0ec9e" },
    human: { bg: "var(--gray-3)", text: "var(--gray-11)", border: "var(--gray-6)" },
    pending: { bg: "#F5F0FF", text: "#5B21B6", border: "#C4B5FD" },
  };
  const c = colors[variant] || colors.human;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {label}
    </span>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 48 }}>
      <div style={{ width: 24, height: 24, border: "2px solid var(--gray-6)", borderTop: "2px solid var(--gray-12)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "8px 12px", borderRadius: "var(--radius)", background: "#FFF0F0", border: "1px solid #FCA5A5", color: "var(--error-9)", fontSize: 13 }}>
      {msg}
    </div>
  );
}

function Modal({ open, onClose, title, children, width = 440 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number;
}) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--gray-0)", borderRadius: "var(--radius-card)", border: "1px solid var(--gray-6)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: "100%", maxWidth: width, padding: 24, animation: "fadeUp 0.15s ease" }}>
        <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          <Btn variant="ghost" size="sm" onClick={onClose} style={{ padding: "4px 8px", fontSize: 16, color: "var(--gray-9)" }}>✕</Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ crumbs }: { crumbs?: { label: string; to?: string }[] }) {
  return (
    <nav style={{ borderBottom: "1px solid var(--gray-6)", background: "var(--gray-0)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 52, ...row(12) }}>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", cursor: "pointer", color: "var(--gray-12)" }} onClick={() => go("/")}>
          Creative QA
        </span>
        {crumbs?.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{ color: "var(--gray-7)", fontSize: 16 }}>/</span>
            {c.to
              ? <span onClick={() => go(c.to!)} style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-11)", cursor: "pointer" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "var(--gray-12)"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "var(--gray-11)"}>{c.label}</span>
              : <span style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-12)" }}>{c.label}</span>
            }
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

// ── Home ───────────────────────────────────────────────────────────────────────
function AssetCard({ asset: a, onDelete }: { asset: any; onDelete: (a: any) => Promise<void> }) {
  const [duration, setDuration] = useState<number | null>(a.duration || null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const runnethCount = Number(a.runneth_count || 0);
  const unreviewedCount = Number(a.unreviewed_count || 0);
  const qaState: "pending" | "review" | "done" =
    runnethCount === 0 ? "pending" : unreviewedCount === 0 ? "done" : "review";
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  const imageSrc = useImageSrc(isImage(a) ? a.id : null);

  return (
    <>
      <div onClick={() => go(`/a/${a.id}`)}
        style={{ border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", overflow: "hidden", cursor: "pointer", background: "var(--gray-0)", transition: "border-color 75ms", animation: "fadeUp 0.2s ease", opacity: deleting ? 0.55 : 1 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-9)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-6)"}>
        <div style={{ background: "var(--gray-3)", aspectRatio: "16/9", position: "relative", overflow: "hidden" }}>
          {isVideo(a) ? (
            <>
              <video muted playsInline preload="metadata"
                src={`${API}/assets/${a.id}/stream#t=0.1`}
                onLoadedMetadata={e => {
                  const m = e.currentTarget;
                  if (m.duration) setDuration(m.duration);
                  try { m.currentTime = Math.min(0.1, m.duration || 0); } catch {}
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <polygon points="5,3 19,12 5,21" fill="rgba(255,255,255,0.55)" />
                </svg>
              </div>
            </>
          ) : imageSrc ? (
            <img src={imageSrc} alt={a.title}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--gray-4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 20, height: 20, border: "2px solid var(--gray-6)", borderTop: "2px solid var(--gray-9)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            </div>
          )}
        </div>
        <div style={{ padding: 14 }}>
          <div style={{ ...row(8), justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <span style={{ fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title || a.id}</span>
            <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }} disabled={deleting}
              style={{ border: "none", background: "transparent", color: "var(--gray-9)", cursor: deleting ? "default" : "pointer", fontSize: 12, padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>
              {deleting ? "..." : "Delete"}
            </button>
          </div>
          <div style={{ ...row(8), color: "var(--gray-11)", fontSize: 12, flexWrap: "wrap" as const }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10, color: "var(--gray-9)", background: "var(--gray-3)", padding: "1px 5px", borderRadius: 4 }}>
              {isVideo(a) ? "Video" : "Image"}
            </span>
            {duration && <span>{fmt(duration)}</span>}
            {a.file_size && <span>{(a.file_size / 1024 / 1024).toFixed(1)} MB</span>}
            <StatusPill
              label={qaState === "pending" ? "QA Pending" : qaState === "done" ? "Reviewed" : "In review"}
              variant={qaState}
            />
          </div>
        </div>
      </div>
      <Modal open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)} title="Delete asset?">
        <div style={col(16)}>
          <p style={{ color: "var(--gray-11)", fontSize: 13 }}>This will permanently delete "{a.title || a.id}", including all comments and share links.</p>
          {deleteError && <ErrMsg msg={deleteError} />}
          <div style={{ ...row(8), justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Btn>
            <Btn variant="danger" disabled={deleting} onClick={async () => {
              setDeleting(true);
              try { await onDelete(a); setConfirmDelete(false); }
              catch (e: any) { setDeleteError(e.message || "Delete failed"); }
              finally { setDeleting(false); }
            }}>{deleting ? "Deleting..." : "Delete asset"}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Home() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => apiFetch("/assets").then(d => setAssets(d.assets)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleFile = (f: File) => {
    setPendingFile(f);
    setUploadTitle(f.name.replace(/\.[^.]+$/, ""));
    setShowUpload(true);
  };

  const upload = async () => {
    if (!pendingFile) return;
    setUploading(true); setProgress(0); setErr("");
    try {
      let duration: number | null = null;
      if (pendingFile.type.startsWith("video/")) {
        duration = await new Promise<number | null>(res => {
          const url = URL.createObjectURL(pendingFile);
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => { URL.revokeObjectURL(url); res(v.duration || null); };
          v.onerror = () => { URL.revokeObjectURL(url); res(null); };
          v.src = url;
        });
      }
      const cr = await apiFetch("/assets", {
        method: "POST",
        body: JSON.stringify({ title: uploadTitle || pendingFile.name, contentType: pendingFile.type, fileName: pendingFile.name, fileSize: pendingFile.size, duration }),
      });
      setProgress(5);

      // Chunked base64 upload — each chunk ~500 KB source / ~680 KB base64, proxy-safe
      const CHUNK = 500 * 1024;
      const totalChunks = Math.ceil(pendingFile.size / CHUNK);
      const readChunk = (start: number, end: number): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = () => reject(new Error("Failed to read chunk"));
          reader.readAsDataURL(pendingFile.slice(start, end));
        });

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK;
        const end = Math.min(start + CHUNK, pendingFile.size);
        const data = await readChunk(start, end);
        await apiFetch(`/assets/${cr.asset.id}/upload/chunk`, {
          method: "POST",
          body: JSON.stringify({ index: i, total: totalChunks, data }),
        });
        setProgress(5 + Math.round(((i + 1) / totalChunks) * 90));
      }

      await apiFetch(`/assets/${cr.asset.id}/upload/complete`, {
        method: "POST",
        body: JSON.stringify({ total: totalChunks }),
      });
      setProgress(100);
      setShowUpload(false); setPendingFile(null); load();
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); setProgress(0); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-0)" }}>
      <style>{css}</style>
      <Nav />
      <input type="file" ref={fileRef} style={{ display: "none" }} accept="video/*,image/*"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>Creatives</h1>
            <p style={{ fontSize: 13, color: "var(--gray-11)" }}>Upload and review video and static ad creatives.</p>
          </div>
          <Btn onClick={() => fileRef.current?.click()}>Upload creative</Btn>
        </div>
        {loading ? <Spinner /> : assets.length === 0 ? (
          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            style={{ border: `1.5px dashed ${dragOver ? "var(--gray-12)" : "var(--gray-6)"}`, borderRadius: "var(--radius-card)", padding: "64px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "var(--gray-3)" : "var(--gray-2)", transition: "all 75ms" }}>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drop a creative here</p>
            <p style={{ fontSize: 13, color: "var(--gray-11)" }}>Video or image — MP4, MOV, WebM, JPG, PNG, GIF, WebP</p>
          </div>
        ) : (
          <div onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}>
            {dragOver && (
              <div style={{ border: "1.5px dashed var(--gray-12)", borderRadius: "var(--radius-card)", padding: "20px 24px", textAlign: "center", marginBottom: 16, background: "var(--gray-3)", fontSize: 13, fontWeight: 500 }}>Drop to upload</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {assets.map(a => (
                <AssetCard key={a.id} asset={a} onDelete={async (asset) => {
                  await apiFetch(`/assets/${asset.id}`, { method: "DELETE" });
                  await load();
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Modal open={showUpload} onClose={() => { if (!uploading) { setShowUpload(false); setPendingFile(null); } }} title="Upload creative">
        <div style={col(14)}>
          {pendingFile && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--gray-3)", fontSize: 13, color: "var(--gray-11)" }}>
              {pendingFile.name} — {(pendingFile.size / 1024 / 1024).toFixed(1)} MB
            </div>
          )}
          <div style={col(6)}>
            <Label>Title</Label>
            <Input value={uploadTitle} onChange={setUploadTitle} placeholder="Asset title" />
          </div>
          {err && <ErrMsg msg={err} />}
          {uploading ? (
            <div style={col(6)}>
              <div style={{ ...row(0), justifyContent: "space-between" }}><Label>Uploading</Label><Label>{progress}%</Label></div>
              <div style={{ height: 4, background: "var(--gray-6)", borderRadius: 99 }}>
                <div style={{ height: "100%", width: `${progress}%`, background: "var(--gray-12)", borderRadius: 99, transition: "width 0.15s" }} />
              </div>
            </div>
          ) : (
            <Btn type="submit" onClick={upload}>Upload</Btn>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ── Image viewer with click-to-annotate ───────────────────────────────────────
function PinMarker({ index, routing, active, onClick }: { index: number; routing: string; active: boolean; onClick: () => void }) {
  const isObj = routing === "objective";
  return (
    <div onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700, cursor: "pointer", userSelect: "none",
        background: active ? "var(--gray-12)" : isObj ? "var(--obj-bg)" : "var(--sub-bg)",
        color: active ? "var(--gray-0)" : isObj ? "var(--obj-text)" : "var(--sub-text)",
        border: `2px solid ${active ? "var(--gray-12)" : isObj ? "var(--obj-border)" : "var(--sub-border)"}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        animation: "pinPop 0.15s ease",
        transition: "background 75ms, border-color 75ms",
      }}>
      {index + 1}
    </div>
  );
}

function PendingPinMarker() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gray-12)", opacity: 0.7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--gray-0)", fontWeight: 700, boxShadow: "0 2px 6px rgba(0,0,0,0.25)", animation: "pinPop 0.15s ease" }}>+</div>
  );
}

function ImageViewer({ asset, comments, onPin, activeCommentId, onActivate }: {
  asset: any; comments: any[]; onPin: (x: number, y: number) => void;
  activeCommentId: string | null; onActivate: (id: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinnedComments = comments.filter(c => c.pin_x !== null && c.pin_x !== undefined);
  const imageSrc = useImageSrc(asset.id);

  const handleClick = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onPin(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
  };

  if (!imageSrc) return (
    <div style={{ width: "100%", aspectRatio: "1", background: "var(--gray-3)", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 24, height: 24, border: "2px solid var(--gray-6)", borderTop: "2px solid var(--gray-12)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
    </div>
  );

  return (
    <div ref={containerRef} onClick={handleClick}
      style={{ position: "relative", cursor: "crosshair", display: "inline-block", width: "100%", lineHeight: 0 }}>
      <img src={imageSrc} alt={asset.title}
        style={{ width: "100%", display: "block", borderRadius: "var(--radius)", userSelect: "none", pointerEvents: "none" }} />
      {pinnedComments.map((c, i) => (
        <div key={c.id} onClick={e => { e.stopPropagation(); onActivate(activeCommentId === c.id ? null : c.id); }}
          style={{ position: "absolute", left: `${c.pin_x * 100}%`, top: `${c.pin_y * 100}%`, transform: "translate(-50%, -50%)", zIndex: 10 }}>
          <PinMarker index={i} routing={c.routing} active={activeCommentId === c.id} onClick={() => {}} />
        </div>
      ))}
    </div>
  );
}

// ── Comment card ──────────────────────────────────────────────────────────────
function CommentCard({ comment: c, index, onAccept, onReject, onUndo, onAnnotate, onDelete, onRoutingToggle, isActive, onActivate, fmtTs }: {
  comment: any; index: number; onAccept: () => void; onReject: () => void; onUndo: () => void;
  onAnnotate: (text: string) => Promise<void>; onDelete: () => void; onRoutingToggle: () => void;
  isActive: boolean; onActivate: () => void; fmtTs: (s: number) => string;
}) {
  const isRunneth = c.source === "runneth";
  const isAccepted = isRunneth && c.resolved === 1;
  const isRejected = isRunneth && c.rejected === 1;
  const isReviewed = isAccepted || isRejected;
  const [annotating, setAnnotating] = useState(false);
  const [annotationDraft, setAnnotationDraft] = useState(c.annotation || "");
  const [annotationSaving, setAnnotationSaving] = useState(false);
  const [annotationErr, setAnnotationErr] = useState("");
  useEffect(() => { if (!annotating) setAnnotationDraft(c.annotation || ""); }, [c.annotation, annotating]);

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${isActive ? "var(--gray-12)" : isAccepted ? "#86EFAC" : isRejected ? "#FCA5A5" : isRunneth ? "#d0ec9e" : "var(--gray-6)"}`,
    borderRadius: "var(--radius)", padding: 10,
    background: isActive ? "var(--gray-3)" : isAccepted ? "#F0FDF4" : isRejected ? "#FFF0F0" : isRunneth ? "var(--gray-2)" : "var(--gray-0)",
    animation: "fadeUp 0.15s ease", opacity: isReviewed && !isActive ? 0.85 : 1, cursor: "pointer",
    boxShadow: isActive ? "0 0 0 2px var(--gray-12)" : "none",
  };

  return (
    <div style={cardStyle} onClick={onActivate}>
      <div style={{ ...row(6), marginBottom: 6, flexWrap: "wrap" as const }}>
        {c.pin_x !== null && c.pin_x !== undefined && (
          <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--gray-12)", color: "var(--gray-0)", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {index + 1}
          </span>
        )}
        {isRunneth
          ? <StatusPill label="Runneth" variant="runneth" />
          : <StatusPill label={c.user_name} variant="human" />
        }
        <RoutingBadge routing={c.routing} />
        {isAccepted && <StatusPill label="Accepted" variant="done" />}
        {isRejected && <StatusPill label="Rejected" variant="rework" />}
        {c.timestamp_seconds > 0 && (
          <span style={{ fontSize: 11, color: "var(--gray-11)", marginLeft: "auto" }}>{fmtTs(c.timestamp_seconds)}</span>
        )}
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: isRunneth ? 8 : 0 }}>{c.text}</p>
      {c.annotation && !annotating && (
        <div style={{ marginTop: 6, padding: "6px 8px", background: "var(--gray-3)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--gray-11)", fontStyle: "italic" }}>
          "{c.annotation}"
        </div>
      )}
      {isRunneth && !isReviewed && (
        <div style={{ ...row(6), marginTop: 8 }}>
          <Btn size="sm" variant="secondary" onClick={e => { e.stopPropagation(); onAccept(); }}>Accept</Btn>
          <Btn size="sm" variant="secondary" onClick={e => { e.stopPropagation(); onReject(); }}>Reject</Btn>
          <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setAnnotating(true); }}>Note</Btn>
        </div>
      )}
      {isRunneth && isReviewed && (
        <div style={{ ...row(6), marginTop: 8 }}>
          <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onUndo(); }}>Undo</Btn>
          {!annotating && <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setAnnotating(true); }}>
            {c.annotation ? "Edit note" : "Add note"}
          </Btn>}
        </div>
      )}
      {annotating && (
        <div style={{ ...col(6), marginTop: 8 }} onClick={e => e.stopPropagation()}>
          <Textarea value={annotationDraft} onChange={setAnnotationDraft} placeholder="Add a note on this feedback..." style={{ minHeight: 56 }} />
          {annotationErr && <ErrMsg msg={annotationErr} />}
          <div style={row(6)}>
            <Btn size="sm" variant="secondary" disabled={annotationSaving} onClick={async e => {
              e.stopPropagation();
              setAnnotationSaving(true); setAnnotationErr("");
              try { await onAnnotate(annotationDraft); setAnnotating(false); }
              catch (e: any) { setAnnotationErr(e.message); }
              finally { setAnnotationSaving(false); }
            }}>{annotationSaving ? "Saving..." : "Save"}</Btn>
            <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setAnnotating(false); setAnnotationDraft(c.annotation || ""); }}>Cancel</Btn>
          </div>
        </div>
      )}
      <div style={{ ...row(6), marginTop: 8, justifyContent: "flex-end" }}>
        <button onClick={e => { e.stopPropagation(); onRoutingToggle(); }}
          style={{ border: "none", background: "transparent", fontSize: 11, color: "var(--gray-9)", cursor: "pointer", padding: 0 }}
          title="Toggle Objective/Subjective">
          Toggle {c.routing === "objective" ? "S" : "O"}
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ border: "none", background: "transparent", fontSize: 11, color: "var(--error-9)", cursor: "pointer", padding: 0 }}>
          Delete
        </button>
      </div>
    </div>
  );
}

// ── Asset detail page ─────────────────────────────────────────────────────────
function AssetPage({ id }: { id: string }) {
  const [asset, setAsset] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentRouting, setCommentRouting] = useState<"objective" | "subjective">("objective");
  const [posting, setPosting] = useState(false);
  const [commentErr, setCommentErr] = useState("");
  const [userName, setUserName] = useState(() => sessionStorage.getItem("cqa_user") || "");
  const [routingFilter, setRoutingFilter] = useState<"all" | "objective" | "subjective">("all");
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [showPinForm, setShowPinForm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loadData = useCallback(async () => {
    const [aRes, cRes] = await Promise.all([apiFetch(`/assets/${id}`), apiFetch(`/assets/${id}/comments`)]);
    setAsset(aRes.asset);
    setComments(cRes.comments);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveName = (n: string) => { setUserName(n); sessionStorage.setItem("cqa_user", n); };

  const fmtTs = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const postComment = async (text: string, routing: "objective" | "subjective", ts: number, pinX?: number, pinY?: number) => {
    setPosting(true); setCommentErr("");
    try {
      await apiFetch(`/assets/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({
          text, routing, timestamp_seconds: ts,
          user_name: userName || "Anonymous", source: "human",
          ...(pinX !== undefined ? { pin_x: pinX, pin_y: pinY } : {}),
        }),
      });
      setCommentText(""); setPosting(false);
      await loadData();
    } catch (e: any) { setCommentErr(e.message); setPosting(false); }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    const ts = isVideo(asset) && videoRef.current ? videoRef.current.currentTime : 0;
    await postComment(commentText, commentRouting, ts);
  };

  const handlePin = (x: number, y: number) => {
    setPendingPin({ x, y });
    setShowPinForm(true);
  };

  const handlePinSubmit = async () => {
    if (!commentText.trim() || !pendingPin) return;
    await postComment(commentText, commentRouting, 0, pendingPin.x, pendingPin.y);
    setPendingPin(null); setShowPinForm(false);
  };

  const updateComment = async (cid: string, patch: object) => {
    await apiFetch(`/comments/${cid}`, { method: "PATCH", body: JSON.stringify(patch) });
    await loadData();
  };

  const filteredComments = comments.filter(c => routingFilter === "all" || c.routing === routingFilter);

  if (loading) return <><style>{css}</style><Nav /><Spinner /></>;
  if (!asset) return <><style>{css}</style><Nav crumbs={[{ label: "Not found" }]} /><ErrMsg msg="Asset not found" /></>;

  const objCount = comments.filter(c => c.routing === "objective").length;
  const subCount = comments.filter(c => c.routing === "subjective").length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-0)" }}>
      <style>{css}</style>
      <Nav crumbs={[{ label: "Creatives", to: "/" }, { label: asset.title }]} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* Left: viewer */}
        <div style={col(16)}>
          <div style={{ ...row(10), flexWrap: "wrap" as const }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, flex: 1 }}>{asset.title}</h1>
            <span style={{ fontSize: 12, color: "var(--gray-9)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isVideo(asset) ? "Video" : "Image"}
            </span>
          </div>

          {isVideo(asset) ? (
            <video ref={videoRef} controls
              src={`${API}/assets/${asset.id}/stream`}
              style={{ width: "100%", maxHeight: "calc(100vh - 160px)", borderRadius: "var(--radius)", background: "var(--gray-12)", display: "block", objectFit: "contain" }} />
          ) : (
            <div>
              <p style={{ fontSize: 12, color: "var(--gray-11)", marginBottom: 8 }}>
                Click anywhere on the image to pin a comment.
              </p>
              <ImageViewer
                asset={asset}
                comments={comments}
                onPin={handlePin}
                activeCommentId={activeCommentId}
                onActivate={id => setActiveCommentId(id)}
              />
            </div>
          )}

          {/* Manual comment input (also works for images without a pin) */}
          <div style={{ border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", padding: 16, ...col(12) }}>
            <div style={{ ...row(8), justifyContent: "space-between" }}>
              <Label>Add comment {isVideo(asset) ? "(posts at current timestamp)" : "(no pin)"}</Label>
              <div style={row(4)}>
                {(["objective", "subjective"] as const).map(r => (
                  <button key={r} onClick={() => setCommentRouting(r)}
                    style={{ border: `1px solid ${commentRouting === r ? (r === "objective" ? "var(--obj-border)" : "var(--sub-border)") : "var(--gray-6)"}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: commentRouting === r ? (r === "objective" ? "var(--obj-bg)" : "var(--sub-bg)") : "transparent", color: commentRouting === r ? (r === "objective" ? "var(--obj-text)" : "var(--sub-text)") : "var(--gray-9)", }}>
                    {r === "objective" ? "O" : "S"} {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {!userName && (
              <div style={col(4)}>
                <Label>Your name</Label>
                <Input value={userName} onChange={saveName} placeholder="Type your name" />
              </div>
            )}
            <Textarea value={commentText} onChange={setCommentText} placeholder="Leave a comment..."
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmitComment(); }} />
            {commentErr && <ErrMsg msg={commentErr} />}
            <Btn disabled={posting || !commentText.trim()} onClick={handleSubmitComment}>
              {posting ? "Posting..." : "Post comment"}
            </Btn>
          </div>
        </div>

        {/* Right: comment list */}
        <div style={{ ...col(12), position: "sticky", top: 24, maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>
          {/* Routing filter */}
          <div style={{ ...row(6), padding: "8px 12px", background: "var(--gray-2)", borderRadius: "var(--radius)", border: "1px solid var(--gray-6)" }}>
            {(["all", "objective", "subjective"] as const).map(f => (
              <button key={f} onClick={() => setRoutingFilter(f)}
                style={{ flex: 1, border: "none", borderRadius: 6, padding: "4px 0", fontSize: 11, fontWeight: 600, cursor: "pointer", background: routingFilter === f ? "var(--gray-0)" : "transparent", color: routingFilter === f ? "var(--gray-12)" : "var(--gray-9)", boxShadow: routingFilter === f ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                {f === "all" ? `All (${comments.length})` : f === "objective" ? `O (${objCount})` : `S (${subCount})`}
              </button>
            ))}
          </div>

          {filteredComments.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--gray-9)", textAlign: "center", padding: "32px 0" }}>No comments yet.</p>
          ) : (
            filteredComments.map((c, i) => (
              <CommentCard key={c.id} comment={c} index={i} isActive={activeCommentId === c.id}
                onActivate={() => {
                  setActiveCommentId(activeCommentId === c.id ? null : c.id);
                  if (isVideo(asset) && c.timestamp_seconds > 0 && videoRef.current) {
                    videoRef.current.currentTime = c.timestamp_seconds;
                  }
                }}
                fmtTs={fmtTs}
                onAccept={() => updateComment(c.id, { resolved: true })}
                onReject={() => updateComment(c.id, { rejected: true })}
                onUndo={() => updateComment(c.id, { resolved: false })}
                onAnnotate={async text => { await updateComment(c.id, { annotation: text }); }}
                onDelete={async () => { await apiFetch(`/comments/${c.id}`, { method: "DELETE" }); await loadData(); }}
                onRoutingToggle={() => updateComment(c.id, { routing: c.routing === "objective" ? "subjective" : "objective" })}
              />
            ))
          )}
        </div>
      </div>

      {/* Pin comment modal */}
      <Modal open={showPinForm} onClose={() => { setShowPinForm(false); setPendingPin(null); }} title="Pin a comment">
        <div style={col(14)}>
          <p style={{ fontSize: 13, color: "var(--gray-11)" }}>Pinned at {pendingPin ? `${(pendingPin.x * 100).toFixed(0)}% x ${(pendingPin.y * 100).toFixed(0)}%` : ""}.</p>
          {!userName && (
            <div style={col(4)}>
              <Label>Your name</Label>
              <Input value={userName} onChange={saveName} placeholder="Type your name" />
            </div>
          )}
          <div style={col(6)}>
            <Label>Routing</Label>
            <div style={row(8)}>
              {(["objective", "subjective"] as const).map(r => (
                <button key={r} onClick={() => setCommentRouting(r)}
                  style={{ flex: 1, border: `1px solid ${commentRouting === r ? (r === "objective" ? "var(--obj-border)" : "var(--sub-border)") : "var(--gray-6)"}`, borderRadius: 6, padding: "5px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", background: commentRouting === r ? (r === "objective" ? "var(--obj-bg)" : "var(--sub-bg)") : "transparent", color: commentRouting === r ? (r === "objective" ? "var(--obj-text)" : "var(--sub-text)") : "var(--gray-9)" }}>
                  {r === "objective" ? "O Objective" : "S Subjective"}
                </button>
              ))}
            </div>
          </div>
          <Textarea value={commentText} onChange={setCommentText} placeholder="Describe the issue..." />
          {commentErr && <ErrMsg msg={commentErr} />}
          <div style={{ ...row(8), justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => { setShowPinForm(false); setPendingPin(null); }}>Cancel</Btn>
            <Btn disabled={posting || !commentText.trim()} onClick={handlePinSubmit}>
              {posting ? "Posting..." : "Post pin"}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
function App() {
  const path = useRouter();
  const assetMatch = path.match(/^\/a\/([^/]+)$/);
  if (assetMatch) return <AssetPage id={assetMatch[1]} />;
  return <Home />;
}

const root = document.getElementById("root")!;
createRoot(root).render(<App />);
