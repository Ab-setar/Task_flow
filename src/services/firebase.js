// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeMEAvSrA2Hdym_5DRGTqLwy-HpFIvLsg",
  authDomain: "taskflow-app-f2e05.firebaseapp.com",
  projectId: "taskflow-app-f2e05",
  storageBucket: "taskflow-app-f2e05.firebasestorage.app",
  messagingSenderId: "208790505198",
  appId: "1:208790505198:web:c0f3ef3dbf5f5dbdce15ff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the services for use in your app
export { auth, db, storage };
export default app;