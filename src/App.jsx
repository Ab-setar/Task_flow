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

	const inputRef = useRef(null);

	const categories = [
		{ name: "Work", color: "blue" },
		{ name: "Personal", color: "emerald" },
		{ name: "Shopping", color: "violet" },
		{ name: "Health", color: "rose" },
		{ name: "Other", color: "slate" },
	];

	const priorities = [
		{ name: "Low", color: "emerald" },
		{ name: "Medium", color: "amber" },
		{ name: "High", color: "rose" },
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

	const getPriorityStyle = (pri) => {
		const styles = {
			Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
			Medium:
				"bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
			High: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
		};
		return styles[pri] || styles.Medium;
	};

	const isOverdue = (dateStr) =>
		dateStr &&
		new Date(dateStr) < new Date(new Date().toISOString().split("T")[0]);

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
		if (window.confirm("Delete task?"))
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
		if (window.confirm("Clear completed?"))
			setTasks(tasks.filter((t) => !t.completed));
	};

	const filteredTasks = tasks.filter((task) => {
		const matchesSearch = task.title
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesStatus =
			filter === "all" ||
			(filter === "active" && !task.completed) ||
			(filter === "completed" && task.completed);
		return matchesSearch && matchesStatus;
	});

	const onDragEnd = (result) => {
		const { destination, source } = result;
		if (!destination || destination.index === source.index) return;
		const newTasks = Array.from(tasks);
		const sourceIndex = newTasks.findIndex(
			(t) => t.id === filteredTasks[source.index].id,
		);
		const destIndex = newTasks.findIndex(
			(t) => t.id === filteredTasks[destination.index].id,
		);
		const [moved] = newTasks.splice(sourceIndex, 1);
		newTasks.splice(destIndex, 0, moved);
		setTasks(newTasks);
	};

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
							Stay organized • Beautifully animated
						</p>
					</div>
					<motion.button
						whileHover={{ scale: 1.1 }}
						whileTap={{ scale: 0.9 }}
						onClick={toggleDarkMode}
						className='w-12 h-12 flex items-center justify-center text-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg'>
						{isDark ? "☀️" : "🌙"}
					</motion.button>
				</div>

				{/* Search + Filter */}
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
								className={`flex-1 px-6 py-2 text-sm font-medium rounded-xl transition-all ${filter === f ? "bg-blue-600 text-white shadow" : "hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
								{f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
							</button>
						))}
					</div>
				</div>

				{/* Stats */}
				<div className='flex justify-between items-center mb-6 text-gray-700 dark:text-gray-300'>
					<div className='text-lg font-medium'>
						{tasks.length} task{tasks.length !== 1 ? "s" : ""}{" "}
						{tasks.filter((t) => t.completed).length > 0 &&
							`• ${tasks.filter((t) => t.completed).length} completed`}
					</div>
				</div>

				{/* Add Form (same as before) */}
				<form
					onSubmit={handleAddTask}
					className='mb-10'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4'>
						<div>
							<p className='text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2'>
								Category
							</p>
							<div className='flex flex-wrap gap-2'>
								{categories.map((cat) => (
									<button
										type='button'
										key={cat.name}
										onClick={() => setSelectedCategory(cat.name)}
										className={`px-5 py-2 text-sm font-medium rounded-2xl transition-all ${getCategoryStyle(cat.name)} ${selectedCategory === cat.name ? "ring-2 ring-blue-500" : ""}`}>
										{cat.name}
									</button>
								))}
							</div>
						</div>
						<div>
							<p className='text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2'>
								Priority
							</p>
							<div className='flex flex-wrap gap-2'>
								{priorities.map((pri) => (
									<button
										type='button'
										key={pri.name}
										onClick={() => setSelectedPriority(pri.name)}
										className={`px-6 py-2 text-sm font-medium rounded-2xl transition-all ${getPriorityStyle(pri.name)} ${selectedPriority === pri.name ? "ring-2 ring-blue-500" : ""}`}>
										{pri.name}
									</button>
								))}
							</div>
						</div>
					</div>
					<div className='flex gap-3 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow'>
						<input
							ref={inputRef}
							type='text'
							value={taskTitle}
							onChange={(e) => setTaskTitle(e.target.value)}
							placeholder='What needs to be done?'
							className='flex-1 px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none'
						/>
						<input
							type='date'
							value={dueDate}
							onChange={(e) => setDueDate(e.target.value)}
							className='px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none'
						/>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							type='submit'
							disabled={!taskTitle.trim()}
							className='px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition'>
							Add
						</motion.button>
					</div>
				</form>

				{/* Animated Drag & Drop List */}
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
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className='bg-white dark:bg-gray-800 rounded-2xl shadow p-12 text-center'>
											<p className='text-6xl mb-4'>📭</p>
											<p className='text-xl text-gray-500 dark:text-gray-400'>
												No tasks yet
											</p>
										</motion.div>
									) : (
										filteredTasks.map((task, index) => {
											const overdue = isOverdue(task.dueDate);
											const completedSubs = task.subtasks.filter(
												(s) => s.completed,
											).length;
											const isExpanded = expandedTasks.has(task.id);

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
															exit={{ opacity: 0, y: -20, scale: 0.95 }}
															whileHover={{ scale: 1.02, y: -2 }}
															whileDrag={{ scale: 1.05 }}
															transition={{ type: "spring", stiffness: 300 }}
															className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-5 transition-all ${snapshot.isDragging ? "shadow-2xl" : ""} ${task.completed ? "opacity-75" : ""}`}>
															<div className='flex items-center gap-4'>
																<span
																	{...provided.dragHandleProps}
																	className='cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-3xl'>
																	≡
																</span>
																<input
																	type='checkbox'
																	checked={task.completed}
																	onChange={() => toggleComplete(task.id)}
																	className='h-6 w-6 text-blue-600 rounded'
																/>
																<div className='flex-1'>
																	{editingId === task.id ? (
																		<input
																			type='text'
																			value={editValue}
																			onChange={(e) =>
																				setEditValue(e.target.value)
																			}
																			onKeyDown={(e) =>
																				e.key === "Enter"
																					? saveEdit(task.id)
																					: e.key === "Escape" && cancelEdit()
																			}
																			autoFocus
																			className='w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600'
																		/>
																	) : (
																		<span
																			onDoubleClick={() => startEdit(task)}
																			className={`cursor-pointer block ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
																			{task.title}
																		</span>
																	)}
																	<div className='flex gap-3 mt-2 flex-wrap'>
																		<span
																			className={`px-4 py-1 text-xs rounded-full ${getCategoryStyle(task.category)}`}>
																			{task.category}
																		</span>
																		<span
																			className={`px-4 py-1 text-xs rounded-full ${getPriorityStyle(task.priority)}`}>
																			{task.priority}
																		</span>
																		{task.dueDate && (
																			<span
																				className={`text-xs px-3 py-1 rounded-full ${overdue ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
																				📅{" "}
																				{new Date(
																					task.dueDate,
																				).toLocaleDateString("en-GB")}{" "}
																				{overdue && "(Overdue!)"}
																			</span>
																		)}
																	</div>
																</div>
																<div className='flex gap-2'>
																	<motion.button
																		whileHover={{ scale: 1.1 }}
																		whileTap={{ scale: 0.9 }}
																		onClick={() => startEdit(task)}
																		className='text-blue-500 text-sm font-medium'>
																		Edit
																	</motion.button>
																	<motion.button
																		whileHover={{ scale: 1.2 }}
																		whileTap={{ scale: 0.9 }}
																		onClick={() => deleteTask(task.id)}
																		className='text-red-500 text-3xl leading-none'>
																		×
																	</motion.button>
																</div>
															</div>

															{/* Subtasks (animated expand) */}
															<div className='mt-4 pl-12'>
																<motion.button
																	whileTap={{ scale: 0.95 }}
																	onClick={() => toggleSubtasks(task.id)}
																	className='flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600'>
																	Subtasks ({completedSubs}/
																	{task.subtasks.length}){" "}
																	<span>{isExpanded ? "▲" : "▼"}</span>
																</motion.button>
																<AnimatePresence>
																	{isExpanded && (
																		<motion.div
																			initial={{ height: 0, opacity: 0 }}
																			animate={{ height: "auto", opacity: 1 }}
																			exit={{ height: 0, opacity: 0 }}
																			className='mt-3 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 overflow-hidden'>
																			<div className='flex gap-2 mb-3'>
																				<input
																					id={`sub-${task.id}`}
																					type='text'
																					placeholder='Add subtask...'
																					className='flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
																					onKeyDown={(e) =>
																						e.key === "Enter" &&
																						(addSubtask(
																							task.id,
																							e.target.value,
																						),
																						(e.target.value = ""))
																					}
																				/>
																				<motion.button
																					whileHover={{ scale: 1.05 }}
																					whileTap={{ scale: 0.95 }}
																					onClick={() => {
																						const inp = document.getElementById(
																							`sub-${task.id}`,
																						);
																						addSubtask(task.id, inp.value);
																						inp.value = "";
																					}}
																					className='px-4 py-2 bg-blue-600 text-white text-sm rounded-lg'>
																					Add
																				</motion.button>
																			</div>
																			{task.subtasks.map((sub) => (
																				<motion.div
																					key={sub.id}
																					initial={{ opacity: 0 }}
																					animate={{ opacity: 1 }}
																					className='flex items-center gap-3 py-1'>
																					<input
																						type='checkbox'
																						checked={sub.completed}
																						onChange={() =>
																							toggleSubtask(task.id, sub.id)
																						}
																						className='h-5 w-5'
																					/>
																					<span
																						className={`flex-1 text-sm ${sub.completed ? "line-through text-gray-500" : ""}`}>
																						{sub.title}
																					</span>
																					<motion.button
																						whileHover={{ scale: 1.2 }}
																						whileTap={{ scale: 0.9 }}
																						onClick={() =>
																							deleteSubtask(task.id, sub.id)
																						}
																						className='text-red-500 text-xl'>
																						×
																					</motion.button>
																				</motion.div>
																			))}
																		</motion.div>
																	)}
																</AnimatePresence>
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
	);
}

export default App;
