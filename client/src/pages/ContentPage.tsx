
import React, { useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ContentInput } from "../components/ContentInput";
import { AIGenerator } from "../components/AIGenerator";
import { PostPreview } from "../components/PostPreview";
import { PublishPosts } from "../components/PublishPosts";
import { ProgressBar } from "../components/ProgressBar";
import { useAppContext } from "../context/AppContext";
import { savePost } from "../lib/database";

export const ContentPage: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPublishModal, setShowPublishModal] = useState(false);

  const handleContentNext = (contentData: any) => {
    dispatch({ type: "SET_CONTENT_DATA", payload: contentData });
    navigate("/content/generate");
  };

  const handleGenerationComplete = async (posts: any[]) => {
    // Save posts to database if we have company and user data
    if (state.user && state.selectedCompany && state.contentData) {
      try {
        await savePost(
          state.selectedCompany.id,
          state.contentData,
          posts,
          state.user.id,
        );
      } catch (error) {
        console.error("Error saving post:", error);
        // Continue anyway - we can still preview the posts
      }
    }

    dispatch({ type: "SET_GENERATED_POSTS", payload: posts });
    navigate("/content/preview");
  };

  const handleGoToPublish = () => {
    setShowPublishModal(true);
  };

  const stepLabels = ["Content Input", "AI Generation", "Preview", "Publish"];
  const getCurrentStep = () => {
    const path = location.pathname;
    if (path.includes("/generate")) return 1;
    if (path.includes("/preview")) return 2;
    if (path.includes("/publish")) return 3;
    return 0;
  };

  return (
    <div className="min-h-screen animated-bg">
      <div className="min-h-screen bg-white/10 backdrop-blur-sm p-3 md:p-5">
        <div className="max-w-7xl mx-auto py-4 md:py-8">
          {/* Header Section */}
          <div className="text-center floating-element mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 drop-shadow-lg">
              AI Content Generator
            </h1>
            <p className="text-sm md:text-xl text-white/80 max-w-2xl mx-auto drop-shadow px-4">
              Create engaging social media content with the power of artificial
              intelligence
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 md:mb-8">
            <ProgressBar
              currentStep={getCurrentStep()}
              totalSteps={4}
              stepLabels={stepLabels}
            />
          </div>

          {/* Content Area - Responsive Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            <div className="col-span-1 md:col-span-2 xl:col-span-3">
              <Routes>
                <Route
                  index
                  element={
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-4 md:p-6 floating-element">
                      <ContentInput
                        onNext={handleContentNext}
                        onBack={() => navigate("/dashboard")}
                        initialData={state.contentData}
                        editMode={!!state.contentData}
                      />
                    </div>
                  }
                />
                <Route
                  path="generate"
                  element={
                    state.contentData ? (
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-4 md:p-6 floating-element">
                        <AIGenerator
                          contentData={state.contentData}
                          onComplete={handleGenerationComplete}
                          onBack={() => navigate("/content")}
                        />
                      </div>
                    ) : (
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6 md:p-8 text-center floating-element">
                        <p className="text-white/80 text-lg mb-4">
                          No content data found. Please start from the beginning.
                        </p>
                        <button
                          onClick={() => navigate("/content")}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Start Over
                        </button>
                      </div>
                    )
                  }
                />
                <Route
                  path="preview"
                  element={
                    state.generatedPosts && state.generatedPosts.length > 0 ? (
                      <div className="space-y-4 md:space-y-6">
                        {/* Preview Controls */}
                        <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-4 floating-element">
                          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                            <h2 className="text-xl font-bold text-white">Generated Posts Preview</h2>
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate("/content")}
                                className="bg-black/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black/30 transition-colors border border-white/20 text-sm"
                              >
                                Edit Content
                              </button>
                              <button
                                onClick={() => navigate("/content/generate")}
                                className="bg-black/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black/30 transition-colors border border-white/20 text-sm"
                              >
                                Regenerate
                              </button>
                              <button
                                onClick={handleGoToPublish}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                              >
                                Publish Posts
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Posts Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                          {state.generatedPosts.map((post, index) => (
                            <div 
                              key={index} 
                              className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-4 floating-element"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              <PostPreview
                                posts={[post]}
                                onEdit={() => navigate("/content")}
                                onBack={() => navigate("/content/generate")}
                                onPublish={handleGoToPublish}
                                compact={true}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/20 p-6 md:p-8 text-center floating-element">
                        <p className="text-white/80 text-lg mb-4">
                          No generated posts found. Please generate content first.
                        </p>
                        <button
                          onClick={() => navigate("/content")}
                          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Start Content Creation
                        </button>
                      </div>
                    )
                  }
                />
              </Routes>
            </div>
          </div>

          {/* Publish Modal */}
          {showPublishModal && state.generatedPosts && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                <PublishPosts
                  posts={state.generatedPosts}
                  onBack={() => setShowPublishModal(false)}
                  userId={state.user?.id || ""}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
