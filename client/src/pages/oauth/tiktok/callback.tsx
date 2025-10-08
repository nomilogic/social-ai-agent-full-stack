import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { oauthManagerClient } from "../../../lib/oauthManagerClient";

export default function TikTokCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        const storedState = localStorage.getItem("tiktok_oauth_state");
        const codeVerifier = localStorage.getItem("tiktok_code_verifier");

        // Validate state and required parameters
        if (!code || !state) {
          throw new Error("Missing required OAuth parameters");
        }

        if (state !== storedState) {
          throw new Error("OAuth state mismatch");
        }

        if (!codeVerifier) {
          throw new Error("Missing code_verifier for PKCE");
        }

        // Get user_id for the request
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
        
        if (!user_id) {
          throw new Error('User not logged in - cannot save TikTok connection');
        }

        // Exchange code for token using direct TikTok route
        const result = await oauthManagerClient.handleCallback("tiktok", code, state, codeVerifier);
        console.log("TikTok OAuth success:", result);

        // Clean up stored PKCE parameters
        localStorage.removeItem("tiktok_code_verifier");
        localStorage.removeItem("tiktok_oauth_state");

        // Success - navigate back to content page or close popup if in popup mode
        if (window.opener) {
          // If in popup, send success message to main window
          window.opener.postMessage({
            type: "oauth_success",
            provider: "tiktok",
            state,
            result
          }, "*");
          window.close();
        } else {
          // If not in popup, navigate to content page
          navigate("/content");
        }

      } catch (err) {
        console.error("TikTok OAuth Error:", err);
        setError(err instanceof Error ? err.message : "Failed to connect TikTok");
        
        // Handle error in popup scenario
        if (window.opener) {
          window.opener.postMessage({
            type: "oauth_error",
            provider: "tiktok",
            error: err instanceof Error ? err.message : "Failed to connect TikTok"
          }, "*");
          window.close();
        } else {
          navigate("/error");
        }
      }
    }

    handleOAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 text-center">
      <div className="animate-pulse">Connecting TikTok account...</div>
    </div>
  );
}
