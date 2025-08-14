
import React, { useState } from 'react';
import { Layout, Plus, Search, Filter, Copy, Edit, Trash2 } from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="theme-text-primary text-2xl font-bold">Content Templates</h1>
          <p className="theme-text-secondary">Create and manage reusable content templates</p>
        </div>
        <button className="theme-button-primary px-4 py-2 rounded-lg flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      <div className="theme-bg-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-light" />
              <input
                type="text"
                placeholder="Search templates..."
                className="theme-input pl-10 pr-4 py-2 w-64 rounded-lg"
              />
            </div>
            <button className="theme-button-secondary px-4 py-2 rounded-lg flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="text-center py-12">
          <Layout className="w-16 h-16 theme-text-light mx-auto mb-4" />
          <h3 className="theme-text-primary text-lg font-medium mb-2">No templates yet</h3>
          <p className="theme-text-secondary mb-4">Create your first template to speed up content creation</p>
          <button className="theme-button-primary px-6 py-2 rounded-lg">
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};
