/**
 * Microsoft Graph API client for OneDrive file access.
 *
 * Uses client credentials flow (app-only auth) to read files from a specific
 * user's OneDrive for Business without user interaction.
 *
 * Required env vars:
 *   AZURE_TENANT_ID   — Azure AD tenant ID
 *   AZURE_CLIENT_ID   — App registration client ID
 *   AZURE_CLIENT_SECRET — App registration client secret
 */

import { ONEDRIVE_BASE, ONEDRIVE_USER } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface DriveItem {
  id: string;
  name: string;
  lastModifiedDateTime: string;
  size: number;
}

interface GraphErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// ---------------------------------------------------------------------------
// Token cache (module-level, reused across calls within the same invocation)
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

function getEnvOrThrow(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`[graph] Missing required env var: ${name}`);
  return val;
}

/**
 * Acquire an access token via client credentials grant.
 * Cached in-memory with a 60s safety margin before expiry.
 */
async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const tenantId = getEnvOrThrow("AZURE_TENANT_ID");
  const clientId = getEnvOrThrow("AZURE_CLIENT_ID");
  const clientSecret = getEnvOrThrow("AZURE_CLIENT_SECRET");

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[graph] Token request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as TokenResponse;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

// ---------------------------------------------------------------------------
// Graph API helpers
// ---------------------------------------------------------------------------

/**
 * Make an authenticated GET request to Graph API.
 * Retries once on 429 (throttled) or 5xx.
 */
async function graphGet(url: string, retries = 1): Promise<Response> {
  const token = await getAccessToken();

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) return res;

    // Retry on throttle or server error
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const retryAfter = res.headers.get("Retry-After");
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000 * (attempt + 1);
      console.warn(`[graph] ${res.status} on ${url}, retrying in ${waitMs}ms...`);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }

    // Non-retryable error
    let errorMsg: string;
    try {
      const errBody = (await res.json()) as GraphErrorResponse;
      errorMsg = `${errBody.error.code}: ${errBody.error.message}`;
    } catch {
      errorMsg = `HTTP ${res.status}`;
    }
    throw new Error(`[graph] GET ${url} failed: ${errorMsg}`);
  }

  throw new Error(`[graph] Exhausted retries for ${url}`);
}

/** Encode a OneDrive path for use in Graph API URLs. */
function encodePath(relativePath: string): string {
  const fullPath = `${ONEDRIVE_BASE}/${relativePath}`;
  // Graph API uses :/path: syntax — path segments are URL-encoded
  return encodeURI(fullPath).replace(/#/g, "%23").replace(/\?/g, "%3F");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get metadata for a single file (including lastModifiedDateTime).
 * Returns null if the file is not found (404).
 */
export async function getFileMetadata(relativePath: string): Promise<DriveItem | null> {
  const path = encodePath(relativePath);
  const url = `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/root:/${path}`;

  try {
    const res = await graphGet(url);
    return (await res.json()) as DriveItem;
  } catch (err) {
    if (err instanceof Error && err.message.includes("itemNotFound")) {
      return null;
    }
    throw err;
  }
}

/**
 * Download a file's contents as an ArrayBuffer.
 * Returns null if the file is not found.
 */
export async function downloadFile(relativePath: string): Promise<ArrayBuffer | null> {
  const path = encodePath(relativePath);
  const url = `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/root:/${path}:/content`;

  try {
    const res = await graphGet(url);
    return await res.arrayBuffer();
  } catch (err) {
    if (err instanceof Error && err.message.includes("itemNotFound")) {
      return null;
    }
    throw err;
  }
}

/**
 * List children of a folder.
 * Returns empty array if the folder is not found.
 */
export async function listFolder(relativePath: string): Promise<DriveItem[]> {
  const path = encodePath(relativePath);
  const url = `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER}/drive/root:/${path}:/children`;

  try {
    const res = await graphGet(url);
    const data = (await res.json()) as { value: DriveItem[] };
    return data.value;
  } catch (err) {
    if (err instanceof Error && err.message.includes("itemNotFound")) {
      return [];
    }
    throw err;
  }
}
