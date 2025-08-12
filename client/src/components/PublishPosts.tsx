import React, { useState, useEffect } from 'react';
import { GeneratedPost, Platform } from '../types';
import { postToAllPlatforms } from '../lib/socialPoster';
import { SocialMediaManager } from './SocialMediaManager';
import { socialMediaAPI } from '../lib/socialMediaApi';

interface PublishProps {
  posts: GeneratedPost[];
  userId?: string;
  onBack: () => void;
}

export const PublishPosts: React.FC<PublishProps> = ({ posts, userId, onBack }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(posts.map(p => p.platform));
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [publishProgress, setPublishProgress] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  useEffect(() => {
    console.log('Publishing posts for user:', userId);
    //alert('Publishing posts for user: ' + userId);
    checkConnectedPlatforms();
    
  }, [userId, posts]);

  const checkConnectedPlatforms = async () => {
    try {
      // Use the server API to check OAuth status
      const response = await fetch(`/api/oauth/status/${userId}`);
      const statusData = await response.json();
      
      const connected: Platform[] = [];
      for (const post of posts) {
        if (statusData[post.platform]?.connected) {
          connected.push(post.platform);
        }
      }
      setConnectedPlatforms(connected);
    } catch (error) {
      console.error('Failed to check connected platforms:', error);
      setConnectedPlatforms([]);
    }
  };

  const handlePublish = async () => {
    // Check if any selected platforms are not connected
    const unconnectedPlatforms = selectedPlatforms.filter(p => !connectedPlatforms.includes(p));
    
    if (unconnectedPlatforms.length > 0) {
      setError(`Please connect your ${unconnectedPlatforms.join(', ')} account(s) first before publishing.`);
      return;
    }
    
    setPublishing(true);
    setError(null);
    setPublishProgress({});
    
    try {
      const selectedPosts = posts.filter(post => selectedPlatforms.includes(post.platform));
      
      const publishResults = await postToAllPlatforms(
        userId || '',
        selectedPosts,
        (platform, status) => {
          setPublishProgress(prev => ({ ...prev, [platform]: status }));
        }
      );
      
      setResults(publishResults);
    } catch (err: any) {
      setError(err.message || 'Failed to publish posts.');
    } finally {
      setPublishing(false);
    }

  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Publish Your Posts</h2>
      <p className="mb-6 text-gray-600">Connect your social media accounts and publish your AI-generated posts directly.</p>
      
      {/* Connection Status Alert */}
      {posts.some(post => !connectedPlatforms.includes(post.platform)) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-blue-800 font-medium mb-2">📱 Connect Your Accounts</h3>
          <p className="text-blue-700 text-sm mb-3">
            You need to connect your social media accounts before publishing. Click the "Connect" buttons below.
          </p>
          <div className="text-sm text-blue-600">
            <strong>Platforms needing connection:</strong> {' '}
            {posts
              .filter(post => !connectedPlatforms.includes(post.platform))
              .map(post => post.platform)
              .join(', ')}
          </div>
        </div>
      )}

      {/* Social Media Connection Management */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4 text-gray-900">Social Media Accounts</h3>
        <SocialMediaManager
          userId={userId || ''}
          onCredentialsUpdate={checkConnectedPlatforms}
        />
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-4">Select Platforms to Publish:</h3>
        <div className="space-y-3">
          {posts.map(post => {
            const isConnected = connectedPlatforms.includes(post.platform);
            const progress = publishProgress[post.platform];
            
            return (
              <label key={post.platform} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                !isConnected ? 'border-gray-200 bg-gray-50' : 
                selectedPlatforms.includes(post.platform) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(post.platform)}
                  disabled={!isConnected}
                  onChange={e => {
                    setSelectedPlatforms(prev =>
                      e.target.checked
                        ? [...prev, post.platform]
                        : prev.filter(p => p !== post.platform)
                    );
                  }}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="capitalize font-medium text-gray-900">{post.platform}</span>
                    {isConnected ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">Connected</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex-shrink-0">Not Connected</span>
                    )}
                    {progress && (
                      <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                        progress === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        progress === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {progress === 'pending' ? 'Publishing...' : 
                         progress === 'success' ? 'Published' : 'Failed'}
                      </span>
                    )}
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-gray-500 mt-1">
                      Connect your {post.platform} account above to enable publishing
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        className={`py-3 px-6 rounded-lg font-medium shadow transition-all duration-200 ${
          selectedPlatforms.length === 0 || selectedPlatforms.every(p => !connectedPlatforms.includes(p))
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : publishing
            ? 'bg-blue-400 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
        }`}
        onClick={handlePublish}
        disabled={publishing || selectedPlatforms.length === 0 || selectedPlatforms.every(p => !connectedPlatforms.includes(p))}
      >
        {publishing 
          ? 'Publishing...' 
          : selectedPlatforms.length === 0 
            ? 'Select platforms to publish'
            : selectedPlatforms.every(p => !connectedPlatforms.includes(p))
              ? 'Connect accounts first'
              : `Publish to ${selectedPlatforms.filter(p => connectedPlatforms.includes(p)).length} Connected Platform${selectedPlatforms.filter(p => connectedPlatforms.includes(p)).length === 1 ? '' : 's'}`
        }
      </button>
      
      {selectedPlatforms.length === 0 && (
        <p className="mt-2 text-sm text-gray-500">Please select at least one connected platform to publish.</p>
      )}
      
      {selectedPlatforms.length > 0 && selectedPlatforms.every(p => !connectedPlatforms.includes(p)) && (
        <p className="mt-2 text-sm text-gray-500">Please connect to at least one selected platform to publish.</p>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      {results && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3 text-green-700">✅ Publishing Results:</h3>
          <div className="space-y-3">
            {Object.entries(results).map(([platform, result]: [string, any]) => (
              <div key={platform} className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 capitalize">{platform}</h4>
                <p className="text-green-600 text-sm">{result.message}</p>
                <p className="text-green-500 text-xs">Post ID: {result.postId}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <button
        className="mt-8 w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
        onClick={onBack}
      >
        Back to Preview
      </button>
    </div>
  );
};
