
import React, { useState } from 'react';
import { Brain, Zap, BarChart3, Settings, Play, Pause } from 'lucide-react';

export const AITrainingPage: React.FC = () => {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'paused'>('idle');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="theme-text-primary text-2xl font-bold">AI Training</h1>
          <p className="theme-text-secondary">Train AI models with your content preferences</p>
        </div>
        <div className="flex space-x-3">
          <button className="theme-button-secondary px-4 py-2 rounded-lg flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configure</span>
          </button>
          <button className="theme-button-primary px-4 py-2 rounded-lg flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Start Training</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="theme-bg-card rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-8 h-8 theme-text-primary" />
            <div>
              <h3 className="theme-text-primary font-semibold">Training Status</h3>
              <p className="theme-text-secondary text-sm">Current model training</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="theme-text-secondary">Status:</span>
              <span className="theme-text-primary capitalize">{trainingStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary">Progress:</span>
              <span className="theme-text-primary">0%</span>
            </div>
            <div className="w-full theme-bg-secondary rounded-full h-2">
              <div className="theme-bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="theme-bg-card rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-8 h-8 theme-text-primary" />
            <div>
              <h3 className="theme-text-primary font-semibold">Performance</h3>
              <p className="theme-text-secondary text-sm">AI model metrics</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="theme-text-secondary">Accuracy:</span>
              <span className="theme-text-primary">N/A</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary">Training Data:</span>
              <span className="theme-text-primary">0 samples</span>
            </div>
          </div>
        </div>

        <div className="theme-bg-card rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Brain className="w-8 h-8 theme-text-primary" />
            <div>
              <h3 className="theme-text-primary font-semibold">Models</h3>
              <p className="theme-text-secondary text-sm">Available AI models</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="theme-text-secondary">Active:</span>
              <span className="theme-text-primary">GPT-4</span>
            </div>
            <div className="flex justify-between">
              <span className="theme-text-secondary">Custom:</span>
              <span className="theme-text-primary">0 models</span>
            </div>
          </div>
        </div>
      </div>

      <div className="theme-bg-card rounded-xl p-6">
        <h3 className="theme-text-primary text-lg font-semibold mb-4">Training Data</h3>
        <div className="text-center py-12">
          <Brain className="w-16 h-16 theme-text-light mx-auto mb-4" />
          <h4 className="theme-text-primary text-lg font-medium mb-2">No training data yet</h4>
          <p className="theme-text-secondary mb-4">Start creating content to build your training dataset</p>
          <button className="theme-button-primary px-6 py-2 rounded-lg">
            Start Training
          </button>
        </div>
      </div>
    </div>
  );
};
