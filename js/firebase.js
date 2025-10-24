// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
// Import setLogLevel for debugging
import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Setup
const firebaseConfig = {
    apiKey: "AIzaSyAdVV6m_OlSaXYwO7TH8EJANSJfTBhUtD0",
    authDomain: "preggyjourney-505cc.firebaseapp.com",
    projectId: "preggyjourney-505cc",
    storageBucket: "preggyjourney-505cc.firebasestorage.app",
    messagingSenderId: "829747410747",
    appId: "1:829747410747:web:518afe3974d7770b76291e",
    measurementId: "G-BSKWNQ5Q7Q"
};

let configError = false;

if (!firebaseConfig || !firebaseConfig.apiKey) { // Added a check for apiKey to be safe
    console.error("Error: Firebase configuration is missing or incomplete.");
    configError = true;
}

let app, auth, db;

if (!configError) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Enable debug logging for Firestore to help troubleshoot
    setLogLevel('debug');
}

export { auth, db, configError, app }; // Export 'app'
