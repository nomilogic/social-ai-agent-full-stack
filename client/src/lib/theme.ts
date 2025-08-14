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
    bgGradient: "from-slate-900 via-blue-900 to-indigo-900",
    primary: "#60A5FA",
    secondary: "#A78BFA",
    accent: "#818CF8",
    text: {
      primary: "#F8FAFC",
      secondary: "rgba(248, 250, 252, 0.85)",
      light: "rgba(248, 250, 252, 0.65)",
    },
    background: {
      primary: "rgba(248, 250, 252, 0.08)",
      secondary: "rgba(248, 250, 252, 0.04)",
      trinary: "rgba(248, 250, 252, 0.02)",
      card: "rgba(15, 23, 42, 0.6)",
    },
    border: "rgba(248, 250, 252, 0.15)",
    button: {
      primary: "#F8FAFC",
      secondary: "rgba(248, 250, 252, 0.15)",
      hover: "rgba(248, 250, 252, 0.9)",
    },
  },
  "content-creation": {
    name: "Content Creation",
    bgGradient: "from-slate-900 via-emerald-900 to-teal-900",
    primary: "#34D399",
    secondary: "#14B8A6",
    accent: "#06B6D4",
    text: {
      primary: "#ECFDF5",
      secondary: "rgba(236, 253, 245, 0.85)",
      light: "rgba(236, 253, 245, 0.65)",
    },
    background: {
      primary: "rgba(236, 253, 245, 0.08)",
      secondary: "rgba(236, 253, 245, 0.04)",
      trinary: "rgba(236, 253, 245, 0.02)",
      card: "rgba(2, 44, 34, 0.6)",
    },
    border: "rgba(236, 253, 245, 0.15)",
    button: {
      primary: "#ECFDF5",
      secondary: "rgba(236, 253, 245, 0.15)",
      hover: "rgba(236, 253, 245, 0.9)",
    },
  },
  "multi-platform": {
    name: "Multi-Platform",
    bgGradient: "from-slate-900 via-orange-900 to-red-900",
    primary: "#FB923C",
    secondary: "#F87171",
    accent: "#F472B6",
    text: {
      primary: "#FFF7ED",
      secondary: "rgba(255, 247, 237, 0.85)",
      light: "rgba(255, 247, 237, 0.65)",
    },
    background: {
      primary: "rgba(255, 247, 237, 0.08)",
      secondary: "rgba(255, 247, 237, 0.04)",
      trinary: "rgba(255, 247, 237, 0.02)",
      card: "rgba(69, 10, 10, 0.6)",
    },
    border: "rgba(255, 247, 237, 0.15)",
    button: {
      primary: "#FFF7ED",
      secondary: "rgba(255, 247, 237, 0.15)",
      hover: "rgba(255, 247, 237, 0.9)",
    },
  },
  "smart-scheduling": {
    name: "Smart Scheduling",
    bgGradient: "from-slate-900 via-violet-900 to-purple-900",
    primary: "#A78BFA",
    secondary: "#C084FC",
    accent: "#E879F9",
    text: {
      primary: "#FAF5FF",
      secondary: "rgba(250, 245, 255, 0.85)",
      light: "rgba(250, 245, 255, 0.65)",
    },
    background: {
      primary: "rgba(250, 245, 255, 0.08)",
      secondary: "rgba(250, 245, 255, 0.04)",
      trinary: "rgba(250, 245, 255, 0.02)",
      card: "rgba(46, 16, 101, 0.6)",
    },
    border: "rgba(250, 245, 255, 0.15)",
    button: {
      primary: "#FAF5FF",
      secondary: "rgba(250, 245, 255, 0.15)",
      hover: "rgba(250, 245, 255, 0.9)",
    },
  },
  analytics: {
    name: "Analytics",
    bgGradient: "from-slate-900 via-amber-900 to-orange-900",
    primary: "#FBBF24",
    secondary: "#F59E0B",
    accent: "#F97316",
    text: {
      primary: "#FFFBEB",
      secondary: "rgba(255, 251, 235, 0.85)",
      light: "rgba(255, 251, 235, 0.65)",
    },
    background: {
      primary: "rgba(255, 251, 235, 0.08)",
      secondary: "rgba(255, 251, 235, 0.04)",
      trinary: "rgba(255, 251, 235, 0.02)",
      card: "rgba(69, 39, 2, 0.6)",
    },
    border: "rgba(255, 251, 235, 0.15)",
    button: {
      primary: "#FFFBEB",
      secondary: "rgba(255, 251, 235, 0.15)",
      hover: "rgba(255, 251, 235, 0.9)",
    },
  },
  enterprise: {
    name: "Enterprise",
    bgGradient: "from-slate-900 via-indigo-900 to-blue-900",
    primary: "#6366F1",
    secondary: "#3B82F6",
    accent: "#8B5CF6",
    text: {
      primary: "#F1F5F9",
      secondary: "rgba(241, 245, 249, 0.85)",
      light: "rgba(241, 245, 249, 0.65)",
    },
    background: {
      primary: "rgba(241, 245, 249, 0.08)",
      secondary: "rgba(241, 245, 249, 0.04)",
      trinary: "rgba(241, 245, 249, 0.02)",
      card: "rgba(15, 23, 42, 0.6)",
    },
    border: "rgba(241, 245, 249, 0.15)",
    button: {
      primary: "#F1F5F9",
      secondary: "rgba(241, 245, 249, 0.15)",
      hover: "rgba(241, 245, 249, 0.9)",
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
