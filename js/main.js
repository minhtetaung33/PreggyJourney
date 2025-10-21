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

function onWellnessDataUpdate(newData) {
    wellnessData = newData;
    updateWellnessDataForMealPlanner(newData);
    updateWellnessDataForJourney(newData);
    if (document.getElementById('content-meal-plan').classList.contains('active')) {
         updateAllMealPlannerTips();
    }
    if (document.getElementById('content-symptom-tracker').classList.contains('active')) {
        updateDashboardUI();
    }
}

function onMealPlanUpdate(newPlan) {
    currentMealPlan = newPlan;
    updateDashboardUI();
}

export const loadAllDataForUser = (userId) => {
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

    if (activeTab === 'meal') {
        updateAllMealPlannerTips();
    } else if (activeTab === 'symptom') {
        // If the chart instance doesn't exist yet, render it.
        if (!wellnessChart) { 
             renderWellnessChart();
        }
        // Always update the chart data and UI when switching to the tab.
        updateWellnessChartData();
        updateDashboardUI();
    }
}

async function updateAllMealPlannerTips() {
    // Awaiting each function ensures they run one after the other.
    await updatePartnerTips();
    await updateHydrationAndSnacks();
    await updatePartnerAvoidTips();
    await updateHydrationAvoidTips();
}
