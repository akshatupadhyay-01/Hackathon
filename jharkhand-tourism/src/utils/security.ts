/**
 * Enterprise-Grade Security & Defensive Utilities
 * 
 * Provides defense against:
 * 1. SSDI / Server-Side Data & Prompt Injection (sanitizes strings, escapes delimiters, schema bounds)
 * 2. ReDoS / Regular Expression Denial of Service (linear time string matching, bounded input lengths)
 * 3. LPDOS / Large Payload Denial of Service & Resource Starvation (payload limits, rate limiting, memory guards)
 * 4. Secret Key Leak Prevention (token redacting, safe credential masking, environment guards)
 * 5. SQL & Query Injection Protection (input sanitization, parameter escaping, UUID & slug validation)
 * 6. Clipboard Attack & Hijacking Defense (control char stripping, zero-width char removal, executable prefix neutralizing)
 */

// ============================================================================
// 1. CLIPBOARD ATTACK DEFENSE & SANITIZATION
// ============================================================================

/**
 * Strips dangerous hidden characters, ANSI escapes, zero-width markers,
 * bidirectional overrides, and executable payload prefixes from text before
 * placing it into the system clipboard.
 */
export function sanitizeForClipboard(
  rawText: string,
  options: { allowNewlines?: boolean; maxLength?: number } = {}
): string {
  if (typeof rawText !== 'string') return '';

  const maxLength = options.maxLength || 4096;
  let text = rawText.slice(0, maxLength);

  // 1. Strip ANSI escape sequences (e.g., \x1b[31m)
  text = text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');

  // 2. Strip Zero-Width and Hidden Unicode Characters (used in clipboard stealth attacks)
  // \u200B (zero-width space), \u200C (zero-width non-joiner), \u200D (zero-width joiner), \uFEFF (BOM), \u2060 (word joiner)
  text = text.replace(/[\u200B-\u200D\uFEFF\u2060\u180E]/g, '');

  // 3. Strip Unicode Bidirectional Overrides (used for spoofing file extensions / commands)
  text = text.replace(/[\u202A-\u202E\u2066-\u2069]/g, '');

  // 4. Strip dangerous ASCII control characters (\x00-\x08, \x0B-\x0C, \x0E-\x1F, \x7F)
  if (!options.allowNewlines) {
    // If newlines aren't allowed, also convert \r and \n to single spaces to prevent multi-line shell command execution
    text = text.replace(/[\x00-\x1F\x7F]/g, ' ');
  } else {
    // Keep \n and \t, strip everything else
    text = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  }

  // 5. Neutralize dangerous script / executable URI prefixes if copied as plain text
  text = text.replace(/^(javascript|data|vbscript|file):/i, 'blocked:');

  return text.trim();
}

/**
 * Safely copies sanitized text to the user's clipboard with fallback support.
 */
export async function safeClipboardCopy(
  text: string,
  options?: { allowNewlines?: boolean; maxLength?: number }
): Promise<boolean> {
  const sanitized = sanitizeForClipboard(text, options);
  if (!sanitized) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(sanitized);
      return true;
    }
  } catch (err) {
    // Fallback to execCommand for older / restricted iframe contexts
  }

  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = sanitized;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', 'true');
      document.body.appendChild(textarea);
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    }
  } catch (fallbackErr) {
    console.warn('Clipboard copy failed safely:', fallbackErr);
  }

  return false;
}

// ============================================================================
// 2. SSDI & PROMPT INJECTION DEFENSE (AI & TEMPLATE SANITIZATION)
// ============================================================================

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s*:\s*/i,
  /human\s*:\s*/i,
  /assistant\s*:\s*/i,
  /```(system|admin|root)/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<<SYS>>/i,
  /<<\/SYS>>/i,
  /reveal\s+(api\s+)?(key|secret|password|token)/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /dan\s+mode/i,
];

/**
 * Sanitizes user input before placing it into AI prompts or template strings.
 * Prevents SSDI, prompt hijacking, role confusion, and delimiter breakout.
 */
export function sanitizePromptInput(input: unknown, maxLength = 80): string {
  if (typeof input !== 'string') return '';

  let sanitized = input.trim().slice(0, maxLength);

  // Strip control chars and markdown code block delimiters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F`$\{\}]/g, ' ');

  // Neutralize prompt injection phrases
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  // Remove multiple consecutive spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

/**
 * Validates and sanitizes array of string tags/interests.
 */
