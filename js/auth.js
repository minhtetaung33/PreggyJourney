// Import signInAnonymously
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
import { elements, showMainApp, showHeroSection, closeAuthModal, openAuthModal } from './ui.js';
import { loadAllDataForUser, unloadAllData } from './main.js';
// NEW: Import the notification UI update function if needed here, or handle readiness differently
// import { updateNotificationButtonUI } from './journey.js'; // Example if needed directly

let userId = null; // This must be 'let' as it is reassigned

// --- NEW: Google Calendar API ---
//
// -----------------------------------------------------------------
// --- ⬇️ PASTE YOUR CLIENT ID HERE ⬇️ ---
// -----------------------------------------------------------------
const GOOGLE_CALENDAR_CLIENT_ID = '760406251903-n2hdsj5sji19cm6e3qk0ibn8403rhsio.apps.googleusercontent.com'; // ⬅️ PASTE YOUR CLIENT ID
// -----------------------------------------------------------------
// --- ⬆️ PASTE YOUR CLIENT ID HERE ⬆️ ---
// -----------------------------------------------------------------
//
const GOOGLE_API_SCOPES = 'https://www.googleapis.com/auth/calendar.events';
let gapiLoaded = false;
let gapiAuthed = false;

/**
 * Loads the Google GAPI client library.
 * This is called from main.js on DOMContentLoaded.
 */
const loadGapiClient = () => {
    // Check if gapi is already loaded to avoid errors on potential reloads
    if (window.gapi) {
        window.gapi.load('client:auth2', initGoogleCalendarClient);
    } else {
        console.error("Google API script (gapi) not loaded yet.");
        // Optionally retry after a delay
        // setTimeout(loadGapiClient, 500); 
    }
};

/**
 * Initializes the Google Calendar API client using .then() for promise handling.
 */
const initGoogleCalendarClient = () => { // Removed 'async'
  // Ensure gapi.client and gapi.auth2 are available
  if (!window.gapi || !window.gapi.client || !window.gapi.auth2) {
      console.error("GAPI client or auth2 libraries not fully loaded.");
      // Optionally retry or indicate an error state
      return; 
  }

  window.gapi.client.init({ // No 'await' here
    clientId: GOOGLE_CALENDAR_CLIENT_ID,
    scope: GOOGLE_API_SCOPES,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
  }).then(() => { // Use .then() for the promise returned by init
      gapiLoaded = true;
      console.log("GAPI Client Initialized Successfully");

      // Check if user is already signed in using the auth instance
      const authInstance = window.gapi.auth2.getAuthInstance(); 
      if (!authInstance) {
          console.error("GAPI Auth Instance not available after init.");
          gapiAuthed = false;
          return; // Exit if auth instance is missing
      }

      if (authInstance.isSignedIn.get()) {
          gapiAuthed = true;
          console.log("GAPI User already signed in to Google Calendar scope.");
      } else {
          gapiAuthed = false;
          console.log("GAPI User needs to sign in to Google Calendar scope.");
      }
      // Update the UI button state now that we know the status
      // You might need to import or call this function from journey.js or main.js
      // updateNotificationButtonUI(); // Example

  }).catch((error) => { // Added .catch() specifically for the init promise
    console.error("Error initializing Google API client:", error);
    gapiLoaded = false; // Ensure loaded state is false on error
    gapiAuthed = false;
  });
};


/**
 * Prompts the user to sign in to Google Calendar.
 */
const signInToGoogleCalendar = async () => {
    if (!gapiLoaded || !window.gapi || !window.gapi.auth2) { // Check gapi and auth2 again
        console.error("GAPI client or auth2 not loaded/initialized yet.");
        return false;
    }
    try {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (!authInstance) {
             console.error("GAPI Auth Instance not available for sign in.");
             return false;
        }
        await authInstance.signIn();
        // Double-check sign-in status after attempting
        if (authInstance.isSignedIn.get()) {
            gapiAuthed = true;
            console.log("Successfully signed in to Google Calendar scope.");
            return true;
        } else {
             console.warn("Sign in attempt finished, but user is not signed in.");
             gapiAuthed = false;
             return false;
        }
    } catch (error) {
        console.error("Error during Google Calendar sign-in process:", error);
        gapiAuthed = false;
        return false;
    }
};

