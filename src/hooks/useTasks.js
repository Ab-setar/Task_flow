import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

/**
 * useTasks — manages all Firestore task operations.
 * Returns tasks array, loading state, and all CRUD functions.
 * Dashboard just calls this hook and focuses on rendering UI.
 */
export function useTasks() {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Real-time listener — runs whenever the logged-in user changes
    useEffect(() => {
        if (!currentUser) {
            setTasks([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        // Query tasks for this user only.
        // We intentionally skip orderBy here to avoid requiring a composite
        // Firestore index. Sorting is handled in JavaScript below.
        const q = query(
            collection(db, "tasks"),
            where("userId", "==", currentUser.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (snap) => {
                setTasks(
                    snap.docs.map((d) => ({
                        id: d.id,
                        ...d.data(),
                        // Convert Firestore Timestamp → JS Date for sorting
                        createdAt: d.data().createdAt?.toDate() || new Date(),
                    }))
                );
                setLoading(false);
            },
            (err) => {
                // Log the full error — if this is an index error, the message
                // contains a URL you can click to create the index automatically.
                console.error("Firestore error code:", err.code);
                console.error("Firestore error message:", err.message);

                // Show a helpful message based on the error type
                if (err.code === "failed-precondition") {
                    // This means a Firestore composite index is missing.
                    // Check the console — there will be a link to create it.
                    setError(
                        "Database index missing. Check the browser console for a link to fix this automatically."
                    );
                } else if (err.code === "permission-denied") {
                    setError(
                        "Permission denied. Your Firestore security rules are blocking this query."
                    );
                } else {
                    setError(`Failed to load tasks: ${err.message}`);
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    // Add a new task
    const addTask = async ({ title, category, priority, dueDate }) => {
        if (!currentUser) return;
        await addDoc(collection(db, "tasks"), {
            title: title.trim(),
            completed: false,
            createdAt: serverTimestamp(),
            category,
            priority,
            dueDate: dueDate || null,
            subtasks: [],
            userId: currentUser.uid,
        });
    };

    // Toggle task complete / incomplete
    const toggleComplete = async (id, currentStatus) => {
        await updateDoc(doc(db, "tasks", id), { completed: !currentStatus });
    };

    // Update task title
    const updateTitle = async (id, newTitle) => {
        if (!newTitle.trim()) return;
        await updateDoc(doc(db, "tasks", id), { title: newTitle.trim() });
    };

    // Delete a single task
    const deleteTask = async (id) => {
        await deleteDoc(doc(db, "tasks", id));
    };

    // Delete all completed tasks at once
    const clearCompleted = async () => {
        const completed = tasks.filter((t) => t.completed);
        await Promise.all(completed.map((t) => deleteDoc(doc(db, "tasks", t.id))));
    };

    // Add a subtask to a task
    const addSubtask = async (taskId, subTitle) => {
        if (!subTitle.trim()) return;
        const task = tasks.find((t) => t.id === taskId);
        const newSub = {
            id: Date.now().toString(),
            title: subTitle.trim(),
            completed: false,
        };
        await updateDoc(doc(db, "tasks", taskId), {
            subtasks: [...(task.subtasks || []), newSub],
        });
    };

    // Toggle a subtask complete / incomplete
    const toggleSubtask = async (taskId, subId) => {
        const task = tasks.find((t) => t.id === taskId);
        const updated = task.subtasks.map((s) =>
            s.id === subId ? { ...s, completed: !s.completed } : s
        );
        await updateDoc(doc(db, "tasks", taskId), { subtasks: updated });
    };

    // Delete a subtask
    const deleteSubtask = async (taskId, subId) => {
        const task = tasks.find((t) => t.id === taskId);
        await updateDoc(doc(db, "tasks", taskId), {
            subtasks: task.subtasks.filter((s) => s.id !== subId),
        });
    };

    return {
        tasks,
        loading,
        error,
        addTask,
        toggleComplete,
        updateTitle,
        deleteTask,
        clearCompleted,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
    };
}
