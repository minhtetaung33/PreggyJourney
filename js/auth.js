// Import signInWithCustomToken
import { 
    onAuthStateChanged, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    signInAnonymously, 
    signInWithCustomToken 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import { elements, showMainApp, showHeroSection, closeAuthModal, openAuthModal } from './ui.js';
import { loadAllDataForUser, unloadAllData } from './main.js';

let userId = null; // This must be 'let' as it is reassigned

/**
 * Performs the initial sign-in.
 * It PRIORITIZES the __initial_auth_token provided by the environment.
 */
const initializeAuth = async () => {
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            console.log("Found custom token. Signing in with custom token...");
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            console.log("No custom token found. Signing in anonymously...");
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Error during initial sign-in:", error);
        // Fallback to anonymous if the custom token is invalid
        if (error.code === 'auth/invalid-custom-token') {
            try {
                await signInAnonymously(auth);
            } catch (anonError) {
                console.error("Anonymous fallback sign-in failed:", anonError);
            }
        }
    }
};

const setupAuthentication = () => {
    // This listener now *reacts* to the auth state, it doesn't *cause* it.
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in (Google, Custom Token, or Anonymous)
            userId = user.uid;

            if (user.isAnonymous) {
                // ANONYMOUS USER
                console.log("Signed in anonymously:", userId);
                elements.userNameEl.textContent = "Guest";
                showHeroSection(); 
                loadAllDataForUser(userId); 
            } else {
                // GOOGLE OR CUSTOM TOKEN USER
                // Use displayName if available (Google), otherwise "User"
                const displayName = user.displayName ? user.displayName.split(' ')[0] : "User";
                console.log(`Signed in as ${displayName}:`, userId);
                console.log("Full User ID:", userId); // Log the ID for clarity
                elements.userNameEl.textContent = displayName;
                showMainApp();
                loadAllDataForUser(userId);
            }
        } else {
            // User is signed out
            console.log("User is signed out.");
            userId = null;
            showHeroSection();
            unloadAllData();
            // We don't re-authenticate here; that's handled by initializeAuth on load
            // or by the user clicking a sign-in button.
        }
    });

    // Add event listeners
    elements.signUpBtn.addEventListener('click', openAuthModal);
    elements.googleSignInBtn.addEventListener('click', () => {
        signInWithGoogle();
        closeAuthModal();
    });
    elements.signOutBtn.addEventListener('click', doSignOut);
    elements.authModalCloseBtn.addEventListener('click', closeAuthModal);
    elements.authModal.addEventListener('click', (e) => e.target === elements.authModal && closeAuthModal());
    
    // Call the initial sign-in function *after* setting up the listener
    initializeAuth();
};

const signInWithGoogle = () => {
    // **IMPORTANT**: This flow will likely cause the *same permission error*
    // because it REPLACES the custom token auth with a new Google auth session
    // that doesn't have the same permissions.
    // A more advanced fix would be to *link* this Google account to the
    // existing user, not sign in fresh.
    console.warn("Signing in with Google may overwrite the environment's auth token and cause permission errors.");
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
        console.error("Google Sign-In Error:", error);
    });
};

const doSignOut = () => {
    signOut(auth).catch(error => {
        console.error("Sign Out Error:", error);
    });
    // After sign out, onAuthStateChanged will fire.
    // To get a new anonymous user, we can call initializeAuth again.
    setTimeout(initializeAuth, 500); // Give sign-out time to complete
};

const getCurrentUserId = () => {
    return userId;
};

export { setupAuthentication, getCurrentUserId };
