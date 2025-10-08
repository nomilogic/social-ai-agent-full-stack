import React, { useEffect } from "react";

/**
 * TikTok OAuth Callback Page
 * Handles the redirect from TikTok, exchanges code for access token using code_verifier, and posts result to opener window.
 */
const TikTokOAuthCallback: React.FC = () => {
  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      if (error) {
        window.opener?.postMessage({ type: "oauth_error", provider: "tiktok", error }, window.location.origin);
        window.close();
        return;
      }
      if (!code || !state) {
        window.opener?.postMessage({ type: "oauth_error", provider: "tiktok", error: "Missing code or state" }, window.location.origin);
        window.close();
        return;
      }
      // Validate state
      const storedState = localStorage.getItem("tiktok_oauth_state");
      if (state !== storedState) {
        window.opener?.postMessage({ type: "oauth_error", provider: "tiktok", error: "Invalid state" }, window.location.origin);
        window.close();
        return;
      }
      localStorage.removeItem("tiktok_oauth_state");
      // Get code_verifier
      const codeVerifier = localStorage.getItem("tiktok_code_verifier");
      if (!codeVerifier) {
        window.opener?.postMessage({ type: "oauth_error", provider: "tiktok", error: "Missing code_verifier" }, window.location.origin);
        window.close();
        return;
      }
      localStorage.removeItem("tiktok_code_verifier");
      // Exchange code for access token
      try {
        const redirectUri = `${window.location.origin}/oauth/tiktok/callback`;
        
        // Get user_id from localStorage if available (set during login)
        const userStr = localStorage.getItem('user');
        let user_id = null;
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user_id = user.id;
          } catch (e) {
            console.warn('Failed to parse user from localStorage');
          }
        }
        
        console.log('Exchanging TikTok code for token:', {
          hasCode: !!code,
          hasVerifier: !!codeVerifier,
          redirectUri,
          hasUserId: !!user_id
        });
        
        const requestBody = {
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
          ...(user_id && { user_id }) // Include user_id if available
        };
        
        const response = await fetch("/api/tiktok/access-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const result = await response.json();
        if (!response.ok) {
          window.opener?.postMessage({ type: "oauth_error", provider: "tiktok", error: result.error || "Token exchange failed" }, window.location.origin);
          window.close();
          return;
        }
        window.opener?.postMessage({ type: "oauth_success", provider: "tiktok", state, result }, window.location.origin);
        window.close();
      } catch (err) {
        window.opener?.postMessage({ type: "oauth_error", provider: "tiktok", error: err?.toString() || "Unknown error" }, window.location.origin);
        window.close();
      }
    }
    handleCallback();
  }, []);
  return <div>Completing TikTok login...</div>;
};

export default TikTokOAuthCallback;
