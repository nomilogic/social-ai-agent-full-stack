import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CompanySelector } from '../components/CompanySelector';
import { CompanySetup } from '../components/CompanySetup';
import { CompanyDashboard } from '../components/CompanyDashboard';
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
              onCreateNewCompany={handleCreateCompany}
              onScheduleCompany={(company) => {
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
                navigate('/schedule');
              }}
              onCampaignCompany={(company) => {
                dispatch({ type: 'SET_SELECTED_COMPANY', payload: company });
                navigate(`/companies/${company.id}/campaigns`);
              }}
              onDashboardCompany={(company) => {
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
            onCreatePost={() => navigate('/content/create')}
            onViewPosts={() => navigate('/content')}
            onManageCampaigns={() => navigate(`/companies/${state.selectedCompany?.id}/campaigns`)}
            onSchedulePosts={() => navigate('/schedule')}
            onEditCompany={() => navigate(`/companies/${state.selectedCompany?.id}/edit`)}
            onBack={() => navigate('/companies')}
          />
        } 
      />
    </Routes>
  );
};