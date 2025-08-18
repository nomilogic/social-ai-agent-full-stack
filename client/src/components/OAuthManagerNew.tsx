import React from 'react';
import { Check, ExternalLink, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { useOAuthManager } from '../hooks/useOAuthManager';
import { Platform } from '../types';

interface OAuthManagerProps {
  userId: string;
  platforms: Platform[];
  onCredentialsUpdate?: () => void;
}

export const OAuthManager: React.FC<OAuthManagerProps> = ({
  userId,
  platforms,
  onCredentialsUpdate
}) => {
  const {
    connections,
    loading,
    error,
    connectPlatform,
    disconnectPlatform,
    isConnected
  } = useOAuthManager(userId);

  const handleConnect = async (platform: Platform) => {
    try {
      await connectPlatform(platform);
      onCredentialsUpdate?.();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      await disconnectPlatform(platform);
      onCredentialsUpdate?.();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const getPlatformDisplayName = (platform: Platform): string => {
    const names: Record<Platform, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'Twitter/X',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok',
      youtube: 'YouTube'
    };
    return names[platform];
  };

  const getPlatformColor = (platform: Platform): string => {
    const colors: Record<Platform, string> = {
      facebook: 'blue',
      instagram: 'pink',
      twitter: 'blue',
      linkedin: 'blue',
      tiktok: 'black',
      youtube: 'red'
    };
    return colors[platform];
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
        Connect your social media accounts to enable direct publishing.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {platforms.map((platform) => (
          <div
            key={platform}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm bg-${getPlatformColor(platform)}-600`}
              >
                {platform.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  {getPlatformDisplayName(platform)}
                </h4>
                <div className="flex items-center space-x-2">
                  {isConnected(platform) ? (
                    <div className="flex items-center text-green-600 text-sm">
                      <Check className="w-4 h-4 mr-1" />
                      Connected
                      {connections[platform]?.username && (
                        <span className="ml-1 text-gray-500">
                          ({connections[platform].username})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Not connected</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isConnected(platform) ? (
                <>
                  <button
                    onClick={() => handleDisconnect(platform)}
                    className="p-2 text-gray-500 hover:text-red-600 disabled:opacity-50"
                    title="Disconnect"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(platform)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Connect</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-800">Enhanced OAuth Manager</h4>
            <p className="text-sm text-blue-700 mt-1">
              This app is using the centralized OAuth Manager service for secure and reliable social media connections.
            </p>
            <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
              <li>All tokens are securely stored and automatically refreshed</li>
              <li>Support for multiple platforms with consistent behavior</li>
              <li>Unified API for all social media providers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
