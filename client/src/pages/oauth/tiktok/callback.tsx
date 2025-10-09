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

        // If we're in a popup and localStorage is empty, try multiple strategies to get PKCE data
        if ((!storedState || !codeVerifier) && window.opener) {
          console.log('⏳ Attempting to get PKCE parameters from parent window...');
          
          // Strategy 1: Wait and retry localStorage access (sometimes takes time to sync)
          for (let attempt = 1; attempt <= 3; attempt++) {
            console.log(`📋 Attempt ${attempt}/3: Checking localStorage...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 200)); // Progressive delay
            
            storedState = localStorage.getItem("tiktok_oauth_state");
            codeVerifier = localStorage.getItem("tiktok_code_verifier");
            
            console.log(`- Attempt ${attempt} result:`, {
              storedState: storedState ? `Present (${storedState})` : 'MISSING',
              codeVerifier: codeVerifier ? `Present (${codeVerifier.length} chars)` : 'MISSING'
            });
            
            if (storedState && codeVerifier) {
              console.log('✅ PKCE parameters found after multiple attempts');
              break;
            }
          }
          
          // Strategy 2: Try to request PKCE data from parent window via postMessage
          if ((!storedState || !codeVerifier) && window.opener) {
            console.log('📨 Requesting PKCE parameters from parent window via postMessage...');
            
            try {
              // Send request to parent window
              window.opener.postMessage({
                type: "pkce_request",
                provider: "tiktok"
              }, "*");
              
              // Wait for response
              const pkceData = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Timeout waiting for PKCE data from parent'));
                }, 2000);
                
                const messageHandler = (event: MessageEvent) => {
                  if (event.data.type === "pkce_response" && event.data.provider === "tiktok") {
                    clearTimeout(timeout);
                    window.removeEventListener("message", messageHandler);
                    resolve(event.data);
                  }
                };
                
                window.addEventListener("message", messageHandler);
              });
              
              if (pkceData && typeof pkceData === 'object' && 'codeVerifier' in pkceData && 'state' in pkceData) {
                codeVerifier = pkceData.codeVerifier;
                storedState = pkceData.state;
                
                // Store in popup's localStorage for consistency
                localStorage.setItem("tiktok_code_verifier", codeVerifier);
                localStorage.setItem("tiktok_oauth_state", storedState);
                
                console.log('✅ PKCE parameters received from parent via postMessage');
              }
            } catch (e) {
              console.warn('⚠️ Could not get PKCE data from parent via postMessage:', e);
            }
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
          
          // Add delay to allow user to see success message
          console.log('✅ TikTok OAuth successful, closing popup in 3 seconds...');
          setTimeout(() => {
            window.close();
          }, 3000);
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
          
          // Add significant delay to allow user to see and debug error
          console.log('❌ TikTok OAuth failed, keeping popup open for 10 seconds for debugging...');
          setTimeout(() => {
            window.close();
          }, 10000);
        } else {
          navigate("/error");
        }
      }
    }

    handleOAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-3">TikTok OAuth Error</h2>
          <div className="text-red-700 mb-4 whitespace-pre-wrap">{error}</div>
          
          {/* Show localStorage debugging info */}
          <div className="bg-gray-100 p-4 rounded text-sm text-gray-700 mt-4">
            <h3 className="font-semibold mb-2">Debug Information:</h3>
            <div className="space-y-1">
              <div>Current URL: {window.location.href}</div>
              <div>Is Popup: {window.opener ? 'Yes' : 'No'}</div>
              <div>TikTok Keys in localStorage: {Object.keys(localStorage).filter(k => k.includes('tiktok')).join(', ') || 'None'}</div>
              <div>Code Verifier Present: {localStorage.getItem('tiktok_code_verifier') ? 'Yes' : 'No'}</div>
              <div>OAuth State Present: {localStorage.getItem('tiktok_oauth_state') ? 'Yes' : 'No'}</div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-red-600">
            {window.opener ? 'This popup will close automatically in 10 seconds.' : 'Click to return to the app.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-center">
      <div className="animate-pulse">Connecting TikTok account...</div>
    </div>
  );
}
