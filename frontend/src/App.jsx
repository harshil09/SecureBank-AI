/*import { Routes, Route } from "react-router-dom";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import AuthCallback from "./pages/AuthCallback";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/auth/callback" element={<AuthCallback />} /> 
    </Routes>
  );
}

export default App;*/
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import Register from "./components/Auth/Register"; // ✅ ADD THIS
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import UserDetails from "./components/Dashboard/UserDetails";
import AuthCallback from "./pages/AuthCallback";
import ResetPasswordOTP from "./components/Auth/ResetPasswordOTP";
import  {ChatBot}  from "./components/Auth/ChatBot";



// 🔐 Protected Route Component
function ProtectedRoute({ children }) {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function ChatNavigationBridge() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();

  useEffect(() => {
    const publicRoutes = new Set(["/", "/register", "/reset-password", "/auth/callback"]);

    const onChatNavigate = (event) => {
      const route = event?.detail?.route;
      if (!route) return;

      if (!token && !publicRoutes.has(route)) {
        navigate("/", { replace: true });
        return;
      }

      const routeMessageMap = {
        "/user-details": "Taken to user detail page",
        "/dashboard": "Taken to dashboard page",
        "/register": "Taken to signup page",
        "/": "Taken to login page",
      };

      navigate(route, {
        state: {
          fromChatbot: true,
          message: routeMessageMap[route] || "Navigation complete",
        },
      });
    };

    window.addEventListener("bank-chat-navigate", onChatNavigate);
    return () => {
      window.removeEventListener("bank-chat-navigate", onChatNavigate);
    };
  }, [navigate, token]);

  useEffect(() => {
    const onChatLogout = () => {
      if (!token) return;
      logout();
      navigate("/", { replace: true });
    };

    window.addEventListener("bank-chat-logout", onChatLogout);
    return () => {
      window.removeEventListener("bank-chat-logout", onChatLogout);
    };
  }, [logout, navigate, token]);

  return null;
}

function App() {
  return (
    <>
    <ChatNavigationBridge />
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPasswordOTP />} />
      
      
    

      {/* 🔥 PROTECTED DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-details"
        element={
          <ProtectedRoute>
            <UserDetails />
          </ProtectedRoute>
        }
      />

      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
    
    <ChatBot />
  </>
  );
}

export default App;
/*
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Auth/Login";
import AuthCallback from "./pages/AuthCallback";  // ✅ Import callback
import Dashboard from "./components/Dashboard/Dashboard";
import { useAuthStore } from "./store/authStore";

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} /> 
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;*/