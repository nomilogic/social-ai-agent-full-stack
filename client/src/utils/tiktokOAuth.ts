import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce";
import { Platform } from "../types";

export async function initiateTikTokOAuth(): Promise<{ token: string; user: any }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Generate secure state parameter (minimum 32 characters for security)
      const state = crypto.getRandomValues(new Uint8Array(16))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
      
      // Generate PKCE parameters according to TikTok requirements
      const codeVerifier = generateCodeVerifier(128); // Use maximum length for better security
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      console.log('TikTok OAuth initialization:', {
        stateLength: state.length,
        verifierLength: codeVerifier.length,
        challengeLength: codeChallenge.length,
        hasClientId: !!import.meta.env.VITE_TIKTOK_CLIENT_ID
      });
      
      // Store PKCE parameters in localStorage
      localStorage.setItem("tiktok_code_verifier", codeVerifier);
      localStorage.setItem("tiktok_oauth_state", state);

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
      console.log('Generated TikTok auth URL:', authUrl.substring(0, 100) + '...');

      const popup = window.open(
        authUrl,
        "tiktok_oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );
      
      if (!popup) {
        reject(new Error("Popup blocked. Please allow popups for this site."));
        return;
      }
      
      const messageListener = (event: MessageEvent) => {
        console.log('Received OAuth message:', event.data);
        
        if (event.data.type === "oauth_success" && event.data.provider === "tiktok") {
          if (event.data.state !== state) {
            console.error('State mismatch:', { expected: state, received: event.data.state });
            window.removeEventListener("message", messageListener);
            popup.close();
            reject(new Error("Invalid OAuth state parameter"));
            return;
          }
          
          console.log('TikTok OAuth success:', event.data.result);
          window.removeEventListener("message", messageListener);
          popup.close();
          resolve(event.data.result);
        } else if (event.data.type === "oauth_error") {
          console.error('TikTok OAuth error:', event.data.error);
          window.removeEventListener("message", messageListener);
          popup.close();
          reject(new Error(event.data.error || "TikTok authentication failed"));
        }
      };
      
      window.addEventListener("message", messageListener);
      
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
          reject(new Error("Authentication cancelled"));
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error initializing TikTok OAuth:', error);
      reject(error);
    }
  });
}
