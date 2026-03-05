import { useState } from "react";

function App() {
	const [taskTitle, setTaskTitle] = useState("");

	const handleAddTask = (e) => {
		e.preventDefault();
		if (!taskTitle.trim()) return;

		alert(`Task added: ${taskTitle}`); // temporary — we'll replace this later
		setTaskTitle("");
	};

	return (
		<div className='min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4'>
			<div className='max-w-3xl mx-auto'>
				{/* Header */}
				<h1 className='text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white'>
					TaskFlow
				</h1>
				<p className='text-center text-gray-600 dark:text-gray-400 mb-10'>
					Simple. Powerful. Yours.
				</p>

				{/* Add Task Form */}
				<form
					onSubmit={handleAddTask}
					className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-10'>
					<div className='flex flex-col sm:flex-row gap-4'>
						<input
							type='text'
							value={taskTitle}
							onChange={(e) => setTaskTitle(e.target.value)}
							placeholder='What needs to be done?'
							className='flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         focus:outline-none focus:ring-2 focus:ring-blue-500'
							autoFocus
						/>
						<button
							type='submit'
							className='px-6 py-3 bg-blue-600 text-white font-medium rounded-lg 
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         transition-colors'>
							Add Task
						</button>
					</div>
				</form>

				{/* Placeholder for future task list */}
				<div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
					<p className='text-gray-500 dark:text-gray-400 text-center py-8'>
						No tasks yet. Add your first one above!
					</p>
				</div>
			</div>
		</div>
	);
}

export default App;
