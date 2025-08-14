import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CompanySelector } from '../components/CompanySelector';
import { ProfileSetup } from '../components/ProfileSetup';
import { CampaignSelector } from '../components/CampaignSelector';
import { CampaignSetup } from '../components/CampaignSetup';
import { CampaignDashboard } from '../components/CampaignDashboard';
import { useAppContext } from '../context/AppContext';
import { usePlanFeatures } from '../hooks/usePlanFeatures';
import { FeatureRestriction } from '../components/FeatureRestriction';

export const CompaniesPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const { hasCampaigns } = usePlanFeatures();

  const handleSelectCompany = (company: any) => {
    const companyData = {
      ...company,
      userId: state.user?.id || ''
    };
    dispatch({ type: 'SET_SELECTED_PROFILE', payload: companyData });
    navigate(`/companies/${company.id}`);
  };

  const handleCreateCompany = () => {
    navigate('/companies/new');
  };

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
                      <h1 className="text-3xl font-bold theme-text-primary">Companies</h1>
                      <p className="theme-text-secondary mt-2">Manage your company profiles and create content for each brand.</p>
                    </div>
                    <button
                      onClick={handleCreateCompany}
                      className="flex items-center space-x-2 theme-gradient text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Profile</span>
                    </button>
                  </div>
                  
                  <CompanySelector
                    userId={state.user?.id || ''}
                    onSelectCompany={handleSelectCompany}
                    onCreateNew={handleCreateCompany}
                    onScheduleCompany={(company) => {
                      const companyData = { ...company, userId: state.user?.id || '' };
                      dispatch({ type: 'SET_SELECTED_PROFILE', payload: companyData });
                      navigate('/schedule');
                    }}
                    onCampaignCompany={(company) => {
                      const companyData = { ...company, userId: state.user?.id || '' };
                      dispatch({ type: 'SET_SELECTED_PROFILE', payload: companyData });
                      navigate(`/companies/${company.id}/campaigns`);
                    }}
                    onDashboardCompany={(company) => {
                      const companyData = { ...company, userId: state.user?.id || '' };
                      dispatch({ type: 'SET_SELECTED_PROFILE', payload: companyData });
                      navigate(`/companies/${company.id}`);
                    }}
                  />
                </div>
              } 
            />
            <Route 
              path="new" 
              element={
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold theme-text-primary">Create New Profile</h1>
                    <p className="theme-text-secondary mt-2">Add a new profile to start creating content.</p>
                  </div>
                  <ProfileSetup
                    onNext={(profileData) => {
                      navigate('/companies');
                    }}
                    onBack={() => navigate('/companies')}
                  />
                </div>
              } 
            />
            <Route 
              path=":companyId" 
              element={
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold theme-text-primary">{state.selectedProfile?.name || 'Profile Dashboard'}</h1>
                      <p className="theme-text-secondary mt-2">Manage content and campaigns for this company.</p>
                    </div>
                    <button
                      onClick={() => navigate('/companies')}
                      className="theme-button-secondary px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Back to Companies
                    </button>
                  </div>
                  {/* Company Dashboard Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="theme-bg-card rounded-xl p-6">
                      <h3 className="text-lg font-semibold theme-text-primary mb-3">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => navigate('/content')}
                          className="w-full theme-gradient text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Create Content
                        </button>
                        <button
                          onClick={() => navigate('/schedule')}
                          className="w-full theme-button-secondary py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          Schedule Posts
                        </button>
                        {hasCampaigns && (
                          <button
                            onClick={() => navigate(`/companies/${state.selectedProfile?.id}/campaigns`)}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200"
                          >
                            Manage Campaigns
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              } 
            />
            <Route 
              path=":companyId/campaigns" 
              element={
                hasCampaigns ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold theme-text-primary">Campaigns</h1>
                        <p className="theme-text-secondary mt-2">Organize your content with targeted campaigns.</p>
                      </div>
                      <button
                        onClick={() => navigate(`/companies/${state.selectedProfile?.id}/campaigns/new`)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Campaign</span>
                      </button>
                    </div>
                    
                    <CampaignSelector
                      companyId={state.selectedProfile?.id || ''}
                      onSelectCampaign={(campaign: any) => {
                        const campaignData = { ...campaign, id: campaign.id!, isActive: campaign.status === 'active', profileId: state.selectedProfile?.id || '' };
                        dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
                        navigate(`/companies/${state.selectedProfile?.id}/campaigns/${campaign.id}`);
                      }}
                      onCreateNew={() => navigate(`/companies/${state.selectedProfile?.id}/campaigns/new`)}
                      onEditCampaign={(campaign: any) => {
                        const campaignData = { ...campaign, id: campaign.id!, isActive: campaign.status === 'active', profileId: state.selectedProfile?.id || '' };
                        dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
                        navigate(`/companies/${state.selectedProfile?.id}/campaigns/${campaign.id}/edit`);
                      }}
                    />
                  </div>
                ) : (
                  <FeatureRestriction feature="Campaign Management" requiredPlan="ipro">
                    <div className="theme-bg-card rounded-xl p-8 text-center">
                      <h3 className="text-xl font-semibold theme-text-primary mb-4">Campaign Management</h3>
                      <p className="theme-text-secondary">Organize your content with targeted campaigns and track their performance.</p>
                    </div>
                  </FeatureRestriction>
                )
              } 
            />
            <Route 
              path=":companyId/campaigns/new" 
              element={
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold theme-text-primary">Create New Campaign</h1>
                    <p className="theme-text-secondary mt-2">Set up a new marketing campaign.</p>
                  </div>
                  <CampaignSetup
                    companyId={state.selectedCompany?.id || ''}
                    onComplete={(campaign) => {
                      dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: { ...campaign, isActive: campaign.status === 'active' } });
                      navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}`);
                    }}
                    onCancel={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns`)}
                  />
                </div>
              } 
            />
            <Route 
              path=":companyId/campaigns/:campaignId" 
              element={
                <div className="space-y-6">
                  <CampaignDashboard
                    campaign={state.selectedCampaign!}
                    onEditCampaign={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/${state.selectedCampaign?.id}/edit`)}
                    onCreatePost={() => navigate('/content')}
                    onViewPosts={() => navigate('/schedule')}
                    onBack={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns`)}
                  />
                </div>
              } 
            />
            <Route 
              path=":companyId/campaigns/:campaignId/edit" 
              element={
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold theme-text-primary">Edit Campaign</h1>
                    <p className="theme-text-secondary mt-2">Update your campaign settings.</p>
                  </div>
                  <CampaignSetup
                    companyId={state.selectedCompany?.id || ''}
                    existingCampaign={state.selectedCampaign!}
                    onComplete={(campaign) => {
                      dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: { ...campaign, isActive: campaign.status === 'active' } });
                      navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}`);
                    }}
                    onCancel={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/${state.selectedCampaign?.id}`)}
                  />
                </div>
              } 
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};