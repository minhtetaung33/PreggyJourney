// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// NEW: Import the functions module
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js"; 

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

if (!firebaseConfig) {
    console.error("Error: Firebase configuration is missing.");
    configError = true;
}

// NEW: Add 'functions' to your initialized variables
let app, auth, db, functions; 

if (!configError) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // NEW: Initialize the functions service
    functions = getFunctions(app); 
}

// NEW: Export 'functions' so your other files can use it
export { auth, db, functions, configError };