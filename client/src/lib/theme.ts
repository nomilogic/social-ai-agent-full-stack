export interface ThemeConfig {
  name: string;
  key: string;
  bgGradient: string;
  tailwindClasses: {
    gradient: string;
    primary: string;
    secondary: string;
    accent: string;
  };
  colors: {
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
  };
}

export const themes: Record<string, ThemeConfig> = {
  "ai-revolution": {
    name: "AI Revolution",
    key: "ai-revolution",
    bgGradient: "bg-gradient-ai-revolution",
    tailwindClasses: {
      gradient: "bg-gradient-ai-revolution",
      primary: "bg-blue-500",
      secondary: "bg-violet-500", 
      accent: "bg-indigo-500",
    },
    colors: {
      primary: "#3B82F6", // blue-500
      secondary: "#8B5CF6", // violet-500
      accent: "#6366F1", // indigo-500
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.9)",
        light: "rgba(255, 255, 255, 0.7)",
      },
      background: {
        primary: "rgba(255, 255, 255, 0.1)",
        secondary: "rgba(9, 10, 35, 0.05)",
        card: "rgba(25, 25, 25, 0.55)",
      },
      border: "rgba(255, 255, 255, 0.2)",
      button: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.2)",
        hover: "rgba(255, 255, 255, 0.9)",
      },
    },
  },
  "content-creation": {
    name: "Content Creation",
    key: "content-creation",
    bgGradient: "bg-gradient-content-creation",
    tailwindClasses: {
      gradient: "bg-gradient-content-creation",
      primary: "bg-emerald-500",
      secondary: "bg-teal-600",
      accent: "bg-cyan-600",
    },
    colors: {
      primary: "#10B981", // emerald-500
      secondary: "#0D9488", // teal-600
      accent: "#0891B2", // cyan-600
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.9)",
        light: "rgba(255, 255, 255, 0.7)",
      },
      background: {
        primary: "rgba(255, 255, 255, 0.1)",
        secondary: "rgba(255, 255, 255, 0.05)",
        card: "rgba(255, 255, 255, 0.15)",
      },
      border: "rgba(255, 255, 255, 0.2)",
      button: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.2)",
        hover: "rgba(255, 255, 255, 0.9)",
      },
    },
  },
  "multi-platform": {
    name: "Multi-Platform",
    key: "multi-platform",
    bgGradient: "bg-gradient-multi-platform",
    tailwindClasses: {
      gradient: "bg-gradient-multi-platform",
      primary: "bg-orange-500",
      secondary: "bg-red-500",
      accent: "bg-pink-500",
    },
    colors: {
      primary: "#F97316", // orange-500
      secondary: "#EF4444", // red-500
      accent: "#EC4899", // pink-500
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.9)",
        light: "rgba(255, 255, 255, 0.7)",
      },
      background: {
        primary: "rgba(255, 255, 255, 0.1)",
        secondary: "rgba(255, 255, 255, 0.05)",
        card: "rgba(255, 255, 255, 0.15)",
      },
      border: "rgba(255, 255, 255, 0.2)",
      button: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.2)",
        hover: "rgba(255, 255, 255, 0.9)",
      },
    },
  },
  "smart-scheduling": {
    name: "Smart Scheduling",
    key: "smart-scheduling",
    bgGradient: "bg-gradient-smart-scheduling",
    tailwindClasses: {
      gradient: "bg-gradient-smart-scheduling",
      primary: "bg-violet-500",
      secondary: "bg-purple-500",
      accent: "bg-fuchsia-600",
    },
    colors: {
      primary: "#8B5CF6", // violet-500
      secondary: "#A855F7", // purple-500
      accent: "#C026D3", // fuchsia-600
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.9)",
        light: "rgba(255, 255, 255, 0.7)",
      },
      background: {
        primary: "rgba(255, 255, 255, 0.1)",
        secondary: "rgba(255, 255, 255, 0.05)",
        card: "rgba(255, 255, 255, 0.15)",
      },
      border: "rgba(255, 255, 255, 0.2)",
      button: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.2)",
        hover: "rgba(255, 255, 255, 0.9)",
      },
    },
  },
  analytics: {
    name: "Analytics",
    key: "analytics", 
    bgGradient: "bg-gradient-analytics",
    tailwindClasses: {
      gradient: "bg-gradient-analytics",
      primary: "bg-amber-500",
      secondary: "bg-orange-600",
      accent: "bg-red-600",
    },
    colors: {
      primary: "#F59E0B", // amber-500
      secondary: "#EA580C", // orange-600
      accent: "#DC2626", // red-600
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.9)",
        light: "rgba(255, 255, 255, 0.7)",
      },
      background: {
        primary: "rgba(255, 255, 255, 0.1)",
        secondary: "rgba(255, 255, 255, 0.05)",
        card: "rgba(255, 255, 255, 0.15)",
      },
      border: "rgba(255, 255, 255, 0.2)",
      button: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.2)",
        hover: "rgba(255, 255, 255, 0.9)",
      },
    },
  },
  enterprise: {
    name: "Enterprise",
    key: "enterprise",
    bgGradient: "bg-gradient-enterprise",
    tailwindClasses: {
      gradient: "bg-gradient-enterprise",
      primary: "bg-indigo-600",
      secondary: "bg-blue-600",
      accent: "bg-violet-600",
    },
    colors: {
      primary: "#4F46E5", // indigo-600
      secondary: "#2563EB", // blue-600
      accent: "#7C3AED", // violet-600
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.9)",
        light: "rgba(255, 255, 255, 0.7)",
      },
      background: {
        primary: "rgba(255, 255, 255, 0.1)",
        secondary: "rgba(255, 255, 255, 0.05)",
        card: "rgba(255, 255, 255, 0.15)",
      },
      border: "rgba(255, 255, 255, 0.2)",
      button: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.2)",
        hover: "rgba(255, 255, 255, 0.9)",
      },
    },
  },
};

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = "ai-revolution"; // Default to first onboarding theme
  private listeners: ((theme: ThemeConfig) => void)[] = [];

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  getCurrentTheme(): ThemeConfig {
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
    root.style.setProperty("--theme-primary", theme.colors.primary);
    root.style.setProperty("--theme-secondary", theme.colors.secondary);
    root.style.setProperty("--theme-accent", theme.colors.accent);
    root.style.setProperty("--theme-text-primary", theme.colors.text.primary);
    root.style.setProperty("--theme-text-secondary", theme.colors.text.secondary);
    root.style.setProperty("--theme-text-light", theme.colors.text.light);
    root.style.setProperty("--theme-bg-primary", theme.colors.background.primary);
    root.style.setProperty("--theme-bg-secondary", theme.colors.background.secondary);
    root.style.setProperty("--theme-bg-card", theme.colors.background.card);
    root.style.setProperty("--theme-border", theme.colors.border);
    root.style.setProperty("--theme-button-primary", theme.colors.button.primary);
    root.style.setProperty("--theme-button-secondary", theme.colors.button.secondary);
    root.style.setProperty("--theme-button-hover", theme.colors.button.hover);

    // Set data attribute for Tailwind theme switching
    root.setAttribute("data-theme", theme.key);
  }

  subscribe(callback: (theme: ThemeConfig) => void) {
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
    return Object.keys(themes).map((key) => themes[key]);
  }

  // Utility methods for getting Tailwind classes
  getCurrentGradientClass(): string {
    return this.getCurrentTheme().tailwindClasses.gradient;
  }

  getCurrentPrimaryClass(): string {
    return this.getCurrentTheme().tailwindClasses.primary;
  }

  getCurrentSecondaryClass(): string {
    return this.getCurrentTheme().tailwindClasses.secondary;
  }

  getCurrentAccentClass(): string {
    return this.getCurrentTheme().tailwindClasses.accent;
  }
}

export const themeManager = ThemeManager.getInstance();
