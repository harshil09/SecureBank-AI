import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "../../store/authStore";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Validation schema
const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: signup, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const isBusy = isSubmitting || isLoading;

  const onSubmit = async (data) => {
    clearError?.();

    const success = await signup({
      email: data.email,
      password: data.password,
    });

    if (success) {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleInputChange = () => {
    if (error) clearError?.();
  };

  return (
    <div style={styles.container}>
      {/* Animated background gradients */}
      <div style={styles.bgGradient1}></div>
      <div style={styles.bgGradient2}></div>
      <div style={styles.bgGradient3}></div>
      
      {/* Floating orbs */}
      <motion.div
        style={styles.orb1}
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      ></motion.div>
      <motion.div
        style={styles.orb2}
        animate={{
          y: [0, 40, 0],
          x: [0, -25, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      ></motion.div>

      {/* Main card */}
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Glow effect */}
        <div style={styles.cardGlow}></div>

        {/* Header */}
        <motion.div
          style={styles.header}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div style={styles.iconWrapper}>
            <Sparkles size={32} style={styles.sparkleIcon} />
          </div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>
            Join MyBank Pro and experience modern banking
          </p>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={styles.errorAlert}
            >
              <AlertCircle size={18} style={styles.errorIcon} />
              <span style={styles.errorText}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
          {/* Email Field */}
          <motion.div
            style={styles.formGroup}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <label style={styles.label}>Email Address</label>
            <div style={{
              ...styles.inputWrapper,
              ...(errors.email ? styles.inputWrapperError : {}),
            }}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                {...register("email")}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.fieldError}
              >
                {errors.email.message}
              </motion.p>
            )}
          </motion.div>

          {/* Password Field */}
          <motion.div
            style={styles.formGroup}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <label style={styles.label}>Password</label>
            <div style={{
              ...styles.inputWrapper,
              ...(errors.password ? styles.inputWrapperError : {}),
            }}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleBtn}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.fieldError}
              >
                {errors.password.message}
              </motion.p>
            )}
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div
            style={styles.formGroup}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <label style={styles.label}>Confirm Password</label>
            <div style={{
              ...styles.inputWrapper,
              ...(errors.confirmPassword ? styles.inputWrapperError : {}),
            }}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                {...register("confirmPassword")}
                onChange={handleInputChange}
                style={styles.input}
                placeholder="Confirm password"
              />
            </div>
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.fieldError}
              >
                {errors.confirmPassword.message}
              </motion.p>
            )}
          </motion.div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isBusy}
            style={{
              ...styles.submitBtn,
              ...(isBusy ? styles.submitBtnDisabled : {}),
            }}
            whileHover={!isBusy ? { scale: 1.02, y: -2 } : {}}
            whileTap={!isBusy ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <span style={styles.submitBtnText}>
              {isBusy ? "Creating Account..." : "Create Account"}
            </span>
            {!isBusy && <div style={styles.submitBtnGlow}></div>}
          </motion.button>
        </form>

        {/* Footer */}
        <motion.p
          style={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.loginLink}
          >
            Sign In
          </button>
        </motion.p>
      </motion.div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
        }

        @keyframes gradientShift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(10%, -10%) rotate(5deg); }
          66% { transform: translate(-10%, 10%) rotate(-5deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.9; }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // Background gradients
  bgGradient1: {
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: "radial-gradient(circle at 30% 50%, rgba(138, 43, 226, 0.15) 0%, transparent 50%)",
    animation: "gradientShift 15s ease-in-out infinite",
  },
  bgGradient2: {
    position: "absolute",
    top: "-50%",
    right: "-50%",
    width: "200%",
    height: "200%",
    background: "radial-gradient(circle at 70% 50%, rgba(0, 191, 255, 0.12) 0%, transparent 50%)",
    animation: "gradientShift 20s ease-in-out infinite reverse",
  },
  bgGradient3: {
    position: "absolute",
    bottom: "-50%",
    left: "25%",
    width: "150%",
    height: "150%",
    background: "radial-gradient(circle at 50% 80%, rgba(255, 20, 147, 0.1) 0%, transparent 50%)",
    animation: "gradientShift 18s ease-in-out infinite",
  },

  // Floating orbs
  orb1: {
    position: "absolute",
    top: "15%",
    right: "20%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(138, 43, 226, 0.4) 0%, rgba(138, 43, 226, 0) 70%)",
    filter: "blur(60px)",
    pointerEvents: "none",
    zIndex: 1,
  },
  orb2: {
    position: "absolute",
    bottom: "20%",
    left: "15%",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0, 191, 255, 0.35) 0%, rgba(0, 191, 255, 0) 70%)",
    filter: "blur(50px)",
    pointerEvents: "none",
    zIndex: 1,
  },

  // Card
  card: {
    position: "relative",
    zIndex: 10,
    width: "100%",
    maxWidth: "480px",
    padding: "48px 40px",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "24px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 80px rgba(138, 43, 226, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  },

  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: "24px",
    background: "linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(0, 191, 255, 0.1) 100%)",
    opacity: 0.6,
    animation: "pulse 4s ease-in-out infinite",
    pointerEvents: "none",
  },

  // Header
  header: {
    textAlign: "center",
    marginBottom: "36px",
  },

  iconWrapper: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "72px",
    height: "72px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #8a2be2 0%, #00bfff 100%)",
    boxShadow: "0 8px 24px rgba(138, 43, 226, 0.4), 0 0 40px rgba(0, 191, 255, 0.2)",
    marginBottom: "20px",
  },

  sparkleIcon: {
    color: "#ffffff",
    filter: "drop-shadow(0 2px 8px rgba(255, 255, 255, 0.3))",
  },

  title: {
    fontSize: "32px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #ffffff 0%, #e0e0ff 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },

  subtitle: {
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    lineHeight: "1.5",
  },

  // Error Alert
  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "12px",
    marginBottom: "20px",
    backdropFilter: "blur(10px)",
  },

  errorIcon: {
    color: "#ff6b6b",
    flexShrink: 0,
  },

  errorText: {
    fontSize: "14px",
    color: "#ffcccb",
    fontWeight: "500",
  },

  // Form
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: "4px",
    letterSpacing: "0.3px",
  },

  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1.5px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "12px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "hidden",
  },

  inputWrapperError: {
    borderColor: "rgba(239, 68, 68, 0.5)",
    background: "rgba(239, 68, 68, 0.05)",
  },

  inputIcon: {
    position: "absolute",
    left: "16px",
    color: "rgba(255, 255, 255, 0.5)",
    pointerEvents: "none",
    zIndex: 2,
  },

  input: {
    flex: 1,
    padding: "14px 16px 14px 48px",
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: "15px",
    color: "#ffffff",
    fontWeight: "500",
    fontFamily: "inherit",
  },

  toggleBtn: {
    position: "absolute",
    right: "12px",
    background: "transparent",
    border: "none",
    color: "rgba(255, 255, 255, 0.6)",
    cursor: "pointer",
    padding: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },

  fieldError: {
    fontSize: "13px",
    color: "#ff6b6b",
    fontWeight: "500",
    marginTop: "4px",
    marginLeft: "4px",
  },

  // Submit Button
  submitBtn: {
    position: "relative",
    width: "100%",
    padding: "16px 32px",
    marginTop: "8px",
    background: "linear-gradient(135deg, #8a2be2 0%, #00bfff 100%)",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "700",
    color: "#ffffff",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 20px rgba(138, 43, 226, 0.4), 0 0 40px rgba(0, 191, 255, 0.2)",
    overflow: "hidden",
    fontFamily: "inherit",
    letterSpacing: "0.5px",
  },

  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
    transform: "none",
  },

  submitBtnText: {
    position: "relative",
    zIndex: 2,
  },

  submitBtnGlow: {
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "200%",
    height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
    animation: "shimmer 3s infinite",
  },

  // Footer
  footer: {
    textAlign: "center",
    fontSize: "14px",
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: "24px",
    fontWeight: "500",
  },

  loginLink: {
    background: "transparent",
    border: "none",
    color: "#00bfff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    fontFamily: "inherit",
    textDecoration: "none",
    transition: "all 0.2s ease",
    padding: "0",
  },
};