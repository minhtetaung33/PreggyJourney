import { 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    signInAnonymously,
    signInWithCustomToken // <-- Import this
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import { elements, showMainApp, showHeroSection, closeAuthModal, openAuthModal } from './ui.js';
import { loadAllDataForUser, unloadAllData } from './main.js';

let userId = null;

function setupAuthentication() {
    
    // onAuthStateChanged listens for any change in user status
    onAuthStateChanged(auth, async user => {
        if (user) {
            // User is signed in
            userId = user.uid;
            
            if (user.isAnonymous) {
                // --- Handle Anonymous User UI ---
                // We assume elements.userNameEl, elements.signOutBtn, etc.
                // are the ones in the *hero section* based on the HTML structure.
                elements.userNameEl.textContent = 'Guest';
                elements.signOutBtn.classList.add('hidden'); // Hide sign out
                elements.authButtons.classList.remove('hidden'); // Show "Get Started" (for upgrade)
                elements.userInfo.classList.remove('flex'); // Hide welcome message
                elements.userInfo.classList.add('hidden');
            } else {
                // --- Handle Signed-in (Google) User UI ---
                elements.userNameEl.textContent = user.displayName.split(' ')[0];
                elements.signOutBtn.classList.remove('hidden'); // Show sign out
                elements.authButtons.classList.add('hidden'); // Hide "Get Started"
                elements.userInfo.classList.remove('hidden'); // Show welcome message
                elements.userInfo.classList.add('flex');
            }
            
            showMainApp(); // Show the main application
            loadAllDataForUser(userId); // Load data for this user

        } else {
            // User is signed out
            userId = null;
            showHeroSection(); // Show the login screen
            unloadAllData();
        }
    });

    // --- NEW: Initial Sign-in Logic ---
    // This logic runs once when the app loads to ensure user is authenticated
    const initialSignIn = async () => {
        // Check if a custom token is provided by the environment
        // This is the standard secure way to log in in this context
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            try {
                await signInWithCustomToken(auth, __initial_auth_token);
                // onAuthStateChanged will see the new user and handle the rest
            } catch (error) {
                console.error("Error signing in with custom token:", error);
                // Fallback to anonymous sign-in
                try {
                    await signInAnonymously(auth);
                } catch (anonError) {
                    console.error("Error in fallback anonymous sign-in:", anonError);
                    showHeroSection(); // Show hero if all auth fails
                }
            }
        } else {
            // No custom token (e.g., local development), just sign in anonymously
            try {
                await signInAnonymously(auth);
                // onAuthStateChanged will handle the rest
            } catch (error) {
                console.error("Error signing in anonymously:", error);
                // If anon sign-in fails, show the hero section as a fallback.
                showHeroSection();
            }
        }
    };
    
    // Run the initial sign-in logic *only if* there's no current user
    if (!auth.currentUser) {
        initialSignIn();
    }
    // --- END: NEW ---


    elements.signUpBtn.addEventListener('click', openAuthModal);
    elements.googleSignInBtn.addEventListener('click', () => {
        signInWithGoogle(); // This will link or upgrade the anonymous/custom account
        closeAuthModal();
    });
    elements.signOutBtn.addEventListener('click', doSignOut);
    elements.authModalCloseBtn.addEventListener('click', closeAuthModal);
    elements.authModal.addEventListener('click', (e) => e.target === elements.authModal && closeAuthModal());
}

const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    // This will link with the anonymous account automatically
    signInWithPopup(auth, provider).catch(error => {
        console.error("Google Sign-In Error:", error);
    });
};

const doSignOut = () => {
    signOut(auth).catch(error => {
        console.error("Sign Out Error:", error);
    });
    
    // --- MODIFIED ---
    // After a Google user signs out, we immediately sign them
    // back in as an anonymous user so the app continues to work.
    // onAuthStateChanged will fire with `null`, then fire again with the new guest user.
    signInAnonymously(auth).catch(error => {
        console.error("Error signing back in anonymously after sign out:", error);
        showHeroSection(); // Fallback
    });
    // --- END MODIFIED ---
};

function getCurrentUserId() {
    return userId;
}

export { setupAuthentication, getCurrentUserId };
