import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
	const { signup, login, signInWithGoogle, resetPassword } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLogin, setIsLogin] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [loading, setLoading] = useState(false);
	const [showResetPassword, setShowResetPassword] = useState(false);
	const [resetEmail, setResetEmail] = useState("");

	// Validation function
	const validateForm = () => {
		if (!email.includes("@") || !email.includes(".")) {
			setError("Please enter a valid email address");
			return false;
		}
		
		if (!isLogin && password.length < 6) {
			setError("Password must be at least 6 characters long");
			return false;
		}
		
		if (password.length === 0) {
			setError("Password cannot be empty");
			return false;
		}
		
		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		
		// Validate form before submitting
		if (!validateForm()) {
			setLoading(false);
			return;
		}
		
		setLoading(true);

		try {
			if (isLogin) {
				await login(email, password);
				setSuccess("Login successful! Redirecting...");
				// The redirect will happen automatically via App.jsx
			} else {
				await signup(email, password);
				setSuccess("Account created successfully! You can now login.");
				// Clear form and switch to login view after successful signup
				setEmail("");
				setPassword("");
				setIsLogin(true);
			}
		} catch (err) {
			console.error("Auth error:", err);
			
			// Handle specific Firebase error codes
			switch (err.code) {
				case "auth/invalid-email":
					setError("Invalid email address format");
					break;
				case "auth/user-disabled":
					setError("This account has been disabled");
					break;
				case "auth/user-not-found":
					setError("No account found with this email. Please sign up first.");
					break;
				case "auth/wrong-password":
				case "auth/invalid-credential":
					setError("Invalid email or password. Please try again.");
					break;
				case "auth/email-already-in-use":
					setError("An account with this email already exists. Please login instead.");
					// Suggest switching to login
					setTimeout(() => setIsLogin(true), 2000);
					break;
				case "auth/weak-password":
					setError("Password should be at least 6 characters");
					break;
				case "auth/too-many-requests":
					setError("Too many failed attempts. Please try again later.");
					break;
				case "auth/network-request-failed":
					setError("Network error. Please check your internet connection.");
					break;
				default:
					setError(err.message || "Authentication failed. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setError("");
		setLoading(true);
		try {
			await signInWithGoogle();
			setSuccess("Google login successful! Redirecting...");
		} catch (err) {
			console.error("Google sign-in error:", err);
			if (err.code === "auth/popup-closed-by-user") {
				setError("Sign-in popup was closed. Please try again.");
			} else if (err.code === "auth/cancelled-popup-request") {
				setError("Sign-in cancelled. Please try again.");
			} else {
				setError("Google sign-in failed. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");
		
		if (!resetEmail.includes("@") || !resetEmail.includes(".")) {
			setError("Please enter a valid email address");
			return;
		}
		
		setLoading(true);

		try {
			await resetPassword(resetEmail);
			setSuccess("Password reset email sent! Check your inbox.");
			setShowResetPassword(false);
			setResetEmail("");
		} catch (err) {
			console.error("Reset password error:", err);
			if (err.code === "auth/user-not-found") {
				setError("No account found with this email address.");
			} else if (err.code === "auth/invalid-email") {
				setError("Invalid email address format.");
			} else {
				setError("Failed to send reset email. Please try again.");
			}
		} finally {
			setLoading(false);
		}
	};

	// Animated background blobs
	const blobVariants = {
		animate: {
			scale: [1, 1.2, 1],
			rotate: [0, 90, 0],
			borderRadius: [
				"30% 70% 70% 30% / 30% 30% 70% 70%",
				"60% 40% 30% 70% / 60% 30% 70% 40%",
				"30% 70% 70% 30% / 30% 30% 70% 70%",
			],
			transition: {
				duration: 8,
				repeat: Infinity,
				ease: "easeInOut",
			},
		},
	};

	if (showResetPassword) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden'>
				{/* Animated background */}
				<motion.div
					variants={blobVariants}
					animate='animate'
					className='absolute -top-20 -right-20 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl'
				/>
				<motion.div
					variants={blobVariants}
					animate='animate'
					className='absolute -bottom-20 -left-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl'
				/>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative z-10'>
					<h2 className='text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
						Reset Password
					</h2>
					<p className='text-center text-gray-500 dark:text-gray-400 mb-8'>
						Enter your email to receive reset instructions
					</p>

					{error && (
						<motion.p
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className='bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-center p-3 rounded-xl mb-4 text-sm'>
							{error}
						</motion.p>
					)}

					{success && (
						<motion.p
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							className='bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-center p-3 rounded-xl mb-4 text-sm'>
							{success}
						</motion.p>
					)}

					<form
						onSubmit={handleResetPassword}
						className='space-y-6'>
						<div className='relative'>
							<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
								📧
							</span>
							<input
								type='email'
								placeholder='Email address'
								value={resetEmail}
								onChange={(e) => setResetEmail(e.target.value)}
								className='w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all'
								required
							/>
						</div>

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							type='submit'
							disabled={loading}
							className='w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50'>
							{loading ? "Sending..." : "Send Reset Email"}
						</motion.button>
					</form>

					<button
						onClick={() => {
							setShowResetPassword(false);
							setError("");
							setSuccess("");
						}}
						className='w-full mt-6 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
						← Back to Login
					</button>
				</motion.div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden'>
			{/* Animated background */}
			<motion.div
				variants={blobVariants}
				animate='animate'
				className='absolute -top-20 -right-20 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl'
			/>
			<motion.div
				variants={blobVariants}
				animate='animate'
				className='absolute -bottom-20 -left-20 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl'
			/>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative z-10'>
				{/* Logo */}
				<div className='text-center mb-8'>
					<motion.div
						animate={{ rotate: [0, 10, -10, 0] }}
						transition={{ duration: 2, repeat: Infinity }}
						className='text-6xl mb-4'>
						✨
					</motion.div>
					<h1 className='text-5xl font-black tracking-tight'>
						<span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent'>
							TaskFlow
						</span>
					</h1>
					<p className='text-gray-500 dark:text-gray-400 mt-2'>
						{isLogin ? "Welcome back! 👋" : "Join us today! 🚀"}
					</p>
				</div>

				{/* Error/Success Messages */}
				{error && (
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className='bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-center p-3 rounded-xl mb-4 text-sm'>
						{error}
					</motion.p>
				)}

				{success && (
					<motion.p
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className='bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-center p-3 rounded-xl mb-4 text-sm'>
						{success}
					</motion.p>
				)}

				{/* Login/Signup Form */}
				<form
					onSubmit={handleSubmit}
					className='space-y-6'>
					<div className='relative'>
						<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
							📧
						</span>
						<input
							type='email'
							placeholder='Email address'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className='w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all'
							required
						/>
					</div>

					<div className='relative'>
						<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'>
							🔒
						</span>
						<input
							type='password'
							placeholder={isLogin ? "Password" : "Password (min 6 characters)"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className='w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all'
							required
							minLength={isLogin ? 1 : 6}
						/>
					</div>

					{isLogin && (
						<div className='text-right'>
							<button
								type='button'
								onClick={() => setShowResetPassword(true)}
								className='text-sm text-blue-600 dark:text-blue-400 hover:underline'>
								Forgot password?
							</button>
						</div>
					)}

					<motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						type='submit'
						disabled={loading}
						className='w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-2xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50'>
						{loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
					</motion.button>
				</form>

				{/* Divider */}
				<div className='relative my-6'>
					<div className='absolute inset-0 flex items-center'>
						<div className='w-full border-t border-gray-300 dark:border-gray-600'></div>
					</div>
					<div className='relative flex justify-center text-sm'>
						<span className='px-4 bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400'>
							Or continue with
						</span>
					</div>
				</div>

				{/* Google Sign In */}
				<motion.button
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					onClick={handleGoogleSignIn}
					disabled={loading}
					className='w-full py-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-2xl transition-all flex items-center justify-center gap-3 mb-4'>
					<svg
						className='w-5 h-5'
						viewBox='0 0 24 24'>
						<path
							fill='currentColor'
							d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
						/>
						<path
							fill='currentColor'
							d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
						/>
						<path
							fill='currentColor'
							d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
						/>
						<path
							fill='currentColor'
							d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
						/>
					</svg>
					Google
				</motion.button>

				{/* Toggle between Login/Signup */}
				<button
					onClick={() => {
						setIsLogin(!isLogin);
						setError("");
						setSuccess("");
						setEmail("");
						setPassword("");
					}}
					className='w-full text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
					{isLogin
						? "Don't have an account? Sign up"
						: "Already have an account? Login"}
				</button>
			</motion.div>
		</div>
	);
}