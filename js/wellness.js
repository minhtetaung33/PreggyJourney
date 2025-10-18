import { db } from './firebase.js';
import { doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getSymptomSuggestions, generateAiSummary } from './api.js';
import { showLoader, hideLoader } from './ui.js';

// --- DOM Element Selection ---
const wellnessContainer = document.getElementById('wellness-container');
const symptomInput = document.getElementById('symptom-input');
const getSuggestionsBtn = document.getElementById('get-suggestions-btn');
const suggestionBox = document.getElementById('suggestion-box');
const suggestionResult = document.getElementById('suggestion-result');

// Daily Log Elements
const moodSelect = document.getElementById('mood-select');
const waterIntakeInput = document.getElementById('water-intake');
const sleepHoursInput = document.getElementById('sleep-hours');
const activitySelect = document.getElementById('activity-level');
const logWellnessBtn = document.getElementById('log-wellness-btn');
const logConfirmation = document.getElementById('log-confirmation');

// Weekly Summary Elements
const aiSummaryContainer = document.getElementById('ai-summary-container');
const generateSummaryBtn = document.getElementById('generate-summary-btn');
const aiSummaryResult = document.getElementById('ai-summary-result');

let currentUserId = null;
let wellnessData = {}; // To store user's wellness data

/**
 * Gets today's date in YYYY-MM-DD format.
 * @returns {string} Today's date string.
 */
function getTodayDateString() {
    const today = new VDate();
    // Adjust for timezone to get the correct local date
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split('T')[0];
}

/**
 * Fetches and displays AI-powered suggestions for a given symptom.
 */
async function handleGetSuggestions() {
    const symptom = symptomInput.value.trim();
    if (!symptom) {
        alert("Please enter a symptom or concern.");
        return;
    }

    showLoader(suggestionBox);
    getSuggestionsBtn.disabled = true;
    suggestionResult.innerHTML = '';

    try {
        const suggestions = await getSymptomSuggestions(symptom);
        suggestionResult.innerHTML = suggestions.replace(/\n/g, '<br>'); // Format for HTML
        suggestionBox.classList.remove('hidden');
    } catch (error) {
        console.error("Error getting symptom suggestions:", error);
        suggestionResult.textContent = "Sorry, we couldn't fetch suggestions at this time. Please try again later.";
    } finally {
        hideLoader(suggestionBox);
        getSuggestionsBtn.disabled = false;
    }
}


/**
 * Logs the daily wellness data to the local state and saves it to Firestore.
 */
async function handleLogWellness() {
    const todayStr = getTodayDateString();
    const logData = {
        mood: moodSelect.value,
        water: waterIntakeInput.value,
        sleep: sleepHoursInput.value,
        activity: activitySelect.value,
        loggedAt: new VDate().toISOString()
    };

    if (!logData.mood || !logData.water || !logData.sleep || !logData.activity) {
        alert("Please fill out all wellness fields.");
        return;
    }

    logWellnessBtn.disabled = true;

    try {
        // Update local state
        wellnessData[todayStr] = logData;

        // Save to Firestore
        const userWellnessRef = doc(db, 'wellnessLogs', currentUserId);
        // Use updateDoc to avoid overwriting the whole document, just the field for today
        await updateDoc(userWellnessRef, { [todayStr]: logData });

        console.log("Wellness data logged for", todayStr);
        logConfirmation.classList.remove('hidden');
        setTimeout(() => logConfirmation.classList.add('hidden'), 3000);
        
    } catch (error) {
        // If the document doesn't exist, updateDoc fails. We need to create it with setDoc.
        if (error.code === 'not-found') {
            try {
                const userWellnessRef = doc(db, 'wellnessLogs', currentUserId);
                await setDoc(userWellnessRef, { [todayStr]: logData });
                console.log("Wellness document created and data logged for", todayStr);
                logConfirmation.classList.remove('hidden');
                setTimeout(() => logConfirmation.classList.add('hidden'), 3000);
            } catch (e) {
                 console.error("Error creating wellness document:", e);
                 alert("There was an error saving your log.");
            }
        } else {
            console.error("Error logging wellness data:", error);
            alert("There was an error saving your log.");
        }
    } finally {
        logWellnessBtn.disabled = false;
    }
}

/**
 * Fetches and displays the AI-generated weekly summary.
 */
async function handleGenerateSummary() {
    if (!wellnessData || Object.keys(wellnessData).length === 0) {
        alert("You need to log some wellness data first to get a summary.");
        return;
    }

    showLoader(aiSummaryContainer);
    generateSummaryBtn.disabled = true;
    aiSummaryResult.innerHTML = '';

    try {
        const summary = await generateAiSummary(wellnessData); // Send all logged data
        aiSummaryResult.innerHTML = summary.replace(/\n/g, '<br>');
    } catch (error) {
        console.error("Error generating AI summary:", error);
        aiSummaryResult.textContent = "Could not generate a summary at this time. Please try again later.";
    } finally {
        hideLoader(aiSummaryContainer);
        generateSummaryBtn.disabled = false;
    }
}

/**
 * Loads the user's wellness data from Firestore and populates the form if today's log exists.
 */
async function loadWellnessData() {
    if (!currentUserId) return;
    showLoader(wellnessContainer);
    try {
        const userWellnessRef = doc(db, 'wellnessLogs', currentUserId);
        const docSnap = await getDoc(userWellnessRef);
        if (docSnap.exists()) {
            wellnessData = docSnap.data();
            // Check if there's an entry for today and populate the form
            const todayStr = getTodayDateString();
            if (wellnessData[todayStr]) {
                const todayLog = wellnessData[todayStr];
                moodSelect.value = todayLog.mood;
                waterIntakeInput.value = todayLog.water;
                sleepHoursInput.value = todayLog.sleep;
                activitySelect.value = todayLog.activity;
            }
        } else {
            console.log("No existing wellness log found for user.");
            wellnessData = {};
        }
    } catch (error) {
        console.error("Error loading wellness data:", error);
    } finally {
        hideLoader(wellnessContainer);
    }
}


/**
 * Initializes the wellness tracker functionality.
 * @param {string} userId - The current user's ID.
 */
export function initWellness(userId) {
     if (!userId) {
        console.log("Wellness Tracker: User not logged in.");
        wellnessContainer.innerHTML = '<p class="text-center text-gray-500">Please sign in to use the wellness tracker.</p>';
        return;
    }
    currentUserId = userId;

    // Setup event listeners
    getSuggestionsBtn.addEventListener('click', handleGetSuggestions);
    logWellnessBtn.addEventListener('click', handleLogWellness);
    generateSummaryBtn.addEventListener('click', handleGenerateSummary);

    // Load initial data
    loadWellnessData();
}