
import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  Users, 
  Video,
  Camera,
  MessageCircle,
  Music,
  Play
} from 'lucide-react';
import { Platform } from '../types';
import { oauthManager } from '../lib/oauth';

interface SocialMediaManagerProps {
  userId: string;
  onCredentialsUpdate?: () => void;
}

interface PlatformStatus {
  platform: Platform;
  connected: boolean;
  loading: boolean;
  error?: string;
  profile?: any;
}

interface PlatformInfo {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  features: string[];
}

const platformInfo: Record<Platform, PlatformInfo> = {
  linkedin: {
    name: 'LinkedIn',
    icon: Users,
    color: 'blue',
    description: 'Professional networking and business content',
    features: ['Text posts', 'Image posts', 'Professional networking']
  },
  facebook: {
    name: 'Facebook',
    icon: MessageCircle,
    color: 'blue',
    description: 'Social networking and community engagement',
    features: ['Text posts', 'Image posts', 'Page management', 'Community building']
  },
  instagram: {
    name: 'Instagram',
    icon: Camera,
    color: 'pink',
    description: 'Visual storytelling and lifestyle content',
    features: ['Image posts', 'Carousel posts', 'Stories', 'Business accounts']
  },
  twitter: {
    name: 'Twitter/X',
    icon: MessageCircle,
    color: 'sky',
    description: 'Real-time news and microblogging',
    features: ['Text tweets', 'Image tweets', 'Thread creation', 'Real-time updates']
  },
  tiktok: {
    name: 'TikTok',
    icon: Music,
    color: 'black',
    description: 'Short-form video content creation',
    features: ['Video posts', 'Trending content', 'Creative tools', 'Music integration']
  },
  youtube: {
    name: 'YouTube',
    icon: Play,
    color: 'red',
    description: 'Long-form video content and education',
    features: ['Video uploads', 'Channel management', 'Monetization', 'Analytics']
  }
};

