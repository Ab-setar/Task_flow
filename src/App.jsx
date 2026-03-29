import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./components/Auth/Login";

// Redirect to /login if not authenticated
function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return currentUser ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("taskflow-dark");
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => setIsDark((prev) => !prev);

  useEffect(() => {
    localStorage.setItem("taskflow-dark", JSON.stringify(isDark));
    isDark
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes — all share the Layout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout isDark={isDark} toggleDarkMode={toggleDarkMode} />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings isDark={isDark} toggleDarkMode={toggleDarkMode} />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
