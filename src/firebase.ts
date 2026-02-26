import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC7UjgEAitZ06-sM0LJi4EyDwBOpVm-hes",
  authDomain: "smart-cowork.firebaseapp.com",
  projectId: "smart-cowork",
  storageBucket: "smart-cowork.firebasestorage.app",
  messagingSenderId: "137183297767",
  appId: "1:137183297767:web:a5e5378404e776d44f2242"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);
