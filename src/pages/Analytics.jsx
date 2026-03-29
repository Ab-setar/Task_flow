import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { db } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { CATEGORIES, PRIORITIES, isOverdue } from "../utils/constants";

export default function Analytics() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = tasks.filter((t) => !t.completed).length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const categories = CATEGORIES.map((c) => c.name);
  const categoryIcons = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.icon]));
  const priorities = PRIORITIES.map((p) => p.name);
  const priorityColors = { High: "bg-rose-500", Medium: "bg-amber-500", Low: "bg-emerald-500" };

  const byCat = categories.map((cat) => ({
    name: cat,
    icon: categoryIcons[cat],
    total: tasks.filter((t) => t.category === cat).length,
    done: tasks.filter((t) => t.category === cat && t.completed).length,
  })).filter((c) => c.total > 0);

  const byPriority = priorities.map((pri) => ({
    name: pri,
    total: tasks.filter((t) => t.priority === pri).length,
    done: tasks.filter((t) => t.priority === pri && t.completed).length,
  })).filter((p) => p.total > 0);

  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate) && !t.completed).length;

  const totalSubtasks = tasks.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0);
  const completedSubtasks = tasks.reduce((acc, t) => acc + (t.subtasks?.filter((s) => s.completed).length || 0), 0);

  const StatCard = ({ icon, label, value, sub, color = "bg-blue-100 dark:bg-blue-500/10" }) => (
    <motion.div whileHover={{ y: -2 }} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Overview of your productivity</p>
      </div>

      {total === 0 ? (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-16 text-center border border-white/20 shadow-lg">
          <div className="text-7xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No data yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Add some tasks on the Dashboard to see your analytics.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon="📋" label="Total Tasks" value={total} />
            <StatCard icon="✅" label="Completed" value={completed} sub={`${completionRate}% rate`} color="bg-emerald-100 dark:bg-emerald-500/10" />
            <StatCard icon="⏳" label="Active" value={active} color="bg-amber-100 dark:bg-amber-500/10" />
            <StatCard icon="⚠️" label="Overdue" value={overdueCount} color="bg-rose-100 dark:bg-rose-500/10" />
          </div>

          {/* Completion bar */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${completionRate}%` }} transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{completed} completed</span>
              <span>{active} remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* By Category */}
            {byCat.length > 0 && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">By Category</h3>
                <div className="space-y-4">
                  {byCat.map((cat) => {
                    const pct = cat.total ? Math.round((cat.done / cat.total) * 100) : 0;
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{cat.icon} {cat.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{cat.done}/{cat.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* By Priority */}
            {byPriority.length > 0 && (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">By Priority</h3>
                <div className="space-y-4">
                  {byPriority.map((pri) => {
                    const pct = pri.total ? Math.round((pri.done / pri.total) * 100) : 0;
                    return (
                      <div key={pri.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{pri.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{pri.done}/{pri.total}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full ${priorityColors[pri.name]} rounded-full`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Subtasks</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalSubtasks}</p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${totalSubtasks ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{completedSubtasks} done</span>
                    <span>{totalSubtasks - completedSubtasks} left</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