export const SocialMediaManager: React.FC<SocialMediaManagerProps> = ({
  userId,
  onCredentialsUpdate
}) => {
  const [platformStatuses, setPlatformStatuses] = useState<PlatformStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const platforms: Platform[] = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube'];

  useEffect(() => {
    checkPlatformStatuses();
  }, [userId]);

  const checkPlatformStatuses = async () => {
    console.log('Checking platform statuses for user:', userId);
    setLoading(true);
    const statuses: PlatformStatus[] = [];

    for (const platform of platforms) {
      try {
        // Use the same OAuth manager that's working
        const connected = await oauthManager.hasValidCredentials(userId, platform);
        
        // Get profile data if connected
        let profile = null;
        if (connected) {
          try {
            const credentials = await oauthManager.getCredentials(userId, platform);
            if (credentials) {
              // You can fetch profile data here using the access token
              // This would depend on your API implementation
              profile = { name: 'Connected User' }; // Placeholder
            }
          } catch (error) {
            console.warn(`Failed to fetch ${platform} profile:`, error);
          }
        }
        
        statuses.push({
          platform,
          connected,
          loading: false,
          profile
        });
      } catch (error) {
        console.error(`Error checking ${platform}:`, error);
        statuses.push({
          platform,
          connected: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setPlatformStatuses(statuses);
    setLoading(false);
  };

  const handleConnect = async (platform: Platform) => {
    console.log('Connecting to platform:', platform);
    try {
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { ...status, loading: true, error: undefined }
            : status
        )
      );

      // Use the same OAuth flow that's working in OAuthManager
      const authUrl = oauthManager.generateAuthUrl(platform, userId);
      console.log('Opening OAuth popup with URL:', authUrl);
      
      const authWindow = window.open(
        authUrl,
        `${platform}_oauth`,
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        throw new Error('OAuth popup blocked');
      }

      // Listen for messages from the OAuth callback
      const messageListener = (event: MessageEvent) => {
        if (event.data.type === 'oauth_success' && event.data.platform === platform) {
          console.log('OAuth success for', platform);
          setTimeout(checkPlatformStatuses, 1000);
          window.removeEventListener('message', messageListener);
          onCredentialsUpdate?.();
        } else if (event.data.type === 'oauth_error') {
          setPlatformStatuses(prev =>
            prev.map(status =>
              status.platform === platform
                ? { 
                    ...status, 
                    loading: false, 
                    error: event.data.error || 'OAuth failed'
                  }
                : status
            )
          );
          window.removeEventListener('message', messageListener);
        }
      };

      window.addEventListener('message', messageListener);

      // Monitor window closure
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          setTimeout(checkPlatformStatuses, 1000);
        }
      }, 1000);

    } catch (error) {
      console.error('Error connecting to platform:', error);
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { 
                ...status, 
                loading: false, 
                error: error instanceof Error ? error.message : 'Connection failed' 
              }
            : status
        )
      );
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platformInfo[platform].name}?`)) {
      return;
    }

    try {
      // Use the same OAuth manager for disconnecting
      await oauthManager.revokeCredentials(userId, platform);
      
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { ...status, connected: false, error: undefined, profile: undefined }
            : status
        )
      );

      onCredentialsUpdate?.();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleRefresh = async (platform: Platform) => {
    try {
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { ...status, loading: true, error: undefined }
            : status
        )
      );

      // Use the same OAuth manager for refreshing
      const credentials = await oauthManager.getCredentials(userId, platform);
      if (credentials) {
        await oauthManager.refreshToken(userId, platform, credentials);
      }
      
      await checkPlatformStatuses();
      onCredentialsUpdate?.();
    } catch (error) {
      setPlatformStatuses(prev =>
        prev.map(status =>
          status.platform === platform
            ? { 
                ...status, 
                loading: false, 
                error: error instanceof Error ? error.message : 'Refresh failed' 
              }
            : status
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Connections</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Checking connections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Connections</h3>
      <p className="text-sm text-gray-600 mb-6">
        Connect your social media accounts to enable direct publishing across all platforms.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {platformStatuses.map((status) => {
          const info = platformInfo[status.platform];
          const IconComponent = info.icon;

          return (
            <div
              key={status.platform}
              className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start space-x-3 flex-1">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${
                  info.color === 'blue' ? 'bg-blue-600' :
                  info.color === 'pink' ? 'bg-pink-600' :
                  info.color === 'sky' ? 'bg-sky-600' :
                  info.color === 'black' ? 'bg-gray-900' :
                  info.color === 'red' ? 'bg-red-600' :
                  'bg-blue-600'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {info.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {info.description}
                  </p>
                  
                  {/* Connection Status */}
                  <div className="flex items-center space-x-2 mb-2">
                    {status.connected ? (
                      <div className="flex items-center text-green-600 text-sm">
                        <Check className="w-4 h-4 mr-1" />
                        Connected
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Not connected</span>
                    )}
                    {status.error && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        <span className="truncate max-w-32">{status.error}</span>
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  {status.profile && status.profile.name && (
                    <div className="text-xs text-gray-500 mb-2">
                      <span>✓ {status.profile.name}</span>
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-1">
                    {info.features.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {info.features.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{info.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-3">
                {status.connected ? (
                  <>
                    <button
                      onClick={() => handleRefresh(status.platform)}
                      disabled={status.loading}
                      className="p-2 text-gray-500 hover:text-blue-600 disabled:opacity-50"
                      title="Refresh connection"
                    >
                      <RefreshCw className={`w-4 h-4 ${status.loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDisconnect(status.platform)}
                      disabled={status.loading}
                      className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(status.platform)}
                    disabled={status.loading}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status.loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    <span>Connect</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Getting Started</h4>
            <p className="text-sm text-blue-700 mt-1">
              To connect your social media accounts:
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
              <li>Click "Connect" on any platform above</li>
              <li>Log in with your social media account</li>
              <li>Authorize the app to post on your behalf</li>
              <li>Start publishing AI-generated content instantly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Connected Platforms Summary */}
      {platformStatuses.filter(s => s.connected).length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ You have {platformStatuses.filter(s => s.connected).length} platform(s) connected and ready for publishing!
          </p>
        </div>
      )}
    </div>
  );
};
