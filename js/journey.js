import { db } from './firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getJourneyInfoForWeek } from './api.js';
import { showLoader, hideLoader } from './ui.js';

// --- DOM Element Selection ---
const journeyContainer = document.getElementById('journey-container');
const dueDateInput = document.getElementById('due-date');
const saveDueDateBtn = document.getElementById('save-due-date-btn');
const dueDateConfirmation = document.getElementById('due-date-confirmation');
const journeyContent = document.getElementById('journey-content');
const journeyWeekTitle = document.getElementById('journey-week-title');
const journeyInfo = document.getElementById('journey-info');

let currentUserId = null;
let userProfile = {}; // To store user data like due date

/**
 * Calculates the current week of pregnancy based on a due date.
 * Assumes a 40-week pregnancy.
 * @param {string} dueDateString - The due date in YYYY-MM-DD format.
 * @returns {number|null} The current week of pregnancy or null if the date is invalid/past.
 */
function calculateCurrentWeek(dueDateString) {
    if (!dueDateString) return null;

    const dueDate = new Date(dueDateString);
    // Add a day to the due date to correctly handle timezone issues and include the due date itself
    dueDate.setDate(dueDate.getDate() + 1);

    const today = new Date();
    if (today > dueDate) return 40; // If past due date, show final week info

    const conceptionDate = new Date(dueDate.getTime());
    conceptionDate.setDate(dueDate.getDate() - 280); // 40 weeks * 7 days

    const diffTime = today - conceptionDate;
    if (diffTime < 0) return 1; // If conception is in the future, default to week 1

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.ceil(diffDays / 7);

    return currentWeek > 40 ? 40 : currentWeek;
}

/**
 * Fetches and displays AI-powered information for the current week of pregnancy.
 */
async function displayJourneyInfo() {
    const week = calculateCurrentWeek(userProfile.dueDate);

    if (!week) {
        journeyWeekTitle.textContent = "Your Journey";
        journeyInfo.innerHTML = `<p class="text-gray-600">Please set your estimated due date above to get personalized weekly information about your pregnancy journey.</p>`;
        return;
    }

    journeyWeekTitle.textContent = `You are in Week ${week}`;
    showLoader(journeyContent);
    journeyInfo.innerHTML = '';

    try {
        const info = await getJourneyInfoForWeek(week);
        journeyInfo.innerHTML = info.replace(/\n/g, '<br>'); // Format for HTML
    } catch (error) {
        console.error("Error getting journey info:", error);
        journeyInfo.innerHTML = `<p class="text-red-500">Sorry, we couldn't fetch information for this week. Please try again later.</p>`;
    } finally {
        hideLoader(journeyContent);
    }
}

/**
 * Saves the user's due date to their profile in Firestore.
 */
async function handleSaveDueDate() {
    const dueDate = dueDateInput.value;
    if (!dueDate) {
        alert("Please select a valid due date.");
        return;
    }

    saveDueDateBtn.disabled = true;
    userProfile.dueDate = dueDate;

    try {
        const userProfileRef = doc(db, 'userProfiles', currentUserId);
        await setDoc(userProfileRef, userProfile, { merge: true }); // Merge to not overwrite other profile data
        
        dueDateConfirmation.classList.remove('hidden');
        setTimeout(() => dueDateConfirmation.classList.add('hidden'), 3000);

        // After saving, update the displayed info
        await displayJourneyInfo();
        
    } catch (error) {
        console.error("Error saving due date:", error);
        alert("There was an error saving your due date.");
    } finally {
        saveDueDateBtn.disabled = false;
    }
}

/**
 * Loads the user's profile, including their due date, from Firestore.
 */
async function loadUserProfile() {
    if (!currentUserId) return;
    showLoader(journeyContainer);
    try {
        const userProfileRef = doc(db, 'userProfiles', currentUserId);
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
            userProfile = docSnap.data();
            if (userProfile.dueDate) {
                dueDateInput.value = userProfile.dueDate;
            }
        } else {
            console.log("No user profile found. A new one will be created.");
            userProfile = {};
        }

        // Display info based on loaded data
        await displayJourneyInfo();

    } catch (error) {
        console.error("Error loading user profile:", error);
    } finally {
        hideLoader(journeyContainer);
    }
}

/**
 * Initializes the journey tab functionality.
 * @param {string} userId - The current user's ID.
 */
export function initJourney(userId) {
    if (!userId) {
        console.log("Journey Tab: User not logged in.");
        journeyContainer.innerHTML = '<p class="text-center text-gray-500">Please sign in to track your journey.</p>';
        return;
    }
    currentUserId = userId;

    // Setup event listeners
    saveDueDateBtn.addEventListener('click', handleSaveDueDate);

    // Load initial data
    loadUserProfile();
}