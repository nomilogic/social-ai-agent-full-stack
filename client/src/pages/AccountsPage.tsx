import React, { useState, useEffect } from 'react';
import { Platform } from '../types';
import { oauthManagerClient } from '../lib/oauthManagerClient';
import Icon from '../components/Icon';
import { RefreshCw, Trash2 } from 'lucide-react';

// Define all available platforms
const ALL_PLATFORMS: Platform[] = ['linkedin', 'facebook', 'instagram', 'youtube', 'tiktok'];

export const AccountsPage: React.FC = () => {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [connectingPlatforms, setConnectingPlatforms] = useState<Platform[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [youtubeChannels, setYoutubeChannels] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string>('');
  const [selectedYoutubeChannel, setSelectedYoutubeChannel] = useState<string>('');

  useEffect(() => {
    checkConnectedPlatforms();
  }, []);

  const checkConnectedPlatforms = async () => {
    try {
      // Get the authentication token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('No authentication token found');
        setConnectedPlatforms([]);
        return;
      }
      
      // Use the authenticated OAuth status endpoint
      const response = await fetch('/api/oauth/connections/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch connection status: ${response.status}`);
      }
      
      const statusData = await response.json();
      
      const connected: Platform[] = [];
      for (const platform of ALL_PLATFORMS) {
        if (statusData[platform]?.connected) {
          connected.push(platform);
        }
      }
      setConnectedPlatforms(connected);
      
      // Fetch Facebook pages if Facebook is connected
      if (connected.includes('facebook')) {
        await fetchFacebookPages();
      }
      
      // Fetch YouTube channels if YouTube is connected
      if (connected.includes('youtube')) {
        await fetchYouTubeChannels();
      }
    } catch (error) {
      console.error('Failed to check connected platforms:', error);
      setConnectedPlatforms([]);
    }
  };

  const fetchFacebookPages = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const tokenResponse = await fetch('/api/oauth/tokens/facebook', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        if (tokenData.connected && tokenData.token?.access_token) {
          const pagesResponse = await fetch(`/api/facebook/pages?access_token=${tokenData.token.access_token}`);
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            setFacebookPages(pagesData.pages || []);
            if (pagesData.pages && pagesData.pages.length > 0 && !selectedFacebookPage) {
              setSelectedFacebookPage(pagesData.pages[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch Facebook pages:', error);
    }
  };

  const fetchYouTubeChannels = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const tokenResponse = await fetch('/api/oauth/tokens/youtube', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        if (tokenData.connected && tokenData.token?.access_token) {
          const channelsResponse = await fetch(`/api/youtube/channels?access_token=${tokenData.token.access_token}`);
          if (channelsResponse.ok) {
            const channelsData = await channelsResponse.json();
            setYoutubeChannels(channelsData.channels || []);
            if (channelsData.channels && channelsData.channels.length > 0 && !selectedYoutubeChannel) {
              setSelectedYoutubeChannel(channelsData.channels[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch YouTube channels:', error);
    }
  };

  const handleConnect = async (platform: Platform) => {
    console.log('Connecting to platform:', platform);
    
    try {
      setConnectingPlatforms(prev => [...prev, platform]);
      setError(null);
      
      // Use the OAuth client to start OAuth flow (uses JWT authentication)
      const result = await oauthManagerClient.startOAuthFlow(platform);
      const { authUrl } = result;
      console.log('Opening OAuth popup with URL:', authUrl);

      const authWindow = window.open(
        authUrl,
        `${platform}_oauth`,
        "width=600,height=700,scrollbars=yes,resizable=yes",
      );

      if (!authWindow) {
        throw new Error("OAuth popup blocked");
      }

      // Listen for messages from the OAuth callback
      const messageListener = (event: MessageEvent) => {
        if (
          event.data.type === "oauth_success" &&
          event.data.platform === platform
        ) {
          console.log("OAuth success for", platform);
          // Close popup from parent window for better browser compatibility
          try {
            authWindow?.close();
          } catch (error) {
            console.warn('Could not close popup from parent:', error);
          }
          setTimeout(checkConnectedPlatforms, 1000);
          window.removeEventListener("message", messageListener);
        } else if (event.data.type === "oauth_error") {
          console.error("OAuth error:", event.data.error);
          // Close popup from parent window for better browser compatibility
          try {
            authWindow?.close();
          } catch (error) {
            console.warn('Could not close popup from parent:', error);
          }
          setError(`Failed to connect ${platform}: ${event.data.error || "OAuth failed"}`);
          window.removeEventListener("message", messageListener);
        }
      };

      window.addEventListener("message", messageListener);

      // Monitor window closure
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener("message", messageListener);
          setTimeout(checkConnectedPlatforms, 1000);
        }
      }, 1000);
    } catch (error) {
      console.error('Error connecting to platform:', error);
      setError(`Failed to connect ${platform}: ${error instanceof Error ? error.message : "Connection failed"}`);
    } finally {
      setConnectingPlatforms(prev => prev.filter(p => p !== platform));
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    try {
      // Use the OAuth manager client for disconnecting (uses JWT authentication)
      await oauthManagerClient.disconnectPlatform(platform);
      checkConnectedPlatforms();
    } catch (error) {
      console.error("Failed to disconnect:", error);
      setError(`Failed to disconnect ${platform}: ${error instanceof Error ? error.message : "Disconnection failed"}`);
    }
  };

  const getPlatformDisplayName = (platform: Platform): string => {
    switch (platform) {
      case 'twitter':
        return 'X (Twitter)';
      default:
        return platform.charAt(0).toUpperCase() + platform.slice(1);
    }
  };

  const getPlatformColors = (platform: Platform) => {
    switch (platform) {
      case 'linkedin':
        return 'bg-blue-600';
      case 'facebook':
        return 'bg-blue-700';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'twitter':
        return 'bg-black';
      case 'youtube':
        return 'bg-red-600';
      case 'tiktok':
        return 'bg-black';
      default:
        return 'bg-gray-600';
    }
  };

  const renderPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'linkedin':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      default:
        return (
          <span className="text-lg font-bold uppercase">
            {platform.substring(0, 2)}
          </span>
        );
    }
  };

  return (
    <div className="theme-bg-light min-h-screen">
      {/* Header */}
     

      {/* Main Content */}
      <div className="max-w-full mx-auto px-0 py-2">
        <div className="mb-0">
           <h2 className="text-2xl font-semibold theme-text-primary mb-1">
              Connect Your Accounts
            </h2>
            <p className="text-sm theme-text-primary mb-1">
            Connect your social media accounts to enable publishing across all platforms.
          </p>

          {/* Connection Status Summary */}
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{connectedPlatforms.length}</span> of <span className="font-medium">{ALL_PLATFORMS.length}</span> platforms connected
            </p>
          </div>

          {/* Connection Alert */}
          {connectedPlatforms.length === 0 && (
            <div className="mb-8 p-4 theme-bg-quaternary rounded-xl border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5">
                  <Icon name="connect-accounts" size={60} className="inline mr-1" />
                </div>
                <div>
                  <h3 className="font-semibold theme-text-secondary mb-1">No Accounts Connected</h3>
                  <p className="text-sm theme-text-secondary leading-relaxed">
                    Connect your social media accounts to start publishing content across multiple platforms.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Platforms List */}
        <div className="space-y-3 mb-2">
          {ALL_PLATFORMS.map(platform => {
            const isConnected = connectedPlatforms.includes(platform);
            const isConnecting = connectingPlatforms.includes(platform);
            
            return (
              <div key={platform} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  {/* Platform Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getPlatformColors(platform)}`}>
                    {renderPlatformIcon(platform)}
                  </div>
                  
                  {/* Platform Info */}
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {getPlatformDisplayName(platform)}
                    </h4>
                    <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </p>
                  </div>
                </div>

                {/* Platform Controls */}
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isConnecting} 
                        className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50 rounded-lg hover:bg-gray-100"
                        title="Refresh connection"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isConnecting}
                        className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50 rounded-lg hover:bg-gray-100"
                        title="Disconnect"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>CONNECTED</span>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={isConnecting}
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed theme-bg-quaternary theme-text-secondary hover:theme-bg-tertiary"
                    >
                      {!isConnecting && <Icon name="connect-accounts" size={14} className="" />}
                      {isConnecting ? (
                        <>
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span>CONNECTING...</span>
                        </>
                      ) : (
                        'CONNECT'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Platform-specific options */}
        {(connectedPlatforms.includes('facebook') && facebookPages.length > 0) && (
          <div className="mb-6 p-2 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-medium text-blue-900 mb-2">Facebook Page Selection</h4>
            <p className="text-blue-700 text-sm mb-3">Choose your default Facebook page for publishing:</p>
            <select
              value={selectedFacebookPage}
              onChange={(e) => setSelectedFacebookPage(e.target.value)}
              className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {facebookPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name} ({page.category})
                </option>
              ))}
            </select>
          </div>
        )}

        {(connectedPlatforms.includes('youtube') && youtubeChannels.length > 0) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <h4 className="font-medium text-red-900 mb-2">YouTube Channel Selection</h4>
            <p className="text-red-700 text-sm mb-3">Choose your default YouTube channel for publishing:</p>
            <select
              value={selectedYoutubeChannel}
              onChange={(e) => setSelectedYoutubeChannel(e.target.value)}
              className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {youtubeChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.snippet.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
