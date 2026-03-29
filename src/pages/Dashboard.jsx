import { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, X, Pencil, Trash2, ChevronDown,
  CheckCircle2, Circle, GripVertical, CalendarDays,
  ListChecks, AlertCircle, Clock, CheckCheck, LayoutList,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../hooks/useTasks";
import {
  CATEGORIES, PRIORITIES,
  getCategoryStyle, getPriorityStyle, isOverdue,
} from "../utils/constants";

// ── Skeleton loader — shown while tasks are fetching ──────────────────────────
function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="flex gap-2">
                <div className="h-3 bg-slate-100 dark:bg-gray-700/60 rounded-full w-16" />
                <div className="h-3 bg-slate-100 dark:bg-gray-700/60 rounded-full w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, textColor }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon size={16} className={textColor} />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className={`text-xl font-bold ${textColor}`}>{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { currentUser } = useAuth();
  const {
    tasks, loading, error,
    addTask, toggleComplete, updateTitle, deleteTask, clearCompleted,
    addSubtask, toggleSubtask, deleteSubtask,
  } = useTasks();

  const [taskTitle, setTaskTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Other");
  const [selectedPriority, setSelectedPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });
  const inputRef = useRef(null);

  useEffect(() => { if (currentUser) inputRef.current?.focus(); }, [currentUser]);

  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 3000);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      await addTask({ title: taskTitle, category: selectedCategory, priority: selectedPriority, dueDate });
      setTaskTitle(""); setDueDate("");
      inputRef.current?.focus();
      showNotification("Task added");
    } catch { showNotification("Error adding task", "error"); }
  };

  const handleToggleComplete = async (id, current) => {
    try { await toggleComplete(id, current); }
    catch { showNotification("Error updating task", "error"); }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try { await deleteTask(id); showNotification("Task deleted"); }
    catch { showNotification("Error deleting task", "error"); }
  };

  const handleSaveEdit = async (id) => {
    try {
      await updateTitle(id, editValue);
      setEditingId(null); setEditValue("");
      showNotification("Task updated");
    } catch { showNotification("Error updating task", "error"); }
  };

  const handleAddSubtask = async (taskId, val) => {
    try { await addSubtask(taskId, val); }
    catch { showNotification("Error adding subtask", "error"); }
  };

  const handleClearCompleted = async () => {
    if (!window.confirm("Clear all completed tasks?")) return;
    try { await clearCompleted(); showNotification("Completed tasks cleared"); }
    catch { showNotification("Error clearing tasks", "error"); }
  };

  const toggleExpanded = (id) => {
    const s = new Set(expandedTasks);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedTasks(s);
  };

  const getSortedTasks = () => {
    const filtered = tasks.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filter === "all" || (filter === "active" && !t.completed) || (filter === "completed" && t.completed);
      return matchSearch && matchFilter;
    });
    const pw = { High: 3, Medium: 2, Low: 1 };
    switch (sortBy) {
      case "priority": return [...filtered].sort((a, b) => pw[b.priority] - pw[a.priority]);
      case "dueDate": return [...filtered].sort((a, b) => { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate) - new Date(b.dueDate); });
      case "category": return [...filtered].sort((a, b) => a.category.localeCompare(b.category));
      default: return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    }
  };

  const filteredTasks = getSortedTasks();

  const onDragEnd = ({ destination, source }) => {
    if (!destination || destination.index === source.index) return;
    const reordered = Array.from(filteredTasks);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.completed).length,
    active: tasks.filter((t) => !t.completed).length,
    overdue: tasks.filter((t) => t.dueDate && isOverdue(t.dueDate) && !t.completed).length,
    rate: tasks.length ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0,
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 animate-pulse h-16" />
        ))}
      </div>
      <TaskSkeleton />
    </div>
  );

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-10 shadow-sm max-w-md w-full">
        <AlertCircle className="mx-auto mb-4 text-rose-500" size={40} />
        <p className="text-gray-800 dark:text-gray-200 font-semibold mb-1">Something went wrong</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error}</p>
        <button onClick={() => window.location.reload()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Reload page
        </button>
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
              notification.type === "error"
                ? "bg-rose-600 text-white"
                : "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
            }`}
          >
            {notification.type === "error"
              ? <AlertCircle size={15} />
              : <CheckCircle2 size={15} />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          {/* Progress ring */}
          {tasks.length > 0 && (
            <div className="relative w-12 h-12 shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" strokeWidth="4" fill="none" className="stroke-slate-200 dark:stroke-gray-700" />
                <circle cx="24" cy="24" r="20" strokeWidth="4" fill="none"
                  stroke="#3b82f6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - stats.rate / 100)}`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{stats.rate}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats row */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <StatCard icon={LayoutList}    label="Total"   value={stats.total}     color="bg-blue-50 dark:bg-blue-500/10"    textColor="text-blue-600 dark:text-blue-400" />
            <StatCard icon={CheckCheck}    label="Done"    value={stats.completed} color="bg-emerald-50 dark:bg-emerald-500/10" textColor="text-emerald-600 dark:text-emerald-400" />
            <StatCard icon={Clock}         label="Active"  value={stats.active}    color="bg-amber-50 dark:bg-amber-500/10"   textColor="text-amber-600 dark:text-amber-400" />
            <StatCard icon={AlertCircle}   label="Overdue" value={stats.overdue}   color="bg-rose-50 dark:bg-rose-500/10"     textColor="text-rose-600 dark:text-rose-400" />
          </div>
        )}
      </motion.div>

      {/* ── Add task form ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="mb-5 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-4">
        <form onSubmit={handleAddTask}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Plus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a new task..."
                className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {taskTitle && (
                <button type="button" onClick={() => setTaskTitle("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X size={14} />
                </button>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={!taskTitle.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              Add Task
            </motion.button>
          </div>

          {/* Form options row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Category */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400">Category</span>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            {/* Priority */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400">Priority</span>
              <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                {PRIORITIES.map((p) => <option key={p.name} value={p.name}>{p.icon} {p.name}</option>)}
              </select>
            </div>
            {/* Due date */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 rounded-lg">
              <CalendarDays size={12} className="text-gray-400" />
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer" />
            </div>
          </div>
        </form>
      </motion.div>

      {/* ── Search + filter bar ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="mb-4 flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-gray-300 cursor-pointer">
            <option value="created">Date created</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due date</option>
            <option value="category">Category</option>
          </select>

          {/* Filter tabs */}
          <div className="flex bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg p-0.5">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "completed", label: "Done" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Task list ── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasklist">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              <AnimatePresence mode="popLayout">

                {/* Empty state */}
                {filteredTasks.length === 0 && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 py-16 text-center"
                  >
                    <div className="w-14 h-14 bg-slate-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {searchTerm
                        ? <Search size={24} className="text-gray-400" />
                        : <ListChecks size={24} className="text-gray-400" />}
                    </div>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {searchTerm ? "No results found" : "No tasks yet"}
                    </h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-5">
                      {searchTerm ? `Nothing matches "${searchTerm}"` : "Add your first task above to get started"}
                    </p>
                    {!searchTerm && (
                      <button onClick={() => inputRef.current?.focus()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                        <Plus size={14} /> Add a task
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Task cards */}
                {filteredTasks.map((task, index) => {
                  const overdue = isOverdue(task.dueDate);
                  const completedSubs = task.subtasks?.filter((s) => s.completed).length || 0;
                  const totalSubs = task.subtasks?.length || 0;
                  const isExpanded = expandedTasks.has(task.id);
                  const category = CATEGORIES.find((c) => c.name === task.category) || CATEGORIES[4];
                  const priority = PRIORITIES.find((p) => p.name === task.priority) || PRIORITIES[1];
                  const priorityBar = priority.name === "High" ? "bg-rose-500" : priority.name === "Medium" ? "bg-amber-400" : "bg-emerald-500";

                  return (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <motion.div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10, scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className={`group bg-white dark:bg-gray-800 rounded-xl border transition-all duration-150 overflow-hidden ${
                            snapshot.isDragging
                              ? "border-blue-400 shadow-xl rotate-1 scale-[1.02]"
                              : task.completed
                              ? "border-slate-200 dark:border-gray-700 opacity-70"
                              : overdue
                              ? "border-rose-200 dark:border-rose-800/40 shadow-sm"
                              : "border-slate-200 dark:border-gray-700 shadow-sm hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-md"
                          }`}
                        >
                          {/* Priority color bar — left edge */}
                          <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${priorityBar}`} />

                          <div className="p-4 pl-5">
                            <div className="flex items-start gap-3">

                              {/* Drag handle */}
                              <span
                                {...provided.dragHandleProps}
                                className="mt-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                              >
                                <GripVertical size={14} />
                              </span>

                              {/* Checkbox */}
                              <button
                                onClick={() => handleToggleComplete(task.id, task.completed)}
                                className="mt-0.5 shrink-0 text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                              >
                                {task.completed
                                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                                  : <Circle size={18} />}
                              </button>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                {editingId === task.id ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleSaveEdit(task.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEdit(task.id);
                                      if (e.key === "Escape") { setEditingId(null); setEditValue(""); }
                                    }}
                                    autoFocus
                                    className="w-full px-2 py-1 text-sm rounded-md border border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <>
                                    <p
                                      onDoubleClick={() => { setEditingId(task.id); setEditValue(task.title); }}
                                      className={`text-sm font-medium leading-snug cursor-default select-none ${
                                        task.completed
                                          ? "line-through text-gray-400 dark:text-gray-500"
                                          : "text-gray-900 dark:text-white"
                                      }`}
                                    >
                                      {task.title}
                                    </p>

                                    {/* Tags row */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getCategoryStyle(task.category)}`}>
                                        {category.icon} {task.category}
                                      </span>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${getPriorityStyle(task.priority)}`}>
                                        {priority.icon} {task.priority}
                                      </span>
                                      {task.dueDate && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${
                                          overdue
                                            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                                            : "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-400"
                                        }`}>
                                          <CalendarDays size={10} />
                                          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                          {overdue && " · Overdue"}
                                        </span>
                                      )}
                                      {totalSubs > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-400 font-medium">
                                          <ListChecks size={10} />
                                          {completedSubs}/{totalSubs}
                                        </span>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Action buttons — visible on hover */}
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() => { setEditingId(task.id); setEditValue(task.title); }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
                                  title="Edit"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* ── Subtasks ── */}
                            <div className="mt-3 ml-10">
                              <button
                                onClick={() => toggleExpanded(task.id)}
                                className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                                {totalSubs > 0 ? `${totalSubs} subtask${totalSubs !== 1 ? "s" : ""}` : "Add subtask"}
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2 space-y-1.5">
                                      {task.subtasks?.map((sub) => (
                                        <motion.div
                                          key={sub.id}
                                          initial={{ opacity: 0, x: -8 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 8 }}
                                          className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-gray-700/40 rounded-lg group/sub"
                                        >
                                          <button onClick={() => toggleSubtask(task.id, sub.id)}
                                            className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors">
                                            {sub.completed
                                              ? <CheckCircle2 size={14} className="text-emerald-500" />
                                              : <Circle size={14} />}
                                          </button>
                                          <span className={`flex-1 text-xs ${sub.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                                            {sub.title}
                                          </span>
                                          <button onClick={() => deleteSubtask(task.id, sub.id)}
                                            className="shrink-0 text-gray-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors opacity-0 group-hover/sub:opacity-100">
                                            <X size={12} />
                                          </button>
                                        </motion.div>
                                      ))}

                                      {/* Add subtask input */}
                                      <div className="flex gap-1.5 mt-2">
                                        <input
                                          id={`sub-${task.id}`}
                                          type="text"
                                          placeholder="New subtask..."
                                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" && e.target.value.trim()) {
                                              handleAddSubtask(task.id, e.target.value);
                                              e.target.value = "";
                                            }
                                          }}
                                        />
                                        <button
                                          onClick={() => {
                                            const inp = document.getElementById(`sub-${task.id}`);
                                            if (inp?.value.trim()) { handleAddSubtask(task.id, inp.value); inp.value = ""; }
                                          }}
                                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </Draggable>
                  );
                })}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Clear completed */}
      {stats.completed > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex justify-center">
          <button
            onClick={handleClearCompleted}
            className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors py-2 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            <Trash2 size={12} />
            Clear {stats.completed} completed task{stats.completed !== 1 ? "s" : ""}
          </button>
        </motion.div>
      )}
    </>
  );
}