export function sanitizeStringList(
  items: unknown,
  maxItems = 10,
  maxItemLength = 40
): string[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitizePromptInput(item, maxItemLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

// ============================================================================
// 3. ReDoS DEFENSE (REGULAR EXPRESSION DENIAL OF SERVICE PREVENTION)
// ============================================================================

/**
 * Safe linear-time substring search without vulnerable regex backtracking.
 * Checks if target string contains search query safely.
 */
export function safeContains(target: string | null | undefined, search: string): boolean {
  if (!target || !search) return false;
  const t = String(target).toLowerCase().slice(0, 1000);
  const s = String(search).toLowerCase().slice(0, 100);
  return t.indexOf(s) !== -1;
}

/**
 * Safe multi-word match: checks if all words in query exist in target in linear time.
 */
export function safeWordsMatch(target: string | null | undefined, query: string): boolean {
  if (!target || !query) return false;
  const t = String(target).toLowerCase().slice(0, 2000);
  const words = query
    .toLowerCase()
    .slice(0, 100)
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return true;
  return words.every((w) => t.indexOf(w) !== -1);
}

/**
 * Validates alphanumeric slugs safely without exponential backtracking.
 */
export function isValidSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length < 1 || slug.length > 100) {
    return false;
  }
  // Linear-time safe character-by-character check
  for (let i = 0; i < slug.length; i++) {
    const code = slug.charCodeAt(i);
    const isLower = code >= 97 && code <= 122; // a-z
    const isDigit = code >= 48 && code <= 57;  // 0-9
    const isDash = code === 45;                // -
    const isUnderscore = code === 95;          // _
    if (!isLower && !isDigit && !isDash && !isUnderscore) {
      return false;
    }
  }
  return true;
}

// ============================================================================
// 4. SQL INJECTION & QUERY HARDENING
// ============================================================================

/**
 * Validates a UUID string safely to prevent filter injection.
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string' || uuid.length !== 36) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitizes search terms before passing to database queries to prevent
 * SQL meta-character attacks, wildcards overflow (% or _ flood), or PostgREST operator injection.
 */
export function sanitizeDbSearchTerm(term: string, maxLength = 100): string {
  if (typeof term !== 'string') return '';
  return term
    .trim()
    .slice(0, maxLength)
    // Remove SQL comment tokens and null bytes
    .replace(/[\x00\r\n;'"`\\]/g, '')
    .replace(/--+/g, '')
    .replace(/\/\*.*?\*\//g, '')
    // Prevent PostgREST filter operator breakout (e.g. eq., neq., or., and.)
    .replace(/\b(eq|neq|gt|gte|lt|lte|like|ilike|is|in|not|or|and)\./gi, '')
    .trim();
}

/**
 * Escapes characters for safe SQL LIKE/ILIKE queries (prevents wildcard denial of service).
 */
export function escapeSqlWildcards(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[%_]/g, '\\$&');
}

// ============================================================================
// 5. SECRET KEY LEAK PREVENTION & MASKING
// ============================================================================

/**
 * Redacts potential secret keys, bearer tokens, and credentials from log strings.
 */
export function redactSecrets(message: string): string {
  if (typeof message !== 'string') return '';
  let sanitized = message;

  // Redact Gemini API keys (AIzaSy...)
  sanitized = sanitized.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'AIzaSy[REDACTED_API_KEY]');

  // Redact Bearer JWT tokens
  sanitized = sanitized.replace(/Bearer\s+eyJ[A-Za-z0-9._-]+/gi, 'Bearer eyJ[REDACTED_TOKEN]');

  // Redact generic API secret assignments (key=..., secret=..., token=...)
  sanitized = sanitized.replace(/(api[_-]?key|secret|password|token)\s*[:=]\s*["']?([^"'\s&]+)["']?/gi, '$1=[REDACTED]');

  return sanitized;
}

/**
 * Safe logger that automatically redacts secrets before printing to console.
 */
export const safeLogger = {
  warn: (...args: any[]) => {
    const cleaned = args.map((arg) => (typeof arg === 'string' ? redactSecrets(arg) : arg));
    console.warn(...cleaned);
  },
  error: (...args: any[]) => {
    const cleaned = args.map((arg) => (typeof arg === 'string' ? redactSecrets(arg) : arg));
    console.error(...cleaned);
  },
  info: (...args: any[]) => {
    const cleaned = args.map((arg) => (typeof arg === 'string' ? redactSecrets(arg) : arg));
    console.info(...cleaned);
  },
};

// ============================================================================
// 6. LPDOS & LARGE PAYLOAD GUARDS
// ============================================================================

export const SECURITY_LIMITS = {
  MAX_JSON_PAYLOAD_BYTES: 64 * 1024, // 64 KB max body for API requests
  MAX_SEARCH_QUERY_LENGTH: 100,      // Max characters in search box
  MAX_ITINERARY_DAYS: 14,            // Maximum itinerary days allowed
  MAX_ITINERARY_GUESTS: 50,          // Maximum travelers allowed
  MAX_BUDGET_INR: 5000000,           // ₹50 Lakh max budget limit
  MIN_BUDGET_INR: 500,               // ₹500 min budget limit
  RATE_LIMIT_WINDOW_MS: 60 * 1000,   // 1 minute window
  MAX_REQUESTS_PER_WINDOW: 30,       // 30 requests per minute per IP/client
};

/**
 * In-memory sliding window rate limiter for API endpoints (prevents LPDOS).
 */
export class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS, maxRequests = SECURITY_LIMITS.MAX_REQUESTS_PER_WINDOW) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(clientId) || [];

    // Filter out timestamps outside the current window
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      this.requests.set(clientId, validTimestamps);
      return false; // Rate limit exceeded
    }

    validTimestamps.push(now);
    this.requests.set(clientId, validTimestamps);

    // Periodic cleanup if map grows too large (DoS protection on memory)
    if (this.requests.size > 5000) {
      this.cleanup(now);
    }

    return true;
  }

  private cleanup(now: number): void {
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}
