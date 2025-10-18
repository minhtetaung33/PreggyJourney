import { initAuth } from './auth.js';
import { initTabs } from './ui.js';
import { initMealPlanner } from './meal-planner.js';
import { initWellness } from './wellness.js';
import { initJourney } from './journey.js';

/**
 * The main entry point for the application. This function is called
 * once the DOM is fully loaded and ready.
 */
function main() {
    console.log("App starting...");
    const mainContent = document.getElementById('main-content');
    const authOverlay = document.getElementById('auth-overlay');

    // Initialize the authentication flow.
    // The initAuth function takes a callback that will be executed
    // once the user's login status is determined.
    initAuth((user) => {
        if (user) {
            // If a user is logged in:
            console.log("User is logged in:", user.uid);
            
            // 1. Hide the login overlay and show the main app content.
            authOverlay.classList.add('hidden');
            mainContent.classList.remove('hidden');

            // 2. Initialize the tab switching functionality from ui.js.
            initTabs();

            // 3. Initialize each of the feature modules, passing the user's ID
            //    so they can fetch the correct data from Firestore.
            initMealPlanner(user.uid);
            initWellness(user.uid);
            initJourney(user.uid);

        } else {
            // If no user is logged in:
            console.log("User is logged out.");
            
            // 1. Show the login overlay and hide the main app content.
            authOverlay.classList.remove('hidden');
            mainContent.classList.add('hidden');
        }
    });
}

// Wait until the entire HTML document is loaded before running the main script.
// This prevents errors from trying to access elements that haven't been created yet.
document.addEventListener('DOMContentLoaded', main);