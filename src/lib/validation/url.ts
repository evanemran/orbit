export interface UrlValidationResult {
  isValid: boolean;
  normalizedUrl: string;
  hostname: string;
  error?: string;
}

const DISALLOWED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'blob:'];

/**
 * Validates and normalizes user-entered URLs safely.
 * Blocks javascript:, data:, and other unsafe schemes.
 */
export function validateAndNormalizeUrl(rawInput: string): UrlValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      normalizedUrl: '',
      hostname: '',
      error: 'URL cannot be empty.',
    };
  }

  const lower = trimmed.toLowerCase();
  for (const proto of DISALLOWED_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      return {
        isValid: false,
        normalizedUrl: '',
        hostname: '',
        error: `Unsafe URL protocol (${proto}) is not allowed.`,
      };
    }
  }

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(candidate)) {
    // Reject if it contains a colon before any slash (like unknown scheme)
    const firstColon = candidate.indexOf(':');
    const firstSlash = candidate.indexOf('/');
    if (firstColon !== -1 && (firstSlash === -1 || firstColon < firstSlash)) {
      const possiblePort = candidate.slice(firstColon + 1).match(/^\d+/);
      if (!possiblePort) {
        return {
          isValid: false,
          normalizedUrl: '',
          hostname: '',
          error: 'Only http:// and https:// URLs are supported.',
        };
      }
    }
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        normalizedUrl: '',
        hostname: '',
        error: 'Only HTTP and HTTPS protocols are allowed.',
      };
    }

    const host = parsed.hostname.toLowerCase();
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    const hasValidDomain = host.includes('.') && !host.startsWith('.') && !host.endsWith('.');

    if (!isLocalhost && !hasValidDomain) {
      return {
        isValid: false,
        normalizedUrl: '',
        hostname: '',
        error: 'Please enter a valid domain name (e.g., example.com).',
      };
    }

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      hostname: host,
    };
  } catch {
    return {
      isValid: false,
      normalizedUrl: '',
      hostname: '',
      error: 'Invalid URL format.',
    };
  }
}

/**
 * Normalizes a URL for duplicate comparison (strips trailing slash & www prefix).
 */
export function getCanonicalUrlKey(rawUrl: string): string {
  const res = validateAndNormalizeUrl(rawUrl);
  if (!res.isValid) return rawUrl.trim().toLowerCase();
  try {
    const u = new URL(res.normalizedUrl);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${host}${path}${u.search}`;
  } catch {
    return rawUrl.trim().toLowerCase();
  }
}

/**
 * Generates a safe favicon URL or returns empty string so UI can render a clean monogram fallback.
 */
export function getFaviconUrl(url: string): string {
  const validated = validateAndNormalizeUrl(url);
  if (!validated.isValid) return '';
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(validated.hostname)}&sz=64`;
}
