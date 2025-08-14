
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
    trinary?: string;
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
  "ai-revolution": {
    name: "AI Revolution",
    bgGradient: "from-blue-600 via-purple-600 to-indigo-700",
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    accent: "#6366F1",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.90)",
      light: "rgba(255, 255, 255, 0.70)",
    },
    background: {
      primary: "rgba(255, 255, 255, 0.15)",
      secondary: "rgba(255, 255, 255, 0.10)",
      trinary: "rgba(255, 255, 255, 0.05)",
      card: "rgba(255, 255, 255, 0.12)",
    },
    border: "rgba(255, 255, 255, 0.25)",
    button: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.20)",
      hover: "rgba(255, 255, 255, 0.95)",
    },
  },
  "content-creation": {
    name: "Content Creation",
    bgGradient: "from-emerald-500 via-teal-600 to-cyan-700",
    primary: "#10B981",
    secondary: "#0D9488",
    accent: "#0891B2",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.90)",
      light: "rgba(255, 255, 255, 0.70)",
    },
    background: {
      primary: "rgba(255, 255, 255, 0.15)",
      secondary: "rgba(255, 255, 255, 0.10)",
      trinary: "rgba(255, 255, 255, 0.05)",
      card: "rgba(255, 255, 255, 0.12)",
    },
    border: "rgba(255, 255, 255, 0.25)",
    button: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.20)",
      hover: "rgba(255, 255, 255, 0.95)",
    },
  },
  "multi-platform": {
    name: "Multi-Platform",
    bgGradient: "from-orange-500 via-red-500 to-pink-600",
    primary: "#F97316",
    secondary: "#EF4444",
    accent: "#EC4899",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.90)",
      light: "rgba(255, 255, 255, 0.70)",
    },
    background: {
      primary: "rgba(255, 255, 255, 0.15)",
      secondary: "rgba(255, 255, 255, 0.10)",
      trinary: "rgba(255, 255, 255, 0.05)",
      card: "rgba(255, 255, 255, 0.12)",
    },
    border: "rgba(255, 255, 255, 0.25)",
    button: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.20)",
      hover: "rgba(255, 255, 255, 0.95)",
    },
  },
  "smart-scheduling": {
    name: "Smart Scheduling",
    bgGradient: "from-violet-600 via-purple-600 to-fuchsia-700",
    primary: "#8B5CF6",
    secondary: "#A855F7",
    accent: "#C026D3",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.90)",
      light: "rgba(255, 255, 255, 0.70)",
    },
    background: {
      primary: "rgba(255, 255, 255, 0.15)",
      secondary: "rgba(255, 255, 255, 0.10)",
      trinary: "rgba(255, 255, 255, 0.05)",
      card: "rgba(255, 255, 255, 0.12)",
    },
    border: "rgba(255, 255, 255, 0.25)",
    button: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.20)",
      hover: "rgba(255, 255, 255, 0.95)",
    },
  },
  analytics: {
    name: "Analytics",
    bgGradient: "from-amber-500 via-orange-500 to-red-600",
    primary: "#F59E0B",
    secondary: "#EA580C",
    accent: "#DC2626",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.90)",
      light: "rgba(255, 255, 255, 0.70)",
    },
    background: {
      primary: "rgba(255, 255, 255, 0.15)",
      secondary: "rgba(255, 255, 255, 0.10)",
      trinary: "rgba(255, 255, 255, 0.05)",
      card: "rgba(255, 255, 255, 0.12)",
    },
    border: "rgba(255, 255, 255, 0.25)",
    button: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.20)",
      hover: "rgba(255, 255, 255, 0.95)",
    },
  },
  enterprise: {
    name: "Enterprise",
    bgGradient: "from-slate-700 via-indigo-600 to-blue-700",
    primary: "#4F46E5",
    secondary: "#2563EB",
    accent: "#7C3AED",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.90)",
      light: "rgba(255, 255, 255, 0.70)",
    },
    background: {
      primary: "rgba(255, 255, 255, 0.15)",
      secondary: "rgba(255, 255, 255, 0.10)",
      trinary: "rgba(255, 255, 255, 0.05)",
      card: "rgba(255, 255, 255, 0.12)",
    },
    border: "rgba(255, 255, 255, 0.25)",
    button: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.20)",
      hover: "rgba(255, 255, 255, 0.95)",
    },
  },
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = "ai-revolution"; // Default to first onboarding theme
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

  getCurrentThemeKey(): string {
    return this.currentTheme;
  }

  setTheme(themeName: string) {
    if (themes[themeName]) {
      this.currentTheme = themeName;
      this.applyTheme();
      this.notifyListeners();
      localStorage.setItem("app-theme", themeName);
    }
  }

  private applyTheme() {
    const theme = this.getCurrentTheme();
    const root = document.documentElement;

    // Apply CSS custom properties for backward compatibility and complex styling
    root.style.setProperty("--theme-primary", theme.primary);
    root.style.setProperty("--theme-secondary", theme.secondary);
    root.style.setProperty("--theme-accent", theme.accent);
    root.style.setProperty("--theme-text-primary", theme.text.primary);
    root.style.setProperty("--theme-text-secondary", theme.text.secondary);
    root.style.setProperty("--theme-text-light", theme.text.light);
    root.style.setProperty("--theme-bg-primary", theme.background.primary);
    root.style.setProperty("--theme-bg-secondary", theme.background.secondary);
    root.style.setProperty("--theme-bg-card", theme.background.card);
    root.style.setProperty(
      "--theme-bg-trinary",
      theme.background.trinary ?? theme.background.card,
    );
    root.style.setProperty("--theme-border", theme.border);
    root.style.setProperty("--theme-button-primary", theme.button.primary);
    root.style.setProperty("--theme-button-secondary", theme.button.secondary);
    root.style.setProperty("--theme-button-hover", theme.button.hover);
  }

  subscribe(callback: (theme: ThemeColors) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback,
      );
    };
  }

  private notifyListeners() {
    const theme = this.getCurrentTheme();
    this.listeners.forEach((listener) => listener(theme));
  }

  initialize() {
    const savedTheme = localStorage.getItem("app-theme");
    if (savedTheme && themes[savedTheme]) {
      this.currentTheme = savedTheme;
    }
    this.applyTheme();
  }

  getAvailableThemes() {
    return Object.keys(themes).map((key) => ({
      key,
      ...themes[key],
    }));
  }

  getThemeByKey(key: string): ThemeColors | null {
    return themes[key] || null;
  }

  // Utility methods for getting gradient class
  getCurrentGradientClass(): string {
    return this.getCurrentTheme().bgGradient;
  }
}

export const themeManager = ThemeManager.getInstance();
