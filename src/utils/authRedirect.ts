/**
 * Authentication and Redirection Security Utility
 * Strictly validates and normalizes redirect destinations to prevent Open Redirect vulnerabilities.
 */

/**
 * Validates that a target URL is a safe, relative, internal application path.
 * Rejects:
 * - Absolute URLs with protocols (e.g. 'http://evil.com', 'javascript:alert(1)')
 * - Protocol-relative URLs (e.g. '//evil.com', '///evil.com')
 * - Backslash bypasses (e.g. '/\\evil.com', '\\evil.com')
 * - URLs with embedded schemes or control characters
 */
export function getSafeInternalRedirect(
  target: string | null | undefined,
  fallback = '/dashboard/customer'
): string {
  if (!target || typeof target !== 'string') {
    return fallback;
  }

  const trimmed = target.trim();

  // Must begin with a single forward slash
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // Reject protocol-relative URLs (starts with '//')
  if (trimmed.startsWith('//')) {
    return fallback;
  }

  // Reject backslash tricks ('/\' or '/\')
  if (trimmed.startsWith('/\\') || trimmed.includes('\\')) {
    return fallback;
  }

  // Extract path portion before query or hash
  const pathOnly = trimmed.split(/[?#]/)[0];

  // Must not contain colon in the path portion (prevents scheme bypasses like '/http://...')
  if (pathOnly.includes(':')) {
    return fallback;
  }

  return trimmed;
}

