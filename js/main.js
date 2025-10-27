import { configError } from './firebase.js';
import { setupAuthentication, getCurrentUserId } from './auth.js';
// Import the new cacheDomElements function and the new listener setup function
import { setupTabs, createBubbleBackground, cacheDomElements, setupNotificationListeners } from './ui.js';
import { initializeMealPlanner, unloadMealPlanner, updateWellnessDataForMealPlanner } from './meal-planner.js';
import { 
    initializeWellness, 
    unloadWellness, 
    generateAllWellnessTips, // Import the new combined function
    renderWellnessChart, 
    updateWellnessChartData, 
    updateDashboardUI,
    wellnessChart 
} from './wellness.js';
import { initializeJourney, unloadJourney, updateWellnessDataForJourney } from './journey.js';
// NEW IMPORT for Calm Space
import { initializeCalmSpace, unloadCalmSpace } from './calm-space.js';

// These must be 'let' as they are reassigned
let wellnessData = {};
let currentMealPlan = {};
let tipsHaveBeenGenerated = false;

// This function is called whenever wellness data (mood, energy, etc.) changes in Firestore.
const onWellnessDataUpdate = (newData) => {
    wellnessData = newData;
    updateWellnessDataForMealPlanner(newData);
    updateWellnessDataForJourney(newData);
    
    // Check if both data sources are ready, and if tips haven't been generated yet.
    if (!tipsHaveBeenGenerated && Object.keys(currentMealPlan).length > 0 && Object.keys(wellnessData).length > 0) {
        generateAllWellnessTips(); // Call the single, combined function
        tipsHaveBeenGenerated = true; // Mark as generated to prevent re-triggering
    }

    if (document.getElementById('content-symptom-tracker').classList.contains('active')) {
        updateDashboardUI();
    }
};

// This function is called whenever the meal plan changes in Firestore.
const onMealPlanUpdate = (newPlan) => {
    currentMealPlan = newPlan;
    
    // Check if both data sources are ready, and if tips haven't been generated yet.
    if (!tipsHaveBeenGenerated && Object.keys(wellnessData).length > 0 && Object.keys(currentMealPlan).length > 0) {
        generateAllWellnessTips(); // Call the single, combined function
        tipsHaveBeenGenerated = true; // Mark as generated to prevent re-triggering
    }

    updateDashboardUI();
};

export const loadAllDataForUser = (userId) => {
    // Reset the flag for a new user session/page load.
    tipsHaveBeenGenerated = false; 
    
    // Initialize all data listeners. The onUpdate functions above will handle the tip generation.
    initializeMealPlanner(userId, onMealPlanUpdate, wellnessData);
    initializeWellness(userId, onWellnessDataUpdate);
    initializeJourney(userId, wellnessData);

    // NEW: Initialize Calm Space
    // Get app ID for Firebase paths in calm-space
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    initializeCalmSpace(userId, appId);
};

export const unloadAllData = () => {
    unloadMealPlanner();
    unloadWellness();
    unloadJourney();
    unloadCalmSpace(); // NEW
};


document.addEventListener('DOMContentLoaded', () => {
    if (configError) {
        document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Firebase configuration is missing. The app cannot start.</p>';
        return;
    }

    // --- THIS IS THE FIX ---
    // Cache all elements first, *before* setting up auth or tabs
    cacheDomElements(); 
    // Now these functions can safely access elements.
    // -------------------------
    setupNotificationListeners(); // Set up listeners for the notification UI

    setupAuthentication();
    setupTabs(handleTabSwitch);

    // --- NEW ANIMATION SETUP ---
    // 1. Create the rising bubbles
    createBubbleBackground();
    // 2. Fade out the page overlay after a short delay
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500); // 0.5s delay before fading out
    // --- END NEW ANIMATION SETUP ---
});

const handleTabSwitch = (activeTab) => {
    const userId = getCurrentUserId();
    if (!userId) return;

    if (activeTab === 'symptom') {
        // If the chart instance doesn't exist yet, render it.
        if (!wellnessChart) { 
             renderWellnessChart();
        }
        // Always update the chart data and UI when switching to the tab.
        updateWellnessChartData();
        updateDashboardUI();
    }
    // No specific action needed for 'calm' or 'journey' tab switches, 
    // they are initialized on load and handle their own state.
};
