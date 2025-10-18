import { auth, provider } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// DOM Elements for authentication and UI switching
const heroSection = document.getElementById('hero-section');
const mainApp = document.getElementById('main-app');
const authButtons = document.getElementById('auth-buttons');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const signOutBtn = document.getElementById('sign-out-btn');
const signUpBtn = document.getElementById('sign-up-btn');
const googleSignInBtn = document.getElementById('google-signin-btn');

// Auth Modal Elements
const authModal = document.getElementById('auth-modal');
const authModalContent = document.getElementById('auth-modal-content');
const authModalCloseBtn = document.getElementById('auth-modal-close-btn');


/**
 * Shows the authentication modal with a smooth animation.
 */
const showAuthModal = () => {
    authModal.classList.remove('hidden');
    setTimeout(() => {
        authModalContent.classList.remove('opacity-0', 'scale-95');
        authModalContent.classList.add('opacity-100', 'scale-100');
    }, 10);
};

/**
 * Hides the authentication modal with a smooth animation.
 */
const hideAuthModal = () => {
    authModalContent.classList.add('opacity-0', 'scale-95');
    authModalContent.classList.remove('opacity-100', 'scale-100');
    setTimeout(() => {
        authModal.classList.add('hidden');
    }, 300); // Wait for the animation to finish
};

/**
 * Handles the Google Sign-In process via a popup.
 */
const signInWithGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Signed in successfully:", result.user.displayName);
            hideAuthModal();
            // The onAuthStateChanged observer will handle the rest of the UI updates.
        }).catch((error) => {
            console.error("Authentication error:", error);
            // You could show an error message to the user here.
        });
};

/**
 * Handles the sign-out process.
 */
const doSignOut = () => {
    signOut(auth).catch((error) => {
        console.error("Sign out error:", error);
    });
};

/**
 * Initializes the authentication flow.
 * @param {function} onAuthChangeCallback - A function to call when the auth state changes. It receives the user object (or null).
 */
export function initAuth(onAuthChangeCallback) {
    // Set up event listeners for all auth-related buttons
    signUpBtn.addEventListener('click', showAuthModal);
    googleSignInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', doSignOut);
    authModalCloseBtn.addEventListener('click', hideAuthModal);
    
    // Close modal if user clicks outside the content area
    authModal.addEventListener('click', (event) => {
        if (event.target === authModal) {
            hideAuthModal();
        }
    });

    // The core authentication listener. This runs whenever a user signs in or out.
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in.
            heroSection.classList.add('hidden');
            mainApp.classList.remove('hidden');

            authButtons.classList.add('hidden');
            userInfo.classList.remove('hidden');
            userName.textContent = user.displayName;

        } else {
            // User is signed out.
            heroSection.classList.remove('hidden');
            mainApp.classList.add('hidden');

            authButtons.classList.remove('hidden');
            userInfo.classList.add('hidden');
            userName.textContent = '';
        }
        
        // Notify the main application script about the auth change.
        // This is crucial for loading user-specific data.
        if (onAuthChangeCallback) {
            onAuthChangeCallback(user);
        }
    });
}