import React, { useState, useEffect, useCallback } from "react";
import { createRoot } from "react-dom/client";

// ── Router ────────────────────────────────────────────────────────────────────
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

// ── API ───────────────────────────────────────────────────────────────────────
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

// ── Design tokens ─────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --gray-0: #ffffff; --gray-2: #f8f8f8; --gray-3: #f3f3f3; --gray-4: #ededed;
  --gray-6: #e2e2e2; --gray-7: #dbdbdb; --gray-9: #8f8f8f; --gray-11: #6f6f6f;
  --gray-12: #171717;
  --primary-3: #eafad1; --primary-9: #c1f14b; --primary-11: #627d20;
  --error-9: #e5484d; --success-9: #30a46c;
  --font: 'Inter', -apple-system, sans-serif;
  --radius: 10px; --radius-card: 16px;
}
html, body { height: 100%; }
body { font-family: var(--font); background: var(--gray-0); color: var(--gray-12); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
button, input, textarea, select { font-family: var(--font); }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--gray-6); border-radius: 99px; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

.brief-content { font-size: 13.5px; line-height: 1.7; color: var(--gray-12); }
.brief-content h1 { font-size: 17px; font-weight: 700; margin: 0 0 4px; letter-spacing: -0.02em; }
.brief-content h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gray-9); margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid var(--gray-6); }
.brief-content h3 { font-size: 13px; font-weight: 600; color: var(--gray-12); margin: 16px 0 6px; }
.brief-content p { margin: 0 0 8px; }
.brief-content strong { font-weight: 600; }
.brief-content blockquote { border-left: 3px solid var(--gray-7); margin: 8px 0; padding: 4px 12px; color: var(--gray-11); font-style: italic; background: var(--gray-2); border-radius: 0 6px 6px 0; }
.brief-content ul { padding-left: 20px; margin: 0 0 8px; }
.brief-content li { margin-bottom: 3px; }
.brief-content hr { border: none; border-top: 1px solid var(--gray-6); margin: 20px 0; }
`;

// ── Layout helpers ─────────────────────────────────────────────────────────────
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap });
const col = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap });

// ── Section config ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "overall",      label: "Overall",      color: "#8f8f8f", bg: "#f3f3f3", border: "#e2e2e2" },
  { id: "concept",      label: "Concept",      color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  { id: "hook",         label: "Hook",         color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  { id: "body",         label: "Body",         color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { id: "cta",          label: "CTA",          color: "#166534", bg: "#f0fdf4", border: "#86efac" },
  { id: "visual",       label: "Visual",       color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
  { id: "deliverables", label: "Deliverables", color: "#374151", bg: "#f9fafb", border: "#d1d5db" },
  { id: "guardrails",   label: "Guardrails",   color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

function SectionBadge({ section }: { section: string }) {
  const s = SECTIONS.find(s => s.id === section) || SECTIONS[0];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: "0.03em", background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pending_review: { label: "Pending review", bg: "#FFF8E1", text: "#7C5700",  border: "#FFE082" },
    approved:       { label: "Approved",       bg: "#F0FDF4", text: "#166534",  border: "#86EFAC" },
    rejected:       { label: "Rejected",       bg: "#FFF0F0", text: "#9B1C1C",  border: "#FCA5A5" },
  };
  const c = map[status] || map.pending_review;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", size = "md", disabled, style }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md";
  disabled?: boolean; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", border: "1px solid transparent",
    borderRadius: "var(--radius)", fontSize: size === "sm" ? 12 : 14,
    padding: size === "sm" ? "4px 10px" : "7px 14px",
    opacity: disabled ? 0.5 : 1, transition: "background 75ms", whiteSpace: "nowrap" as const,
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: "var(--gray-12)", color: "var(--gray-0)", borderColor: "var(--gray-12)" },
    secondary: { background: "var(--gray-0)",  color: "var(--gray-12)", borderColor: "var(--gray-6)" },
    ghost:     { background: "transparent",    color: "var(--gray-11)", borderColor: "transparent" },
    danger:    { background: "var(--error-9)", color: "#fff",           borderColor: "var(--error-9)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Textarea({ value, onChange, placeholder, style, onKeyDown }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  style?: React.CSSProperties; onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      onKeyDown={onKeyDown}
      style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--gray-6)", borderRadius: "var(--radius)", background: "var(--gray-0)", color: "var(--gray-12)", outline: "none", resize: "vertical", minHeight: 72, fontFamily: "var(--font)", lineHeight: 1.5, ...style }}
      onFocus={e => e.target.style.borderColor = "var(--gray-12)"}
      onBlur={e => e.target.style.borderColor = "var(--gray-6)"} />
  );
}

function Input({ value, onChange, placeholder, style }: {
  value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties;
}) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: "1px solid var(--gray-6)", borderRadius: "var(--radius)", background: "var(--gray-0)", color: "var(--gray-12)", outline: "none", fontFamily: "var(--font)", ...style }}
      onFocus={e => e.target.style.borderColor = "var(--gray-12)"}
      onBlur={e => e.target.style.borderColor = "var(--gray-6)"} />
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

function Modal({ open, onClose, title, children, width = 480 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number;
}) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "var(--gray-0)", borderRadius: "var(--radius-card)", border: "1px solid var(--gray-6)", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", width: "100%", maxWidth: width, padding: 24, animation: "fadeUp 0.15s ease", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ ...row(0), justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          <Btn variant="ghost" size="sm" onClick={onClose} style={{ padding: "4px 8px", fontSize: 16, color: "var(--gray-9)" }}>✕</Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderBrief(md: string): React.ReactNode {
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  const inlineFormat = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={idx}>{p.slice(2, -2)}</strong>;
      return p;
    });
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# "))       nodes.push(<h1 key={key++}>{inlineFormat(line.slice(2))}</h1>);
    else if (line.startsWith("## ")) nodes.push(<h2 key={key++}>{inlineFormat(line.slice(3))}</h2>);
    else if (line.startsWith("### "))nodes.push(<h3 key={key++}>{inlineFormat(line.slice(4))}</h3>);
    else if (line.startsWith("> "))  nodes.push(<blockquote key={key++}><p>{inlineFormat(line.slice(2))}</p></blockquote>);
    else if (line.match(/^[-*] /)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(<li key={i}>{inlineFormat(lines[i].slice(2))}</li>);
        i++;
      }
      nodes.push(<ul key={key++}>{items}</ul>);
      continue;
    }
    else if (line.trim() === "---" || line.trim() === "***") nodes.push(<hr key={key++} />);
    else if (line.trim() !== "") nodes.push(<p key={key++}>{inlineFormat(line)}</p>);
    i++;
  }

  return <div className="brief-content">{nodes}</div>;
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ crumbs }: { crumbs?: { label: string; to?: string }[] }) {
  return (
    <nav style={{ borderBottom: "1px solid var(--gray-6)", background: "var(--gray-0)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px", height: 52, ...row(12) }}>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em", cursor: "pointer" }} onClick={() => go("/")}>
          Brief QA
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

// ── Config banner ─────────────────────────────────────────────────────────────
function ConfigBanner({ config }: { config: Record<string, any> }) {
  if (!config.onboarding_complete) {
    return (
      <div style={{ background: "var(--gray-3)", border: "1px solid var(--gray-6)", borderRadius: "var(--radius)", padding: "10px 16px", ...row(10), fontSize: 13, color: "var(--gray-11)" }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <span>Tell Runneth <em>"Set up Brief QA"</em> to add your QA criteria.</span>
      </div>
    );
  }
  const hasRubric = !!config.qa_rubric;
  return (
    <div style={{ background: "var(--primary-3)", border: "1px solid #d0ec9e", borderRadius: "var(--radius)", padding: "8px 14px", ...row(10), fontSize: 12 }}>
      <span style={{ fontWeight: 600, color: "var(--primary-11)" }}>QA active</span>
      <span style={{ background: "var(--gray-0)", border: "1px solid #d0ec9e", color: "var(--primary-11)", padding: "1px 8px", borderRadius: 5, fontSize: 11, fontWeight: 500 }}>
        {hasRubric ? "Custom rubric" : "Default rubric"}
      </span>
      <span style={{ marginLeft: "auto", color: "var(--primary-11)", fontSize: 11 }}>
        Tell Runneth "update Brief QA criteria" to change
      </span>
    </div>
  );
}

// ── Comment card ──────────────────────────────────────────────────────────────
function CommentCard({ comment: c, onAccept, onReject, onUndo, onAnnotate, onDelete }: {
  comment: any;
  onAccept: () => void; onReject: () => void; onUndo: () => void;
  onAnnotate: (text: string) => Promise<void>; onDelete: () => void;
}) {
  const isRunneth = c.source === "runneth";
  const isAccepted = isRunneth && c.resolved === 1;
  const isRejected = isRunneth && c.rejected === 1;
  const isReviewed = isAccepted || isRejected;
  const [annotating, setAnnotating] = useState(false);
  const [annotationDraft, setAnnotationDraft] = useState(c.annotation || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (!annotating) setAnnotationDraft(c.annotation || ""); }, [c.annotation, annotating]);

  return (
    <div style={{
      border: `1px solid ${isAccepted ? "#86EFAC" : isRejected ? "#FCA5A5" : isRunneth ? "#d0ec9e" : "var(--gray-6)"}`,
      borderRadius: "var(--radius)", padding: 10,
      background: isAccepted ? "#F0FDF4" : isRejected ? "#FFF0F0" : isRunneth ? "var(--gray-2)" : "var(--gray-0)",
      animation: "fadeUp 0.15s ease",
    }}>
      <div style={{ ...row(6), marginBottom: 6, flexWrap: "wrap" as const }}>
        {isRunneth
          ? <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--primary-3)", color: "var(--primary-11)", border: "1px solid #d0ec9e" }}>Runneth</span>
          : <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: "var(--gray-3)", color: "var(--gray-11)", border: "1px solid var(--gray-6)" }}>{c.user_name}</span>
        }
        <SectionBadge section={c.section || "overall"} />
        {isAccepted && <span style={{ fontSize: 11, fontWeight: 600, color: "#166534", background: "#F0FDF4", border: "1px solid #86EFAC", padding: "1px 7px", borderRadius: 6 }}>Accepted</span>}
        {isRejected && <span style={{ fontSize: 11, fontWeight: 600, color: "#9B1C1C", background: "#FFF0F0", border: "1px solid #FCA5A5", padding: "1px 7px", borderRadius: 6 }}>Rejected</span>}
        <span style={{ fontSize: 11, color: "var(--gray-9)", marginLeft: "auto" }}>
          {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
      <p style={{ fontSize: 13, lineHeight: 1.55 }}>{c.text}</p>
      {c.annotation && !annotating && (
        <div style={{ marginTop: 6, padding: "6px 8px", background: "var(--gray-3)", borderRadius: "var(--radius)", fontSize: 12, color: "var(--gray-11)", fontStyle: "italic" }}>
          "{c.annotation}"
        </div>
      )}
      {isRunneth && !isReviewed && (
        <div style={{ ...row(6), marginTop: 8 }}>
          <Btn size="sm" variant="secondary" onClick={onAccept}>Accept</Btn>
          <Btn size="sm" variant="secondary" onClick={onReject}>Reject</Btn>
          <Btn size="sm" variant="ghost" onClick={() => setAnnotating(true)}>Note</Btn>
        </div>
      )}
      {isRunneth && isReviewed && (
        <div style={{ ...row(6), marginTop: 8 }}>
          <Btn size="sm" variant="ghost" onClick={onUndo}>Undo</Btn>
          {!annotating && <Btn size="sm" variant="ghost" onClick={() => setAnnotating(true)}>{c.annotation ? "Edit note" : "Add note"}</Btn>}
        </div>
      )}
      {annotating && (
        <div style={{ ...col(6), marginTop: 8 }}>
          <Textarea value={annotationDraft} onChange={setAnnotationDraft} placeholder="Add a note on this feedback..." style={{ minHeight: 56 }} />
          {err && <ErrMsg msg={err} />}
          <div style={row(6)}>
            <Btn size="sm" variant="secondary" disabled={saving} onClick={async () => {
              setSaving(true); setErr("");
              try { await onAnnotate(annotationDraft); setAnnotating(false); }
              catch (e: any) { setErr(e.message); }
              finally { setSaving(false); }
            }}>{saving ? "Saving..." : "Save"}</Btn>
            <Btn size="sm" variant="ghost" onClick={() => { setAnnotating(false); setAnnotationDraft(c.annotation || ""); }}>Cancel</Btn>
          </div>
        </div>
      )}
      <div style={{ marginTop: 8, textAlign: "right" }}>
        <button onClick={onDelete} style={{ border: "none", background: "transparent", fontSize: 11, color: "var(--error-9)", cursor: "pointer", padding: 0 }}>Delete</button>
      </div>
    </div>
  );
}

// ── Brief list card ───────────────────────────────────────────────────────────
function BriefCard({ brief: b, onDelete }: { brief: any; onDelete: () => Promise<void> }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rCount = Number(b.runneth_count || 0);
  const uCount = Number(b.unreviewed_count || 0);
  const aCount = Number(b.accepted_count || 0);
  const meta = b.metadata ? (() => { try { return JSON.parse(b.metadata); } catch { return {}; } })() : {};

  return (
    <>
      <div onClick={() => go(`/b/${b.id}`)}
        style={{ border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", padding: 16, cursor: "pointer", background: "var(--gray-0)", transition: "border-color 75ms", animation: "fadeUp 0.2s ease", opacity: deleting ? 0.55 : 1 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-9)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "var(--gray-6)"}
      >
        <div style={{ ...row(8), justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={col(4)}>
            <span style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>{b.title}</span>
            {b.brand_name && <span style={{ fontSize: 12, color: "var(--gray-11)" }}>{b.brand_name}</span>}
          </div>
          <button onClick={e => { e.stopPropagation(); setConfirm(true); }} disabled={deleting}
            style={{ border: "none", background: "transparent", color: "var(--gray-9)", cursor: "pointer", fontSize: 12, padding: "0 2px", flexShrink: 0 }}>
            {deleting ? "..." : "Delete"}
          </button>
        </div>
        <div style={{ ...row(6), flexWrap: "wrap" as const, marginBottom: 10 }}>
          <StatusPill status={b.workflow_status} />
          {meta.awareness_stage && <span style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-11)", background: "var(--gray-3)", border: "1px solid var(--gray-6)", padding: "1px 7px", borderRadius: 5 }}>{meta.awareness_stage}</span>}
          {meta.format && <span style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-11)", background: "var(--gray-3)", border: "1px solid var(--gray-6)", padding: "1px 7px", borderRadius: 5 }}>{meta.format}</span>}
        </div>
        {b.goal && <p style={{ fontSize: 12, color: "var(--gray-11)", marginBottom: 10 }}>{b.goal}</p>}
        <div style={{ ...row(12), fontSize: 11, color: "var(--gray-9)" }}>
          {rCount > 0 ? (
            <>
              <span>{rCount} AI {rCount === 1 ? "note" : "notes"}</span>
              {uCount > 0 && <span style={{ color: "#b45309", fontWeight: 600 }}>{uCount} unreviewed</span>}
              {aCount > 0 && <span style={{ color: "#166534" }}>{aCount} accepted</span>}
            </>
          ) : <span>No QA yet</span>}
          <span style={{ marginLeft: "auto" }}>{new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>
      </div>

      <Modal open={confirm} onClose={() => !deleting && setConfirm(false)} title="Delete brief?">
        <div style={col(16)}>
          <p style={{ color: "var(--gray-11)", fontSize: 13 }}>This will permanently delete "{b.title}" and all its comments.</p>
          <div style={{ ...row(8), justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setConfirm(false)} disabled={deleting}>Cancel</Btn>
            <Btn variant="danger" disabled={deleting} onClick={async () => {
              setDeleting(true);
              try { await onDelete(); setConfirm(false); }
              catch { setDeleting(false); }
            }}>{deleting ? "Deleting..." : "Delete brief"}</Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
function Home() {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending_review" | "approved" | "rejected">("all");

  const load = async () => {
    const [briefRes, configRes] = await Promise.all([
      apiFetch("/briefs"),
      apiFetch("/config").catch(() => ({ config: {} })),
    ]);
    setBriefs(briefRes.briefs);
    setConfig(configRes.config || {});
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? briefs : briefs.filter(b => b.workflow_status === filter);
  const counts = {
    all:            briefs.length,
    pending_review: briefs.filter(b => b.workflow_status === "pending_review").length,
    approved:       briefs.filter(b => b.workflow_status === "approved").length,
    rejected:       briefs.filter(b => b.workflow_status === "rejected").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-0)" }}>
      <style>{css}</style>
      <Nav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ ...col(16), marginBottom: 24 }}>
          <div style={{ ...row(0), justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 2 }}>Briefs</h1>
              <p style={{ fontSize: 13, color: "var(--gray-11)" }}>
                Ask Runneth to generate and QA briefs. Review AI feedback here.
              </p>
            </div>
          </div>
          <ConfigBanner config={config} />
        </div>

        {/* Filter tabs */}
        <div style={{ ...row(4), marginBottom: 20, borderBottom: "1px solid var(--gray-6)" }}>
          {(["all", "pending_review", "approved", "rejected"] as const).map(f => {
            const labels = { all: "All", pending_review: "Pending", approved: "Approved", rejected: "Rejected" };
            const active = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                border: "none", background: "transparent", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? "var(--gray-12)" : "var(--gray-9)",
                padding: "8px 12px", borderBottom: active ? "2px solid var(--gray-12)" : "2px solid transparent",
                marginBottom: -1,
              }}>
                {labels[f]} <span style={{ fontSize: 11, color: "var(--gray-9)" }}>({counts[f]})</span>
              </button>
            );
          })}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ border: "1.5px dashed var(--gray-6)", borderRadius: "var(--radius-card)", padding: "64px 24px", textAlign: "center", background: "var(--gray-2)" }}>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No briefs yet</p>
            <p style={{ fontSize: 13, color: "var(--gray-11)" }}>
              Ask Runneth: <em>"Generate a brief for [brand/product] and save it to Brief QA"</em>
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {filtered.map(b => (
              <BriefCard key={b.id} brief={b} onDelete={async () => {
                await apiFetch(`/briefs/${b.id}`, { method: "DELETE" });
                await load();
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Brief detail ──────────────────────────────────────────────────────────────
function BriefPage({ id }: { id: string }) {
  const [brief, setBrief] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentSection, setCommentSection] = useState<SectionId>("overall");
  const [posting, setPosting] = useState(false);
  const [commentErr, setCommentErr] = useState("");
  const [userName, setUserName] = useState(() => sessionStorage.getItem("bqa_user") || "");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = useCallback(async () => {
    const [bRes, cRes] = await Promise.all([apiFetch(`/briefs/${id}`), apiFetch(`/briefs/${id}/comments`)]);
    setBrief(bRes.brief);
    setComments(cRes.comments);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveName = (n: string) => { setUserName(n); sessionStorage.setItem("bqa_user", n); };

  const postComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true); setCommentErr("");
    try {
      await apiFetch(`/briefs/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: commentText, section: commentSection, user_name: userName || "Anonymous", source: "human" }),
      });
      setCommentText("");
      await loadData();
    } catch (e: any) { setCommentErr(e.message); }
    finally { setPosting(false); }
  };

  const updateComment = async (cid: string, patch: object) => {
    await apiFetch(`/comments/${cid}`, { method: "PATCH", body: JSON.stringify(patch) });
    await loadData();
  };

  const updateStatus = async (status: string) => {
    setUpdatingStatus(true);
    try { await apiFetch(`/briefs/${id}`, { method: "PATCH", body: JSON.stringify({ workflow_status: status }) }); await loadData(); }
    finally { setUpdatingStatus(false); }
  };

  const filteredComments = filterSection === "all" ? comments : comments.filter(c => c.section === filterSection);
  const meta = brief?.metadata ? (() => { try { return JSON.parse(brief.metadata); } catch { return {}; } })() : {};

  if (loading) return <><style>{css}</style><Nav /><Spinner /></>;
  if (!brief) return <><style>{css}</style><Nav crumbs={[{ label: "Not found" }]} /><ErrMsg msg="Brief not found" /></>;

  const rCount = comments.filter(c => c.source === "runneth").length;
  const uCount = comments.filter(c => c.source === "runneth" && !c.resolved && !c.rejected).length;
  const sectionCounts = SECTIONS.reduce((acc, s) => { acc[s.id] = comments.filter(c => c.section === s.id).length; return acc; }, {} as Record<string, number>);

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-0)" }}>
      <style>{css}</style>
      <Nav crumbs={[{ label: "Briefs", to: "/" }, { label: brief.title }]} />

      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px", display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, alignItems: "start" }}>

        {/* Left: brief content */}
        <div style={col(0)}>
          <div style={{ ...row(12), justifyContent: "space-between", flexWrap: "wrap" as const, marginBottom: 20, padding: "14px 16px", border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", background: "var(--gray-2)" }}>
            <div style={col(4)}>
              <StatusPill status={brief.workflow_status} />
              <div style={{ ...row(6), flexWrap: "wrap" as const }}>
                {brief.brand_name && <span style={{ fontSize: 12, color: "var(--gray-11)" }}>{brief.brand_name}</span>}
                {brief.for_context && <span style={{ fontSize: 12, color: "var(--gray-9)" }}>{brief.for_context}</span>}
              </div>
              {(meta.awareness_stage || meta.mechanic || meta.format) && (
                <div style={{ ...row(6), flexWrap: "wrap" as const }}>
                  {meta.awareness_stage && <span style={{ fontSize: 11, color: "var(--gray-11)", background: "var(--gray-3)", border: "1px solid var(--gray-6)", padding: "1px 7px", borderRadius: 5 }}>{meta.awareness_stage}</span>}
                  {meta.mechanic && <span style={{ fontSize: 11, color: "var(--gray-11)", background: "var(--gray-3)", border: "1px solid var(--gray-6)", padding: "1px 7px", borderRadius: 5 }}>{meta.mechanic}</span>}
                  {meta.format && <span style={{ fontSize: 11, color: "var(--gray-11)", background: "var(--gray-3)", border: "1px solid var(--gray-6)", padding: "1px 7px", borderRadius: 5 }}>{meta.format}</span>}
                </div>
              )}
            </div>
            <div style={row(8)}>
              {brief.workflow_status !== "approved" && (
                <Btn size="sm" variant="secondary" disabled={updatingStatus} onClick={() => updateStatus("approved")} style={{ borderColor: "#86EFAC", color: "#166534", background: "#F0FDF4" }}>Approve</Btn>
              )}
              {brief.workflow_status !== "rejected" && (
                <Btn size="sm" variant="secondary" disabled={updatingStatus} onClick={() => updateStatus("rejected")} style={{ borderColor: "#FCA5A5", color: "#9B1C1C", background: "#FFF0F0" }}>Reject</Btn>
              )}
              {brief.workflow_status !== "pending_review" && (
                <Btn size="sm" variant="ghost" disabled={updatingStatus} onClick={() => updateStatus("pending_review")}>Reset</Btn>
              )}
            </div>
          </div>

          <div style={{ border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", padding: "24px 28px" }}>
            {renderBrief(brief.full_brief)}
          </div>

          {rCount > 0 && (
            <div style={{ ...row(12), padding: "10px 16px", border: "1px solid #d0ec9e", borderRadius: "var(--radius-card)", background: "var(--primary-3)", fontSize: 12, color: "var(--primary-11)", marginTop: 16 }}>
              <span style={{ fontWeight: 600 }}>{rCount} Runneth {rCount === 1 ? "note" : "notes"}</span>
              {uCount > 0 && <span>{uCount} awaiting review</span>}
            </div>
          )}
        </div>

        {/* Right: comment thread */}
        <div style={{ ...col(12), position: "sticky", top: 24, maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>
          <div style={{ ...col(0), border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", padding: 12, background: "var(--gray-2)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-9)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Filter by section</span>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
              <button onClick={() => setFilterSection("all")} style={{ border: `1px solid ${filterSection === "all" ? "var(--gray-12)" : "var(--gray-6)"}`, background: filterSection === "all" ? "var(--gray-12)" : "transparent", color: filterSection === "all" ? "var(--gray-0)" : "var(--gray-11)", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 5, cursor: "pointer" }}>
                All ({comments.length})
              </button>
              {SECTIONS.filter(s => (sectionCounts[s.id] || 0) > 0).map(s => (
                <button key={s.id} onClick={() => setFilterSection(s.id)} style={{ border: `1px solid ${filterSection === s.id ? s.color : s.border}`, background: filterSection === s.id ? s.bg : "transparent", color: filterSection === s.id ? s.color : "var(--gray-11)", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 5, cursor: "pointer" }}>
                  {s.label} ({sectionCounts[s.id]})
                </button>
              ))}
            </div>
          </div>

          {filteredComments.length === 0
            ? <p style={{ fontSize: 13, color: "var(--gray-9)", textAlign: "center", padding: "24px 0" }}>{comments.length === 0 ? "No feedback yet." : "No comments in this section."}</p>
            : filteredComments.map(c => (
                <CommentCard key={c.id} comment={c}
                  onAccept={() => updateComment(c.id, { resolved: true })}
                  onReject={() => updateComment(c.id, { rejected: true })}
                  onUndo={() => updateComment(c.id, { resolved: false })}
                  onAnnotate={async text => { await updateComment(c.id, { annotation: text }); }}
                  onDelete={async () => { await apiFetch(`/comments/${c.id}`, { method: "DELETE" }); await loadData(); }}
                />
              ))
          }

          <div style={{ border: "1px solid var(--gray-6)", borderRadius: "var(--radius-card)", padding: 14, ...col(10) }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--gray-9)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Add comment</span>
            {!userName && (
              <div style={col(4)}>
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-11)" }}>Your name</span>
                <Input value={userName} onChange={saveName} placeholder="Type your name" />
              </div>
            )}
            <div style={col(4)}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "var(--gray-11)" }}>Section</span>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                {SECTIONS.map(s => (
                  <button key={s.id} onClick={() => setCommentSection(s.id as SectionId)} style={{ border: `1px solid ${commentSection === s.id ? s.color : s.border}`, background: commentSection === s.id ? s.bg : "transparent", color: commentSection === s.id ? s.color : "var(--gray-11)", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 5, cursor: "pointer" }}>{s.label}</button>
                ))}
              </div>
            </div>
            <Textarea value={commentText} onChange={setCommentText} placeholder="Leave a comment..." onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postComment(); }} />
            {commentErr && <ErrMsg msg={commentErr} />}
            <Btn disabled={posting || !commentText.trim()} onClick={postComment}>{posting ? "Posting..." : "Post comment"}</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App shell ─────────────────────────────────────────────────────────────────
function App() {
  const path = useRouter();
  const match = path.match(/^\/b\/([^/]+)$/);
  if (match) return <BriefPage id={match[1]} />;
  return <Home />;
}

const root = document.getElementById("root")!;
createRoot(root).render(<App />);
