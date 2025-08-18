import { useState, useEffect, useCallback, useRef } from 'react';
import { OAuthManagerClient, type OAuthConnection } from '../lib/oauthManagerClient';
import { Platform } from '../types';

interface UseOAuthManagerOptions {
  baseURL?: string;
  authToken?: string;
  headers?: HeadersInit;
}

interface UseOAuthManagerResult {
  connections: Record<Platform, OAuthConnection>;
  loading: boolean;
  error: string | null;
  connectPlatform: (platform: Platform, options?: any) => Promise<any>;
  disconnectPlatform: (platform: Platform) => Promise<void>;
  isConnected: (platform: Platform) => boolean;
  getConnection: (platform: Platform) => OAuthConnection;
  loadConnections: () => Promise<void>;
  client: OAuthManagerClient;
}

export function useOAuthManager(
  userId: string,
  options: UseOAuthManagerOptions = {}
): UseOAuthManagerResult {
  const [client] = useState(() => new OAuthManagerClient(options.baseURL, {
    userId,
    authToken: options.authToken,
    headers: options.headers
  }));

  const [connections, setConnections] = useState<Record<Platform, OAuthConnection>>({
    facebook: { connected: false },
    instagram: { connected: false },
    linkedin: { connected: false },
    twitter: { connected: false },
    tiktok: { connected: false },
    youtube: { connected: false }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // Update client when userId or authToken changes
  useEffect(() => {
    if (userId) {
      client.setUserId(userId);
    }
    if (options.authToken) {
      client.setAuthToken(options.authToken);
    }
  }, [client, userId, options.authToken]);

  // Load connection status
  const loadConnections = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await client.getConnectionStatus();
      setConnections(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load connections';
      setError(errorMessage);
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  }, [client, userId]);

  // Load connections on mount and userId change
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Connect to platform
  const connectPlatform = useCallback(async (platform: Platform, options: any = {}) => {
    try {
      setError(null);
      
      // Start OAuth flow
      const response = await client.startOAuthFlow(platform, options);
      
      return new Promise((resolve, reject) => {
        // Clean up any existing message handler
        if (messageHandlerRef.current) {
          window.removeEventListener('message', messageHandlerRef.current);
        }

        // Create message handler
        const messageHandler = (event: MessageEvent) => {
          // Only accept messages from our own origin
          const appURL = new URL(client['baseURL']);
          if (event.origin !== appURL.origin) {
            return;
          }

          if (event.data.type === 'OAUTH_SUCCESS' && event.data.platform === platform) {
            window.removeEventListener('message', messageHandler);
            messageHandlerRef.current = null;

            // Update connections state
            setConnections(prev => ({
              ...prev,
              [platform]: {
                connected: true,
                username: event.data.username,
                profilePicture: event.data.profilePicture,
                connectedAt: Date.now()
              }
            }));

            popup?.close();
            resolve(event.data);
          } else if (event.data.type === 'OAUTH_ERROR' && event.data.platform === platform) {
            window.removeEventListener('message', messageHandler);
            messageHandlerRef.current = null;

            const errorMessage = event.data.error || 'OAuth failed';
            setError(errorMessage);
            popup?.close();
            reject(new Error(errorMessage));
          } else if (event.data.type === 'CLOSE_POPUP') {
            window.removeEventListener('message', messageHandler);
            messageHandlerRef.current = null;
            popup?.close();
            reject(new Error('OAuth flow cancelled'));
          }
        };

        messageHandlerRef.current = messageHandler;
        window.addEventListener('message', messageHandler);

        // Open OAuth popup
        const popup = window.open(
          response.authUrl,
          `${platform}_oauth`,
          'width=600,height=700,scrollbars=yes,resizable=yes,location=yes,status=yes,menubar=no,toolbar=no'
        );

        if (!popup) {
          window.removeEventListener('message', messageHandler);
          messageHandlerRef.current = null;
          reject(new Error('OAuth popup was blocked. Please allow popups for this site.'));
          return;
        }

        popup.focus();

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            messageHandlerRef.current = null;
            reject(new Error('OAuth popup was closed'));
          }
        }, 1000);

        // Clean up interval when promise resolves/rejects
        const originalResolve = resolve;
        const originalReject = reject;
        
        resolve = ((value: any) => {
          clearInterval(checkClosed);
          return originalResolve(value);
        }) as any;
        
        reject = ((reason: any) => {
          clearInterval(checkClosed);
          return originalReject(reason);
        }) as any;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [client]);

  // Disconnect from platform
  const disconnectPlatform = useCallback(async (platform: Platform) => {
    try {
      setError(null);
      await client.disconnectPlatform(platform);

      // Update connections state
      setConnections(prev => ({
        ...prev,
        [platform]: { connected: false }
      }));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnection failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [client]);

  // Check if platform is connected
  const isConnected = useCallback((platform: Platform) => {
    return connections[platform]?.connected || false;
  }, [connections]);

  // Get connection info for platform
  const getConnection = useCallback((platform: Platform) => {
    return connections[platform] || { connected: false };
  }, [connections]);

  // Clean up message handlers on unmount
  useEffect(() => {
    return () => {
      if (messageHandlerRef.current) {
        window.removeEventListener('message', messageHandlerRef.current);
      }
    };
  }, []);

  return {
    connections,
    loading,
    error,
    connectPlatform,
    disconnectPlatform,
    isConnected,
    getConnection,
    loadConnections,
    client
  };
}
