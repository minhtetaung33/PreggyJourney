// Import signInAnonymously
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { auth } from './firebase.js';
// ... existing code ...
import { loadAllDataForUser, unloadAllData } from './main.js';

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
    window.gapi.load('client:auth2', initGoogleCalendarClient);
};

/**
 * Initializes the Google Calendar API client.
 */
const initGoogleCalendarClient = async () => {
  try {
    await window.gapi.client.init({
      clientId: GOOGLE_CALENDAR_CLIENT_ID,
      scope: GOOGLE_API_SCOPES,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    });
    
    gapiLoaded = true;
    
    // Check if user is already signed in
    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance && authInstance.isSignedIn.get()) {
        gapiAuthed = true;
    } else {
        gapiAuthed = false;
    }
  } catch (error) {
    console.error("Error initializing Google API client:", error);
  }
};

/**
 * Prompts the user to sign in to Google Calendar.
 */
const signInToGoogleCalendar = async () => {
    if (!gapiLoaded) {
        console.error("GAPI client not loaded yet.");
        return false;
    }
    try {
        await window.gapi.auth2.getAuthInstance().signIn();
        gapiAuthed = true;
        return true;
    } catch (error) {
        console.error("Error signing in to Google Calendar:", error);
        gapiAuthed = false;
        return false;
    }
};

/**
 * Checks if the user is authenticated with Google Calendar.
 */
const isCalendarAuthed = () => {
    return gapiLoaded && gapiAuthed;
};

/**
 * Returns the GAPI client object for making API calls.
 */
const getGapiClient = () => {
    return window.gapi.client;
}
// --- End NEW ---


const setupAuthentication = () => {
    onAuthStateChanged(auth, async (user) => {
// ... existing code ...
    elements.authModal.addEventListener('click', (e) => e.target === elements.authModal && closeAuthModal());
};

const signInWithGoogle = () => {
// ... existing code ...
    });
};

const doSignOut = () => {
// ... existing code ...
    });
};
// ... existing code ...
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
