import { useState, useEffect, useRef } from "react";

function App() {
	// === Dark Mode (persists) ===
	const [isDark, setIsDark] = useState(() => {
		const saved = localStorage.getItem("taskflow-dark");
		return saved ? JSON.parse(saved) : false;
	});

	// === Tasks ===
	const [tasks, setTasks] = useState(() => {
		const saved = localStorage.getItem("taskflow-tasks");
		return saved ? JSON.parse(saved) : [];
	});

	const [taskTitle, setTaskTitle] = useState("");
	const [editingId, setEditingId] = useState(null);
	const [editValue, setEditValue] = useState("");
	const [sortOldestFirst, setSortOldestFirst] = useState(false);
	const inputRef = useRef(null);

	// Dark mode effect
	useEffect(() => {
		localStorage.setItem("taskflow-dark", JSON.stringify(isDark));
		if (isDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [isDark]);

	// Save tasks
	useEffect(() => {
		localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
	}, [tasks]);

	// Auto focus input
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

	const sortedTasks = [...tasks].sort((a, b) =>
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
						className='w-12 h-12 flex items-center justify-center text-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all'>
						{isDark ? "☀️" : "🌙"}
					</button>
				</div>

				{/* Stats & Controls */}
				<div className='flex flex-col sm:flex-row justify-between items-center mb-6 gap-4'>
					<div className='text-lg font-medium text-gray-700 dark:text-gray-300'>
						{total} task{total !== 1 ? "s" : ""}
						{completedCount > 0 && ` • ${completedCount} completed`}
					</div>

					<div className='flex gap-3'>
						<button
							onClick={() => setSortOldestFirst(!sortOldestFirst)}
							className='px-5 py-2 text-sm bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl shadow transition'>
							{sortOldestFirst ? "Newest first" : "Oldest first"}
						</button>

						{completedCount > 0 && (
							<button
								onClick={clearCompleted}
								className='px-5 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-xl transition'>
								Clear completed
							</button>
						)}
					</div>
				</div>

				{/* Add Task Form */}
				<form
					onSubmit={handleAddTask}
					className='mb-10'>
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
					{sortedTasks.length === 0 ? (
						<div className='bg-white dark:bg-gray-800 rounded-2xl shadow p-12 text-center'>
							<p className='text-6xl mb-4'>📭</p>
							<p className='text-xl text-gray-500 dark:text-gray-400'>
								No tasks yet
							</p>
							<p className='text-gray-400 mt-2'>Add your first task above</p>
						</div>
					) : (
						sortedTasks.map((task) => (
							<div
								key={task.id}
								className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-5 flex items-center gap-4 transition-all ${task.completed ? "opacity-75" : ""}`}>
								<input
									type='checkbox'
									checked={task.completed}
									onChange={() => toggleComplete(task.id)}
									className='h-6 w-6 text-blue-600 rounded focus:ring-blue-500'
								/>

								{editingId === task.id ? (
									<div className='flex-1 flex gap-2'>
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
									<>
										<span
											onDoubleClick={() => startEdit(task)}
											className={`flex-1 cursor-pointer ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
											{task.title}
										</span>
										<button
											onClick={() => startEdit(task)}
											className='text-blue-500 hover:text-blue-600 text-sm font-medium'>
											Edit
										</button>
									</>
								)}

								<button
									onClick={() => deleteTask(task.id)}
									className='text-red-500 hover:text-red-600 text-2xl leading-none px-3'>
									×
								</button>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}

export default App;
