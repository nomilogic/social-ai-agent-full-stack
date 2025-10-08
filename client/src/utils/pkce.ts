// PKCE utilities for TikTok OAuth
// Base64url encode function (no padding, URL-safe)
function base64urlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return base64;
}

export function generateCodeVerifier(length = 64): string {
  // TikTok requires code_verifier between 43-128 characters
  // Using unreserved characters as per RFC 7636: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 characters');
  }
  
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length];
  }
  
  return result;
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Encode the code_verifier as UTF-8
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // Hash with SHA-256
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url (no padding)
  const bytes = new Uint8Array(digest);
  const base64url = base64urlEncode(bytes);
  
  return base64url;
}
