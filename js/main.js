import { configError } from './firebase.js';
import { setupAuthentication, getCurrentUserId } from './auth.js';
import { setupTabs } from './ui.js';
import { initializeMealPlanner, unloadMealPlanner, updateWellnessDataForMealPlanner } from './meal-planner.js';
import { 
    initializeWellness, 
    unloadWellness, 
    updatePartnerTips, 
    updateHydrationAndSnacks, 
    updatePartnerAvoidTips, 
    updateHydrationAvoidTips, 
    renderWellnessChart, 
    updateWellnessChartData, 
    updateDashboardUI,
    wellnessChart // Import the chart instance
} from './wellness.js';
import { initializeJourney, unloadJourney, updateWellnessDataForJourney } from './journey.js';

let wellnessData = {};
let currentMealPlan = {};
let tipsHaveBeenGenerated = false;

// This function is called whenever wellness data (mood, energy, etc.) changes in Firestore.
function onWellnessDataUpdate(newData) {
    wellnessData = newData;
    updateWellnessDataForMealPlanner(newData);
    updateWellnessDataForJourney(newData);
    
    // The main data is ready, if tips haven't been generated yet, generate them now.
    if (!tipsHaveBeenGenerated && Object.keys(currentMealPlan).length > 0) {
        updateAllMealPlannerTips();
        tipsHaveBeenGenerated = true; // Mark as generated to prevent re-triggering
    }

    if (document.getElementById('content-symptom-tracker').classList.contains('active')) {
        updateDashboardUI();
    }
}

// This function is called whenever the meal plan changes in Firestore.
function onMealPlanUpdate(newPlan) {
    currentMealPlan = newPlan;
    
    // The meal plan data is ready, if tips haven't been generated yet, generate them now.
    if (!tipsHaveBeenGenerated && Object.keys(wellnessData).length > 0) {
        updateAllMealPlannerTips();
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
};

export const unloadAllData = () => {
    unloadMealPlanner();
    unloadWellness();
    unloadJourney();
};


document.addEventListener('DOMContentLoaded', () => {
    if (configError) {
        document.body.innerHTML = '<p style="color: red; text-align: center; margin-top: 50px;">Firebase configuration is missing. The app cannot start.</p>';
        return;
    }

    setupAuthentication();
    setupTabs(handleTabSwitch);
});

function handleTabSwitch(activeTab) {
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
}

// A helper function to call all four tip generation functions at once.
function updateAllMealPlannerTips(){
    console.log("Generating AI tips on page load...");
    updatePartnerTips();
    updateHydrationAndSnacks();
    updatePartnerAvoidTips();
    updateHydrationAvoidTips();
}
