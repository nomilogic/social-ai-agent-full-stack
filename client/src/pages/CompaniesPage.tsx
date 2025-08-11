import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CompanySelector } from '../components/CompanySelector';
import { CompanySetup } from '../components/CompanySetup';
import { CompanyDashboard } from '../components/CompanyDashboard';
import { CampaignSelector } from '../components/CampaignSelector';
import { CampaignSetup } from '../components/CampaignSetup';
import { CampaignDashboard } from '../components/CampaignDashboard';
import { useAppContext } from '../context/AppContext';

export const CompaniesPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();

  const handleSelectCompany = (company: any) => {
    dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
                <p className="text-gray-600 mt-2">Manage your company profiles and create content for each brand.</p>
              </div>
              <button
                onClick={handleCreateCompany}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>New Company</span>
              </button>
            </div>
            
            <CompanySelector
              userId={state.user?.id || ''}
              onSelectCompany={handleSelectCompany}
              onCreateNew={handleCreateCompany}
              onSchedule={(company) => {
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
                navigate('/schedule');
              }}
              onCampaigns={(company) => {
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
                navigate(`/companies/${company.id}/campaigns`);
              }}
              onDashboard={(company) => {
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
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
              <h1 className="text-3xl font-bold text-gray-900">Create New Company</h1>
              <p className="text-gray-600 mt-2">Add a new company profile to start creating content.</p>
            </div>
            <CompanySetup
              onNext={(companyData) => {
                // Handle company creation and navigate back
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Company</h1>
              <p className="text-gray-600 mt-2">Update your company profile information.</p>
            </div>
            <CompanySetup
              onNext={(companyData) => {
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: companyData });
                navigate(`/companies/${state.selectedCompany?.id}`);
              }}
              onBack={() => navigate(`/companies/${state.selectedCompany?.id}`)}
              existingCompany={state.selectedCompany}
            />
          </div>
        } 
      />
      <Route 
        path=":companyId/campaigns" 
        element={
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
                <p className="text-gray-600 mt-2">Manage campaigns for {state.selectedCompany?.name}</p>
              </div>
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
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaign });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}`);
              }}
              onCreateNewCampaign={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/new`)}
              onEditCampaign={(campaign) => {
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaign });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}/edit`);
              }}
              onBack={() => navigate(`/companies/${state.selectedCompany?.id}`)}
            />
          </div>
        } 
      />
      <Route 
        path=":companyId/campaigns/new" 
        element={
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
              <p className="text-gray-600 mt-2">Set up a new marketing campaign for {state.selectedCompany?.name}</p>
            </div>
            <CampaignSetup
              companyId={state.selectedCompany?.id || ''}
              onSave={(campaign) => {
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaign });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns`);
              }}
              onCancel={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns`)}
            />
          </div>
        } 
      />
      <Route 
        path=":companyId/campaigns/:campaignId" 
        element={
          <CampaignDashboard
            campaign={state.selectedCampaign}
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Campaign</h1>
              <p className="text-gray-600 mt-2">Update your campaign information.</p>
            </div>
            <CampaignSetup
              companyId={state.selectedCompany?.id || ''}
              campaignData={state.selectedCampaign}
              onSave={(campaign) => {
                dispatch({ type: 'SET_SELECTED_CAMPAIGN', payload: campaign });
                navigate(`/companies/${state.selectedCompany?.id}/campaigns/${campaign.id}`);
              }}
              onCancel={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns/${state.selectedCampaign?.id}`)}
            />
          </div>
        } 
      />
    </Routes>
  );
};