/**
 * Checks if the user is authenticated with Google Calendar.
 */
const isCalendarAuthed = () => {
    // Also check the auth instance's current state if possible
    const authInstance = gapiLoaded && window.gapi?.auth2 ? window.gapi.auth2.getAuthInstance() : null;
    gapiAuthed = authInstance ? authInstance.isSignedIn.get() : false; // Update gapiAuthed based on current state
    return gapiLoaded && gapiAuthed;
};


/**
 * Returns the GAPI client object for making API calls.
 * IMPORTANT: Always check if gapiLoaded is true before calling this.
 */
const getGapiClient = () => {
    if (!gapiLoaded || !window.gapi || !window.gapi.client) {
        console.error("GAPI client is not loaded or available.");
        return null; // Return null or throw an error
    }
    return window.gapi.client;
}
// --- End NEW ---


const setupAuthentication = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in (either Google or Anonymous)
            userId = user.uid;

            if (user.isAnonymous) {
                // ANONYMOUS USER
                console.log("Firebase signed in anonymously:", userId);
                if (elements.userNameEl) elements.userNameEl.textContent = "Guest"; // Show "Guest"
                showHeroSection(); // Show the hero section so they can "Get Started"
                // Load data even for the anonymous user
                loadAllDataForUser(userId); 
            } else {
                // GOOGLE USER (Firebase Auth)
                console.log("Firebase signed in with Google:", userId);
                 if (elements.userNameEl) elements.userNameEl.textContent = user.displayName ? user.displayName.split(' ')[0] : "User";
                showMainApp(); // Show the full app
                loadAllDataForUser(userId);
            }
        } else {
            // User is signed out (Firebase Auth)
            userId = null;
            showHeroSection();
            unloadAllData();
            
            // Try to sign in anonymously to get permissions to read data
            try {
                console.log("No Firebase user. Attempting anonymous sign-in...");
                await signInAnonymously(auth);
                // This will trigger onAuthStateChanged to run again
            } catch (error) {
                console.error("Firebase Anonymous Sign-In Error:", error);
                // Handle anonymous sign-in failure (e.g., show an error message)
            }
        }
    });

    // Ensure elements exist before adding listeners
    if (elements.signUpBtn) {
        elements.signUpBtn.addEventListener('click', openAuthModal);
    }
    if (elements.googleSignInBtn) {
        elements.googleSignInBtn.addEventListener('click', () => {
            signInWithGoogle(); // Firebase Google Sign In
            closeAuthModal();
        });
    }
     if (elements.signOutBtn) {
        elements.signOutBtn.addEventListener('click', doSignOut); // Firebase Sign Out
     }
    if (elements.authModalCloseBtn) {
        elements.authModalCloseBtn.addEventListener('click', closeAuthModal);
    }
    if (elements.authModal) {
        elements.authModal.addEventListener('click', (e) => e.target === elements.authModal && closeAuthModal());
    }
};

// Firebase Google Sign In
const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch(error => {
        console.error("Firebase Google Sign-In Error:", error);
    });
};

// Firebase Sign Out
const doSignOut = () => {
    signOut(auth).catch(error => {
        console.error("Firebase Sign Out Error:", error);
    });
    // --- NEW: Sign out from Google Calendar Scope too ---
    if (gapiLoaded && window.gapi && window.gapi.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance();
        if (authInstance && authInstance.isSignedIn.get()) {
            authInstance.signOut().then(() => {
                 console.log("Signed out from Google Calendar scope.");
                 gapiAuthed = false;
                 // Optionally update UI immediately
                 // updateNotificationButtonUI(); 
            }).catch((error) => {
                 console.error("Error signing out from Google Calendar scope:", error);
            });
        }
    }
    // --- End NEW ---
};

const getCurrentUserId = () => {
    return userId;
};

export { 
    setupAuthentication, 
    getCurrentUserId,
    // --- NEW EXPORTS ---
    loadGapiClient,
    signInToGoogleCalendar,
    isCalendarAuthed,
    getGapiClient
    // --- End NEW ---
};
