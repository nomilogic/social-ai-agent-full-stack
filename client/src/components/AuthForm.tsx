import React, { useState } from "react";
import { Mail, Lock, User, Sparkles } from "lucide-react";

interface AuthFormProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Login failed');
        }

        if (!result.token || !result.user) {
          throw new Error('Invalid response from server');
        }

        localStorage.setItem("auth_token", result.token);
        console.log('Login successful, user:', result.user);
        onAuthSuccess(result.user);
      } else {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || 'Registration failed');
        }

        if (!result.token || !result.user) {
          throw new Error('Invalid response from server');
        }

        localStorage.setItem("auth_token", result.token);
        console.log('Registration successful, user:', result.user);
        onAuthSuccess(result.user);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="w-full max-w-md mx-auto">
        {/* Animated Background */}
      <div className={`absolute inset-0 theme-bg-primary transition-all duration-1000`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-white/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 bg-white/15 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-white/10 rounded-full animate-pulse"></div>
      </div>
      <div className="theme-bg-card rounded-xl shadow-lg p-6 border" style={{ borderColor: "var(--theme-border)" }}>
        <div className="text-center mb-6">
          <div className="w-12 h-12 theme-gradient rounded-lg flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 theme-text-primary" />
          </div>
          <h1 className="text-xl font-bold theme-text-primary">
            {isLogin ? "Welcome back" : "Get started"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium theme-text-primary mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="w-full px-3 py-2 theme-input rounded-lg focus:outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium theme-text-secondary mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              className="w-full px-3 py-2 theme-input rounded-lg focus:outline-none"
              placeholder="Enter your password"
            />
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium theme-text-secondary mb-1"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full px-3 py-2 theme-input rounded-lg focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>
          )}

          {error && (
            <div
              className="p-3 theme-bg-primary border rounded-lg"
              style={{ borderColor: "var(--theme-accent)" }}
            >
              <p className="text-sm theme-text-primary">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full theme-button-primary py-2 px-4 rounded-lg hover:theme-button-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="theme-text-secondary hover:opacity-80 text-sm font-medium"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
