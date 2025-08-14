import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Brain, Target, Users, TrendingUp } from 'lucide-react';

interface Question {
  id: string;
  section: string;
  question: string;
  options: string[];
  allowOther?: boolean;
}

interface QuestionnaireProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: (responses: Record<string, string>) => void;
}

const QUESTIONS: Question[] = [
  // Section 1: Content Goals & Engagement
  {
    id: 'main_result',
    section: 'Content Goals',
    question: "What's the main result you want from each post?",
    options: ['More likes', 'More comments', 'More shares', 'More clicks'],
    allowOther: true
  },
  {
    id: 'post_feel',
    section: 'Content Goals',
    question: 'What should your post feel like at first glance?',
    options: ['Eye-catching', 'Thought-provoking', 'Funny', 'Informative'],
    allowOther: true
  },
  {
    id: 'content_priority',
    section: 'Content Goals',
    question: "What's more important?",
    options: ['Being trend-relevant', 'Staying evergreen', 'A balanced mix'],
    allowOther: true
  },
  {
    id: 'ideal_impact',
    section: 'Content Goals',
    question: "How would you describe your ideal post's impact?",
    options: ['Inspires action', 'Starts conversation', 'Drives traffic', 'Builds brand image'],
    allowOther: true
  },
  {
    id: 'hook_style',
    section: 'Content Goals',
    question: 'What kind of "hook" works best?',
    options: ['Bold statement', 'Question', 'Surprising fact', 'Emotional appeal'],
    allowOther: true
  },
  
  // Section 2: Audience Alignment
  {
    id: 'target_audience',
    section: 'Audience',
    question: 'Whom should this content speak to?',
    options: ['Loyal followers', 'New prospects', 'Trend seekers', 'Niche groups'],
    allowOther: true
  },
  {
    id: 'audience_tone',
    section: 'Audience',
    question: 'What tone should match your audience?',
    options: ['Casual', 'Educational', 'Bold', 'Lighthearted'],
    allowOther: true
  },
  {
    id: 'connection_vibe',
    section: 'Audience',
    question: 'Which vibe connects best?',
    options: ['Friendly chat', 'Informal advice', 'Bold statements', 'Light jokes'],
    allowOther: true
  },
  {
    id: 'audience_interests',
    section: 'Audience',
    question: 'Which themes interest your audience most?',
    options: ['How-tos/tips', 'Industry trends', 'Behind-the-scenes', 'Stories and experiences'],
    allowOther: true
  },
  {
    id: 'visual_preference',
    section: 'Audience',
    question: 'What visual style do they prefer?',
    options: ['Clean graphics', 'Lifestyle images', 'Bold colors', 'Minimalist design'],
    allowOther: true
  },

  // Section 3: Trend Relevance
  {
    id: 'trend_focus',
    section: 'Trends',
    question: 'Should we focus on trends?',
    options: ['Daily trending topics', 'Weekly highlights', 'Monthly themes', 'Keep it evergreen'],
    allowOther: true
  },
  {
    id: 'trend_source',
    section: 'Trends',
    question: 'What trend source should we use?',
    options: ['Hashtags', 'News', 'Creators', 'Industry'],
    allowOther: true
  },
  {
    id: 'content_balance',
    section: 'Trends',
    question: "What's more appealing?",
    options: ['Trendy posts', 'Evergreen content', 'Balance of both'],
    allowOther: true
  },
  {
    id: 'trend_influence',
    section: 'Trends',
    question: 'How should trends influence creative?',
    options: ['Visual tweaks', 'Caption tweaks', 'Both'],
    allowOther: true
  },
  {
    id: 'trend_types',
    section: 'Trends',
    question: 'Which trend types interest you?',
    options: ['Industry news', 'Pop culture', 'Seasonal topics', 'Viral formats'],
    allowOther: true
  }
];

export const BotTrainingQuestionnaire: React.FC<QuestionnaireProps> = ({
  isVisible,
  onClose,
  onComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [otherText, setOtherText] = useState<string>('');
  const [isCompleting, setIsCompleting] = useState(false);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUESTIONS.length) * 100;

  useEffect(() => {
    if (isVisible) {
      // Reset state when questionnaire opens
      setCurrentQuestionIndex(0);
      setResponses({});
      setSelectedOption('');
      setOtherText('');
    }
  }, [isVisible]);

  useEffect(() => {
    // Load saved response for current question
    const savedResponse = responses[currentQuestion?.id];
    if (savedResponse) {
      if (currentQuestion.options.includes(savedResponse)) {
        setSelectedOption(savedResponse);
        setOtherText('');
      } else {
        setSelectedOption('Other');
        setOtherText(savedResponse);
      }
    } else {
      setSelectedOption('');
      setOtherText('');
    }
  }, [currentQuestionIndex, responses, currentQuestion]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    if (option !== 'Other') {
      setOtherText('');
    }
  };

  const handleNext = () => {
    // Save current response
    const response = selectedOption === 'Other' ? otherText : selectedOption;
    if (response) {
      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: response
      }));
    }

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    // Include current question response
    const response = selectedOption === 'Other' ? otherText : selectedOption;
    const finalResponses = response ? {
      ...responses,
      [currentQuestion.id]: response
    } : responses;

    try {
      await onComplete(finalResponses);
      onClose();
    } catch (error) {
      console.error('Error saving questionnaire responses:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const canProceed = selectedOption && (selectedOption !== 'Other' || otherText.trim());

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'Content Goals': return <Target className="w-5 h-5" />;
      case 'Audience': return <Users className="w-5 h-5" />;
      case 'Trends': return <TrendingUp className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="theme-bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="theme-gradient p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6" />
              <h2 className="text-xl font-bold">AI Bot Training</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestionIndex + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section Badge */}
          <div className="flex items-center space-x-2 theme-text-secondary">
            {getSectionIcon(currentQuestion.section)}
            <span className="text-sm font-medium">{currentQuestion.section}</span>
          </div>

          {/* Question */}
          <div>
            <h3 className="text-xl font-semibold theme-text-primary mb-6">
              {currentQuestion.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                    selectedOption === option
                      ? 'theme-gradient text-white shadow-lg'
                      : 'theme-bg-secondary theme-text-primary hover:shadow-md border theme-border'
                  }`}
                >
                  {option}
                </button>
              ))}
              
              {currentQuestion.allowOther && (
                <div className="space-y-2">
                  <button
                    onClick={() => handleOptionSelect('Other')}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                      selectedOption === 'Other'
                        ? 'theme-gradient text-white shadow-lg'
                        : 'theme-bg-secondary theme-text-primary hover:shadow-md border theme-border'
                    }`}
                  >
                    Other (please specify)
                  </button>
                  
                  {selectedOption === 'Other' && (
                    <textarea
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Please describe your preference..."
                      className="w-full p-3 theme-input rounded-lg resize-none"
                      rows={3}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t theme-border p-6">
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 theme-button-secondary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed || isCompleting}
              className="flex items-center space-x-2 px-6 py-2 theme-gradient text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>
                {currentQuestionIndex === QUESTIONS.length - 1 
                  ? (isCompleting ? 'Saving...' : 'Complete') 
                  : 'Next'
                }
              </span>
              {currentQuestionIndex < QUESTIONS.length - 1 && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};