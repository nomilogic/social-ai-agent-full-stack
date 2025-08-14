
import React from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export const ThemeSelector: React.FC = () => {
  const { currentTheme, changeTheme, availableThemes, currentThemeKey } = useTheme();

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 theme-bg-secondary hover:theme-bg-primary">
        <div
          className={`w-5 h-5 border-2 border-white/30 rounded-full bg-gradient-to-r ${currentTheme.bgGradient} shadow-lg`}
        ></div>
        <Palette className="w-4 h-4 theme-text-secondary" />
        <span className="hidden sm:block theme-text-secondary font-medium text-sm">
          {currentTheme.name}
        </span>
      </button>

      <div className="absolute top-full right-0 mt-3 w-80 theme-bg-card rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 border theme-border">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="w-5 h-5 theme-text-primary" />
            <h3 className="theme-text-primary font-semibold text-lg">
              Choose Theme
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {availableThemes.map((theme) => (
              <button
                key={theme.key}
                onClick={() => changeTheme(theme.key)}
                className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 group/theme ${
                  currentThemeKey === theme.key 
                    ? "theme-bg-primary ring-2 ring-white/30" 
                    : "theme-bg-secondary hover:theme-bg-primary"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-6 h-6 border-2 border-white/40 rounded-lg bg-gradient-to-r ${theme.bgGradient} shadow-lg group-hover/theme:scale-110 transition-transform duration-200`}
                  ></div>
                  <div className="text-left">
                    <span className="theme-text-primary font-medium block">
                      {theme.name}
                    </span>
                    <span className="theme-text-light text-xs">
                      {theme.key === "ai-revolution" && "AI & Technology"}
                      {theme.key === "content-creation" && "Creative & Fresh"}
                      {theme.key === "multi-platform" && "Dynamic & Bold"}
                      {theme.key === "smart-scheduling" && "Elegant & Modern"}
                      {theme.key === "analytics" && "Warm & Professional"}
                      {theme.key === "enterprise" && "Corporate & Sleek"}
                    </span>
                  </div>
                </div>
                {currentThemeKey === theme.key && (
                  <div className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                    <Check className="w-4 h-4 theme-text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-4 p-3 theme-bg-secondary rounded-lg">
            <p className="text-xs theme-text-light leading-relaxed">
              ✨ Themes change the entire app appearance instantly. Each theme is inspired by different aspects of social media management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
