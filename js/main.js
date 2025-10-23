import { configError } from './firebase.js';
import { setupAuthentication, getCurrentUserId } from './auth.js';
// Import createBubbleBackground from ui.js
import { setupTabs, createBubbleBackground } from './ui.js';
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
// Import new calm space functions
import { initializeCalmSpace, unloadCalmSpace, updateWellnessDataForCalmSpace, stopCalmSpaceActivities } from './calm-space.js';

let wellnessData = {};
let currentMealPlan = {};
let tipsHaveBeenGenerated = false;

// This function is called whenever wellness data (mood, energy, etc.) changes in Firestore.
function onWellnessDataUpdate(newData) {
    wellnessData = newData;
    updateWellnessDataForMealPlanner(newData);
    updateWellnessDataForJourney(newData);
    updateWellnessDataForCalmSpace(newData); // Pass data to new module
    
    // Check if both data sources are ready, and if tips haven't been generated yet.
    if (!tipsHaveBeenGenerated && Object.keys(currentMealPlan).length > 0 && Object.keys(wellnessData).length > 0) {
        generateAllWellnessTips(); // Call the single, combined function
        tipsHaveBeenGenerated = true; // Mark as generated to prevent re-triggering
    }

    if (document.getElementById('content-symptom-tracker').classList.contains('active')) {
        updateDashboardUI();
    }
}

// This function is called whenever the meal plan changes in Firestore.
function onMealPlanUpdate(newPlan) {
    currentMealPlan = newPlan;
    
    // Check if both data sources are ready, and if tips haven't been generated yet.
    if (!tipsHaveBeenGenerated && Object.keys(wellnessData).length > 0 && Object.keys(currentMealPlan).length > 0) {
        generateAllWellnessTips(); // Call the single, combined function
        tipsHaveBeenGenerated = true; // Mark as generated to prevent re-triggering
    }

    updateDashboardUI();
}

export const loadAllDataForUser = (userId) => {
    // Reset the flag for a new user session/page load.
    tipsHaveBeenGenerated = false; 
    
    // Initialize all data listeners. The onUpdate functions above will handle the tip generation.
    initializeMealPlanner(userId, onMealPlanUpdate, wellnessData);
    initializeWellness(userId, onWellnessDataUpdate);
    initializeJourney(userId, wellnessData);
    initializeCalmSpace(userId, wellnessData); // Initialize new module
};

export const unloadAllData = () => {
    unloadMealPlanner();
    unloadWellness();
    unloadJourney();
    unloadCalmSpace(); // Unload new module
};


document.addEventListener('DOMContentLoaded', () => {
    if (configError) {
        document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Firebase configuration is missing. The app cannot start.</p>';
        return;
    }

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

function handleTabSwitch(activeTab) {
    const userId = getCurrentUserId();
    if (!userId) return;

    // Stop any calm space activities (like sound) if we switch away
    if (activeTab !== 'calm') {
        stopCalmSpaceActivities();
    }

    if (activeTab === 'symptom') {
        // If the chart instance doesn't exist yet, render it.
        if (!wellnessChart) { 
             renderWellnessChart();
        }
        // Always update the chart data and UI when switching to the tab.
        updateWellnessChartData();
        updateDashboardUI();
    }
}
