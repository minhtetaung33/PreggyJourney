// Import signInAnonymously
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import { elements, showMainApp, showHeroSection, closeAuthModal, openAuthModal } from './ui.js';
import { loadAllDataForUser, unloadAllData } from './main.js';

let userId = null; // This must be 'let' as it is reassigned

const setupAuthentication = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in (either Google or Anonymous)
            userId = user.uid;

            if (user.isAnonymous) {
                // ANONYMOUS USER
                console.log("Signed in anonymously:", userId);
                elements.userNameEl.textContent = "Guest"; // Show "Guest"
                showHeroSection(); // Show the hero section so they can "Get Started"
                // *** THIS IS THE FIX ***
                // Load data even for the anonymous user
                loadAllDataForUser(userId); 
            } else {
                // GOOGLE USER
                console.log("Signed in with Google:", userId);
                elements.userNameEl.textContent = user.displayName.split(' ')[0];
                showMainApp(); // Show the full app
                loadAllDataForUser(userId);
            }
        } else {
            // User is signed out
            userId = null;
            showHeroSection();
            unloadAllData();
            
            // --- THIS IS THE FIX ---
            // Try to sign in anonymously to get permissions to read data
            try {
                console.log("No user. Attempting anonymous sign-in...");
                await signInAnonymously(auth);
                // This will trigger onAuthStateChanged to run again
            } catch (error) {
                console.error("Anonymous Sign-In Error:", error);
            }
        }
    });

    elements.signUpBtn.addEventListener('click', openAuthModal);
    elements.googleSignInBtn.addEventListener('click', () => {
        signInWithGoogle();
        closeAuthModal();
    });
    elements.signOutBtn.addEventListener('click', doSignOut);
    elements.authModalCloseBtn.addEventListener('click', closeAuthModal);
    elements.authModal.addEventListener('click', (e) => e.target === elements.authModal && closeAuthModal());
};

const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
        console.error("Google Sign-In Error:", error);
    });
};

const doSignOut = () => {
    signOut(auth).catch(error => {
        console.error("Sign Out Error:", error);
    });
};

const getCurrentUserId = () => {
    return userId;
};

export { setupAuthentication, getCurrentUserId };
