export interface ThemeColors {
  name: string;
  bgGradient: string;
  primary: string;
  secondary: string;
  accent: string;
  text: {
    primary: string;
    secondary: string;
    light: string;
  };
  background: {
    primary: string;
    secondary: string;
    card: string;
  };
  border: string;
  button: {
    primary: string;
    secondary: string;
    hover: string;
  };
}

export const themes: Record<string, ThemeColors> = {
  'ai-revolution': {
    name: 'AI Revolution',
    bgGradient: 'from-blue-600 via-purple-600 to-indigo-700',
    primary: '#3B82F6', // blue-500
    secondary: '#8B5CF6', // violet-500
    accent: '#6366F1', // indigo-500
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      light: 'rgba(255, 255, 255, 0.7)'
    },
    background: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      card: 'rgba(255, 255, 255, 0.15)'
    },
    border: 'rgba(255, 255, 255, 0.2)',
    button: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.2)',
      hover: 'rgba(255, 255, 255, 0.9)'
    }
  },
  'content-creation': {
    name: 'Content Creation',
    bgGradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    primary: '#10B981', // emerald-500
    secondary: '#0D9488', // teal-600
    accent: '#0891B2', // cyan-600
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      light: 'rgba(255, 255, 255, 0.7)'
    },
    background: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      card: 'rgba(255, 255, 255, 0.15)'
    },
    border: 'rgba(255, 255, 255, 0.2)',
    button: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.2)',
      hover: 'rgba(255, 255, 255, 0.9)'
    }
  },
  'multi-platform': {
    name: 'Multi-Platform',
    bgGradient: 'from-orange-500 via-red-500 to-pink-600',
    primary: '#F97316', // orange-500
    secondary: '#EF4444', // red-500
    accent: '#EC4899', // pink-500
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      light: 'rgba(255, 255, 255, 0.7)'
    },
    background: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      card: 'rgba(255, 255, 255, 0.15)'
    },
    border: 'rgba(255, 255, 255, 0.2)',
    button: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.2)',
      hover: 'rgba(255, 255, 255, 0.9)'
    }
  },
  'smart-scheduling': {
    name: 'Smart Scheduling',
    bgGradient: 'from-violet-600 via-purple-600 to-fuchsia-700',
    primary: '#8B5CF6', // violet-500
    secondary: '#A855F7', // purple-500
    accent: '#C026D3', // fuchsia-600
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      light: 'rgba(255, 255, 255, 0.7)'
    },
    background: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      card: 'rgba(255, 255, 255, 0.15)'
    },
    border: 'rgba(255, 255, 255, 0.2)',
    button: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.2)',
      hover: 'rgba(255, 255, 255, 0.9)'
    }
  },
  'analytics': {
    name: 'Analytics',
    bgGradient: 'from-amber-500 via-orange-600 to-red-600',
    primary: '#F59E0B', // amber-500
    secondary: '#EA580C', // orange-600
    accent: '#DC2626', // red-600
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      light: 'rgba(255, 255, 255, 0.7)'
    },
    background: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      card: 'rgba(255, 255, 255, 0.15)'
    },
    border: 'rgba(255, 255, 255, 0.2)',
    button: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.2)',
      hover: 'rgba(255, 255, 255, 0.9)'
    }
  },
  'enterprise': {
    name: 'Enterprise',
    bgGradient: 'from-indigo-600 via-blue-600 to-purple-700',
    primary: '#4F46E5', // indigo-600
    secondary: '#2563EB', // blue-600
    accent: '#7C3AED', // violet-600
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.9)',
      light: 'rgba(255, 255, 255, 0.7)'
    },
    background: {
      primary: 'rgba(255, 255, 255, 0.1)',
      secondary: 'rgba(255, 255, 255, 0.05)',
      card: 'rgba(255, 255, 255, 0.15)'
    },
    border: 'rgba(255, 255, 255, 0.2)',
    button: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.2)',
      hover: 'rgba(255, 255, 255, 0.9)'
    }
  }
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = 'ai-revolution'; // Default to first onboarding theme
  private listeners: ((theme: ThemeColors) => void)[] = [];

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  getCurrentTheme(): ThemeColors {
    return themes[this.currentTheme];
  }

  setTheme(themeName: string) {
    if (themes[themeName]) {
      this.currentTheme = themeName;
      this.applyTheme();
      this.notifyListeners();
      localStorage.setItem('app-theme', themeName);
    }
  }

  private applyTheme() {
    const theme = this.getCurrentTheme();
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-text-primary', theme.text.primary);
    root.style.setProperty('--theme-text-secondary', theme.text.secondary);
    root.style.setProperty('--theme-text-light', theme.text.light);
    root.style.setProperty('--theme-bg-primary', theme.background.primary);
    root.style.setProperty('--theme-bg-secondary', theme.background.secondary);
    root.style.setProperty('--theme-bg-card', theme.background.card);
    root.style.setProperty('--theme-border', theme.border);
    root.style.setProperty('--theme-button-primary', theme.button.primary);
    root.style.setProperty('--theme-button-secondary', theme.button.secondary);
    root.style.setProperty('--theme-button-hover', theme.button.hover);
  }

  subscribe(callback: (theme: ThemeColors) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners() {
    const theme = this.getCurrentTheme();
    this.listeners.forEach(listener => listener(theme));
  }

  initialize() {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && themes[savedTheme]) {
      this.currentTheme = savedTheme;
    }
    this.applyTheme();
  }

  getAvailableThemes() {
    return Object.keys(themes).map(key => ({
      key,
      ...themes[key]
    }));
  }
}

export const themeManager = ThemeManager.getInstance();