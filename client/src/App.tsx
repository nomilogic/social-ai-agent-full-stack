import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, LogOut, Bell } from 'lucide-react';
import { getCurrentUser, saveCompany, savePost, updateCompany } from './lib/database';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/AuthForm';
import { CompanySelector } from './components/CompanySelector';
import { ProgressBar } from './components/ProgressBar';
import { CompanySetup } from './components/CompanySetup';
import { ContentInput } from './components/ContentInput';
import { AIGenerator } from './components/AIGenerator';
import { PostPreview } from './components/PostPreview';
import { PublishPosts } from './components/PublishPosts';
import { OAuthCallback } from './components/OAuthCallback';
import { PostScheduleDashboard } from './components/PostScheduleDashboard';
import { CampaignSetup } from './components/CampaignSetup';
import { CampaignSelector } from './components/CampaignSelector';
import { CompanyDashboard } from './components/CompanyDashboard';
import { CampaignDashboard } from './components/CampaignDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { StepData } from './types';

type Step = 'auth' | 'company-select' | 'company-setup' | 'content' | 'generate' | 'preview' | 'publish' | 'schedule' | 'campaign-setup' | 'campaign-select' | 'company-dashboard' | 'campaign-dashboard';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<Step>('auth');
  const [stepData, setStepData] = useState<StepData>({});
  const [user, setUser] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  React.useEffect(() => {
    initializeAuth();

    // Listen for custom event to show the publish modal
    const handleShowPublishModal = (event: CustomEvent) => {
      setStepData(prev => ({ ...prev, generatedPosts: event.detail })); // Ensure generatedPosts is in stepData
      setShowPublishModal(true);
    };

    window.addEventListener('showPublishModal', handleShowPublishModal as EventListener);

    return () => {
      window.removeEventListener('showPublishModal', handleShowPublishModal as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_success') {
        console.log('OAuth succeeded:', event.data);
        // OAuth succeeded, refresh credentials or update UI
        // Example: checkPlatformStatuses();
      }
      if (event.data?.type === 'oauth_error') {
        // Handle OAuth error
        // Example: show error notification
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const initializeAuth = async () => {
    try {
      const currentUser = await getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        setCurrentStep('company-select');
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleAuthSuccess = (user: any) => {
    console.log('User authenticated:', user);
    setUser(user);
    setCurrentStep('company-select');
  };

  const stepLabels = ['Company', 'Content Input', 'AI Generation', 'Preview', 'Publish'];
  const stepIndex = ['company-select', 'content', 'generate', 'preview', 'publish'].indexOf(currentStep);

  const handleCompanyNext = (companyInfo: any) => {
    const saveAndContinue = async () => {
      try {
        if (user) {
          let savedCompany;
          if (selectedCompany?.id) {
            savedCompany = await updateCompany(selectedCompany.id, companyInfo, user.id);
          } else {
            savedCompany = await saveCompany(companyInfo, user.id);
          }
          setStepData(prev => ({
            ...prev,
            company: companyInfo,
            companyId: savedCompany.id
          }));
          setSelectedCompany(savedCompany);
        } else {
          setStepData(prev => ({ ...prev, company: companyInfo }));
        }
        setCurrentStep('content');
      } catch (error) {
        console.error('Error saving company:', error);
        // Continue anyway with local data
        setStepData(prev => ({ ...prev, company: companyInfo }));
        setCurrentStep('content');
      }
    };

    saveAndContinue();
  };

  const handleContentNext = (contentData: any) => {
    setStepData(prev => ({ ...prev, content: contentData }));
    setCurrentStep('generate');
  };

  const handleGenerationComplete = (posts: any[]) => {
    const saveAndContinue = async () => {
      try {
        if (user && stepData.companyId && stepData.content) {
          await savePost(stepData.companyId, stepData.content, posts, user.id);
        }
        setStepData(prev => ({ ...prev, generatedPosts: posts }));
        setCurrentStep('preview');
      } catch (error) {
        console.error('Error saving post:', error);
        setStepData(prev => ({ ...prev, generatedPosts: posts }));
        setCurrentStep('preview');
      }
    };
    saveAndContinue();
  };

  const handleGoToPublish = () => {
    // Trigger the custom event to show the publish modal
    const publishEvent = new CustomEvent('showPublishModal', { detail: stepData.generatedPosts });
    window.dispatchEvent(publishEvent);
  };


  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    setStepData(prev => ({ ...prev, company, companyId: company.id }));
    setCurrentStep('content');
  };

  const handleScheduleCompany = (company: any) => {
    setSelectedCompany(company);
    setStepData(prev => ({ ...prev, company, companyId: company.id }));
    setCurrentStep('schedule');
  };

  const handleCampaignCompany = (company: any) => {
    setSelectedCompany(company);
    setStepData(prev => ({ ...prev, company, companyId: company.id }));
    setCurrentStep('campaign-select');
  };

  const handleCreateNewCampaign = () => {
    setCurrentStep('campaign-setup');
  };

  const handleEditCampaign = (campaign: any) => {
    // Store the campaign data for editing
    setStepData(prev => ({ ...prev, selectedCampaign: campaign }));
    setCurrentStep('campaign-setup');
  };

  const handleSelectCampaign = (campaign: any) => {
    // Handle campaign selection for viewing/managing dashboard
    setStepData(prev => ({ ...prev, selectedCampaign: campaign }));
    setCurrentStep('campaign-dashboard');
  };

  // New dashboard handlers
  const handleDashboardCompany = (company: any) => {
    setSelectedCompany(company);
    setStepData(prev => ({ ...prev, company, companyId: company.id }));
    setCurrentStep('company-dashboard');
  };

  const handleDashboardCreatePost = () => {
    setCurrentStep('content');
  };

  const handleDashboardViewPosts = () => {
    // Navigate to posts view - could be a separate component or filtered view
    console.log('View posts for company:', selectedCompany);
  };

  const handleDashboardManageCampaigns = () => {
    setCurrentStep('campaign-select');
  };

  const handleDashboardSchedulePosts = () => {
    setCurrentStep('schedule');
  };

  const handleDashboardEditCompany = () => {
    setCurrentStep('company-setup');
  };

  const handleCampaignDashboardCreatePost = () => {
    // Set campaign context and create post
    setCurrentStep('content');
  };

  const handleCampaignDashboardViewPosts = () => {
    // Navigate to campaign-specific posts view
    console.log('View posts for campaign:', stepData.selectedCampaign);
  };

  const handleCampaignDashboardEditCampaign = () => {
    setCurrentStep('campaign-setup');
  };

  const handleCreateNewCompany = () => {
    setCurrentStep('company-setup');
  };

  const handleEditCompany = (company: any) => {
    setSelectedCompany(company);
    setCurrentStep('company-setup');
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'company-setup':
        setCurrentStep('company-select');
        break;
      case 'content':
        setCurrentStep('company-select');
        break;
      case 'generate':
        setCurrentStep('content');
        break;
      case 'preview':
        setCurrentStep('content');
        break;
      case 'publish':
        setCurrentStep('preview');
        break;
      case 'schedule':
        setCurrentStep('company-select');
        break;
      case 'campaign-select':
        setCurrentStep('company-select');
        break;
      case 'campaign-setup':
        setCurrentStep('campaign-select');
        break;
      case 'company-dashboard':
        setCurrentStep('company-select');
        break;
      case 'campaign-dashboard':
        setCurrentStep('campaign-select');
        break;
    }
  };

  const handleRegenerate = () => {
    setCurrentStep('generate');
  };

  const resetToStart = () => {
    setCurrentStep('company-select');
    setStepData({});
    setSelectedCompany(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentStep('auth');
    setStepData({});
    setSelectedCompany(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Social AI Agent</h2>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* OAuth callback routes */}
      <Route path="/oauth/:platform/callback" element={<OAuthCallback />} />
      
      {/* Main app routes */}
      <Route path="/*" element={
        !user ? (
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Social AI Agent</h1>
                <p className="text-sm text-gray-600">AI-Powered Social Media Content Generator</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-sm text-gray-600">
                  Welcome, {user.user_metadata?.name || user.email}
                </span>
              )}
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 hover:bg-gray-100 rounded-lg"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge - could be dynamic based on unread count */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
              </button>
              {currentStep !== 'company-select' && (
                <button
                  onClick={resetToStart}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Start Over</span>
              </button>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep !== 'company-select' && currentStep !== 'company-setup' && (
          <ProgressBar
            currentStep={stepIndex}
            totalSteps={4}
            stepLabels={stepLabels}
          />
        )}

        <div className="mt-8">
          {currentStep === 'company-select' && (
            <CompanySelector
              userId={user.id}
              onSelectCompany={handleSelectCompany}
              onScheduleCompany={handleScheduleCompany}
              onCampaignCompany={handleCampaignCompany}
              onDashboardCompany={handleDashboardCompany}
              onEditCompany={handleEditCompany}
              onCreateNew={handleCreateNewCompany}
            />
          )}

          {currentStep === 'company-setup' && (
            <CompanySetup
              onNext={handleCompanyNext}
              onBack={handleBack}
              initialData={selectedCompany}
            />
          )}

          {currentStep === 'content' && stepData.company && (
            <ContentInput
              onNext={handleContentNext}
              onBack={handleBack}
              initialData={stepData.content}
              selectedPlatforms={stepData.company.platforms}
            />
          )}

          {currentStep === 'generate' && stepData.company && stepData.content && (
            <AIGenerator
              companyInfo={stepData.company}
              contentData={stepData.content}
              onComplete={handleGenerationComplete}
            />
          )}

          {currentStep === 'preview' && stepData.generatedPosts && (
            <>
              <PostPreview
                posts={stepData.generatedPosts}
                onBack={handleBack}
                onRegenerate={handleRegenerate}
              />
              <div className="mt-8 flex justify-center">
                <button
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg font-bold shadow hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  onClick={handleGoToPublish}
                >
                  Publish Posts
                </button>
              </div>
            </>
          )}

          {currentStep === 'publish' && stepData.generatedPosts && (
            <PublishPosts
              posts={stepData.generatedPosts || []}
              userId={user?.id || ''}
              onBack={() => setCurrentStep('preview')}
            />
          )}

          {currentStep === 'schedule' && stepData.company && (
            <PostScheduleDashboard
              companyId={stepData.companyId}
              companyData={stepData.company}
            />
          )}

          {currentStep === 'campaign-select' && stepData.company && (
            <CampaignSelector
              companyId={stepData.companyId}
              onSelectCampaign={handleSelectCampaign}
              onCreateNew={handleCreateNewCampaign}
              onEditCampaign={handleEditCampaign}
            />
          )}

          {currentStep === 'campaign-setup' && stepData.company && (
            <CampaignSetup
              companyId={stepData.companyId}
              onNext={() => setCurrentStep('campaign-select')}
              onBack={handleBack}
              initialData={stepData.selectedCampaign}
            />
          )}

          {currentStep === 'company-dashboard' && stepData.company && (
            <CompanyDashboard
              companyData={stepData.company}
              onCreatePost={handleDashboardCreatePost}
              onViewPosts={handleDashboardViewPosts}
              onManageCampaigns={handleDashboardManageCampaigns}
              onSchedulePosts={handleDashboardSchedulePosts}
              onEditCompany={handleDashboardEditCompany}
              onBack={handleBack}
            />
          )}

          {currentStep === 'campaign-dashboard' && stepData.selectedCampaign && (
            <CampaignDashboard
              campaignData={stepData.selectedCampaign}
              companyData={stepData.company}
              onCreatePost={handleCampaignDashboardCreatePost}
              onViewPosts={handleCampaignDashboardViewPosts}
              onEditCampaign={handleCampaignDashboardEditCampaign}
              onBack={handleBack}
            />
          )}
        </div>
      </main>

      {/* Publish Modal */}
      {showPublishModal && stepData.generatedPosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <PublishPosts
              posts={stepData.generatedPosts}
              onBack={() => setShowPublishModal(false)}
               userId={user?.id || ''}
            />
          </div>
        </div>
      )}

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        userId={user?.id}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              © 2025 Social AI Agent. Powered by advanced AI for smarter social media content.
            </p>
            <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Privacy Policy</a>
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Terms of Service</a>
              <a href="#" className="hover:text-gray-700 transition-colors duration-200">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
        )
      } />
    </Routes>
  );
}

export default App;