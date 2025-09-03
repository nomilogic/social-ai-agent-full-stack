import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ProfileSetupFree } from './ProfileSetupFree';
import { ProfileSetupPro } from './ProfileSetupPro';
import { ProfileSetupBusiness } from './ProfileSetupBusiness';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface UnifiedProfileSetupProps {
  onComplete: () => void;
}

export const UnifiedProfileSetup: React.FC<UnifiedProfileSetupProps> = ({ onComplete }) => {
  const { state } = useAppContext();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Get the user's plan from the context
  const userPlan = state.userPlan || state.user?.plan || 'free';
  const isBusinessAccount = state.isBusinessAccount || state.user?.profile_type === 'business';

  // Clear error/success messages after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleComplete = () => {
    setSuccess('Profile setup completed successfully!');
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Determine which form to render based on user's plan and type
  const renderProfileForm = () => {
    if (isBusinessAccount || userPlan === 'business') {
      return <ProfileSetupBusiness onComplete={handleComplete} />;
    } else if (userPlan === 'ipro') {
      return <ProfileSetupPro onComplete={handleComplete} />;
    } else {
      return <ProfileSetupFree onComplete={handleComplete} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <p className="text-sm text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div>
              <p className="text-sm text-green-700 font-medium">Success</p>
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        )}

        {/* Plan Info Banner */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Setting up your {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} profile
              </h3>
              <p className="text-sm text-gray-600">
                {userPlan === 'free' && 'Basic features with 1 social platform'}
                {userPlan === 'ipro' && 'Advanced features with up to 3 platforms and enhanced AI'}
                {userPlan === 'business' && 'Full enterprise features with unlimited platforms'}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userPlan === 'free' ? 'bg-green-100 text-green-800' :
                userPlan === 'ipro' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {userPlan.toUpperCase()} {isBusinessAccount ? 'BUSINESS' : 'PLAN'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white shadow-xl rounded-lg p-6 sm:p-8">
          {renderProfileForm()}
        </div>

        {/* Plan Limitations Info */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Your plan includes:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {userPlan === 'free' && (
              <>
                <li>• 1 social media platform</li>
                <li>• Basic content generation</li>
                <li>• Standard templates</li>
              </>
            )}
            {userPlan === 'ipro' && (
              <>
                <li>• Up to 3 social media platforms</li>
                <li>• Advanced content generation</li>
                <li>• 4 social media goals</li>
                <li>• Enhanced AI features</li>
                <li>• Custom brand voice settings</li>
              </>
            )}
            {userPlan === 'business' && (
              <>
                <li>• Unlimited social media platforms</li>
                <li>• Enterprise-grade content generation</li>
                <li>• Team collaboration features</li>
                <li>• Custom integrations</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
