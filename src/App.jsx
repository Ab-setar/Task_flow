import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";

function App() {
  // Dark Mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("taskflow-dark");
    return saved ? JSON.parse(saved) : false;
  });

  // Tasks
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("taskflow-tasks");
    if (saved) {
      try {
        return JSON.parse(saved).map((t) => ({
          ...t,
          category: t.category || "Other",
          priority: t.priority || "Medium",
          dueDate: t.dueDate || null,
          subtasks: t.subtasks || [],
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [taskTitle, setTaskTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Other");
  const [selectedPriority, setSelectedPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [sortBy, setSortBy] = useState("created");

  const inputRef = useRef(null);

  const categories = [
    { name: "Work", color: "blue", icon: "💼", lightBg: "bg-blue-50", lightText: "text-blue-700", darkBg: "dark:bg-blue-500/10", darkText: "dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
    { name: "Personal", color: "emerald", icon: "🏠", lightBg: "bg-emerald-50", lightText: "text-emerald-700", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
    { name: "Shopping", color: "violet", icon: "🛒", lightBg: "bg-violet-50", lightText: "text-violet-700", darkBg: "dark:bg-violet-500/10", darkText: "dark:text-violet-400", border: "border-violet-200 dark:border-violet-800" },
    { name: "Health", color: "rose", icon: "❤️", lightBg: "bg-rose-50", lightText: "text-rose-700", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
    { name: "Other", color: "slate", icon: "📌", lightBg: "bg-slate-50", lightText: "text-slate-700", darkBg: "dark:bg-slate-500/10", darkText: "dark:text-slate-400", border: "border-slate-200 dark:border-slate-700" },
  ];

  const priorities = [
    { name: "Low", color: "emerald", icon: "🔽", lightBg: "bg-emerald-50", lightText: "text-emerald-700", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400" },
    { name: "Medium", color: "amber", icon: "⏺️", lightBg: "bg-amber-50", lightText: "text-amber-700", darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400" },
    { name: "High", color: "rose", icon: "🔼", lightBg: "bg-rose-50", lightText: "text-rose-700", darkBg: "dark:bg-rose-500/10", darkText: "dark:text-rose-400" },
  ];

  const getCategoryStyle = (cat) => {
    const category = categories.find(c => c.name === cat) || categories[4];
    return `${category.lightBg} ${category.lightText} ${category.darkBg} ${category.darkText}`;
  };

  const getPriorityStyle = (pri) => {
    const priority = priorities.find(p => p.name === pri) || priorities[1];
    return `${priority.lightBg} ${priority.lightText} ${priority.darkBg} ${priority.darkText}`;
  };

  const isOverdue = (dateStr) =>
    dateStr && new Date(dateStr) < new Date(new Date().toISOString().split("T")[0]);

  // Effects
  useEffect(() => {
    localStorage.setItem("taskflow-dark", JSON.stringify(isDark));
    isDark
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => inputRef.current?.focus(), []);

  const toggleDarkMode = () => setIsDark(!isDark);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: taskTitle.trim(),
      completed: false,
      createdAt: Date.now(),
      category: selectedCategory,
      priority: selectedPriority,
      dueDate: dueDate || null,
      subtasks: [],
    };
    setTasks([newTask, ...tasks]);
    setTaskTitle("");
    setDueDate("");
    inputRef.current?.focus();
  };

  const toggleComplete = (id) =>
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const toggleSubtasks = (id) => {
    const newSet = new Set(expandedTasks);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedTasks(newSet);
  };

  const addSubtask = (taskId, subTitle) => {
    if (!subTitle.trim()) return;
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                { id: Date.now(), title: subTitle.trim(), completed: false },
              ],
            }
          : t,
      ),
    );
  };

  const toggleSubtask = (taskId, subId) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) =>
                s.id === subId ? { ...s, completed: !s.completed } : s,
              ),
            }
          : t,
      ),
    );
  };

  const deleteSubtask = (taskId, subId) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) }
          : t,
      ),
    );
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };
  const saveEdit = (id) => {
    if (!editValue.trim()) return;
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, title: editValue.trim() } : t)),
    );
    setEditingId(null);
    setEditValue("");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  // Sorting and filtering
  const getSortedTasks = () => {
    let filtered = tasks.filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        filter === "all" ||
        (filter === "active" && !task.completed) ||
        (filter === "completed" && task.completed);
      return matchesSearch && matchesStatus;
    });

    switch (sortBy) {
      case "priority":
        const priorityWeight = { High: 3, Medium: 2, Low: 1 };
        return [...filtered].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      case "dueDate":
        return [...filtered].sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      case "category":
        return [...filtered].sort((a, b) => a.category.localeCompare(b.category));
      default:
        return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    }
  };

  const filteredTasks = getSortedTasks();

  const onDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;
    
    const reorderedTasks = Array.from(tasks);
    const [movedTask] = reorderedTasks.splice(source.index, 1);
    reorderedTasks.splice(destination.index, 0, movedTask);
    setTasks(reorderedTasks);
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length,
    overdue: tasks.filter(t => t.dueDate && isOverdue(t.dueDate) && !t.completed).length,
    highPriority: tasks.filter(t => t.priority === "High" && !t.completed).length,
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500 ${
        isDark 
          ? "dark bg-gray-950" 
          : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
      }`}>
      
      {/* Simple background pattern using CSS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#fff' : '#000'} 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      <div className='relative max-w-6xl mx-auto px-4 py-8'>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'>
          <div className='flex justify-between items-start'>
            <div>
              <h1 className='text-6xl font-black tracking-tight'>
                <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent'>
                  TaskFlow
                </span>
              </h1>
              <p className='text-gray-600 dark:text-gray-400 mt-2 text-lg'>
                Organize your life with elegance and precision
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className='flex items-center gap-4'>
              <div className='flex gap-3'>
                <div className='px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-sm'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>Active</span>
                  <span className='ml-2 font-bold text-gray-900 dark:text-white'>{stats.active}</span>
                </div>
                <div className='px-4 py-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-sm'>
                  <span className='text-sm text-gray-600 dark:text-gray-400'>Completed</span>
                  <span className='ml-2 font-bold text-emerald-600 dark:text-emerald-400'>{stats.completed}</span>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className='w-12 h-12 flex items-center justify-center text-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all'>
                {isDark ? "☀️" : "🌙"}
              </motion.button>
            </div>
          </div>

          {/* Alert Banner */}
          {stats.overdue > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='mt-4 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-2xl'>
              <div className='flex items-center gap-3'>
                <span className='text-2xl'>⚠️</span>
                <span className='text-rose-700 dark:text-rose-400 font-medium'>
                  You have {stats.overdue} overdue task{stats.overdue !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Main Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='lg:col-span-1'>
            <div className='sticky top-8 space-y-4'>
              {/* Categories */}
              <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/20'>
                <h3 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                  <span className='text-blue-600'>📊</span> Categories
                </h3>
                <div className='space-y-2'>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedCategory === cat.name
                          ? `${cat.lightBg} ${cat.darkBg} ${cat.border} border`
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}>
                      <span className='text-xl'>{cat.icon}</span>
                      <span className='flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {cat.name}
                      </span>
                      <span className='text-xs bg-white dark:bg-gray-700 px-2 py-1 rounded-full'>
                        {tasks.filter(t => t.category === cat.name).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priorities */}
              <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/20'>
                <h3 className='font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2'>
                  <span className='text-amber-600'>🎯</span> Priorities
                </h3>
                <div className='space-y-2'>
                  {priorities.map((pri) => (
                    <div
                      key={pri.name}
                      className='flex items-center gap-3 p-2'>
                      <span className='text-xl'>{pri.icon}</span>
                      <span className='flex-1 text-sm text-gray-700 dark:text-gray-300'>
                        {pri.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityStyle(pri.name)}`}>
                        {tasks.filter(t => t.priority === pri.name && !t.completed).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-5 border border-white/20'>
                <h3 className='font-semibold text-gray-900 dark:text-white mb-4'>⚡ Quick Actions</h3>
                <div className='space-y-2'>
                  <button
                    onClick={() => setFilter('all')}
                    className='w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300'>
                    📋 View all tasks
                  </button>
                  <button
                    onClick={() => setFilter('active')}
                    className='w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300'>
                    ✅ View active tasks
                  </button>
                  {stats.completed > 0 && (
                    <button
                      onClick={clearCompleted}
                      className='w-full text-left p-3 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl text-sm text-rose-600 dark:text-rose-400'>
                      🗑️ Clear completed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className='lg:col-span-3'>
            {/* Add Task Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20'>
              <form onSubmit={handleAddTask}>
                <div className='flex gap-3'>
                  <input
                    ref={inputRef}
                    type='text'
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className='flex-1 px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg'
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type='submit'
                    disabled={!taskTitle.trim()}
                    className='px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl'>
                    Add Task
                  </motion.button>
                </div>
                
                {/* Quick Options */}
                <div className='flex flex-wrap gap-3 mt-4'>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className='px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 text-sm'>
                    {categories.map(cat => (
                      <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className='px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 text-sm'>
                    {priorities.map(pri => (
                      <option key={pri.name} value={pri.name}>{pri.icon} {pri.name}</option>
                    ))}
                  </select>
                  <input
                    type='date'
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className='px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 text-sm'
                  />
                </div>
              </form>
            </motion.div>

            {/* Search and Filter Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='mb-6 flex flex-col sm:flex-row gap-3'>
              <div className='flex-1 relative'>
                <span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>🔍</span>
                <input
                  type='text'
                  placeholder='Search tasks...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-12 pr-5 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all'
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className='px-5 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all'>
                <option value="created">Sort by: Created</option>
                <option value="priority">Sort by: Priority</option>
                <option value="dueDate">Sort by: Due Date</option>
                <option value="category">Sort by: Category</option>
              </select>
            </motion.div>

            {/* Task List */}
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId='tasklist'>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className='space-y-3'>
                    <AnimatePresence>
                      {filteredTasks.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-16 text-center border border-white/20'>
                          <div className='text-8xl mb-6'>✨</div>
                          <h3 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
                            No tasks found
                          </h3>
                          <p className='text-gray-500 dark:text-gray-400'>
                            {searchTerm ? 'Try adjusting your search' : 'Add your first task to get started'}
                          </p>
                        </motion.div>
                      ) : (
                        filteredTasks.map((task, index) => {
                          const overdue = isOverdue(task.dueDate);
                          const completedSubs = task.subtasks.filter(s => s.completed).length;
                          const isExpanded = expandedTasks.has(task.id);
                          const category = categories.find(c => c.name === task.category) || categories[4];
                          const priority = priorities.find(p => p.name === task.priority) || priorities[1];

                          return (
                            <Draggable
                              key={task.id}
                              draggableId={task.id.toString()}
                              index={index}>
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -20 }}
                                  whileHover={{ y: -2 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                  className={`group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all border ${
                                    snapshot.isDragging 
                                      ? 'border-blue-500 shadow-2xl scale-105 rotate-1' 
                                      : task.completed
                                      ? 'border-green-200 dark:border-green-800/50'
                                      : overdue
                                      ? 'border-rose-200 dark:border-rose-800/50'
                                      : 'border-white/20'
                                  }`}>
                                  
                                  {/* Priority Indicator */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                                    priority.name === 'High' ? 'bg-rose-500' :
                                    priority.name === 'Medium' ? 'bg-amber-500' :
                                    'bg-emerald-500'
                                  }`} />

                                  <div className='p-5 pl-6'>
                                    <div className='flex items-start gap-4'>
                                      <div className='flex items-center gap-2'>
                                        <span
                                          {...provided.dragHandleProps}
                                          className='cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl select-none opacity-0 group-hover:opacity-100 transition-opacity'>
                                          ⋮⋮
                                        </span>
                                        <input
                                          type='checkbox'
                                          checked={task.completed}
                                          onChange={() => toggleComplete(task.id)}
                                          className='h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                        />
                                      </div>
                                      
                                      <div className='flex-1 min-w-0'>
                                        {editingId === task.id ? (
                                          <input
                                            type='text'
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={() => saveEdit(task.id)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') saveEdit(task.id);
                                              if (e.key === 'Escape') cancelEdit();
                                            }}
                                            autoFocus
                                            className='w-full px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none'
                                          />
                                        ) : (
                                          <div>
                                            <h3
                                              onDoubleClick={() => startEdit(task)}
                                              className={`text-lg font-medium cursor-pointer ${
                                                task.completed 
                                                  ? 'line-through text-gray-500 dark:text-gray-400' 
                                                  : 'text-gray-900 dark:text-white'
                                              }`}>
                                              {task.title}
                                            </h3>
                                            
                                            <div className='flex flex-wrap items-center gap-2 mt-2'>
                                              <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getCategoryStyle(task.category)}`}>
                                                <span>{category.icon}</span>
                                                {task.category}
                                              </span>
                                              <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getPriorityStyle(task.priority)}`}>
                                                <span>{priority.icon}</span>
                                                {task.priority}
                                              </span>
                                              {task.dueDate && (
                                                <span
                                                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${
                                                    overdue 
                                                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' 
                                                      : 'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                  }`}>
                                                  📅 {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                  })}
                                                  {overdue && ' (Overdue)'}
                                                </span>
                                              )}
                                              {task.subtasks.length > 0 && (
                                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                                  📋 {completedSubs}/{task.subtasks.length}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => startEdit(task)}
                                          className='p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors'
                                          title="Edit">
                                          ✏️
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.9 }}
                                          onClick={() => deleteTask(task.id)}
                                          className='p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors'
                                          title="Delete">
                                          🗑️
                                        </motion.button>
                                      </div>
                                    </div>

                                    {/* Subtasks */}
                                    {task.subtasks.length > 0 && (
                                      <div className='mt-4 pl-14'>
                                        <button
                                          onClick={() => toggleSubtasks(task.id)}
                                          className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
                                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                            completedSubs === task.subtasks.length
                                              ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                          }`}>
                                            {completedSubs}/{task.subtasks.length}
                                          </div>
                                          Subtasks
                                          <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                            ▼
                                          </span>
                                        </button>
                                        
                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className='mt-3 space-y-2 overflow-hidden'>
                                              <div className='flex gap-2'>
                                                <input
                                                  id={`sub-${task.id}`}
                                                  type='text'
                                                  placeholder='Add a subtask...'
                                                  className='flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none'
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                      addSubtask(task.id, e.target.value);
                                                      e.target.value = '';
                                                    }
                                                  }}
                                                />
                                                <motion.button
                                                  whileHover={{ scale: 1.05 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  onClick={() => {
                                                    const inp = document.getElementById(`sub-${task.id}`);
                                                    if (inp && inp.value.trim()) {
                                                      addSubtask(task.id, inp.value);
                                                      inp.value = '';
                                                    }
                                                  }}
                                                  className='px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg shadow hover:shadow-lg transition-shadow'>
                                                  Add
                                                </motion.button>
                                              </div>
                                              {task.subtasks.map((sub) => (
                                                <motion.div
                                                  key={sub.id}
                                                  initial={{ opacity: 0, x: -10 }}
                                                  animate={{ opacity: 1, x: 0 }}
                                                  exit={{ opacity: 0, x: 10 }}
                                                  className='flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg'>
                                                  <input
                                                    type='checkbox'
                                                    checked={sub.completed}
                                                    onChange={() => toggleSubtask(task.id, sub.id)}
                                                    className='h-4 w-4 rounded border-gray-300 text-blue-600'
                                                  />
                                                  <span
                                                    className={`flex-1 text-sm ${
                                                      sub.completed 
                                                        ? 'line-through text-gray-500 dark:text-gray-400' 
                                                        : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {sub.title}
                                                  </span>
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => deleteSubtask(task.id, sub.id)}
                                                    className='text-rose-500 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                                                    title="Delete subtask">
                                                    ×
                                                  </motion.button>
                                                </motion.div>
                                              ))}
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;