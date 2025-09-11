import React, { useState } from "react";
import { Mail, Lock, User, Sparkles } from "lucide-react";
import { initiateGoogleOAuth, initiateFacebookOAuth, isOAuthConfigured } from "../utils/authOAuth";

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
  const [rememberMe, setRememberMe] = useState(false);
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

        // Store token with expiration based on rememberMe setting
        if (rememberMe) {
          // Persistent storage for 30 days
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          localStorage.setItem("auth_token", result.token);
          localStorage.setItem("auth_token_expiry", expirationDate.toISOString());
          localStorage.setItem("auth_remember", "true");
        } else {
          // Session storage (expires when browser closes)
          localStorage.setItem("auth_token", result.token);
          localStorage.removeItem("auth_token_expiry");
          localStorage.removeItem("auth_remember");
        }
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

  const handleGoogleOAuth = async () => {
    setLoading(true);
    setError("");
    
    try {
      const result = await initiateGoogleOAuth();
      localStorage.setItem("auth_token", result.token);
      console.log('Google OAuth successful, user:', result.user);
      onAuthSuccess(result.user);
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      setError(error.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookOAuth = async () => {
    setLoading(true);
    setError("");
    
    try {
      const result = await initiateFacebookOAuth();
      localStorage.setItem("auth_token", result.token);
      console.log('Facebook OAuth successful, user:', result.user);
      onAuthSuccess(result.user);
    } catch (error: any) {
      console.error('Facebook OAuth error:', error);
      setError(error.message || 'Facebook authentication failed');
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

          {/* Remember Me Checkbox */}
          {isLogin && (
            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm theme-text-secondary">
                Remember me for 30 days
              </label>
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

        {/* OAuth Login Buttons */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--theme-border)" }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 theme-bg-card theme-text-secondary">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* Google OAuth Button */}
            {isOAuthConfigured('google') && (
              <button
                type="button"
                onClick={handleGoogleOAuth}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Google</span>
              </button>
            )}

            {/* Facebook OAuth Button */}
            {isOAuthConfigured('facebook') && (
              <button
                type="button"
                onClick={handleFacebookOAuth}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="ml-2">Facebook</span>
              </button>
            )}
          </div>
        </div>

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
