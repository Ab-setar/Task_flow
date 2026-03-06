import { useState, useEffect } from "react";

function App() {
	const [tasks, setTasks] = useState(() => {
		const saved = localStorage.getItem("taskflow-tasks");
		if (saved) {
			try {
				return JSON.parse(saved);
			} catch (e) {
				console.error("Failed to parse saved tasks:", e);
				return [];
			}
		}
		return [];
	});

	const [taskTitle, setTaskTitle] = useState("");
	const [sortOldestFirst, setSortOldestFirst] = useState(false);

	useEffect(() => {
		localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
	}, [tasks]);

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
	};

	const toggleComplete = (id) => {
		setTasks(
			tasks.map((task) =>
				task.id === id ? { ...task, completed: !task.completed } : task,
			),
		);
	};

	const deleteTask = (id) => {
		if (!window.confirm("Delete this task?")) return;
		setTasks(tasks.filter((task) => task.id !== id));
	};

	const clearCompleted = () => {
		if (!window.confirm("Clear all completed tasks?")) return;
		setTasks(tasks.filter((task) => !task.completed));
	};

	// Sort: newest first (default) or oldest first
	const sortedTasks = [...tasks].sort((a, b) => {
		return sortOldestFirst
			? a.createdAt - b.createdAt
			: b.createdAt - a.createdAt;
	});

	const totalTasks = tasks.length;
	const completedCount = tasks.filter((t) => t.completed).length;

	return (
		<div className='min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-3xl mx-auto'>
				<h1 className='text-4xl sm:text-5xl font-bold text-center mb-2 text-gray-800 dark:text-white'>
					TaskFlow
				</h1>
				<p className='text-center text-gray-500 dark:text-gray-400 mb-8 text-lg'>
					Your tasks. Organized. Persistent.
				</p>

				{/* Stats & Controls */}
				<div className='flex flex-col sm:flex-row justify-between items-center mb-6 gap-4'>
					<div className='text-gray-700 dark:text-gray-300'>
						{totalTasks} task{totalTasks !== 1 ? "s" : ""}
						{completedCount > 0 && ` • ${completedCount} completed`}
					</div>

					<div className='flex gap-3'>
						<button
							onClick={() => setSortOldestFirst(!sortOldestFirst)}
							className='px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 
                         dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg 
                         transition-colors'>
							{sortOldestFirst ? "Newest first" : "Oldest first"}
						</button>

						{completedCount > 0 && (
							<button
								onClick={clearCompleted}
								className='px-4 py-2 text-sm bg-red-100 hover:bg-red-200 
                           dark:bg-red-900/40 dark:hover:bg-red-800/60 
                           text-red-700 dark:text-red-300 rounded-lg transition-colors'>
								Clear completed
							</button>
						)}
					</div>
				</div>

				{/* Add Task Form */}
				<form
					onSubmit={handleAddTask}
					className='bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-10'>
					<div className='flex flex-col sm:flex-row gap-4'>
						<input
							type='text'
							value={taskTitle}
							onChange={(e) => setTaskTitle(e.target.value)}
							placeholder='What needs to be done today?'
							className='flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500'
							autoFocus
						/>
						<button
							type='submit'
							className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                         transition-colors duration-200'>
							Add
						</button>
					</div>
				</form>

				{/* Task List */}
				<div className='space-y-3'>
					{sortedTasks.length === 0 ? (
						<div className='bg-white dark:bg-gray-800 rounded-xl shadow p-10 text-center'>
							<p className='text-gray-500 dark:text-gray-400 text-xl font-medium'>
								No tasks yet
							</p>
							<p className='text-gray-400 dark:text-gray-500 mt-2'>
								Add your first task above to get started!
							</p>
						</div>
					) : (
						sortedTasks.map((task) => (
							<div
								key={task.id}
								className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 transition-all
                  ${task.completed ? "opacity-70" : ""}`}>
								<input
									type='checkbox'
									checked={task.completed}
									onChange={() => toggleComplete(task.id)}
									className='h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500'
								/>

								<span
									className={`flex-1 ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white"}`}>
									{task.title}
								</span>

								<button
									onClick={() => deleteTask(task.id)}
									className='text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 
                             font-medium px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors'>
									Delete
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
