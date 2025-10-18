// Import the necessary functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAdVV6m_OlSaXYwO7TH8EJANSJfTBhUtD0",
    authDomain: "preggyjourney-505cc.firebaseapp.com",
    projectId: "preggyjourney-505cc",
    storageBucket: "preggyjourney-505cc.firebasestorage.app",
    messagingSenderId: "829747410747",
    appId: "1:829747410747:web:518afe3974d7770b76291e",
    measurementId: "G-BSKWNQ5Q7Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();