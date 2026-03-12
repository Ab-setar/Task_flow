import { useState, useEffect, useRef } from "react";

function App() {
	// Dark Mode
	const [isDark, setIsDark] = useState(() => {
		const saved = localStorage.getItem("taskflow-dark");
		return saved ? JSON.parse(saved) : false;
	});

	// Tasks (with category support)
	const [tasks, setTasks] = useState(() => {
		const saved = localStorage.getItem("taskflow-tasks");
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				return parsed.map((t) => ({ ...t, category: t.category || "Other" }));
			} catch (e) {
				return [];
			}
		}
		return [];
	});

	const [taskTitle, setTaskTitle] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("Other");
	const [editingId, setEditingId] = useState(null);
	const [editValue, setEditValue] = useState("");
	const [sortOldestFirst, setSortOldestFirst] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [filter, setFilter] = useState("all");

	const inputRef = useRef(null);

	const categories = [
		{ name: "Work", color: "blue" },
		{ name: "Personal", color: "emerald" },
		{ name: "Shopping", color: "violet" },
		{ name: "Health", color: "rose" },
		{ name: "Other", color: "slate" },
	];

	const getCategoryStyle = (cat) => {
		const styles = {
			Work: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
			Personal:
				"bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
			Shopping:
				"bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300",
			Health: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
			Other:
				"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
		};
		return styles[cat] || styles.Other;
	};

	// Effects
	useEffect(() => {
		localStorage.setItem("taskflow-dark", JSON.stringify(isDark));
		if (isDark) document.documentElement.classList.add("dark");
		else document.documentElement.classList.remove("dark");
	}, [isDark]);

	useEffect(() => {
		localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
	}, [tasks]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

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
		};

		setTasks([newTask, ...tasks]);
		setTaskTitle("");
		inputRef.current?.focus();
	};

	const toggleComplete = (id) => {
		setTasks(
			tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
		);
	};

	const deleteTask = (id) => {
		if (!window.confirm("Delete this task?")) return;
		setTasks(tasks.filter((t) => t.id !== id));
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
		if (!window.confirm("Clear all completed tasks?")) return;
		setTasks(tasks.filter((t) => !t.completed));
	};

	// Filter + Search + Sort
	const filteredTasks = tasks
		.filter((task) => {
			const matchesSearch = task.title
				.toLowerCase()
				.includes(searchTerm.toLowerCase());
			const matchesStatus =
				filter === "all" ||
				(filter === "active" && !task.completed) ||
				(filter === "completed" && task.completed);
			return matchesSearch && matchesStatus;
		})
		.sort((a, b) =>
			sortOldestFirst ? a.createdAt - b.createdAt : b.createdAt - a.createdAt,
		);

	const total = tasks.length;
	const completedCount = tasks.filter((t) => t.completed).length;

	return (
		<div
			className={`min-h-screen py-8 px-4 transition-colors ${isDark ? "bg-gray-950" : "bg-gray-50"}`}>
			<div className='max-w-3xl mx-auto'>
				{/* Header */}
				<div className='flex justify-between items-center mb-8'>
					<div>
						<h1 className='text-5xl font-bold text-gray-900 dark:text-white'>
							TaskFlow
						</h1>
						<p className='text-gray-500 dark:text-gray-400'>
							Stay organized • Tasks persist
						</p>
					</div>
					<button
						onClick={toggleDarkMode}
						className='w-12 h-12 flex items-center justify-center text-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 transition-all'>
						{isDark ? "☀️" : "🌙"}
					</button>
				</div>

				{/* Search + Status Filter */}
				<div className='mb-6 flex flex-col sm:flex-row gap-4'>
					<input
						type='text'
						placeholder='Search tasks...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='flex-1 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none'
					/>
					<div className='flex bg-white dark:bg-gray-800 rounded-2xl shadow p-1'>
						{["all", "active", "completed"].map((f) => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={`flex-1 px-6 py-2 text-sm font-medium rounded-xl transition-all ${
									filter === f
										? "bg-blue-600 text-white shadow"
										: "hover:bg-gray-100 dark:hover:bg-gray-700"
								}`}>
								{f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
							</button>
						))}
					</div>
				</div>

				{/* Stats */}
				<div className='flex justify-between items-center mb-6 text-gray-700 dark:text-gray-300'>
					<div className='text-lg font-medium'>
						{total} task{total !== 1 ? "s" : ""}
						{completedCount > 0 && ` • ${completedCount} completed`}
					</div>
					<button
						onClick={() => setSortOldestFirst(!sortOldestFirst)}
						className='px-5 py-2 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition'>
						{sortOldestFirst ? "Newest first" : "Oldest first"}
					</button>
				</div>

				{/* Add Task Form */}
				<form
					onSubmit={handleAddTask}
					className='mb-10'>
					{/* Category Selector */}
					<div className='mb-4'>
						<p className='text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2'>
							Category
						</p>
						<div className='flex flex-wrap gap-2'>
							{categories.map((cat) => (
								<button
									type='button'
									key={cat.name}
									onClick={() => setSelectedCategory(cat.name)}
									className={`px-5 py-2 text-sm font-medium rounded-2xl transition-all ${getCategoryStyle(cat.name)} ${
										selectedCategory === cat.name
											? "ring-2 ring-blue-500 scale-105"
											: "hover:scale-105"
									}`}>
									{cat.name}
								</button>
							))}
						</div>
					</div>

					{/* Input + Add Button */}
					<div className='flex gap-3 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow'>
						<input
							ref={inputRef}
							type='text'
							value={taskTitle}
							onChange={(e) => setTaskTitle(e.target.value)}
							placeholder='What needs to be done?'
							className='flex-1 px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none'
						/>
						<button
							type='submit'
							disabled={!taskTitle.trim()}
							className='px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition'>
							Add
						</button>
					</div>
				</form>

				{/* Task List */}
				<div className='space-y-3'>
					{filteredTasks.length === 0 ? (
						<div className='bg-white dark:bg-gray-800 rounded-2xl shadow p-12 text-center'>
							<p className='text-6xl mb-4'>🔎</p>
							<p className='text-xl text-gray-500 dark:text-gray-400'>
								{searchTerm ? "No matching tasks" : "No tasks yet"}
							</p>
						</div>
					) : (
						filteredTasks.map((task) => (
							<div
								key={task.id}
								className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-5 flex items-center gap-4 transition-all ${task.completed ? "opacity-75" : ""}`}>
								<input
									type='checkbox'
									checked={task.completed}
									onChange={() => toggleComplete(task.id)}
									className='h-6 w-6 text-blue-600 rounded focus:ring-blue-500'
								/>

								<div className='flex-1 min-w-0'>
									{editingId === task.id ? (
										<div className='flex gap-2'>
											<input
												type='text'
												value={editValue}
												onChange={(e) => setEditValue(e.target.value)}
												onKeyDown={(e) =>
													e.key === "Enter"
														? saveEdit(task.id)
														: e.key === "Escape" && cancelEdit()
												}
												autoFocus
												className='flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
											/>
											<button
												onClick={() => saveEdit(task.id)}
												className='text-green-600 px-4'>
												Save
											</button>
											<button
												onClick={cancelEdit}
												className='text-gray-500 px-4'>
												Cancel
											</button>
										</div>
									) : (
										<div className='flex items-center gap-3'>
											<span
												onDoubleClick={() => startEdit(task)}
												className={`cursor-pointer flex-1 ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
												{task.title}
											</span>
											<span
												className={`px-4 py-1 text-xs font-medium rounded-full ${getCategoryStyle(task.category)}`}>
												{task.category}
											</span>
										</div>
									)}
								</div>

								<button
									onClick={() => startEdit(task)}
									className='text-blue-500 hover:text-blue-600 text-sm font-medium hidden sm:block'>
									Edit
								</button>

								<button
									onClick={() => deleteTask(task.id)}
									className='text-red-500 hover:text-red-600 text-3xl leading-none px-2'>
									×
								</button>
							</div>
						))
					)}
				</div>

				{completedCount > 0 && filter !== "active" && (
					<button
						onClick={clearCompleted}
						className='mt-8 mx-auto block px-6 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-xl transition'>
						Clear all completed
					</button>
				)}
			</div>
		</div>
	);
}

export default App;
