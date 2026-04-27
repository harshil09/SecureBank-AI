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
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Register from "./components/Auth/Register"; // ✅ ADD THIS
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
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

function App() {
  return (
    <>
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