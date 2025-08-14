
import React, { useState, useEffect } from 'react';
import { Upload, Image, Video, File, Search, Filter, Grid, List } from 'lucide-react';

export const MediaPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="theme-text-primary text-2xl font-bold">Media Library</h1>
          <p className="theme-text-secondary">Manage your media assets</p>
        </div>
        <button className="theme-button-primary px-4 py-2 rounded-lg flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>Upload Media</span>
        </button>
      </div>

      <div className="theme-bg-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 theme-text-light" />
              <input
                type="text"
                placeholder="Search media..."
                className="theme-input pl-10 pr-4 py-2 w-64 rounded-lg"
              />
            </div>
            <button className="theme-button-secondary px-4 py-2 rounded-lg flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'theme-bg-primary' : 'theme-bg-secondary'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'theme-bg-primary' : 'theme-bg-secondary'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center py-12">
          <Image className="w-16 h-16 theme-text-light mx-auto mb-4" />
          <h3 className="theme-text-primary text-lg font-medium mb-2">No media files yet</h3>
          <p className="theme-text-secondary mb-4">Upload your first media file to get started</p>
          <button className="theme-button-primary px-6 py-2 rounded-lg">
            Upload Media
          </button>
        </div>
      </div>
    </div>
  );
};
