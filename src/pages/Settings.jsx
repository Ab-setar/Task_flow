import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Defined outside Settings so React doesn't recreate it on every render
function Row({ icon, label, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      {children}
    </div>
  );
}

export default function Settings({ isDark, toggleDarkMode }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your preferences</p>
      </div>

      {/* Account */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Account</h3>
        <Row icon="👤" label="Email">
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{currentUser?.email}</span>
        </Row>
        <Row icon="🔑" label="Account ID">
          <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{currentUser?.uid?.slice(0, 12)}...</span>
        </Row>
      </div>

      {/* Appearance */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Appearance</h3>
        <Row icon={isDark ? "🌙" : "☀️"} label="Dark Mode">
          <button
            onClick={toggleDarkMode}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isDark ? "bg-blue-600" : "bg-gray-300"}`}
            role="switch"
            aria-checked={isDark}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${isDark ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </Row>
      </div>

      {/* Danger zone */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-rose-200/50 dark:border-rose-800/30 shadow-lg">
        <h3 className="text-sm font-semibold text-rose-500 uppercase tracking-wider mb-4">Danger Zone</h3>
        <Row icon="🚪" label="Sign out of your account">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors shadow"
          >
            Logout
          </motion.button>
        </Row>
      </div>
    </motion.div>
  );
}
