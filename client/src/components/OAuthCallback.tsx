import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { oauthManager } from "../lib/oauth";
import { Loader } from "lucide-react";

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [message, setMessage] = useState("Processing OAuth callback...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const platform = window.location.pathname.split("/")[2]; // Extract platform from /oauth/{platform}/callback

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error("Missing code or state parameter");
        }

        setMessage(`Connecting to ${platform}...`);

        // Handle the OAuth callback
        const credentials = await oauthManager.handleCallback(
          platform,
          code,
          state,
        );

        setStatus("success");
        setMessage(`Successfully connected to ${platform}!`);

        // Notify parent window if opened in popup
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "oauth_success",
              platform: platform,
              credentials: credentials,
            },
            "*",
          );
          window.close();
        } else {
          // Redirect to settings page after successful connection
          setTimeout(() => {
            navigate("/settings");
          }, 2000);
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Authentication failed",
        );

        // Notify parent window if opened in popup
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "oauth_error",
              error:
                error instanceof Error
                  ? error.message
                  : "Authentication failed",
            },
            "*",
          );
          window.close();
        } else {
          // Redirect to settings page after error
          setTimeout(() => {
            navigate("/settings");
          }, 3000);
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          {status === "processing" && (
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          )}
          {status === "success" && (
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          )}
          {status === "error" && (
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {status === "processing" && "Connecting Account"}
          {status === "success" && "Connection Successful"}
          {status === "error" && "Connection Failed"}
        </h2>

        <p className="text-gray-600">{message}</p>

        {status !== "processing" && (
          <div className="mt-6">
            <button
              onClick={() => navigate("/settings")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// import React, { useEffect, useState } from 'react';
// import { useParams, useSearchParams } from 'react-router-dom';
// import { oauthManager } from '../lib/oauth';
// import { CheckCircle, XCircle, Loader } from 'lucide-react';

// export const OAuthCallback: React.FC = () => {
//   const { platform } = useParams<{ platform: string }>();
//   const [searchParams] = useSearchParams();
//   const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
//   const [message, setMessage] = useState('');
//   const called = React.useRef(false);

//   useEffect(() => {
//     if (called.current) return;
//     called.current = true;
//     handleOAuthCallback();
//     // eslint-disable-next-line
//   }, []);

//   const handleOAuthCallback = async () => {
//     try {
//       const code = searchParams.get('code');
//       const state = searchParams.get('state');
//       const error = searchParams.get('error');
//       console.log('Handling OAuth callback for platform:', platform, 'code:', code, 'state:', state);

//       if (error) {
//         throw new Error(`OAuth error: ${error}`);
//       }

//       if (!code || !state) {
//         throw new Error('Missing required OAuth parameters');
//       }

//       if (!platform) {
//         throw new Error('Invalid platform parameter');
//       }
//       await oauthManager.handleCallback(platform, code, state);

//       setStatus('success');
//       setMessage(`Successfully connected to ${platform.charAt(0).toUpperCase() + platform.slice(1)}!`);

//       // Send message to parent window before closing
//       if (window.opener) {
//         window.opener.postMessage(
//           { type: 'oauth_success', platform, status: 'success' },
//           '*'
//         );
//       }

//       setTimeout(() => {
//         window.close();
//       }, 112000);

//     } catch (error) {
//       console.error('OAuth callback error:', error);
//       setStatus('error');
//       setMessage(error instanceof Error ? error.message : 'OAuth authentication failed');

//       // Send error to parent window before closing
//       if (window.opener) {
//         window.opener.postMessage(
//           { type: 'oauth_error', error: error instanceof Error ? error.message : 'OAuth authentication failed' },
//           '*'
//         );
//       }

//       setTimeout(() => {
//         window.close();
//       }, 113000);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
//         {status === 'loading' && (
//           <>
//             <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               Completing Authentication...
//             </h2>
//             <p className="text-gray-600">
//               Please wait while we verify your credentials.
//             </p>
//           </>
//         )}

//         {status === 'success' && (
//           <>
//             <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               Authentication Successful!
//             </h2>
//             <p className="text-gray-600">{message}</p>
//             <p className="text-sm text-gray-500 mt-3">
//               This window will close automatically.
//             </p>
//           </>
//         )}

//         {status === 'error' && (
//           <>
//             <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
//             <h2 className="text-xl font-semibold text-gray-900 mb-2">
//               Authentication Failed
//             </h2>
//             <p className="text-gray-600">{message}</p>
//             <p className="text-sm text-gray-500 mt-3">
//               This window will close automatically.
//             </p>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };
