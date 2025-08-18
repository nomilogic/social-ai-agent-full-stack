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
    <div className=" w-4xl theme-bg-card flex rounded-2xl items-center justify-center overflow-hidden">
      <div
        className=" w-full theme-bg-card lg:w-[50vw] w-[90vw]  rounded-2xl shadow-xl p-8 border"
        style={{ borderColor: "var(--theme-border)" }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 theme-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 theme-text-primary" />
          </div>
          <h1 className="text-2xl font-bold theme-text-primary mb-2">
            Social AI Agent
          </h1>
          <p className="theme-text-secondary">
            {isLogin ? "Welcome back!" : "Create your account"}
          </p>
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
