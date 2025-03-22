// Import the functions you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhdRVei33jeLLTS4vam5IGiWEkwj76GLU",
  authDomain: "ians-web.firebaseapp.com",
  projectId: "ians-web",
  storageBucket: "ians-web.firebasestorage.app",
  messagingSenderId: "1011416616189",
  appId: "1:1011416616189:web:473fe9b6cc88dac2be0294",
  measurementId: "G-B0T6VMRDER"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
