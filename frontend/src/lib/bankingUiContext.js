/**
 * Secure DOM → JSON context for banking AI (whitelist only, no HTML / full DOM).
 * DOM is treated as untrusted; all string values are sanitized.
 */

const REDACT = "[REDACTED]";
const SENSITIVE_RE = /\b(password|otp|token|secret)\b/gi;

/** Whitelist: only these selectors are read (textContent, never innerHTML). */
const FIELD_SELECTORS = {
  balance: '[data-ai-field="balance"]',
  accountName: '[data-ai-field="accountName"]',
  activeTab: '[data-ai-field="activeTab"]',
};

function sanitizeText(raw) {
  if (raw == null) return "";
  let s = String(raw).replace(/\s+/g, " ").trim();
  if (!s) return "";
  s = s.replace(SENSITIVE_RE, REDACT);
  const lower = s.toLowerCase();
  const injections = [
    "ignore previous",
    "system:",
    "override instructions",
    "disregard",
  ];
  if (injections.some((p) => lower.includes(p))) return REDACT;
  return s.slice(0, 200);
}

function readField(key) {
  const sel = FIELD_SELECTORS[key];
  if (!sel) return null;
  const el = document.querySelector(sel);
  if (!el || !(el instanceof Element)) return null;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return null;
  if (el.getAttribute("aria-hidden") === "true") return null;
  const text = el.textContent ?? "";
  const cleaned = sanitizeText(text);
  return cleaned || null;
}

function derivePageType(pathname) {
  const p = (pathname || "/").toLowerCase();
  if (p.startsWith("/dashboard")) return "dashboard";
  if (p.includes("/transfer")) return "transfer";
  if (p.startsWith("/user-details") || p.includes("/settings")) return "settings";
  return "other";
}

function detectHasForm() {
  return !!document.querySelector("[data-ai-form-region] input, [data-ai-form-region] textarea, [data-ai-form-region] select");
}

function normalizeRoutePath(href) {
  if (!href || typeof href !== "string") return null;
  try {
    const parsed = new URL(href, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    const path = (parsed.pathname || "/").trim();
    if (!path.startsWith("/")) return null;
    if (path === "/auth/callback") return null;
    return path;
  } catch {
    return null;
  }
}

function extractRouteCatalog() {
  const byRoute = new Map();
  const coreRoutes = [
    { route: "/", label: "login" },
    { route: "/register", label: "register signup" },
    { route: "/dashboard", label: "dashboard transactions balance" },
    { route: "/user-details", label: "user details profile account email" },
  ];
  coreRoutes.forEach((entry) => {
    byRoute.set(entry.route, entry);
  });
  const anchors = document.querySelectorAll("a[href], [data-ai-route]");
  anchors.forEach((node) => {
    const rawHref =
      node.getAttribute("href") || node.getAttribute("data-ai-route") || "";
    const route = normalizeRoutePath(rawHref);
    if (!route) return;
    const label = sanitizeText(node.textContent || "") || route;
    if (!byRoute.has(route)) {
      byRoute.set(route, { route, label });
    }
  });

  // Always include current route so concierge can still reason when nav links are hidden.
  const currentPath = window.location.pathname || "/";
  if (!byRoute.has(currentPath)) {
    byRoute.set(currentPath, { route: currentPath, label: currentPath });
  }

  return Array.from(byRoute.values()).slice(0, 24);
}

/**
 * Build secure UI snapshot for the agent pipeline.
 * @returns {{ ui_state: Record<string, string|null>, derived_state: { pageType: string, hasForm: boolean }, route_catalog: Array<{route:string,label:string}>, url: string, timestamp: number }}
 */
export function extractBankingUiContext() {
  const ui_state = {
    balance: readField("balance"),
    accountName: readField("accountName"),
    activeTab: readField("activeTab"),
  };

  const path = window.location.pathname || "/";
  const derived_state = {
    pageType: derivePageType(path),
    hasForm: detectHasForm(),
  };

  const url = `${window.location.origin}${path}`;

  return {
    ui_state,
    derived_state,
    route_catalog: extractRouteCatalog(),
    url,
    timestamp: Date.now(),
  };
}

/** Snapshot + user question for `POST /api/ui-context/agent`. */
export function buildUiAgentRequest(question) {
  return {
    ...extractBankingUiContext(),
    question: String(question || "").slice(0, 2000),
  };
}
