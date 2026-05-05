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

/**
 * Build secure UI snapshot for the agent pipeline.
 * @returns {{ ui_state: Record<string, string|null>, derived_state: { pageType: string, hasForm: boolean }, url: string, timestamp: number }}
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
