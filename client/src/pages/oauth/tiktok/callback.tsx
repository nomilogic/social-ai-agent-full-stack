import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { oauthManagerClient } from "../../../lib/oauthManagerClient";

export default function TikTokCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        console.log('🔍 TikTok OAuth Callback Debug:');
        console.log('- Window location:', window.location.href);
        console.log('- Is popup window:', !!window.opener);
        
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const state = params.get("state");
        
        console.log('- URL Parameters:', { 
          code: code ? `Present (${code.substring(0, 20)}...)` : 'MISSING',
          state: state ? `Present (${state})` : 'MISSING'
        });

        // Validate state and required parameters
        if (!code || !state) {
          console.error('❌ Missing required OAuth parameters:', { code: !!code, state: !!state });
          throw new Error("Missing required OAuth parameters (code or state)");
        }

        // Check localStorage - with retry mechanism for popup windows
        let storedState = localStorage.getItem("tiktok_oauth_state");
        let codeVerifier = localStorage.getItem("tiktok_code_verifier");
        
        console.log('- Initial localStorage check:', {
          storedState: storedState ? `Present (${storedState})` : 'MISSING',
          codeVerifier: codeVerifier ? `Present (${codeVerifier.length} chars)` : 'MISSING'
        });

        // If we're in a popup and localStorage is empty, try to get from opener
        if ((!storedState || !codeVerifier) && window.opener) {
          console.log('⏳ Attempting to get PKCE parameters from parent window...');
          try {
            // Wait a bit for localStorage sync
            await new Promise(resolve => setTimeout(resolve, 100));
            storedState = localStorage.getItem("tiktok_oauth_state");
            codeVerifier = localStorage.getItem("tiktok_code_verifier");
            
            console.log('- After retry:', {
              storedState: storedState ? `Present (${storedState})` : 'MISSING',
              codeVerifier: codeVerifier ? `Present (${codeVerifier.length} chars)` : 'MISSING'
            });
          } catch (e) {
            console.warn('Could not access parent window localStorage:', e);
          }
        }

        if (state !== storedState) {
          console.error('❌ OAuth state mismatch:', { 
            received: state,
            stored: storedState,
            match: state === storedState
          });
          throw new Error("OAuth state mismatch - possible security issue");
        }

        if (!codeVerifier) {
          console.error('❌ Missing code_verifier for PKCE');
          console.error('Debug info:', {
            isPopup: !!window.opener,
            localStorage: {
              all: Object.keys(localStorage).filter(k => k.includes('tiktok')),
              codeVerifier: localStorage.getItem("tiktok_code_verifier"),
              state: localStorage.getItem("tiktok_oauth_state")
            }
          });
          throw new Error("Missing code_verifier for PKCE - OAuth flow was not properly initialized");
        }

        // Validate code_verifier format
        if (codeVerifier.length < 43 || codeVerifier.length > 128) {
          console.error('❌ Invalid code_verifier length:', codeVerifier.length);
          throw new Error(`Invalid code_verifier length: ${codeVerifier.length}. Must be between 43-128 characters.`);
        }

        if (!/^[A-Za-z0-9\-._~]+$/.test(codeVerifier)) {
          console.error('❌ Invalid code_verifier format');
          throw new Error('Invalid code_verifier format. Must contain only unreserved characters.');
        }

        console.log('✅ All PKCE parameters validated successfully');

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
        console.log('🔄 Exchanging authorization code for access token...');
        const result = await oauthManagerClient.handleCallback("tiktok", code, state, codeVerifier);
        console.log("✅ TikTok OAuth success:", result);

        // Clean up stored PKCE parameters
        console.log('🧹 Cleaning up PKCE parameters from localStorage');
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
        console.error("❌ TikTok OAuth Error:", err);
        
        // Enhanced error logging for debugging
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
        }
        
        // Log additional debug information for PKCE errors
        if (err instanceof Error && err.message.includes('code_verifier')) {
          console.error('PKCE Debug Info:', {
            localStorage: {
              all: Object.keys(localStorage),
              tiktok_items: Object.keys(localStorage).filter(k => k.includes('tiktok')),
              code_verifier: localStorage.getItem('tiktok_code_verifier'),
              oauth_state: localStorage.getItem('tiktok_oauth_state'),
              user: localStorage.getItem('user'),
              auth_token: localStorage.getItem('auth_token')
            },
            window: {
              location: window.location.href,
              opener: !!window.opener,
              origin: window.location.origin
            }
          });
        }
        
        const errorMessage = err instanceof Error ? err.message : "Failed to connect TikTok";
        setError(errorMessage);
        
        // Handle error in popup scenario
        if (window.opener) {
          window.opener.postMessage({
            type: "oauth_error",
            provider: "tiktok",
            error: errorMessage
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
