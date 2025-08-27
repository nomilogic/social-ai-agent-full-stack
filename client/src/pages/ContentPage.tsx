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
    navigate("/generate");
  };

  const handleGenerationComplete = async (posts: any[]) => {
    // Save posts to database if we have campaign and user data
    if (state.user && state.selectedProfile && state.contentData) {
      try {
        await savePost(
          state.selectedProfile.id,
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
    <div className=" animated-bg ">
      <div className="">
        <div className="w-full mx-auto">
          {/* <ProgressBar
            currentStep={getCurrentStep()}
            totalSteps={4}
            stepLabels={stepLabels}
          />
 */}
          <Routes>
            <Route
              index
              element={
                <ContentInput
                  onNext={handleContentNext}
                  onBack={() => navigate("/dashboard")}
                  initialData={state.contentData}
                  editMode={!!state.contentData}
                />
              }
            />
            <Route
              path="generate"
              element={
                (() => {
                  // Debug logging
                  console.log('🔍 Generate route accessed:', {
                    hasContentData: !!state.contentData,
                    contentData: state.contentData,
                    location: location.pathname
                  });
                  
                  return state.contentData ? (
                    <AIGenerator
                      contentData={state.contentData}
                      onComplete={handleGenerationComplete}
                      onBack={() => navigate("/content")}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
                        <h3 className="font-semibold text-yellow-800 mb-2">No Content Data Found</h3>
                        <p className="text-yellow-700 text-sm mb-3">
                          The content generation requires initial content data. This usually happens when:
                        </p>
                        <ul className="text-yellow-700 text-sm list-disc list-inside space-y-1">
                          <li>You accessed /generate directly without going through the content creation flow</li>
                          <li>Your session expired and the data was cleared</li>
                          <li>You refreshed the page during the content creation process</li>
                        </ul>
                      </div>
                      <p className="text-gray-600 mb-4">
                        Please start the content creation process from the beginning.
                      </p>
                      <button
                        onClick={() => navigate("/content")}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Content Creation
                      </button>
                    </div>
                  );
                })()
              }
            />
            <Route
              path="preview"
              element={
                state.generatedPosts && state.generatedPosts.length > 0 ? (
                  <PostPreview
                    posts={state.generatedPosts}
                    onEdit={() => navigate("/content")}
                    onBack={() => navigate("/generate")}
                    onPublish={handleGoToPublish}
                    onPostsUpdate={(updatedPosts) => {
                      dispatch({ type: "SET_GENERATED_POSTS", payload: updatedPosts });
                    }}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No generated posts found. Please generate content first.
                    </p>
                    <button
                      onClick={() => navigate("/content")}
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Start Content Creation
                    </button>
                  </div>
                )
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
