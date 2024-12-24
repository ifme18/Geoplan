// Import the functions you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBdj0apmOp6lTlf7sMpBDldFp8WB70iRkg",
      authDomain: "test-2618d.firebaseapp.com",
      databaseURL: "https://test-2618d-default-rtdb.firebaseio.com",
      projectId: "test-2618d",
      storageBucket: "test-2618d.appspot.com",
      messagingSenderId: "347431242639",
      appId: "1:347431242639:web:e2f1ba1f4584fd8bfed9fa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
