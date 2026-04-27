import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      // No token found, redirect to login
      navigate("/login", { replace: true });
      return;
    }

    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(token.split(".")[1]));
      
      // Store token and user info
      setToken(token);
      setUser({
        id: payload.user_id,
        email: payload.email,
        name: payload.name,
      });

      // Store in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({
        id: payload.user_id,
        email: payload.email,
        name: payload.name,
      }));

      // Redirect to dashboard
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Token processing error:", error);
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, setToken, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          Logging you in...
        </h2>
        <p className="text-gray-600 mt-2">Please wait</p>
      </motion.div>
    </div>
  );
}