import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce";
import { Platform } from "../types";

export async function initiateTikTokOAuth(): Promise<{ token: string; user: any }> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🚀 Starting TikTok OAuth initialization...');
      
      // Clear any existing PKCE parameters to start fresh
      localStorage.removeItem("tiktok_code_verifier");
      localStorage.removeItem("tiktok_oauth_state");
      
      // Generate secure state parameter (minimum 32 characters for security)
      const state = crypto.getRandomValues(new Uint8Array(16))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
      
      // Generate PKCE parameters according to TikTok requirements
      const codeVerifier = generateCodeVerifier(128); // Use maximum length for better security
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      console.log('🔐 Generated PKCE parameters:', {
        stateLength: state.length,
        verifierLength: codeVerifier.length,
        challengeLength: codeChallenge.length,
        hasClientId: !!import.meta.env.VITE_TIKTOK_CLIENT_ID,
        verifierValid: /^[A-Za-z0-9\-._~]+$/.test(codeVerifier) && codeVerifier.length >= 43 && codeVerifier.length <= 128
      });
      
      // Store PKCE parameters in localStorage BEFORE opening popup
      console.log('💾 Storing PKCE parameters in localStorage...');
      localStorage.setItem("tiktok_code_verifier", codeVerifier);
      localStorage.setItem("tiktok_oauth_state", state);
      
      // Verify storage was successful
      const storedVerifier = localStorage.getItem("tiktok_code_verifier");
      const storedState = localStorage.getItem("tiktok_oauth_state");
      
      if (!storedVerifier || !storedState) {
        console.error('❌ Failed to store PKCE parameters in localStorage');
        throw new Error('Failed to store OAuth parameters - localStorage may be disabled');
      }
      
      if (storedVerifier !== codeVerifier || storedState !== state) {
        console.error('❌ PKCE parameter storage verification failed');
        throw new Error('OAuth parameter storage verification failed');
      }
      
      console.log('✅ PKCE parameters successfully stored and verified');

      const clientId = import.meta.env.VITE_TIKTOK_CLIENT_ID;
      if (!clientId) {
        reject(new Error('TikTok Client ID not configured. Please check your environment variables.'));
        return;
      }
      
      const redirectUri = `${window.location.origin}/oauth/tiktok/callback`;
      const params = new URLSearchParams({
        client_key: clientId, // TikTok expects 'client_key' instead of 'client_id'
        response_type: "code",
        scope: "user.info.basic,video.publish", // TikTok current scopes
        redirect_uri: redirectUri,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256", // SHA-256 method for PKCE
      });
      
      const authUrl = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;
      console.log('🔗 Generated TikTok auth URL:', authUrl.substring(0, 100) + '...');

      // Add a small delay to ensure localStorage is fully synced
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('🚪 Opening popup window for TikTok OAuth...');
      const popup = window.open(
        authUrl,
        "tiktok_oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes,location=yes,status=yes"
      );
      
      if (!popup) {
        console.error('❌ Popup was blocked');
        reject(new Error("Popup blocked. Please allow popups for this site."));
        return;
      }
      
      console.log('✅ Popup opened successfully');
      
      // Additional check: verify popup can access localStorage and sync if needed
      try {
        // Wait a moment for popup to fully load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const testVerifier = popup.localStorage?.getItem("tiktok_code_verifier");
        console.log('🔍 Popup localStorage check:', {
          canAccessLocalStorage: !!popup.localStorage,
          hasCodeVerifier: !!testVerifier
        });
        
        // If popup doesn't have the verifier, try to sync it
        if (popup.localStorage && !testVerifier) {
          console.log('🔄 Syncing PKCE parameters to popup localStorage...');
          popup.localStorage.setItem("tiktok_code_verifier", codeVerifier);
          popup.localStorage.setItem("tiktok_oauth_state", state);
          
          // Verify sync worked
          const syncedVerifier = popup.localStorage.getItem("tiktok_code_verifier");
          console.log('📋 Sync result:', { syncedVerifier: !!syncedVerifier });
        }
      } catch (e) {
        console.warn('⚠️ Could not verify or sync popup localStorage:', e.message);
      }
      
      const messageListener = (event: MessageEvent) => {
        console.log('📨 Received OAuth message:', {
          type: event.data.type,
          provider: event.data.provider,
          hasResult: !!event.data.result,
          error: event.data.error
        });
        
        // Handle PKCE requests from popup
        if (event.data.type === "pkce_request" && event.data.provider === "tiktok") {
          console.log('🔑 Popup requesting PKCE parameters, sending response...');
          
          // Get current PKCE parameters from localStorage
          const currentVerifier = localStorage.getItem("tiktok_code_verifier");
          const currentState = localStorage.getItem("tiktok_oauth_state");
          
          if (currentVerifier && currentState) {
            // Send PKCE data to popup
            popup.postMessage({
              type: "pkce_response",
              provider: "tiktok",
              codeVerifier: currentVerifier,
              state: currentState
            }, "*");
            console.log('✅ PKCE parameters sent to popup via postMessage');
          } else {
            console.error('❌ Cannot send PKCE parameters - not found in parent localStorage');
            popup.postMessage({
              type: "pkce_response",
              provider: "tiktok",
              error: "PKCE parameters not found in parent window"
            }, "*");
          }
          return;
        }
        
        if (event.data.type === "oauth_success" && event.data.provider === "tiktok") {
          if (event.data.state !== state) {
            console.error('❌ State mismatch in message listener:', { 
              expected: state, 
              received: event.data.state,
              match: event.data.state === state
            });
            window.removeEventListener("message", messageListener);
            popup.close();
            reject(new Error("Invalid OAuth state parameter"));
            return;
          }
          
          console.log('✅ TikTok OAuth success:', event.data.result);
          window.removeEventListener("message", messageListener);
          popup.close();
          
          // Clean up localStorage after successful OAuth
          localStorage.removeItem("tiktok_code_verifier");
          localStorage.removeItem("tiktok_oauth_state");
          
          resolve(event.data.result);
        } else if (event.data.type === "oauth_error") {
          console.error('❌ TikTok OAuth error from popup:', event.data.error);
          window.removeEventListener("message", messageListener);
          popup.close();
          
          // Clean up localStorage after failed OAuth
          localStorage.removeItem("tiktok_code_verifier");
          localStorage.removeItem("tiktok_oauth_state");
          
          reject(new Error(event.data.error || "TikTok authentication failed"));
        }
      };
      
      window.addEventListener("message", messageListener);
      
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('🚪 Popup window closed by user');
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
          
          // Clean up localStorage when popup is closed
          localStorage.removeItem("tiktok_code_verifier");
          localStorage.removeItem("tiktok_oauth_state");
          
          reject(new Error("Authentication cancelled by user"));
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error initializing TikTok OAuth:', error);
      
      // Clean up localStorage on error
      localStorage.removeItem("tiktok_code_verifier");
      localStorage.removeItem("tiktok_oauth_state");
      
      reject(error);
    }
  });
}
