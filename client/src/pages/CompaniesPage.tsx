import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CompanySelector } from '../components/CompanySelector';
import { ProfileSetup } from '../components/ProfileSetup';
import { CompanyDashboard } from '../components/CompanyDashboard';
import { CampaignSelector } from '../components/CampaignSelector';
import { CampaignSetup } from '../components/CampaignSetup';
import { CampaignDashboard } from '../components/CampaignDashboard';
import { useAppContext } from '../context/AppContext';

export const CompaniesPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  const handleSelectCompany = (company: any) => {
    // Convert to proper Company format for context
    const companyData = {
      ...company,
      userId: state.user?.id || company.userId || ''
    };
    dispatch({ type: 'SET_SELECTED_COMPANY', payload: companyData });
    navigate(`/companies/${company.id}`);
  };

  const handleCreateCompany = () => {
    navigate('/companies/new');
  };

  return (
    <Routes>
      <Route 
        index 
        element={
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={handleCreateCompany}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
                const companyData = { ...company, userId: state.user?.id || company.userId || '' };
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: companyData });
                navigate('/schedule');
              }}
              onCampaignCompany={(company) => {
                const companyData = { ...company, userId: state.user?.id || company.userId || '' };
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: companyData });
                navigate(`/companies/${company.id}/campaigns`);
              }}
              onDashboardCompany={(company) => {
                const companyData = { ...company, userId: state.user?.id || company.userId || '' };
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: companyData });
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
            <ProfileSetup
              onNext={(profileData) => {
                // Handle profile creation and navigate back
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
          <CompanyDashboard
            company={state.selectedCompany}
            onCreatePost={() => navigate('/content')}
            onViewPosts={() => navigate('/content')}
            onManageCampaigns={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns`)}
            onSchedulePosts={() => navigate('/schedule')}
            onEditCompany={() => navigate(`/companies/${state.selectedCompany?.id}/edit`)}
            onBack={() => navigate('/companies')}
          />
        } 
      />
      <Route 
        path=":companyId/edit" 
        element={
          <div className="space-y-6">
            <ProfileSetup
              onNext={(profileData) => {
                // Convert ProfileInfo to Company format for context compatibility
                const companyData = {
                  id: state.selectedCompany?.id || '',
                  name: profileData.name,
                  industry: profileData.industry,
                  description: profileData.description,
                  tone: profileData.brandTone,
                  target_audience: profileData.targetAudience,
                  userId: state.user?.id || ''
                };
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: companyData });
                navigate(`/companies/${state.selectedCompany?.id}`);
              }}
              onBack={() => navigate(`/companies/${state.selectedCompany?.id}`)}
              initialData={state.selectedCompany ? {
                type: 'business',
                name: state.selectedCompany.name,
                website: '',
                industry: state.selectedCompany.industry,
                description: state.selectedCompany.description || '',
                targetAudience: state.selectedCompany.target_audience || '',
                brandTone: (state.selectedCompany.tone as any) || 'professional',
                goals: [],
                platforms: []
              } : undefined}
            />
          </div>
        } 
      />
      <Route 
        path=":companyId/campaigns" 
        element={
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/new`)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            </div>
            
            <CampaignSelector
              companyId={state.selectedCompany?.id || ''}
              onSelectCampaign={(campaign) => {
                const campaignData = { ...campaign, id: campaign.id!, isActive: campaign.status === 'active' };
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}`);
              }}
              onCreateNew={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/new`)}
              onEditCampaign={(campaign) => {
                const campaignData = { ...campaign, id: campaign.id!, isActive: campaign.status === 'active' };
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}/edit`);
              }}
            />
          </div>
        } 
      />
      <Route 
        path=":companyId/campaigns/new" 
        element={
          <div className="space-y-6">
            <CampaignSetup
              companyId={state.selectedCompany?.id || ''}
              onNext={(campaign) => {
                const campaignData = { ...campaign, id: campaign.id!, isActive: campaign.status === 'active' };
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns`);
              }}
              onBack={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns`)}
            />
          </div>
        } 
      />
      <Route 
        path=":companyId/campaigns/:campaignId" 
        element={
          <CampaignDashboard
            campaign={state.selectedCampaign!}
            company={state.selectedCompany}
            onCreatePost={() => navigate('/content')}
            onViewPosts={() => navigate('/content')}
            onEditCampaign={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/${state.selectedCampaign?.id}/edit`)}
            onBack={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns`)}
          />
        } 
      />
      <Route 
        path=":companyId/campaigns/:campaignId/edit" 
        element={
          <div className="space-y-6">
            <CampaignSetup
              companyId={state.selectedCompany?.id || ''}
              initialData={state.selectedCampaign ? {
                ...state.selectedCampaign,
                platforms: [],
                status: 'active' as const
              } : undefined}
              onNext={(campaign) => {
                const campaignData = { ...campaign, id: campaign.id!, isActive: campaign.status === 'active' };
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaignData });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}`);
              }}
              onBack={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/${state.selectedCampaign?.id}`)}
            />
          </div>
        } 
      />
    </Routes>
  );
};