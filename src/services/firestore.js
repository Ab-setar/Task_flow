import { db } from './firebase'; // We'll create this next
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { auth } from './firebase';

// We'll initialize db in firebase.js later

// Get all tasks for current user
export const getTasks = async () => {
  if (!auth.currentUser) return [];
  
  const q = query(
    collection(db, "tasks"),
    where("userId", "==", auth.currentUser.uid),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Add new task
export const addTask = async (taskData) => {
  if (!auth.currentUser) throw new Error("User not logged in");
  
  const task = {
    ...taskData,
    userId: auth.currentUser.uid,
    createdAt: new Date().toISOString(),
  };
  
  const docRef = await addDoc(collection(db, "tasks"), task);
  return { id: docRef.id, ...task };
};

// Update task (complete, edit, etc.)
export const updateTask = async (taskId, updates) => {
  if (!auth.currentUser) throw new Error("User not logged in");
  const taskRef = doc(db, "tasks", taskId);
  await updateDoc(taskRef, updates);
};

// Delete task
export const deleteTask = async (taskId) => {
  if (!auth.currentUser) throw new Error("User not logged in");
  await deleteDoc(doc(db, "tasks", taskId));
};