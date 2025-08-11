import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ContentInput } from '../components/ContentInput';
import { AIGenerator } from '../components/AIGenerator';
import { PostPreview } from '../components/PostPreview';
import { PublishPosts } from '../components/PublishPosts';
import { ProgressBar } from '../components/ProgressBar';
import { useAppContext } from '../context/AppContext';

export const ContentPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handleContentNext = (contentData: any) => {
    dispatch({ type: 'SET_CONTENT_DATA', payload: contentData });
    navigate('/content/generate');
  };

  const handleGenerationComplete = (posts: any[]) => {
    dispatch({ type: 'SET_GENERATED_POSTS', payload: posts });
    navigate('/content/preview');
  };

  const handleGoToPublish = () => {
    setShowPublishModal(true);
  };

  const stepLabels = ['Content Input', 'AI Generation', 'Preview', 'Publish'];
  const getCurrentStep = () => {
    const path = location.pathname;
    if (path.includes('/generate')) return 1;
    if (path.includes('/preview')) return 2;
    if (path.includes('/publish')) return 3;
    return 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Content</h1>
        <p className="text-gray-600 mt-2">Generate AI-powered social media content for your brand.</p>
      </div>

      <ProgressBar
        currentStep={getCurrentStep()}
        totalSteps={4}
        stepLabels={stepLabels}
      />

      <Routes>
        <Route
          index
          element={
            <ContentInput
              onNext={handleContentNext}
              onBack={() => navigate('/dashboard')}
              companyData={state.selectedCompany}
            />
          }
        />
        <Route
          path="generate"
          element={
            <AIGenerator
              contentData={state.contentData}
              companyData={state.selectedCompany}
              onComplete={handleGenerationComplete}
              onBack={() => navigate('/content')}
            />
          }
        />
        <Route
          path="preview"
          element={
            <PostPreview
              posts={state.generatedPosts}
              onPublish={handleGoToPublish}
              onRegenerate={() => navigate('/content/generate')}
              onBack={() => navigate('/content/generate')}
            />
          }
        />
      </Routes>

      {/* Publish Modal */}
      {showPublishModal && state.generatedPosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <PublishPosts
              posts={state.generatedPosts}
              onBack={() => setShowPublishModal(false)}
              userId={state.user?.id || ''}
            />
          </div>
        </div>
      )}
    </div>
  );
};