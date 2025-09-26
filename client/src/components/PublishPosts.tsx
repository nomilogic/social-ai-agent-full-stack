import React, { useState, useEffect } from 'react';
import { GeneratedPost, Platform } from '../types';
import { postToAllPlatforms } from '../lib/socialPoster';
import { SocialMediaManager } from './SocialMediaManager';
import { socialMediaAPI } from '../lib/socialMediaApi';
import { oauthManagerClient } from '../lib/oauthManagerClient';
import Icon from './Icon';
import { RefreshCw, Trash2 } from 'lucide-react';

interface PublishProps {
  posts: GeneratedPost[];
  userId?: string;
  onBack: () => void;
  onReset?: () => void;
}

export const PublishPosts: React.FC<PublishProps> = ({ posts, userId, onBack, onReset }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(posts.map(p => p.platform));
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [publishProgress, setPublishProgress] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [connectingPlatforms, setConnectingPlatforms] = useState<Platform[]>([]);
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [youtubeChannels, setYoutubeChannels] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string>('');
  const [selectedYoutubeChannel, setSelectedYoutubeChannel] = useState<string>('');
  const [publishedPlatforms, setPublishedPlatforms] = useState<Platform[]>([]);

  useEffect(() => {
    console.log('Publishing posts for user:', userId);
    //alert('Publishing posts for user: ' + userId);
    checkConnectedPlatforms();
    
  }, [userId, posts]);

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
      for (const post of posts) {
        if (statusData[post.platform]?.connected) {
          connected.push(post.platform);
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
      // if (
      //   !confirm(
      //     `Are you sure you want to disconnect ${getPlatformDisplayName(platform)}?`,
      //   )
      // ) {
      //   return;
      // }
  
      try {
        // Use the OAuth manager client for disconnecting (uses JWT authentication)
        await oauthManagerClient.disconnectPlatform(platform);
  
          checkConnectedPlatforms();
         // window.removeEventListener("message", messageListener);
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    };

  const handlePublish = async () => {
    // Filter to only connected platforms that are selected and not already published
    const availablePlatforms = selectedPlatforms.filter(p => 
      connectedPlatforms.includes(p) && !publishedPlatforms.includes(p)
    );
    
    if (availablePlatforms.length === 0) {
      setError(`No available platforms to publish to. All connected platforms have been published or none are selected.`);
      return;
    }
    
    setPublishing(true);
    setError(null);
    setPublishProgress({});
    
    try {
      // Only process posts for available platforms (connected and not published)
      const selectedPosts = posts.filter(post => 
        availablePlatforms.includes(post.platform)
      );
      
      console.log(`Publishing to ${availablePlatforms.length} platforms: ${availablePlatforms.join(', ')}`);
      
      // Get thumbnail URL from YouTube post for context
      const youtubePost = selectedPosts.find(post => post.platform === 'youtube');
      const thumbnailUrl = youtubePost?.thumbnailUrl;
      
      const publishResults = await postToAllPlatforms(
        selectedPosts,
        (platform, status) => {
          setPublishProgress(prev => ({ ...prev, [platform]: status }));
          
          // If successful, immediately disable and unselect the platform
          if (status === 'success') {
            setPublishedPlatforms(prev => [...prev, platform as Platform]);
            setSelectedPlatforms(prev => prev.filter(p => p !== platform));
          }
        },
        {
          facebookPageId: selectedFacebookPage || undefined,
          youtubeChannelId: selectedYoutubeChannel || undefined,
          thumbnailUrl: thumbnailUrl || undefined
        }
      );
      
      setResults(publishResults);
      
      // Check if all originally selected connected platforms have been published
      const originalConnectedPlatforms = posts
        .map(p => p.platform)
        .filter(p => connectedPlatforms.includes(p));
      
      const newlyPublished = Object.entries(publishResults)
        .filter(([key, result]) => key !== '_summary' && result.success)
        .map(([platform]) => platform as Platform);
      
      const allPublishedPlatforms = [...publishedPlatforms, ...newlyPublished];
      
      // Check if all connected platforms have been published
      const allConnectedPlatformsPublished = originalConnectedPlatforms.every(p => 
        allPublishedPlatforms.includes(p)
      );
      
      if (allConnectedPlatformsPublished && onReset) {
        console.log('All connected platforms published successfully, triggering reset workflow in 3 seconds...');
        setTimeout(() => {
          onReset();
        }, 3000);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to publish posts.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="theme-bg-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
      
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Publish Your Posts</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Connect your social media accounts and publish your AI-generated posts directly.
        </p>

        {/* Connection Status Alert */}
        {posts.some(post => !connectedPlatforms.includes(post.platform)) && (
          <div className="mb-8 p-4 theme-bg-quaternary rounded-xl border border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5">
               <Icon name="connect-accounts"  size={60} className="inline mr-1" />
              </div>
              <div>
                <h3 className="font-semibold theme-text-secondary mb-1">Connect Your Accounts</h3>
                <p className="text-sm theme-text-secondary leading-relaxed">
                  You need to connect your social media accounts before publishing. Click the
                  Connect buttons below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Platforms Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Select Platforms to Publish:</h2>
              <p className="text-sm text-gray-600">
                Connect your social media accounts to enable direct publishing across all platforms.
              </p>
            </div>
          {connectedPlatforms.filter(p => !publishedPlatforms.includes(p)).length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedPlatforms(connectedPlatforms.filter(p => !publishedPlatforms.includes(p)))}
                className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedPlatforms([])}
                className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Deselect All
              </button>
            </div>
          )}
          </div>
          
          {/* Selection Summary */}
          {connectedPlatforms.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">{selectedPlatforms.filter(p => connectedPlatforms.includes(p) && !publishedPlatforms.includes(p)).length}</span> of <span className="font-medium">{connectedPlatforms.filter(p => !publishedPlatforms.includes(p)).length}</span> available platforms selected for publishing
              </p>
              {publishedPlatforms.length > 0 && (
                <p className="text-sm text-green-800 mt-1">
                  <span className="font-medium">{publishedPlatforms.length}</span> platforms already published: {publishedPlatforms.join(', ')}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {posts.map(post => {
              const isConnected = connectedPlatforms.includes(post.platform);
              const isConnecting = connectingPlatforms.includes(post.platform);
              const progress = publishProgress[post.platform];
              
              return (
                <div key={post.platform} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Platform Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                      post.platform === 'linkedin' ? 'bg-blue-600' :
                      post.platform === 'facebook' ? 'bg-blue-700' :
                      post.platform === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                      post.platform === 'twitter' ? 'bg-black' :
                      post.platform === 'youtube' ? 'bg-red-600' :
                      post.platform === 'tiktok' ? 'bg-black' :
                      'bg-gray-600'
                    }`}>
                      {post.platform === 'linkedin' && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      {post.platform === 'facebook' && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      {post.platform === 'instagram' && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {(post.platform === 'twitter' || post.platform === 'x') && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      {!['linkedin', 'facebook', 'instagram', 'twitter', 'x'].includes(post.platform) && (
                        <span className="text-lg font-bold uppercase">
                          {post.platform.substring(0, 2)}
                        </span>
                      )}
                    </div>
                    
                    {/* Platform Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {post.platform === 'x' ? 'X (Twitter)' : post.platform}
                      </h4>
                      <p className={`text-sm ${
                        isConnected ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </p>
                      {progress && (
                        <p className={`text-xs mt-1 ${
                          progress === 'pending' ? 'text-yellow-600' :
                          progress === 'success' ? 'text-green-600' :
                          'text-red-600'
                        }`}>
                          {progress === 'pending' ? 'Publishing...' : 
                           progress === 'success' ? 'Published' : 'Failed'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Platform Selection Checkbox and Status */}
                  <div className="flex items-center gap-3">
                    {/* Connection Status Icon */}
                    {/* <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isConnected ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8 9.414l-1.707 1.707a1 1 0 101.414 1.414L9 11.828l1.293 1.293a1 1 0 001.414-1.414L10.414 10.414l1.293-1.293a1 1 0 00-1.414-1.414L9 9.414 7.707 8.121a1 1 0 00-1.414 1.414L7.586 10.414 6.293 11.707a1 1 0 101.414 1.414L9 11.828l1.293 1.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div> */}
                    {isConnected ? (
                  <>
                    <button
                      onClick={() => handleConnect(post.platform)}
                      disabled={isConnecting} 
                      className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50 rounded-lg hover:bg-gray-100"
                      title="Refresh connection"
                    >
                      <RefreshCw
                        className={`w-4 h-4`}
                      />
                    </button>
                    <button
                      onClick={() => handleDisconnect(post.platform)}
                      disabled={isConnecting}
                      className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50 rounded-lg hover:bg-gray-100"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <> </>
                )
              }

                    {/* Platform Selection and Connect Controls */}

                    <div className="flex items-center gap-2">
                      {/* Checkbox - Only show if connected and not published */}
                      {isConnected && !publishedPlatforms.includes(post.platform) && (
                        <label className="flex items-center cursor-pointer" htmlFor={`platform-${post.platform}`}>
                          <div className="relative">
                            <input className="text-green-500 focus:ring-green-400 sr-only"
                              type="checkbox"
                              checked={selectedPlatforms.includes(post.platform)}
                              onChange={e => {
                                setSelectedPlatforms(prev =>
                                  e.target.checked
                                    ? [...prev, post.platform]
                                    : prev.filter(p => p !== post.platform)
                                );
                              }}
                              id={`platform-${post.platform}`}
                            />
                            <div className={`w-6 h-6 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                              selectedPlatforms.includes(post.platform)
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 hover:border-blue-500'
                            }`}>
                              {selectedPlatforms.includes(post.platform) && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </label>
                      )}
                      
                      {/* Published indicator - Show when platform is published */}
                      {isConnected && publishedPlatforms.includes(post.platform) && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>PUBLISHED</span>
                        </div>
                      )}
                      
                      {/* Connect Button - Only show when not connected */}
                      {!isConnected && (
                        <button
                          onClick={() => handleConnect(post.platform)}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Hidden Social Media Manager */}
        <div className="hidden">
          <SocialMediaManager
            userId={userId || ''}
            onCredentialsUpdate={checkConnectedPlatforms}
          />
        </div>
        {/* Platform-specific options (if needed) */}
        {(connectedPlatforms.includes('facebook') && selectedPlatforms.includes('facebook') && facebookPages.length > 0) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-medium text-blue-900 mb-2">Facebook Page Selection</h4>
            <p className="text-blue-700 text-sm mb-3">Choose which Facebook page to post to:</p>
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

        {(connectedPlatforms.includes('youtube') && selectedPlatforms.includes('youtube') && youtubeChannels.length > 0) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <h4 className="font-medium text-red-900 mb-2">YouTube Channel Selection</h4>
            <p className="text-red-700 text-sm mb-3">Choose which YouTube channel to upload to:</p>
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

        {/* Main Publish Button */}
        <button
          onClick={handlePublish}
          disabled={publishing || selectedPlatforms.filter(p => connectedPlatforms.includes(p) && !publishedPlatforms.includes(p)).length === 0}
          className={`w-full rounded-full py-2 px-4 font-medium theme-text-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            selectedPlatforms.filter(p => connectedPlatforms.includes(p) && !publishedPlatforms.includes(p)).length === 0
              ? 'bg-gray-400'
              : publishing
              ? 'theme-bg-trinary'
              : 'theme-bg-success'
          }`}
        >
          {publishing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>PUBLISHING...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>
                {selectedPlatforms.filter(p => connectedPlatforms.includes(p) && !publishedPlatforms.includes(p)).length === 0
                  ? publishedPlatforms.length > 0 
                    ? 'ALL SELECTED PLATFORMS PUBLISHED'
                    : 'SELECT PLATFORMS TO PUBLISH'
                  : 'PUBLISH TO PLATFORMS'
                }
              </span>
            </div>
          )}
        </button>
        
        {/* Helper text */}
        {selectedPlatforms.filter(p => connectedPlatforms.includes(p) && !publishedPlatforms.includes(p)).length === 0 && publishedPlatforms.length === 0 && (
          <p className="mt-3 text-sm text-gray-500 text-center">
            Please select at least one connected platform to publish.
          </p>
        )}
        
        {publishedPlatforms.length > 0 && selectedPlatforms.filter(p => connectedPlatforms.includes(p) && !publishedPlatforms.includes(p)).length === 0 && (
          <p className="mt-3 text-sm text-green-600 text-center font-medium">
            All selected platforms have been published successfully! 
            {connectedPlatforms.filter(p => !publishedPlatforms.includes(p)).length === 0 
              ? 'Returning to content creation...' 
              : `You can select from ${connectedPlatforms.filter(p => !publishedPlatforms.includes(p)).length} remaining platforms.`
            }
          </p>
        )}
        
        {/* Publishing Results */}
        {results && (
          <div className="mt-8">
            <h3 className="font-semibold mb-4 text-gray-900">Publishing Results:</h3>
            
            {/* Summary */}
            {results._summary && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{results._summary.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results._summary.successful}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{results._summary.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Individual Results */}
            <div className="space-y-3">
              {Object.entries(results)
                .filter(([key]) => key !== '_summary')
                .map(([platform, result]: [string, any]) => (
                  <div key={platform} className={`border rounded-xl p-4 ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-medium capitalize ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.success ? '✅' : '❌'} {platform}
                      </h4>
                      {result.success && result.postId && (
                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-lg">
                          ID: {result.postId}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${
                      result.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.message || result.error}
                    </p>
                    {!result.success && result.retryable && (
                      <p className="text-xs text-amber-600 mt-1">
                        💡 This error might be temporary - you can try again
                      </p>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
