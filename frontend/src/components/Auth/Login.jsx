import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../store/authStore";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../../config/env";
import "./l.css";
import {ChatBot}  from "./ChatBot";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(2, "Password must be at least 8 characters"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    clearError?.();
    const success = await login(data);
    if (success) {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  return (
    <div className="login-container">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div
    style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "350px",
      height: "500px",
      zIndex: 1000,
    }}
  >
  </div>

      {/* Floating Geometric Shapes */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="login-card"
      >
        {/* Glassmorphic Effect Overlay */}
        <div className="card-glow"></div>

        {/* Header */}
        <header className="login-header">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="logo-icon"
          >
            <Sparkles className="sparkle-icon" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="login-title"
          >
            MyBank Pro
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="login-subtitle"
          >
            Your gateway to seamless banking
          </motion.p>
        </header>

        {/* Global Error */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="error-banner"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="error-icon" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="form-group"
          >
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className={`input-wrapper ${errors.email ? "error" : ""}`}>
              <Mail className="input-icon" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="form-input"
                placeholder="you@example.com"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="error-indicator"
                />
              )}
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  id="email-error"
                  className="error-message"
                  role="alert"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="form-group"
          >
            <div className="label-row">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <button
                type="button"
                className="forgot-link"
                onClick={() => navigate("/reset-password")}
              >
                Forgot password?
              </button>
            </div>
            <div className={`input-wrapper ${errors.password ? "error" : ""}`}>
              <Lock className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                className="form-input"
                placeholder="Enter your password"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="toggle-icon" />
                ) : (
                  <Eye className="toggle-icon" />
                )}
              </button>
              {errors.password && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="error-indicator"
                />
              )}
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  id="password-error"
                  className="error-message"
                  role="alert"
                >
                  {errors.password.message}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting || isLoading}
            className="submit-btn"
          >
            <span className="btn-gradient"></span>
            <span className="btn-content">
              {isSubmitting || isLoading ? (
                <>
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle
                      className="spinner-track"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                    <path
                      className="spinner-head"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </>
              ) : (
                "Sign In"
              )}
            </span>
          </motion.button>
        </form>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">OR</span>
          <div className="divider-line" />
        </div>

        {/* Google Login */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          type="button"
          disabled={isLoading}
          className="google-btn"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt=""
            className="google-icon"
            aria-hidden="true"
          />
          Continue with Google
        </motion.button>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="login-footer"
        >
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="register-link"
          >
            Create Account
          </button>
        </motion.p>
      </motion.div>
      <ChatBot />
    </div>

    
  );
}