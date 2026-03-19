import { useState, useEffect, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import { db } from "./services/firebase";
import {
	collection,
	query,
	where,
	orderBy,
	onSnapshot,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	serverTimestamp,
} from "firebase/firestore";

function App() {
	const { currentUser, loading: authLoading, logout } = useAuth();
	const [tasks, setTasks] = useState([]);
	const [tasksLoading, setTasksLoading] = useState(true);

	// Form states
	const [taskTitle, setTaskTitle] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("Other");
	const [selectedPriority, setSelectedPriority] = useState("Medium");
	const [dueDate, setDueDate] = useState("");

	// UI states
	const [editingId, setEditingId] = useState(null);
	const [editValue, setEditValue] = useState("");
	const [searchTerm, setSearchTerm] = useState("");
	const [filter, setFilter] = useState("all");
	const [expandedTasks, setExpandedTasks] = useState(new Set());
	const [sortBy, setSortBy] = useState("created");
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [notification, setNotification] = useState({
		show: false,
		message: "",
		type: "",
	});

	const inputRef = useRef(null);
	const mobileMenuRef = useRef(null);

	// Dark Mode
	const [isDark, setIsDark] = useState(() => {
		const saved = localStorage.getItem("taskflow-dark");
		return saved ? JSON.parse(saved) : false;
	});

	// Log current user state for debugging
	useEffect(() => {
		console.log("Current user in App:", currentUser?.email);
	}, [currentUser]);

	// Categories and Priorities
	const categories = [
		{
			name: "Work",
			color: "blue",
			icon: "💼",
			lightBg: "bg-blue-50",
			lightText: "text-blue-700",
			darkBg: "dark:bg-blue-500/10",
			darkText: "dark:text-blue-400",
			border: "border-blue-200 dark:border-blue-800",
		},
		{
			name: "Personal",
			color: "emerald",
			icon: "🏠",
			lightBg: "bg-emerald-50",
			lightText: "text-emerald-700",
			darkBg: "dark:bg-emerald-500/10",
			darkText: "dark:text-emerald-400",
			border: "border-emerald-200 dark:border-emerald-800",
		},
		{
			name: "Shopping",
			color: "violet",
			icon: "🛒",
			lightBg: "bg-violet-50",
			lightText: "text-violet-700",
			darkBg: "dark:bg-violet-500/10",
			darkText: "dark:text-violet-400",
			border: "border-violet-200 dark:border-violet-800",
		},
		{
			name: "Health",
			color: "rose",
			icon: "❤️",
			lightBg: "bg-rose-50",
			lightText: "text-rose-700",
			darkBg: "dark:bg-rose-500/10",
			darkText: "dark:text-rose-400",
			border: "border-rose-200 dark:border-rose-800",
		},
		{
			name: "Other",
			color: "slate",
			icon: "📌",
			lightBg: "bg-slate-50",
			lightText: "text-slate-700",
			darkBg: "dark:bg-slate-500/10",
			darkText: "dark:text-slate-400",
			border: "border-slate-200 dark:border-slate-700",
		},
	];

	const priorities = [
		{
			name: "Low",
			color: "emerald",
			icon: "🔽",
			lightBg: "bg-emerald-50",
			lightText: "text-emerald-700",
			darkBg: "dark:bg-emerald-500/10",
			darkText: "dark:text-emerald-400",
		},
		{
			name: "Medium",
			color: "amber",
			icon: "⏺️",
			lightBg: "bg-amber-50",
			lightText: "text-amber-700",
			darkBg: "dark:bg-amber-500/10",
			darkText: "dark:text-amber-400",
		},
		{
			name: "High",
			color: "rose",
			icon: "🔼",
			lightBg: "bg-rose-50",
			lightText: "text-rose-700",
			darkBg: "dark:bg-rose-500/10",
			darkText: "dark:text-rose-400",
		},
	];

	// Helper functions
	const getCategoryStyle = (cat) => {
		const category = categories.find((c) => c.name === cat) || categories[4];
		return `${category.lightBg} ${category.lightText} ${category.darkBg} ${category.darkText}`;
	};

	const getPriorityStyle = (pri) => {
		const priority = priorities.find((p) => p.name === pri) || priorities[1];
		return `${priority.lightBg} ${priority.lightText} ${priority.darkBg} ${priority.darkText}`;
	};

	const isOverdue = (dateStr) =>
		dateStr &&
		new Date(dateStr) < new Date(new Date().toISOString().split("T")[0]);

	const showNotification = (message, type = "success") => {
		setNotification({ show: true, message, type });
		setTimeout(
			() => setNotification({ show: false, message: "", type: "" }),
			3000,
		);
	};

	// Dark mode effect
	useEffect(() => {
		localStorage.setItem("taskflow-dark", JSON.stringify(isDark));
		isDark
			? document.documentElement.classList.add("dark")
			: document.documentElement.classList.remove("dark");
	}, [isDark]);

	// Click outside to close mobile menu
	useEffect(() => {
		function handleClickOutside(event) {
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target)
			) {
				setShowMobileMenu(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Focus input on mount when user is authenticated
	useEffect(() => {
		if (currentUser) {
			inputRef.current?.focus();
		}
	}, [currentUser]);

	// Fetch tasks from Firebase when user is authenticated
	useEffect(() => {
		if (!currentUser) {
			setTasks([]);
			setTasksLoading(false);
			return;
		}

		console.log("Fetching tasks for user:", currentUser.uid);
		setTasksLoading(true);
		
		try {
			const q = query(
				collection(db, "tasks"),
				where("userId", "==", currentUser.uid),
				orderBy("createdAt", "desc"),
			);

			const unsubscribe = onSnapshot(
				q,
				(querySnapshot) => {
					const tasksData = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
						createdAt: doc.data().createdAt?.toDate() || new Date(),
					}));
					console.log("Tasks loaded:", tasksData.length);
					setTasks(tasksData);
					setTasksLoading(false);
				},
				(error) => {
					console.error("Error fetching tasks:", error);
					showNotification("Error loading tasks", "error");
					setTasksLoading(false);
				},
			);

			return () => unsubscribe();
		} catch (error) {
			console.error("Error setting up tasks listener:", error);
			setTasksLoading(false);
		}
	}, [currentUser]);

	// CRUD Operations
	const handleAddTask = async (e) => {
		e.preventDefault();
		if (!taskTitle.trim() || !currentUser) return;

		try {
			const newTask = {
				title: taskTitle.trim(),
				completed: false,
				createdAt: serverTimestamp(),
				category: selectedCategory,
				priority: selectedPriority,
				dueDate: dueDate || null,
				subtasks: [],
				userId: currentUser.uid,
			};

			await addDoc(collection(db, "tasks"), newTask);
			setTaskTitle("");
			setDueDate("");
			inputRef.current?.focus();
			showNotification("Task added successfully!");
		} catch (error) {
			console.error("Error adding task:", error);
			showNotification("Error adding task", "error");
		}
	};

	const toggleComplete = async (id, currentStatus) => {
		try {
			const taskRef = doc(db, "tasks", id);
			await updateDoc(taskRef, {
				completed: !currentStatus,
			});
		} catch (error) {
			console.error("Error updating task:", error);
			showNotification("Error updating task", "error");
		}
	};

	const deleteTask = async (id) => {
		if (!window.confirm("Are you sure you want to delete this task?")) return;

		try {
			await deleteDoc(doc(db, "tasks", id));
			showNotification("Task deleted successfully");
		} catch (error) {
			console.error("Error deleting task:", error);
			showNotification("Error deleting task", "error");
		}
	};

	const saveEdit = async (id) => {
		if (!editValue.trim()) return;

		try {
			const taskRef = doc(db, "tasks", id);
			await updateDoc(taskRef, {
				title: editValue.trim(),
			});
			setEditingId(null);
			setEditValue("");
			showNotification("Task updated successfully");
		} catch (error) {
			console.error("Error updating task:", error);
			showNotification("Error updating task", "error");
		}
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditValue("");
	};

	const addSubtask = async (taskId, subTitle) => {
		if (!subTitle.trim() || !currentUser) return;

		try {
			const task = tasks.find((t) => t.id === taskId);
			const newSubtask = {
				id: Date.now().toString(),
				title: subTitle.trim(),
				completed: false,
			};

			const taskRef = doc(db, "tasks", taskId);
			await updateDoc(taskRef, {
				subtasks: [...(task.subtasks || []), newSubtask],
			});
			showNotification("Subtask added");
		} catch (error) {
			console.error("Error adding subtask:", error);
			showNotification("Error adding subtask", "error");
		}
	};

	const toggleSubtask = async (taskId, subId) => {
		try {
			const task = tasks.find((t) => t.id === taskId);
			const updatedSubtasks = task.subtasks.map((s) =>
				s.id === subId ? { ...s, completed: !s.completed } : s,
			);

			const taskRef = doc(db, "tasks", taskId);
			await updateDoc(taskRef, {
				subtasks: updatedSubtasks,
			});
		} catch (error) {
			console.error("Error toggling subtask:", error);
			showNotification("Error updating subtask", "error");
		}
	};

	const deleteSubtask = async (taskId, subId) => {
		try {
			const task = tasks.find((t) => t.id === taskId);
			const updatedSubtasks = task.subtasks.filter((s) => s.id !== subId);

			const taskRef = doc(db, "tasks", taskId);
			await updateDoc(taskRef, {
				subtasks: updatedSubtasks,
			});
			showNotification("Subtask deleted");
		} catch (error) {
			console.error("Error deleting subtask:", error);
			showNotification("Error deleting subtask", "error");
		}
	};

	const toggleSubtasks = (id) => {
		const newSet = new Set(expandedTasks);
		newSet.has(id) ? newSet.delete(id) : newSet.add(id);
		setExpandedTasks(newSet);
	};

	const clearCompleted = async () => {
		if (!window.confirm("Clear all completed tasks?")) return;

		try {
			const completedTasks = tasks.filter((t) => t.completed);
			const deletePromises = completedTasks.map((task) =>
				deleteDoc(doc(db, "tasks", task.id)),
			);
			await Promise.all(deletePromises);
			showNotification("Completed tasks cleared");
		} catch (error) {
			console.error("Error clearing completed tasks:", error);
			showNotification("Error clearing tasks", "error");
		}
	};

	const toggleDarkMode = () => setIsDark(!isDark);

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
				return [...filtered].sort(
					(a, b) => priorityWeight[b.priority] - priorityWeight[a.priority],
				);
			case "dueDate":
				return [...filtered].sort((a, b) => {
					if (!a.dueDate) return 1;
					if (!b.dueDate) return -1;
					return new Date(a.dueDate) - new Date(b.dueDate);
				});
			case "category":
				return [...filtered].sort((a, b) =>
					a.category.localeCompare(b.category),
				);
			default:
				return [...filtered].sort((a, b) => b.createdAt - a.createdAt);
		}
	};

	const filteredTasks = getSortedTasks();

	const onDragEnd = async (result) => {
		const { destination, source } = result;
		if (!destination || destination.index === source.index) return;

		const reorderedTasks = Array.from(filteredTasks);
		const [movedTask] = reorderedTasks.splice(source.index, 1);
		reorderedTasks.splice(destination.index, 0, movedTask);

		setTasks(reorderedTasks);
	};

	const stats = {
		total: tasks.length,
		completed: tasks.filter((t) => t.completed).length,
		active: tasks.filter((t) => !t.completed).length,
		overdue: tasks.filter(
			(t) => t.dueDate && isOverdue(t.dueDate) && !t.completed,
		).length,
		highPriority: tasks.filter((t) => t.priority === "High" && !t.completed)
			.length,
		completionRate: tasks.length
			? Math.round(
					(tasks.filter((t) => t.completed).length / tasks.length) * 100,
				)
			: 0,
	};

	const currentDate = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	// Show loading state while checking auth
	if (authLoading) {
		console.log("Auth loading...");
		return (
			<div
				className={`min-h-screen flex items-center justify-center ${isDark ? "dark bg-gray-950" : "bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
				<div className='text-center'>
					<div className='w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
					<p className='text-gray-600 dark:text-gray-400'>Loading...</p>
				</div>
			</div>
		);
	}

	// Show login if not authenticated
	if (!currentUser) {
		console.log("No user, showing login page");
		return <Login />;
	}

	// Show tasks loading state
	if (tasksLoading) {
		console.log("Tasks loading...");
		return (
			<div
				className={`min-h-screen flex items-center justify-center ${isDark ? "dark bg-gray-950" : "bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
				<div className='text-center'>
					<div className='w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
					<p className='text-gray-600 dark:text-gray-400'>
						Loading your tasks...
					</p>
				</div>
			</div>
		);
	}

	// Main App UI - only shown when user is authenticated
	console.log("User authenticated, showing main app");
	return (
		<div
			className={`min-h-screen transition-all duration-700 ${
				isDark
					? "dark bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950"
					: "bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/50"
			}`}>
			{/* Animated background elements */}
			<div className='fixed inset-0 overflow-hidden pointer-events-none'>
				<div className='absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob'></div>
				<div className='absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000'></div>
				<div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000'></div>
			</div>

			{/* Notification Toast */}
			<AnimatePresence>
				{notification.show && (
					<motion.div
						initial={{ opacity: 0, y: -50 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -50 }}
						className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-2xl shadow-2xl ${
							notification.type === "error"
								? "bg-rose-500 text-white"
								: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
						}`}>
						{notification.message}
					</motion.div>
				)}
			</AnimatePresence>

			<style>{`
				@keyframes blob {
					0% { transform: translate(0px, 0px) scale(1); }
					33% { transform: translate(30px, -50px) scale(1.1); }
					66% { transform: translate(-20px, 20px) scale(0.9); }
					100% { transform: translate(0px, 0px) scale(1); }
				}
				.animate-blob {
					animation: blob 7s infinite;
				}
				.animation-delay-2000 {
					animation-delay: 2s;
				}
				.animation-delay-4000 {
					animation-delay: 4s;
				}
			`}</style>

			<div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className='mb-8'>
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
						<div>
							<div className='flex items-center gap-3 mb-2'>
								<motion.div
									animate={{ rotate: [0, 10, -10, 0] }}
									transition={{ duration: 2, repeat: Infinity }}
									className='text-4xl'>
									✨
								</motion.div>
								<h1 className='text-4xl sm:text-5xl font-black tracking-tight'>
									<span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent'>
										TaskFlow
									</span>
								</h1>
							</div>
							<p className='text-gray-600 dark:text-gray-400 text-sm sm:text-base'>
								{currentDate} • {stats.active} active task
								{stats.active !== 1 ? "s" : ""}
							</p>
						</div>

						{/* Mobile menu button */}
						<div className='sm:hidden relative' ref={mobileMenuRef}>
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={() => setShowMobileMenu(!showMobileMenu)}
								className='p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg'>
								<span className='text-2xl'>☰</span>
							</motion.button>

							<AnimatePresence>
								{showMobileMenu && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50'>
										<button
											onClick={toggleDarkMode}
											className='w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors'>
											{isDark ? "☀️ Light mode" : "🌙 Dark mode"}
										</button>
										<button
											onClick={() => setFilter("all")}
											className='w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors'>
											📋 All tasks
										</button>
										<button
											onClick={() => setFilter("active")}
											className='w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors'>
											✅ Active tasks
										</button>
										<button
											onClick={logout}
											className='w-full text-left p-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors'>
											🚪 Logout
										</button>
									</motion.div>
								)}
							</AnimatePresence>
						</div>

						{/* Desktop header actions */}
						<div className='hidden sm:flex items-center gap-4'>
							{/* Progress circle */}
							<div className='relative w-16 h-16'>
								<svg className='w-16 h-16 transform -rotate-90'>
									<circle
										cx='32'
										cy='32'
										r='28'
										stroke='currentColor'
										strokeWidth='4'
										fill='none'
										className='text-gray-200 dark:text-gray-700'
									/>
									<circle
										cx='32'
										cy='32'
										r='28'
										stroke='url(#gradient)'
										strokeWidth='4'
										fill='none'
										strokeLinecap='round'
										strokeDasharray={`${2 * Math.PI * 28}`}
										strokeDashoffset={`${2 * Math.PI * 28 * (1 - stats.completionRate / 100)}`}
										className='transition-all duration-1000'
									/>
								</svg>
								<defs>
									<linearGradient
										id='gradient'
										x1='0%'
										y1='0%'
										x2='100%'
										y2='0%'>
										<stop
											offset='0%'
											stopColor='#3B82F6'
										/>
										<stop
											offset='100%'
											stopColor='#8B5CF6'
										/>
									</linearGradient>
								</defs>
								<div className='absolute inset-0 flex items-center justify-center'>
									<span className='text-sm font-bold text-gray-900 dark:text-white'>
										{stats.completionRate}%
									</span>
								</div>
							</div>

							<motion.button
								whileHover={{ scale: 1.1, rotate: 15 }}
								whileTap={{ scale: 0.9 }}
								onClick={toggleDarkMode}
								className='w-12 h-12 flex items-center justify-center text-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all'>
								{isDark ? "☀️" : "🌙"}
							</motion.button>

							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={logout}
								className='px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg'>
								Logout
							</motion.button>
						</div>
					</div>

					{/* Stats cards - only show if there are tasks */}
					{tasks.length > 0 && (
						<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6'>
							<motion.div
								whileHover={{ y: -2 }}
								className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center'>
										<span className='text-xl'>📊</span>
									</div>
									<div>
										<p className='text-xs text-gray-500 dark:text-gray-400'>
											Total
										</p>
										<p className='text-2xl font-bold text-gray-900 dark:text-white'>
											{stats.total}
										</p>
									</div>
								</div>
							</motion.div>

							<motion.div
								whileHover={{ y: -2 }}
								className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center'>
										<span className='text-xl'>✅</span>
									</div>
									<div>
										<p className='text-xs text-gray-500 dark:text-gray-400'>
											Done
										</p>
										<p className='text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
											{stats.completed}
										</p>
									</div>
								</div>
							</motion.div>

							<motion.div
								whileHover={{ y: -2 }}
								className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 bg-amber-100 dark:bg-amber-500/10 rounded-xl flex items-center justify-center'>
										<span className='text-xl'>⏳</span>
									</div>
									<div>
										<p className='text-xs text-gray-500 dark:text-gray-400'>
											Active
										</p>
										<p className='text-2xl font-bold text-amber-600 dark:text-amber-400'>
											{stats.active}
										</p>
									</div>
								</div>
							</motion.div>

							<motion.div
								whileHover={{ y: -2 }}
								className='bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50'>
								<div className='flex items-center gap-3'>
									<div className='w-10 h-10 bg-rose-100 dark:bg-rose-500/10 rounded-xl flex items-center justify-center'>
										<span className='text-xl'>⚠️</span>
									</div>
									<div>
										<p className='text-xs text-gray-500 dark:text-gray-400'>
											Overdue
										</p>
										<p className='text-2xl font-bold text-rose-600 dark:text-rose-400'>
											{stats.overdue}
										</p>
									</div>
								</div>
							</motion.div>
						</div>
					)}
				</motion.div>

				{/* Main Content */}
				<div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
					{/* Main Content Area */}
					<div className='lg:col-span-12'>
						{/* Add Task Form */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className='mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20'>
							<form onSubmit={handleAddTask}>
								<div className='flex flex-col sm:flex-row gap-3'>
									<div className='flex-1 relative'>
										<input
											ref={inputRef}
											type='text'
											value={taskTitle}
											onChange={(e) => setTaskTitle(e.target.value)}
											placeholder='What needs to be done?'
											className='w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg pr-12'
										/>
										{taskTitle && (
											<button
												type='button'
												onClick={() => setTaskTitle("")}
												className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
												✕
											</button>
										)}
									</div>
									<motion.button
										whileHover={{ scale: 1.02 }}
										whileTap={{ scale: 0.98 }}
										type='submit'
										disabled={!taskTitle.trim()}
										className='px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl whitespace-nowrap'>
										Add Task
									</motion.button>
								</div>

								{/* Quick Options */}
								<div className='flex flex-wrap items-center gap-3 mt-4'>
									<div className='flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl'>
										<span className='text-sm text-gray-500 dark:text-gray-400'>
											Category:
										</span>
										<select
											value={selectedCategory}
											onChange={(e) => setSelectedCategory(e.target.value)}
											className='bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 dark:text-white'>
											{categories.map((cat) => (
												<option
													key={cat.name}
													value={cat.name}>
													{cat.icon} {cat.name}
												</option>
											))}
										</select>
									</div>

									<div className='flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl'>
										<span className='text-sm text-gray-500 dark:text-gray-400'>
											Priority:
										</span>
										<select
											value={selectedPriority}
											onChange={(e) => setSelectedPriority(e.target.value)}
											className='bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 dark:text-white'>
											{priorities.map((pri) => (
												<option
													key={pri.name}
													value={pri.name}>
													{pri.icon} {pri.name}
												</option>
											))}
										</select>
									</div>

									<div className='flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl'>
										<span className='text-sm text-gray-500 dark:text-gray-400'>
											Due:
										</span>
										<input
											type='date'
											value={dueDate}
											onChange={(e) => setDueDate(e.target.value)}
											className='bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-900 dark:text-white'
										/>
									</div>
								</div>
							</form>
						</motion.div>

						{/* Search and Filter Bar */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className='mb-6 flex flex-col sm:flex-row gap-3'>
							<div className='flex-1 relative group'>
								<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors'>
									🔍
								</span>
								<input
									type='text'
									placeholder='Search tasks...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='w-full pl-12 pr-5 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all'
								/>
								{searchTerm && (
									<button
										onClick={() => setSearchTerm("")}
										className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
										✕
									</button>
								)}
							</div>

							<div className='flex gap-2'>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className='px-5 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all'>
									<option value='created'>📅 Created</option>
									<option value='priority'>🎯 Priority</option>
									<option value='dueDate'>⏰ Due Date</option>
									<option value='category'>📁 Category</option>
								</select>

								<div className='flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200 dark:border-gray-700'>
									{["all", "active", "completed"].map((f) => (
										<button
											key={f}
											onClick={() => setFilter(f)}
											className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
												filter === f
													? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
													: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
											}`}>
											{f === "all" ? "All" : f === "active" ? "Active" : "Done"}
										</button>
									))}
								</div>
							</div>
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
													<motion.div
														animate={{
															y: [0, -10, 0],
														}}
														transition={{ duration: 3, repeat: Infinity }}
														className='text-8xl mb-6'>
														{searchTerm ? "🔍" : "✨"}
													</motion.div>
													<h3 className='text-2xl font-semibold text-gray-900 dark:text-white mb-2'>
														{searchTerm
															? "No tasks found"
															: "Your canvas is empty"}
													</h3>
													<p className='text-gray-500 dark:text-gray-400'>
														{searchTerm
															? "Try different keywords or clear the search"
															: "Add your first task to begin your journey"}
													</p>
													{!searchTerm && (
														<motion.button
															whileHover={{ scale: 1.05 }}
															whileTap={{ scale: 0.95 }}
															onClick={() => inputRef.current?.focus()}
															className='mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all'>
															+ Add your first task
														</motion.button>
													)}
												</motion.div>
											) : (
												filteredTasks.map((task, index) => {
													const overdue = isOverdue(task.dueDate);
													const completedSubs =
														task.subtasks?.filter((s) => s.completed).length ||
														0;
													const isExpanded = expandedTasks.has(task.id);
													const category =
														categories.find((c) => c.name === task.category) ||
														categories[4];
													const priority =
														priorities.find((p) => p.name === task.priority) ||
														priorities[1];

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
																	transition={{
																		type: "spring",
																		stiffness: 300,
																	}}
																	className={`group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all border ${
																		snapshot.isDragging
																			? "border-blue-500 shadow-2xl scale-105 rotate-1"
																			: task.completed
																				? "border-green-200 dark:border-green-800/50"
																				: overdue
																					? "border-rose-200 dark:border-rose-800/50"
																					: "border-white/20"
																	}`}>
																	{/* Priority Indicator */}
																	<div
																		className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
																			priority.name === "High"
																				? "bg-rose-500"
																				: priority.name === "Medium"
																					? "bg-amber-500"
																					: "bg-emerald-500"
																		}`}
																	/>

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
																					onChange={() =>
																						toggleComplete(
																							task.id,
																							task.completed,
																						)
																					}
																					className='h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
																				/>
																			</div>

																			<div className='flex-1 min-w-0'>
																				{editingId === task.id ? (
																					<input
																						type='text'
																						value={editValue}
																						onChange={(e) =>
																							setEditValue(e.target.value)
																						}
																						onBlur={() => saveEdit(task.id)}
																						onKeyDown={(e) => {
																							if (e.key === "Enter")
																								saveEdit(task.id);
																							if (e.key === "Escape")
																								cancelEdit();
																						}}
																						autoFocus
																						className='w-full px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none'
																					/>
																				) : (
																					<div>
																						<h3
																							onDoubleClick={() => {
																								setEditingId(task.id);
																								setEditValue(task.title);
																							}}
																							className={`text-lg font-medium cursor-pointer ${
																								task.completed
																									? "line-through text-gray-500 dark:text-gray-400"
																									: "text-gray-900 dark:text-white"
																							}`}>
																							{task.title}
																						</h3>

																						<div className='flex flex-wrap items-center gap-2 mt-2'>
																							<span
																								className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getCategoryStyle(task.category)}`}>
																								<span>{category.icon}</span>
																								{task.category}
																							</span>
																							<span
																								className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${getPriorityStyle(task.priority)}`}>
																								<span>{priority.icon}</span>
																								{task.priority}
																							</span>
																							{task.dueDate && (
																								<span
																									className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full ${
																										overdue
																											? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
																											: "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
																									}`}>
																									📅{" "}
																									{new Date(
																										task.dueDate,
																									).toLocaleDateString(
																										"en-US",
																										{
																											month: "short",
																											day: "numeric",
																										},
																									)}
																									{overdue && " (Overdue)"}
																								</span>
																							)}
																							{task.subtasks?.length > 0 && (
																								<span className='text-xs text-gray-500 dark:text-gray-400'>
																									📋 {completedSubs}/
																									{task.subtasks.length}
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
																					onClick={() => {
																						setEditingId(task.id);
																						setEditValue(task.title);
																					}}
																					className='p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors'
																					title='Edit'>
																					✏️
																				</motion.button>
																				<motion.button
																					whileHover={{ scale: 1.1 }}
																					whileTap={{ scale: 0.9 }}
																					onClick={() => deleteTask(task.id)}
																					className='p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors'
																					title='Delete'>
																					🗑️
																				</motion.button>
																			</div>
																		</div>

																		{/* Subtasks */}
																		{task.subtasks?.length > 0 && (
																			<div className='mt-4 pl-14'>
																				<button
																					onClick={() =>
																						toggleSubtasks(task.id)
																					}
																					className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
																					<div
																						className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
																							completedSubs ===
																							task.subtasks.length
																								? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400"
																								: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
																						}`}>
																						{completedSubs}/
																						{task.subtasks.length}
																					</div>
																					Subtasks
																					<span
																						className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
																						▼
																					</span>
																				</button>

																				<AnimatePresence>
																					{isExpanded && (
																						<motion.div
																							initial={{
																								height: 0,
																								opacity: 0,
																							}}
																							animate={{
																								height: "auto",
																								opacity: 1,
																							}}
																							exit={{ height: 0, opacity: 0 }}
																							className='mt-3 space-y-2 overflow-hidden'>
																							<div className='flex gap-2'>
																								<input
																									id={`sub-${task.id}`}
																									type='text'
																									placeholder='Add a subtask...'
																									className='flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none'
																									onKeyDown={(e) => {
																										if (
																											e.key === "Enter" &&
																											e.target.value.trim()
																										) {
																											addSubtask(
																												task.id,
																												e.target.value,
																											);
																											e.target.value = "";
																										}
																									}}
																								/>
																								<motion.button
																									whileHover={{ scale: 1.05 }}
																									whileTap={{ scale: 0.95 }}
																									onClick={() => {
																										const inp =
																											document.getElementById(
																												`sub-${task.id}`,
																											);
																										if (
																											inp &&
																											inp.value.trim()
																										) {
																											addSubtask(
																												task.id,
																												inp.value,
																											);
																											inp.value = "";
																										}
																									}}
																									className='px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg shadow hover:shadow-lg transition-shadow'>
																									Add
																								</motion.button>
																							</div>
																							{task.subtasks.map((sub) => (
																								<motion.div
																									key={sub.id}
																									initial={{
																										opacity: 0,
																										x: -10,
																									}}
																									animate={{ opacity: 1, x: 0 }}
																									exit={{ opacity: 0, x: 10 }}
																									className='flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg'>
																									<input
																										type='checkbox'
																										checked={sub.completed}
																										onChange={() =>
																											toggleSubtask(
																												task.id,
																												sub.id,
																											)
																										}
																										className='h-4 w-4 rounded border-gray-300 text-blue-600'
																									/>
																									<span
																										className={`flex-1 text-sm ${
																											sub.completed
																												? "line-through text-gray-500 dark:text-gray-400"
																												: "text-gray-700 dark:text-gray-300"
																										}`}>
																										{sub.title}
																									</span>
																									<motion.button
																										whileHover={{ scale: 1.1 }}
																										whileTap={{ scale: 0.9 }}
																										onClick={() =>
																											deleteSubtask(
																												task.id,
																												sub.id,
																											)
																										}
																										className='text-rose-500 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity'
																										title='Delete subtask'>
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

						{/* Clear completed button */}
						{stats.completed > 0 && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className='mt-6 text-center'>
								<button
									onClick={clearCompleted}
									className='px-6 py-3 text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition-colors'>
									Clear completed tasks ({stats.completed})
								</button>
							</motion.div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;