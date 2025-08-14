import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Target, BarChart3, Calendar, Settings, Zap } from 'lucide-react';
import { CampaignSelector } from '../components/CampaignSelector';
import { CampaignSetup } from '../components/CampaignSetup';
import { CampaignDashboard } from '../components/CampaignDashboard';
import { useAppContext } from '../context/AppContext';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import { FeatureRestriction } from '../components/FeatureRestriction';
import { BotTrainingQuestionnaire } from '../components/BotTrainingQuestionnaire';

export const CampaignsPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const { hasCampaigns, maxCampaigns, hasBotTraining } = usePlanFeatures();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const handleCreateCampaign = () => {
    navigate('/campaigns/new');
  };

  const handleSelectCampaign = (campaign: any) => {
    const campaignData = { 
      ...campaign, 
      id: campaign.id!,
      isActive: campaign.status === 'active',
      profileId: state.selectedProfile?.id || ''
    };
    dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
    navigate(`/campaigns/${campaign.id}`);
  };

  const handleEditCampaign = (campaign: any) => {
    const campaignData = { 
      ...campaign, 
      id: campaign.id!,
      isActive: campaign.status === 'active',
      profileId: state.selectedProfile?.id || ''
    };
    dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
    navigate(`/campaigns/${campaign.id}/edit`);
  };

  const handleQuestionnaireComplete = async (responses: Record<string, string>) => {
    try {
      // Save training data to improve AI recommendations
      const response = await fetch('/api/training/bot-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: state.user?.id,
          responses,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        console.log('Bot training data saved successfully');
      }
    } catch (error) {
      console.error('Error saving bot training data:', error);
    }
  };

  // Randomly show questionnaire for bot training (every 10th visit)
  React.useEffect(() => {
    if (hasBotTraining && Math.random() < 0.1) {
      const lastShown = localStorage.getItem('lastQuestionnaireShown');
      const now = new Date().getTime();
      const daysSinceLastShown = lastShown ? (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24) : 999;
      
      if (daysSinceLastShown > 7) { // Show at most once a week
        setTimeout(() => setShowQuestionnaire(true), 3000);
        localStorage.setItem('lastQuestionnaireShown', now.toString());
      }
    }
  }, [hasBotTraining]);

  if (!hasCampaigns) {
    return (
      <div className="min-h-screen theme-gradient">
        <div className="min-h-screen theme-bg-primary backdrop-blur-sm p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <FeatureRestriction feature="Campaign Management" requiredPlan="ipro">
              <div className="theme-bg-card rounded-xl p-8 text-center">
                <Target className="w-16 h-16 theme-text-secondary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold theme-text-primary mb-4">Campaign Management</h3>
                <p className="theme-text-secondary mb-6">
                  Organize your content with targeted campaigns, track performance, and optimize your social media strategy.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="theme-bg-secondary p-4 rounded-lg">
                    <BarChart3 className="w-8 h-8 theme-text-primary mx-auto mb-2" />
                    <div className="font-medium theme-text-primary">Performance Tracking</div>
                    <div className="theme-text-secondary">Real-time analytics</div>
                  </div>
                  <div className="theme-bg-secondary p-4 rounded-lg">
                    <Calendar className="w-8 h-8 theme-text-primary mx-auto mb-2" />
                    <div className="font-medium theme-text-primary">Advanced Scheduling</div>
                    <div className="theme-text-secondary">Multi-week planning</div>
                  </div>
                  <div className="theme-bg-secondary p-4 rounded-lg">
                    <Zap className="w-8 h-8 theme-text-primary mx-auto mb-2" />
                    <div className="font-medium theme-text-primary">AI Optimization</div>
                    <div className="theme-text-secondary">Smart recommendations</div>
                  </div>
                </div>
              </div>
            </FeatureRestriction>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-gradient">
      <div className="min-h-screen theme-bg-primary backdrop-blur-sm p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route 
              path="/" 
              element={
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold theme-text-primary">Campaigns</h1>
                      <p className="theme-text-secondary mt-2">
                        Organize your content with targeted campaigns. 
                        {maxCampaigns > 0 && ` You can create up to ${maxCampaigns} campaigns.`}
                        {maxCampaigns === -1 && ' Create unlimited campaigns.'}
                      </p>
                    </div>
                    <button
                      onClick={handleCreateCampaign}
                      className="flex items-center space-x-2 theme-gradient text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Campaign</span>
                    </button>
                  </div>
                  
                  <CampaignSelector
                    companyId={state.selectedProfile?.id || state.user?.id || ''}
                    onSelectCampaign={handleSelectCampaign}
                    onCreateNew={handleCreateCampaign}
                    onEditCampaign={handleEditCampaign}
                  />
                </div>
              } 
            />
            <Route 
              path="new" 
              element={
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold theme-text-primary">Create New Campaign</h1>
                    <p className="theme-text-secondary mt-2">Set up a new marketing campaign with specific goals and content strategy.</p>
                  </div>
                  <CampaignSetup
                    companyId={state.selectedProfile?.id || state.user?.id || ''}
                    onComplete={(campaign: any) => {
                      dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: { ...campaign, isActive: campaign.status === 'active' } });
                      navigate(`/campaigns/${campaign.id}`);
                    }}
                    onCancel={() => navigate('/campaigns')}
                  />
                </div>
              } 
            />
            <Route 
              path=":campaignId" 
              element={
                <div className="space-y-6">
                  <CampaignDashboard
                    campaign={state.selectedCampaign!}
                    onEditCampaign={() => navigate(`/campaigns/${state.selectedCampaign?.id}/edit`)}
                    onCreatePost={() => navigate('/content')}
                    onViewPosts={() => navigate('/schedule')}
                    onBack={() => navigate('/campaigns')}
                  />
                </div>
              } 
            />
            <Route 
              path=":campaignId/edit" 
              element={
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold theme-text-primary">Edit Campaign</h1>
                    <p className="theme-text-secondary mt-2">Update your campaign settings and strategy.</p>
                  </div>
                  <CampaignSetup
                    companyId={state.selectedProfile?.id || state.user?.id || ''}
                    existingCampaign={state.selectedCampaign!}
                    onComplete={(campaign: any) => {
                      dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: { ...campaign, isActive: campaign.status === 'active' } });
                      navigate(`/campaigns/${campaign.id}`);
                    }}
                    onCancel={() => navigate(`/campaigns/${state.selectedCampaign?.id}`)}
                  />
                </div>
              } 
            />
          </Routes>

          {/* Bot Training Questionnaire */}
          <BotTrainingQuestionnaire
            isVisible={showQuestionnaire}
            onClose={() => setShowQuestionnaire(false)}
            onComplete={handleQuestionnaireComplete}
          />
        </div>
      </div>
    </div>
  );
};