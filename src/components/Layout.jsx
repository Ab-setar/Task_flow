import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard, BarChart2, Settings, LogOut,
  Sun, Moon, Menu, X, Sparkles,
} from "lucide-react";

export default function Layout({ isDark, toggleDarkMode }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target))
        setShowMobileMenu(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { to: "/", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/analytics", label: "Analytics", Icon: BarChart2 },
    { to: "/settings", label: "Settings", Icon: Settings },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? "dark bg-gray-950" : "bg-slate-50"}`}>

      {/* Subtle background gradient — light only */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200 dark:bg-violet-900/20 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white tracking-tight">TaskFlow</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">
              {currentUser?.email}
            </span>
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              title="Toggle dark mode"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden relative" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            >
              {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
            </button>

            <AnimatePresence>
              {showMobileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 p-1.5 z-50"
                >
                  {navItems.map(({ to, label, Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === "/"}
                      onClick={() => setShowMobileMenu(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                            : "text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800"
                        }`
                      }
                    >
                      <Icon size={15} />
                      {label}
                    </NavLink>
                  ))}
                  <div className="my-1 border-t border-slate-100 dark:border-gray-800" />
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {isDark ? <Sun size={15} /> : <Moon size={15} />}
                    {isDark ? "Light mode" : "Dark mode"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
