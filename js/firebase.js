// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// Import setLogLevel for debugging
import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Setup
// User-provided configuration
const firebaseConfig = {
    apiKey: "AIzaSyAdVV6m_OlSaXYwO7TH8EJANSJfTBhUtD0",
    authDomain: "preggyjourney-505cc.firebaseapp.com",
    projectId: "preggyjourney-505cc",
    storageBucket: "preggyjourney-505cc.firebasestorage.app",
    messagingSenderId: "829747410747",
    appId: "1:829747410747:web:518afe3974d7770b76291e",
    measurementId: "G-BSKWNQ5Q7Q"
};

let tempApp = null;
let tempAuth = null;
let tempDb = null;
let configError = false; // This must be let, as it's reassigned on error

if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.error("Error: Firebase configuration is missing.");
    configError = true;
} else {
    // Initialize Firebase services
    tempApp = initializeApp(firebaseConfig);
    tempAuth = getAuth(tempApp);
    tempDb = getFirestore(tempApp);
    
    // Enable debug logging to see Firestore operations in the console
    setLogLevel('debug');
}

// Export services as const
export const app = tempApp;
export const auth = tempAuth;
export const db = tempDb;
// Export the error flag
export { configError };
