import { useState } from "react";

function App() {
	const [tasks, setTasks] = useState([]);
	const [taskTitle, setTaskTitle] = useState("");

	const handleAddTask = (e) => {
		e.preventDefault();
		if (!taskTitle.trim()) return;

		const newTask = {
			id: Date.now(), // simple unique id
			title: taskTitle.trim(),
			completed: false,
		};

		setTasks([newTask, ...tasks]); // add to top of list
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

	return (
		<div className='min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-3xl mx-auto'>
				{/* Header */}
				<h1 className='text-4xl sm:text-5xl font-bold text-center mb-2 text-gray-800 dark:text-white'>
					TaskFlow
				</h1>
				<p className='text-center text-gray-500 dark:text-gray-400 mb-10 text-lg'>
					Your tasks. Organized. Simple.
				</p>

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
					{tasks.length === 0 ? (
						<div className='bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center'>
							<p className='text-gray-500 dark:text-gray-400 text-lg'>
								No tasks yet — add one above!
							</p>
						</div>
					) : (
						tasks.map((task) => (
							<div
								key={task.id}
								className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 transition-all
                  ${task.completed ? "opacity-75" : ""}`}>
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
