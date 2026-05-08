// authenticate-apps · Fastify auth plugin
//
// Adds a self-bootstrapping login layer to a sandbox app:
//   • First request when no credentials file exists routes to /setup, where
//     the user picks a username + password in their browser. The password is
//     hashed with scrypt and a random cookie-signing secret is generated.
//   • From then on, every request outside the allow-list is gated behind
//     /login, validating against the stored hash. Sessions are 30-day
//     HMAC-signed cookies using the stored cookieSecret (decoupled from the
//     password so rotation does not have to invalidate sessions).
//   • Both /setup and /login forms POST as JSON via inline fetch, because the
//     gateway's Fastify only parses application/json by default and rejects
//     application/x-www-form-urlencoded with FST_ERR_CTP_INVALID_MEDIA_TYPE.
//
// Zero external dependencies beyond Node built-ins and Fastify.
//
// Usage (server/src/index.ts):
//
//   const authPlugin = (await import('../auth.mjs')).default
//   await server.register(authPlugin, {
//     basePath: '/your-app-route',                 // from buildeth.app.json `route`
//     credentialsPath: `${process.env.BUILDETH_APP_ROOT}/.auth/credentials.json`,
//     appLabel: 'Your app',                        // shown in the setup/login UI
//     cookieName: 'your_app_session',              // optional; defaults to auth_session
//     allowPaths: ['/api/health'],                 // optional; uptime probes etc.
//   })

import { timingSafeEqual, createHmac, randomBytes, scryptSync } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";

const MAX_AGE_MS = 30 * 24 * 3600 * 1000;
const SCRYPT_KEYLEN = 64;

function resolveConfig(opts = {}) {
  const basePath = String(opts.basePath ?? process.env.AUTH_BASE_PATH ?? "").replace(/\/$/, "");
  const credentialsPath =
    opts.credentialsPath ??
    process.env.AUTH_CREDENTIALS_PATH ??
    defaultCredentialsPath();
  if (!credentialsPath) {
    throw new Error(
      "authenticate-apps: provide options.credentialsPath, or set AUTH_CREDENTIALS_PATH or BUILDETH_APP_ROOT.",
    );
  }
  return {
    basePath,
    credentialsPath,
    appLabel: String(opts.appLabel ?? "App"),
    cookieName: String(opts.cookieName ?? "auth_session"),
    allowPaths: Array.isArray(opts.allowPaths) ? opts.allowPaths.slice() : ["/api/health"],
  };
}

function defaultCredentialsPath() {
  const root = process.env.BUILDETH_APP_ROOT;
  return root ? `${root}/.auth/credentials.json` : null;
}

// ----- credential file I/O ------------------------------------------------

let credsCache = { data: null, mtimeMs: 0, path: null };
function loadCredentials(config) {
  const path = config.credentialsPath;
  try {
    if (!existsSync(path)) {
      credsCache = { data: null, mtimeMs: 0, path };
      return null;
    }
    const stat = statSync(path);
    if (credsCache.data && credsCache.path === path && stat.mtimeMs === credsCache.mtimeMs) {
      return credsCache.data;
    }
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    if (
      typeof parsed?.user !== "string" ||
      typeof parsed?.passwordHash !== "string" ||
      typeof parsed?.salt !== "string" ||
      typeof parsed?.cookieSecret !== "string"
    ) {
      console.warn("authenticate-apps: credentials file present but malformed");
      return null;
    }
    credsCache = { data: parsed, mtimeMs: stat.mtimeMs, path };
    return parsed;
  } catch (e) {
    console.warn("authenticate-apps: failed to read credentials:", e.message);
    return null;
  }
}

function writeCredentials(config, { user, password }) {
  const path = config.credentialsPath;
  mkdirSync(dirname(path), { recursive: true });
  const salt = randomBytes(16).toString("hex");
  const passwordHash = scryptSync(String(password), salt, SCRYPT_KEYLEN).toString("hex");
  const cookieSecret = randomBytes(32).toString("hex");
  const payload = {
    user: String(user),
    passwordHash,
    salt,
    cookieSecret,
    createdAt: new Date().toISOString(),
  };
  writeFileSync(path, JSON.stringify(payload, null, 2), { mode: 0o600 });
  credsCache = { data: payload, mtimeMs: statSync(path).mtimeMs, path };
  return payload;
}

function verifyPassword(creds, submitted) {
  try {
    const computed = scryptSync(String(submitted), creds.salt, SCRYPT_KEYLEN);
    const stored = Buffer.from(creds.passwordHash, "hex");
    if (computed.length !== stored.length) return false;
    return timingSafeEqual(computed, stored);
  } catch {
    return false;
  }
}

