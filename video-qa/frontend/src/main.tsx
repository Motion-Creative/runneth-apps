import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

// ─── ROUTER ───────────────────────────────────────────────────────────────────

// Derive base path from URL so the app works under any route.
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

// ─── API ─────────────────────────────────────────────────────────────────────


async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(e.error || "Request failed");
  }
  return res.json();
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gray-0: #ffffff;
    --gray-2: #f8f8f8;
    --gray-3: #f3f3f3;
    --gray-4: #ededed;
    --gray-6: #e2e2e2;
    --gray-7: #dbdbdb;
    --gray-9: #8f8f8f;
    --gray-11: #6f6f6f;
    --gray-12: #171717;
    --primary-3: #eafad1;
    --primary-9: #c1f14b;
    --primary-11: #627d20;
    --error-9: #e5484d;
    --success-9: #30a46c;
    --font: 'Inter', -apple-system, sans-serif;
    --radius: 10px;
    --radius-card: 16px;
  }

  body {
    font-family: var(--font);
    background: var(--gray-0);
    color: var(--gray-12);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  button, input, textarea, select { font-family: var(--font); }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--gray-6); border-radius: 99px; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
`;

// Inline style helpers
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap });
const col = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap });

// Button variants
function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button", style }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md"; disabled?: boolean; type?: "button" | "submit"; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", borderRadius: "var(--radius)",
    fontSize: size === "sm" ? 12 : 14, padding: size === "sm" ? "4px 10px" : "7px 14px",
    opacity: disabled ? 0.5 : 1, transition: "background 75ms",
    whiteSpace: "nowrap" as const,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: "var(--gray-12)", color: "var(--gray-0)", borderColor: "var(--gray-12)" },
    secondary: { background: "var(--gray-0)",  color: "var(--gray-12)", borderColor: "var(--gray-6)" },
    ghost:     { background: "transparent",    color: "var(--gray-11)", borderColor: "transparent" },
    danger:    { background: "var(--error-9)", color: "#fff",           borderColor: "var(--error-9)" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, required, type = "text", style }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  required?: boolean; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      required={required}
      style={{ width: "100%", padding: "7px 10px", fontSize: 14, border: "1px solid var(--gray-6)",
        borderRadius: "var(--radius)", background: "var(--gray-0)", color: "var(--gray-12)",
        outline: "none", fontFamily: "var(--font)", ...style }}
      onFocus={e => e.target.style.borderColor = "var(--gray-12)"}
      onBlur={e => e.target.style.borderColor = "var(--gray-6)"}
    />
  );
}

function Textarea({ value, onChange, placeholder, style, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--gray-6)",
        borderRadius: "var(--radius)", background: "var(--gray-0)", color: "var(--gray-12)",
        outline: "none", resize: "vertical", minHeight: 72, fontFamily: "var(--font)", lineHeight: 1.5, ...style }}
      onFocus={e => e.target.style.borderColor = "var(--gray-12)"}
      onBlur={e => e.target.style.borderColor = "var(--gray-6)"}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gray-11)" }}>{children}</span>;
}

function Divider() {
  return <div style={{ height: 1, background: "var(--gray-6)", margin: "4px 0" }} />;
}

function Pill({ label, variant }: { label: string; variant: "review" | "rework" | "done" | "runneth" | "human" }) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    review:  { bg: "#FFF8E1", text: "#7C5700", border: "#FFE082" },
    rework:  { bg: "#FFF0F0", text: "#9B1C1C", border: "#FCA5A5" },
    done:    { bg: "#F0FDF4", text: "#166534", border: "#86EFAC" },
    runneth: { bg: "var(--primary-3)", text: "var(--primary-11)", border: "#d0ec9e" },
    human:   { bg: "var(--gray-3)", text: "var(--gray-11)", border: "var(--gray-6)" },
  };
  const c = colors[variant] || colors.human;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 6,
      fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
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

// ─── NAV ─────────────────────────────────────────────────────────────────────

function Nav({ crumbs }: { crumbs?: { label: string; to?: string }[] }) {
  return (
    <nav style={{ borderBottom: "1px solid var(--gray-6)", background: "var(--gray-0)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 52, ...row(12) }}>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", cursor: "pointer", color: "var(--gray-12)" }} onClick={() => go("/")}>
          Video QA
        </span>
        {crumbs?.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{ color: "var(--gray-7)", fontSize: 16 }}>/</span>
            {c.to
              ? <span onClick={() => go(c.to!)} style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-11)", cursor: "pointer" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = "var(--gray-12)"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = "var(--gray-11)"}>
                  {c.label}
                </span>
              : <span style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-12)" }}>{c.label}</span>
            }
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────

function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => apiFetch("/videos").then(d => setVideos(d.videos)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleFile = (f: File) => { setPendingFile(f); setUploadTitle(f.name.replace(/\.[^.]+$/, "")); setShowUpload(true); };

  const upload = async () => {
    if (!pendingFile) return;
    setUploading(true); setProgress(0); setErr("");
    try {
      const duration = await new Promise<number | null>(res => {
        const url = URL.createObjectURL(pendingFile);
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => { URL.revokeObjectURL(url); res(v.duration || null); };
        v.onerror = () => { URL.revokeObjectURL(url); res(null); };
        v.src = url;
      });
      const cr = await apiFetch("/videos", { method: "POST", body: JSON.stringify({ title: uploadTitle || pendingFile.name, contentType: pendingFile.type || "video/mp4", fileName: pendingFile.name, fileSize: pendingFile.size, duration }) });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", `${API}/videos/${cr.video.id}/upload`);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100)); };
        xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error("Upload failed"));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(pendingFile);
      });
      setShowUpload(false); setPendingFile(null); load();
    } catch (e: any) { setErr(e.message); }
    finally { setUploading(false); setProgress(0); }
  };

  const fmt = (s: number | null) => { if (!s) return ""; return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`; };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-0)" }}>
      <style>{css}</style>
      <Nav />
      <input type="file" ref={fileRef} style={{ display: "none" }} accept="video/*" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>Videos</h1>
            <p style={{ fontSize: 13, color: "var(--gray-11)" }}>Upload and review video creatives.</p>
          </div>
          <Btn onClick={() => fileRef.current?.click()}>Upload video</Btn>
        </div>

        {loading ? <Spinner /> : videos.length === 0 ? (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            style={{ border: `1.5px dashed ${dragOver ? "var(--gray-12)" : "var(--gray-6)"}`, borderRadius: "var(--radius-card)", padding: "64px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "var(--gray-3)" : "var(--gray-2)", transition: "all 75ms" }}>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drop a video here</p>
            <p style={{ fontSize: 13, color: "var(--gray-11)" }}>or click to browse — MP4, MOV, WebM</p>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}>
            {dragOver && (
              <div style={{ border: "1.5px dashed var(--gray-12)", borderRadius: "var(--radius-card)", padding: "20px 24px", textAlign: "center", marginBottom: 16, background: "var(--gray-3)", fontSize: 13, fontWeight: 500 }}>
                Drop to upload
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {videos.map(v => (
                <div key={v.id} onClick={() => go(`/v/${v.id}`)} style={{ border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", overflow: "hidden", cursor: "pointer", background: "var(--gray-0)", transition: "border-color 75ms", animation: "fadeUp 0.2s ease" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-9)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-6)"}>
                  <div style={{ background: "var(--gray-12)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <polygon points="5,3 19,12 5,21" fill="rgba(255,255,255,0.25)" />
                    </svg>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ ...row(8), justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 500, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</span>
                      <Pill label={v.workflow_status} variant={v.workflow_status as any} />
                    </div>
                    <div style={{ ...row(12), color: "var(--gray-11)", fontSize: 12 }}>
                      {v.uploader_name && <span>{v.uploader_name}</span>}
                      {v.duration && <span>{fmt(v.duration)}</span>}
                      {v.file_size && <span>{(v.file_size / 1024 / 1024).toFixed(1)} MB</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showUpload} onClose={() => { if (!uploading) { setShowUpload(false); setPendingFile(null); } }} title="Upload video">
        <div style={col(14)}>
          {pendingFile && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius)", background: "var(--gray-3)", fontSize: 13, color: "var(--gray-11)" }}>
              {pendingFile.name} — {(pendingFile.size / 1024 / 1024).toFixed(1)} MB
            </div>
          )}
          <div style={col(6)}>
            <Label>Title</Label>
            <Input value={uploadTitle} onChange={setUploadTitle} placeholder="Video title" />
          </div>
          {err && <ErrMsg msg={err} />}
          {uploading ? (
            <div style={col(6)}>
              <div style={{ ...row(0), justifyContent: "space-between" }}>
                <Label>Uploading</Label>
                <Label>{progress}%</Label>
              </div>
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

// ─── VIDEO PAGE ───────────────────────────────────────────────────────────────

// ─── COMMENT CARD ────────────────────────────────────────────────────────────

function CommentCard({ comment: c, onJump, onAccept, onReject, onAnnotate, onDelete, fmt }: {
  comment: any;
  onJump: () => void;
  onAccept: () => void;
  onReject: () => void;
  onAnnotate: (text: string) => Promise<void>;
  onDelete: () => void;
  fmt: (s: number) => string;
}) {
  const isRunneth = c.source === "runneth";
  const isAccepted = isRunneth && c.resolved;
  const isRejected = isRunneth && c.rejected;
  const isReviewed = isAccepted || isRejected;
  const [annotating, setAnnotating] = useState(false);
  const [annotationDraft, setAnnotationDraft] = useState(c.annotation || "");
  const [annotationSaving, setAnnotationSaving] = useState(false);
  const [annotationErr, setAnnotationErr] = useState("");

  // Sync draft if annotation prop changes (after parent refresh)
  useEffect(() => { if (!annotating) setAnnotationDraft(c.annotation || ""); }, [c.annotation, annotating]);

  // Card border + background based on state
  const cardStyle: React.CSSProperties = {
    border: `1px solid ${
      isAccepted ? "#86EFAC" :
      isRejected ? "#FCA5A5" :
      isRunneth  ? "#d0ec9e"  : "var(--gray-6)"
    }`,
    borderRadius: "var(--radius)",
    padding: 10,
    background: isAccepted ? "#F0FDF4" : isRejected ? "#FFF0F0" : isRunneth ? "var(--gray-2)" : "var(--gray-0)",
    animation: "fadeUp 0.15s ease",
    opacity: isReviewed ? 0.85 : 1,
  };

  const handleSaveAnnotation = async () => {
    setAnnotationSaving(true); setAnnotationErr("");
    try {
      await onAnnotate(annotationDraft);
      setAnnotating(false);
    } catch (e: any) { setAnnotationErr(e.message); }
    finally { setAnnotationSaving(false); }
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ ...row(6) }}>
          <button onClick={onJump}
            style={{ fontSize: 10, fontWeight: 600, background: "var(--gray-12)", color: "var(--gray-0)", border: "none", borderRadius: 4, padding: "1px 5px", cursor: "pointer", fontFamily: "monospace", flexShrink: 0 }}>
            {fmt(c.timestamp_seconds)}
          </button>
          {/* For Runneth: show pill only. For human: show name only. */}
          {isRunneth
            ? <Pill label={isAccepted ? "Runneth ✔" : isRejected ? "Runneth ×" : "Runneth"} variant="runneth" />
            : <span style={{ fontSize: 12, fontWeight: 600 }}>{c.user_name}</span>
          }
        </div>

        {/* Actions */}
        <div style={row(4)}>
          {isRunneth ? (
            isReviewed ? (
              // Already decided — show undo button
              <button onClick={isAccepted ? onReject : onAccept} title="Change decision"
                style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 6, border: "1px solid var(--gray-6)", background: "transparent", color: "var(--gray-9)", cursor: "pointer" }}>
                Undo
              </button>
            ) : (
              // Not yet reviewed
              <>
                <button onClick={() => { onAccept(); }} title="Accept"
                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--success-9)", background: "var(--success-9)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                  ✓
                </button>
                <button onClick={() => { onReject(); }} title="Reject"
                  style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--error-9)", background: "var(--error-9)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
                  ×
                </button>
              </>
            )
          ) : (
            // Human comment — delete only
            <button onClick={onDelete} title="Delete"
              style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid var(--gray-6)", background: "transparent", color: "var(--gray-9)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Comment text */}
      <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--gray-12)" }}>{c.text}</p>

      {/* Annotation — shown after a decision is made on Runneth comments */}
      {isRunneth && isReviewed && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid " + (isAccepted ? "#86EFAC" : "#FCA5A5") }}>
          {c.annotation && !annotating ? (
            <div style={{ ...row(6), alignItems: "flex-start" }}>
              <p style={{ fontSize: 12, color: "var(--gray-11)", lineHeight: 1.4, flex: 1, fontStyle: "italic" }}>
                "{c.annotation}"
              </p>
              <button onClick={() => { setAnnotationDraft(c.annotation || ""); setAnnotating(true); }}
                style={{ fontSize: 10, color: "var(--gray-9)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Edit</button>
            </div>
          ) : annotating ? (
            <div style={col(6)}>
              <textarea
                autoFocus
                value={annotationDraft}
                onChange={e => setAnnotationDraft(e.target.value)}
                placeholder="Add a note (optional)…"
                style={{ width: "100%", padding: "5px 8px", fontSize: 12, border: "1px solid var(--gray-6)", borderRadius: 6, outline: "none", resize: "none", minHeight: 48, fontFamily: "var(--font)", lineHeight: 1.4, background: "rgba(255,255,255,0.6)" }}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveAnnotation(); }}
              />
              {annotationErr && <p style={{ fontSize: 11, color: "var(--error-9)" }}>{annotationErr}</p>}
              <div style={row(6)}>
                <Btn size="sm" disabled={annotationSaving} onClick={handleSaveAnnotation}>
                  {annotationSaving ? "Saving…" : "Save note"}
                </Btn>
                <Btn variant="ghost" size="sm" onClick={() => setAnnotating(false)}>Cancel</Btn>
              </div>
            </div>
          ) : (
            <button onClick={() => setAnnotating(true)}
              style={{ fontSize: 11, color: "var(--gray-9)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font)" }}>
              + Add a note
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const WF_LABELS: Record<string, string> = { review: "In review", rework: "Needs rework", done: "Done" };

function VideoPage({ id }: { id: string }) {
  const [video, setVideo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [shareLinks, setShareLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commenterName, setCommenterName] = useState(() => sessionStorage.getItem("video_qa_commenter") || "");
  const [commentText, setCommentText] = useState("");
  const [commentErr, setCommentErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [wfStatus, setWfStatus] = useState("review");
  const [showShare, setShowShare] = useState(false);
  const [allowDownload, setAllowDownload] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const load = async () => {
    const [vd, cd, sd] = await Promise.all([apiFetch(`/videos/${id}`), apiFetch(`/videos/${id}/comments`), apiFetch(`/videos/${id}/share-links`)]);
    setVideo(vd.video); setComments(cd.comments); setShareLinks(sd.links); setWfStatus(vd.video.workflow_status); setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const postComment = async () => {
    if (!commentText.trim() || !commenterName.trim()) return;
    sessionStorage.setItem("video_qa_commenter", commenterName);
    setSubmitting(true); setCommentErr("");
    try {
      await apiFetch(`/videos/${id}/comments`, { method: "POST", body: JSON.stringify({ text: commentText, timestamp_seconds: currentTime, user_name: commenterName, source: "human" }) });
      setCommentText("");
      const cd = await apiFetch(`/videos/${id}/comments`); setComments(cd.comments);
    } catch (e: any) { setCommentErr(e.message); }
    finally { setSubmitting(false); }
  };

  const accept = async (cid: string) => {
    await apiFetch(`/comments/${cid}`, { method: "PATCH", body: JSON.stringify({ resolved: true }) });
    const cd = await apiFetch(`/videos/${id}/comments`); setComments(cd.comments);
  };

  const reject = async (cid: string) => {
    await apiFetch(`/comments/${cid}`, { method: "PATCH", body: JSON.stringify({ rejected: true }) });
    const cd = await apiFetch(`/videos/${id}/comments`); setComments(cd.comments);
  };

  const saveAnnotation = async (cid: string, annotation: string) => {
    await apiFetch(`/comments/${cid}`, { method: "PATCH", body: JSON.stringify({ annotation }) });
    const cd = await apiFetch(`/videos/${id}/comments`); setComments(cd.comments);
  };

  const delComment = async (cid: string) => {
    await apiFetch(`/comments/${cid}`, { method: "DELETE" });
    const cd = await apiFetch(`/videos/${id}/comments`); setComments(cd.comments);
  };

  const setStatus = async (s: string) => {
    await apiFetch(`/videos/${id}`, { method: "PATCH", body: JSON.stringify({ workflow_status: s }) }); setWfStatus(s);
  };

  const createShare = async (e: React.FormEvent) => {
    e.preventDefault(); setSharingLoading(true);
    try {
      await apiFetch(`/videos/${id}/share-links`, { method: "POST", body: JSON.stringify({ allow_download: allowDownload }) });
      const sd = await apiFetch(`/videos/${id}/share-links`); setShareLinks(sd.links);
    } finally { setSharingLoading(false); }
  };

  const copy = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${BASE_PATH}/share/${token}`);
    setCopied(token); setTimeout(() => setCopied(""), 2000);
  };

  const jump = (ts: number) => { if (videoRef.current) { videoRef.current.currentTime = ts; videoRef.current.play(); } };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  if (loading) return <><style>{css}</style><Nav /><Spinner /></>;

  const runnethComments = comments.filter(c => c.source === "runneth");
  const accepted = runnethComments.filter(c => c.resolved);
  const rejected = runnethComments.filter(c => c.rejected);
  const unreviewed = runnethComments.filter(c => !c.resolved && !c.rejected);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--gray-0)" }}>
      <style>{css}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--gray-6)", background: "var(--gray-0)", flexShrink: 0, padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 52, ...row(0), justifyContent: "space-between" }}>
          <div style={{ ...row(10), minWidth: 0, flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", cursor: "pointer", flexShrink: 0 }} onClick={() => go("/")}>Video QA</span>
            <span style={{ color: "var(--gray-7)", flexShrink: 0 }}>/</span>
            <span onClick={() => go("/")} style={{ fontSize: 13, fontWeight: 500, color: "var(--gray-11)", cursor: "pointer", flexShrink: 0 }}>Videos</span>
            <span style={{ color: "var(--gray-7)", flexShrink: 0 }}>/</span>
            <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{video?.title}</span>
          </div>
          <div style={{ ...row(8), flexShrink: 0, marginLeft: 16 }}>
            <Pill label={WF_LABELS[wfStatus] || wfStatus} variant={wfStatus as any} />
            <div style={{ ...row(4) }}>
              {(["review", "rework", "done"] as const).map(s => (
                <Btn key={s} variant={wfStatus === s ? "primary" : "secondary"} size="sm" onClick={() => setStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Btn>
              ))}
            </div>
            <Btn variant="secondary" size="sm" onClick={() => setShowShare(true)}>Share</Btn>
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", flex: 1, minHeight: 0 }}>

        {/* Video */}
        <div style={{ background: "#000", position: "relative", overflow: "hidden" }}>
          <video
            ref={videoRef}
            controls
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            src={`${API}/videos/${id}/stream`}
            onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
          />
          {video?.duration && comments.map(c => (
            <div key={c.id} onClick={() => jump(c.timestamp_seconds)} title={`${fmt(c.timestamp_seconds)}: ${c.text}`}
              style={{ position: "absolute", bottom: 52, left: `${Math.min(97, (c.timestamp_seconds / video.duration) * 100)}%`, transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: c.resolved ? "var(--success-9)" : c.source === "runneth" ? "var(--primary-11)" : "#ef4444", border: "1.5px solid rgba(255,255,255,0.8)", cursor: "pointer", zIndex: 10 }} />
          ))}
        </div>

        {/* Sidebar */}
        <div style={{ borderLeft: "1px solid var(--gray-6)", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--gray-0)" }}>

          {/* Comment input */}
          <div style={{ padding: 14, borderBottom: "1px solid var(--gray-6)", flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-9)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Comment at {fmt(currentTime)}
            </p>
            <div style={col(8)}>
              <Input value={commenterName} onChange={setCommenterName} placeholder="Your name" />
              <Textarea value={commentText} onChange={setCommentText} placeholder="Your feedback… (Ctrl+Enter to post)"
                style={{ minHeight: 60 }}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) postComment(); }}
              />
              {commentErr && <ErrMsg msg={commentErr} />}
              <Btn disabled={submitting || !commentText.trim() || !commenterName.trim()} onClick={postComment} style={{ alignSelf: "flex-start" }}>
                {submitting ? "Posting…" : `Post at ${fmt(currentTime)}`}
              </Btn>
            </div>
          </div>

          {/* Comment list */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12, ...col(8) }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "var(--gray-9)" }}>
                <p style={{ fontSize: 13 }}>No comments yet.</p>
              </div>
            ) : comments.map(c => (
              <CommentCard key={c.id} comment={c}
                onJump={() => jump(c.timestamp_seconds)}
                onAccept={() => accept(c.id)}
                onReject={() => reject(c.id)}
                onAnnotate={(text) => saveAnnotation(c.id, text)}
                onDelete={() => delComment(c.id)}
                fmt={fmt}
              />
            ))}
          </div>

          {/* Footer stats */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid var(--gray-6)", background: "var(--gray-3)", flexShrink: 0, ...row(12) }}>
            <span style={{ fontSize: 12, color: "var(--gray-11)" }}>{unreviewed.length} to review</span>
            <span style={{ fontSize: 12, color: "var(--success-9)", fontWeight: 500 }}>{accepted.length} accepted</span>
            <span style={{ fontSize: 12, color: "var(--error-9)", fontWeight: 500 }}>{rejected.length} rejected</span>
            {video?.duration && <span style={{ fontSize: 12, color: "var(--gray-11)", marginLeft: "auto" }}>{fmt(video.duration)}</span>}
          </div>
        </div>
      </div>

      {/* Share modal */}
      <Modal open={showShare} onClose={() => setShowShare(false)} title="Share video">
        <div style={col(16)}>
          {shareLinks.length > 0 && (
            <div style={col(8)}>
              <Label>Active links</Label>
              {shareLinks.map(link => (
                <div key={link.id} style={{ ...row(8), padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--gray-6)", background: "var(--gray-3)" }}>
                  <span style={{ flex: 1, fontFamily: "monospace", fontSize: 11, color: "var(--gray-11)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    /share/{link.token.slice(0, 12)}…
                  </span>
                  <span style={{ fontSize: 11, color: "var(--gray-9)", flexShrink: 0 }}>{link.view_count}v</span>
                  <Btn variant="secondary" size="sm" onClick={() => copy(link.token)}>{copied === link.token ? "Copied!" : "Copy"}</Btn>
                  <Btn variant="danger" size="sm" onClick={async () => { await apiFetch(`/share-links/${link.id}`, { method: "DELETE" }); const sd = await apiFetch(`/videos/${id}/share-links`); setShareLinks(sd.links); }}>✕</Btn>
                </div>
              ))}
              <Divider />
            </div>
          )}
          <form onSubmit={createShare} style={col(12)}>
            <label style={{ ...row(8), cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={allowDownload} onChange={e => setAllowDownload(e.target.checked)} style={{ accentColor: "var(--gray-12)" }} />
              Allow download
            </label>
            <Btn type="submit" disabled={sharingLoading}>
              {sharingLoading ? "Creating…" : shareLinks.length ? "Create another link" : "Create share link"}
            </Btn>
          </form>
        </div>
      </Modal>
    </div>
  );
}

// ─── SHARE PAGE ───────────────────────────────────────────────────────────────

function SharePage({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guestName, setGuestName] = useState(() => sessionStorage.getItem("video_qa_commenter") || "");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch(`${API}/share/${token}`)
      .then(async r => { if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Failed"); } return r.json(); })
      .then(async d => { setData(d); const cd = await fetch(`${API}/videos/${d.video.id}/comments`).then(r => r.json()); setComments(cd.comments || []); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const postComment = async () => {
    if (!commentText.trim() || !guestName.trim()) return;
    sessionStorage.setItem("video_qa_commenter", guestName);
    setSubmitting(true);
    try {
      await fetch(`${API}/videos/${data.video.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: commentText, timestamp_seconds: currentTime, user_name: guestName, source: "human" }) });
      setCommentText("");
      const cd = await fetch(`${API}/videos/${data.video.id}/comments`).then(r => r.json());
      setComments(cd.comments || []);
    } finally { setSubmitting(false); }
  };

  const jump = (ts: number) => { if (videoRef.current) { videoRef.current.currentTime = ts; videoRef.current.play(); } };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><style>{css}</style><Spinner /></div>;
  if (error || !data) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <style>{css}</style>
      <span style={{ fontWeight: 700, fontSize: 18 }}>Video QA</span>
      <p style={{ color: "var(--gray-11)", fontSize: 14 }}>{error || "Video not found"}</p>
    </div>
  );

  const streamUrl = `${API}/videos/${data.video.id}/stream?token=${token}`;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--gray-12)", color: "var(--gray-0)" }}>
      <style>{css}</style>
      <div style={{ padding: "0 20px", borderBottom: "1px solid #2a2a2a", height: 48, ...row(0), justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>Video QA</span>
        <span style={{ fontSize: 12, color: "#6f6f6f" }}>{data.video.title}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", flex: 1, minHeight: 0 }}>
        <div style={{ background: "#000", display: "flex", flexDirection: "column" }}>
          <video ref={videoRef} controls onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }} style={{ width: "100%", flex: 1, minHeight: 0, objectFit: "contain" }} src={streamUrl} />
          {data.link.allow_download && (
            <div style={{ padding: "8px 16px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
              <a href={streamUrl} download style={{ fontSize: 12, color: "#6f6f6f", textDecoration: "none", fontWeight: 500 }}>↓ Download</a>
            </div>
          )}
        </div>
        <div style={{ borderLeft: "1px solid #2a2a2a", display: "flex", flexDirection: "column", background: "#0f0f0f" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #1e1e1e", flexShrink: 0, ...col(8) }}>
            <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "#555" }}>Comment at {fmt(currentTime)}</p>
            <div style={col(7)}>
              <input style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid #2a2a2a", borderRadius: "var(--radius)", background: "#1a1a1a", color: "#eee", outline: "none", fontFamily: "var(--font)" }} placeholder="Your name" value={guestName} onChange={e => setGuestName(e.target.value)} />
              <textarea style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px solid #2a2a2a", borderRadius: "var(--radius)", background: "#1a1a1a", color: "#eee", outline: "none", resize: "vertical", minHeight: 56, fontFamily: "var(--font)", lineHeight: 1.5 }} placeholder="Feedback…" value={commentText} onChange={e => setCommentText(e.target.value)} />
              <button onClick={postComment} disabled={submitting || !commentText.trim() || !guestName.trim()} style={{ padding: "7px 14px", fontSize: 13, fontWeight: 500, border: "none", borderRadius: "var(--radius)", background: "#c1f14b", color: "#171717", cursor: "pointer", opacity: (submitting || !commentText.trim() || !guestName.trim()) ? 0.5 : 1 }}>
                {submitting ? "Posting…" : `Post at ${fmt(currentTime)}`}
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, ...col(7) }}>
            {comments.length === 0
              ? <p style={{ textAlign: "center", padding: 32, color: "#444", fontSize: 13 }}>No comments yet.</p>
              : comments.map(c => (
                <div key={c.id} style={{ border: "1px solid #2a2a2a", borderRadius: "var(--radius)", padding: 10, background: "#161616", opacity: c.resolved ? 0.5 : 1 }}>
                  <div style={{ ...row(6), marginBottom: 5 }}>
                    <button onClick={() => jump(c.timestamp_seconds)} style={{ fontSize: 9, fontWeight: 700, background: "#2a2a2a", color: "#ccc", border: "none", borderRadius: 4, padding: "1px 5px", cursor: "pointer", fontFamily: "monospace" }}>{fmt(c.timestamp_seconds)}</button>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#ddd" }}>{c.user_name}</span>
                    {c.resolved && <span style={{ fontSize: 9, color: "var(--success-9)", fontWeight: 600 }}>✓ Resolved</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

function App() {
  const path = useRouter();
  const shareMatch = path.match(/^\/share\/([^/]+)$/);
  if (shareMatch) return <SharePage token={shareMatch[1]} />;
  const videoMatch = path.match(/^\/v\/([^/]+)$/);
  if (videoMatch) return <VideoPage id={videoMatch[1]} />;
  return <Home />;
}

createRoot(document.getElementById("root")!).render(<App />);