function safeStringEqual(a, b) {
  const ba = Buffer.from(String(a ?? ""));
  const bb = Buffer.from(String(b ?? ""));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// ----- cookies & tokens ---------------------------------------------------

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function sign(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function makeToken(secret) {
  const ts = Date.now().toString();
  return `${ts}.${sign(ts, secret)}`;
}

function verifyToken(token, secret) {
  if (!token || typeof token !== "string") return false;
  const [ts, sig] = token.split(".");
  if (!ts || !sig) return false;
  const expectedSig = sign(ts, secret);
  if (sig.length !== expectedSig.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return false;
  const age = Date.now() - parseInt(ts, 10);
  return !Number.isNaN(age) && age >= 0 && age <= MAX_AGE_MS;
}

function buildSetCookie(name, value, { secure, maxAgeSec }) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

// ----- helpers ------------------------------------------------------------

function basePath(config) {
  return config.basePath || "";
}

function safeNext(raw, fallback) {
  if (typeof raw !== "string" || !raw.startsWith("/")) return fallback;
  return raw;
}

function pathOnly(url) {
  return String(url || "/").split("?")[0];
}

function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const h = req.headers || {};
  return h["x-forwarded-proto"] === "https";
}

function escapeHtml(s) {
  return String(s).replace(/[<>"'&]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "&": "&amp;",
  }[c]));
}

// ----- HTML pages (rendered inline so the package has zero external assets)

function renderShellStyles() {
  return `<style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
    body{background:#0a0a0a;color:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',system-ui,sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
    .card{width:100%;max-width:420px;background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:32px 28px;}
    .title{font-size:20px;font-weight:600;color:#fff;letter-spacing:-0.3px;margin-bottom:6px;}
    .sub{font-size:12px;color:#777;margin-bottom:24px;line-height:1.5;}
    .field{margin-bottom:14px;}
    .label{display:block;font-size:11px;color:#777;text-transform:uppercase;letter-spacing:1px;font-weight:500;margin-bottom:6px;}
    .input{width:100%;background:#0a0a0a;border:1px solid #222;border-radius:6px;padding:10px 12px;font-size:13px;color:#e5e5e5;font-family:inherit;outline:none;}
    .input:focus{border-color:#4d7dff;}
    .submit{width:100%;margin-top:8px;background:#4d7dff;color:#fff;border:0;border-radius:6px;padding:11px 14px;font-size:13px;font-weight:600;cursor:pointer;}
    .submit:hover{background:#3d6def;}
    .err{background:#2a1414;border:1px solid #4a1f1f;color:#d6a3a3;font-size:12px;padding:8px 12px;border-radius:6px;margin-bottom:14px;}
    .footer{margin-top:18px;font-size:11px;color:#444;text-align:center;}
  </style>`;
}

function renderJsonSubmitScript() {
  return `<script>
    (function(){
      var form = document.querySelector('form');
      function showErr(msg){
        var existing = form.querySelector('.err'); if (existing) existing.remove();
        var d = document.createElement('div'); d.className = 'err'; d.textContent = msg;
        var anchor = form.querySelector('.sub') || form.querySelector('.title');
        anchor.after(d);
      }
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        var data = Object.fromEntries(new FormData(form));
        try {
          var res = await fetch(form.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (res.redirected) { window.location.href = res.url; return; }
          if (res.ok) { window.location.href = res.url || form.action; return; }
          var text = await res.text();
          showErr(text || ('Request failed (' + res.status + ').'));
        } catch (err) {
          showErr(String(err && err.message || err));
        }
      });
    })();
  </script>`;
}

function renderSetupPage(config, { error } = {}) {
  const errBlock = error ? `<div class="err">${escapeHtml(error)}</div>` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Set up · ${escapeHtml(config.appLabel)}</title>
${renderShellStyles()}
</head><body>
  <form class="card" method="post" action="${escapeHtml(basePath(config))}/setup" autocomplete="off">
    <div class="title">Set up access</div>
    <div class="sub">First-time setup for <strong>${escapeHtml(config.appLabel)}</strong>. Pick credentials to sign in with. The password is stored hashed on disk and never echoed back.</div>
    ${errBlock}
    <div class="field">
      <label class="label" for="username">Username</label>
      <input class="input" id="username" name="username" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" required autofocus />
    </div>
    <div class="field">
      <label class="label" for="password">Password</label>
      <input class="input" id="password" name="password" type="password" required minlength="8" />
    </div>
    <div class="field">
      <label class="label" for="confirm">Confirm password</label>
      <input class="input" id="confirm" name="confirm" type="password" required minlength="8" />
    </div>
    <button class="submit" type="submit">Save credentials</button>
    <div class="footer">${escapeHtml(config.appLabel)}</div>
  </form>
${renderJsonSubmitScript()}
</body></html>`;
}

function renderLoginPage(config, { error, nextPath } = {}) {
  const errBlock = error ? `<div class="err">${escapeHtml(error)}</div>` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Sign in · ${escapeHtml(config.appLabel)}</title>
${renderShellStyles()}
</head><body>
  <form class="card" method="post" action="${escapeHtml(basePath(config))}/login" autocomplete="on">
    <div class="title">${escapeHtml(config.appLabel)}</div>
    <div class="sub" style="margin-bottom:18px;">&nbsp;</div>
    ${errBlock}
    <div class="field">
      <label class="label" for="username">Username</label>
      <input class="input" id="username" name="username" type="text" autocomplete="username"
             autocapitalize="off" autocorrect="off" spellcheck="false" required autofocus />
    </div>
    <div class="field">
      <label class="label" for="password">Password</label>
      <input class="input" id="password" name="password" type="password"
             autocomplete="current-password" required />
    </div>
    <input type="hidden" name="next" value="${escapeHtml(nextPath || basePath(config) + "/")}" />
    <button class="submit" type="submit">Sign in</button>
    <div class="footer">${escapeHtml(config.appLabel)}</div>
  </form>
${renderJsonSubmitScript()}
</body></html>`;
}

// ----- Fastify plugin -----------------------------------------------------

export default async function authPlugin(fastify, options = {}) {
  const config = resolveConfig(options);
  const bp = basePath(config);

  // Setup routes
  fastify.get("/setup", async (req, reply) => {
    if (loadCredentials(config)) {
      reply.redirect(`${bp}/`, 303);
      return;
    }
    reply.header("content-type", "text/html; charset=utf-8");
    reply.send(renderSetupPage(config));
  });

  fastify.post("/setup", async (req, reply) => {
    if (loadCredentials(config)) {
      reply.redirect(`${bp}/`, 303);
      return;
    }
    const body = req.body || {};
    const user = String(body.username || "").trim();
    const pwd = String(body.password || "");
    const confirm = String(body.confirm || "");
    let error = null;
    if (!user || user.length < 2) error = "Username is required.";
    else if (pwd.length < 8) error = "Password must be at least 8 characters.";
    else if (pwd !== confirm) error = "Passwords do not match.";
    if (error) {
      reply.code(400).header("content-type", "text/html; charset=utf-8");
      reply.send(renderSetupPage(config, { error }));
      return;
    }
    const fresh = writeCredentials(config, { user, password: pwd });
    reply.header(
      "Set-Cookie",
      buildSetCookie(config.cookieName, makeToken(fresh.cookieSecret), {
        secure: isSecureRequest(req),
        maxAgeSec: Math.floor(MAX_AGE_MS / 1000),
      }),
    );
    reply.redirect(`${bp}/`, 303);
  });

  // Login routes
  fastify.get("/login", async (req, reply) => {
    if (!loadCredentials(config)) {
      reply.redirect(`${bp}/setup`, 303);
      return;
    }
    const url = new URL(req.url, "http://placeholder");
    const next = url.searchParams.get("next");
    const errParam = url.searchParams.get("err");
    reply.header("content-type", "text/html; charset=utf-8");
    reply.send(
      renderLoginPage(config, {
        error: errParam ? "Invalid credentials." : null,
        nextPath: safeNext(next, bp + "/"),
      }),
    );
  });

  fastify.post("/login", async (req, reply) => {
    const creds = loadCredentials(config);
    if (!creds) {
      reply.redirect(`${bp}/setup`, 303);
      return;
    }
    const body = req.body || {};
    const submittedUser = String(body.username || "");
    const submittedPwd = String(body.password || "");
    if (safeStringEqual(submittedUser, creds.user) && verifyPassword(creds, submittedPwd)) {
      reply.header(
        "Set-Cookie",
        buildSetCookie(config.cookieName, makeToken(creds.cookieSecret), {
          secure: isSecureRequest(req),
          maxAgeSec: Math.floor(MAX_AGE_MS / 1000),
        }),
      );
      reply.redirect(safeNext(body.next, bp + "/"), 303);
      return;
    }
    reply.redirect(`${bp}/login?err=1`, 303);
  });

  // Logout
  fastify.get("/logout", async (req, reply) => {
    reply.header(
      "Set-Cookie",
      buildSetCookie(config.cookieName, "", {
        secure: isSecureRequest(req),
        maxAgeSec: 0,
      }),
    );
    reply.redirect(`${bp}/login`, 303);
  });

  // Gate everything else
  fastify.addHook("onRequest", async (req, reply) => {
    const path = pathOnly(req.url);

    // Allow health/probe paths and the auth routes themselves.
    if (config.allowPaths.includes(path)) return;
    if (path === "/setup" || path === "/login" || path === "/logout") return;

    const creds = loadCredentials(config);
    if (!creds) {
      reply.redirect(`${bp}/setup`, 303);
      return reply;
    }

    const cookies = parseCookies(req.headers.cookie);
    if (verifyToken(cookies[config.cookieName], creds.cookieSecret)) return;

    if (path.startsWith("/api/")) {
      reply.code(401).send({ error: "Not authenticated" });
      return reply;
    }

    const target = encodeURIComponent(bp + req.url);
    reply.redirect(`${bp}/login?next=${target}`, 303);
    return reply;
  });
}
