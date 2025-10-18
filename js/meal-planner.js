import { db } from './firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { generateAiMealPlan } from './api.js';
import { showLoader, hideLoader } from './ui.js';

// --- DOM Element Selection ---
const mealPlanGrid = document.getElementById('meal-plan-grid');
const generateMealPlanBtn = document.getElementById('generate-meal-plan-btn');
const mealPlanPromptInput = document.getElementById('meal-plan-prompt');
const mealPlanContainer = document.getElementById('meal-plan-container');

// Meal Modal Elements
const mealModal = document.getElementById('meal-modal');
const mealModalContent = document.getElementById('meal-modal-content');
const mealModalCloseBtn = document.getElementById('meal-modal-close-btn');
const mealModalTitle = document.getElementById('meal-modal-title');
const mealModalTextarea = document.getElementById('meal-modal-textarea');
const mealModalSaveBtn = document.getElementById('meal-modal-save-btn');

let currentMealPlan = {};
let currentEditingCell = null; // To keep track of which day/meal is being edited
let currentUserId = null;


/**
 * Renders the meal plan data into the HTML grid.
 * @param {object} plan - The meal plan object (e.g., { monday: { breakfast: '...' } }).
 */
function renderMealPlan(plan) {
    mealPlanGrid.innerHTML = ''; // Clear existing grid
    if (!plan || Object.keys(plan).length === 0) {
        mealPlanGrid.innerHTML = `<p class="text-center text-gray-500 col-span-4">No meal plan generated yet. Enter your preferences and click "Generate Plan".</p>`;
        return;
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];

    days.forEach(day => {
        meals.forEach(meal => {
            const cell = document.createElement('div');
            cell.className = 'bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer min-h-[100px] flex flex-col justify-between';
            cell.dataset.day = day;
            cell.dataset.meal = meal;

            const mealName = plan[day]?.[meal] || 'Click to add';
            
            cell.innerHTML = `
                <p class="text-sm font-semibold capitalize text-gray-600">${day.substring(0,3)} - ${meal}</p>
                <p class="text-gray-800 mt-1 text-sm flex-grow">${mealName}</p>
            `;
            
            cell.addEventListener('click', () => openMealModal(day, meal, mealName));
            mealPlanGrid.appendChild(cell);
        });
    });
}

/**
 * Opens the meal editing modal with the correct data.
 * @param {string} day - The day of the week.
 * @param {string} meal - The type of meal (e.g., 'breakfast').
 * @param {string} currentText - The current meal description.
 */
function openMealModal(day, meal, currentText) {
    currentEditingCell = { day, meal };
    mealModalTitle.textContent = `Edit ${meal.charAt(0).toUpperCase() + meal.slice(1)} for ${day.charAt(0).toUpperCase() + day.slice(1)}`;
    mealModalTextarea.value = currentText === 'Click to add' ? '' : currentText;
    
    mealModal.classList.remove('hidden');
    setTimeout(() => {
        mealModalContent.classList.remove('opacity-0', 'scale-95');
        mealModalContent.classList.add('opacity-100', 'scale-100');
    }, 10);
}

/**
 * Closes the meal editing modal.
 */
function closeMealModal() {
    mealModalContent.classList.add('opacity-0', 'scale-95');
    setTimeout(() => mealModal.classList.add('hidden'), 300);
}


/**
 * Saves the changes made in the meal modal to the local state and then to Firestore.
 */
async function saveMealChange() {
    if (!currentEditingCell || !currentUserId) return;

    const { day, meal } = currentEditingCell;
    const newText = mealModalTextarea.value.trim();

    // Update local state
    if (!currentMealPlan[day]) currentMealPlan[day] = {};
    currentMealPlan[day][meal] = newText;
    
    // Update UI immediately for responsiveness
    renderMealPlan(currentMealPlan);
    
    // Save to Firestore
    try {
        const userMealPlanRef = doc(db, 'mealPlans', currentUserId);
        await setDoc(userMealPlanRef, currentMealPlan);
        console.log("Meal plan updated in Firestore.");
    } catch (error) {
        console.error("Error saving meal plan:", error);
        // Optionally, show an error message to the user.
    }

    closeMealModal();
}

/**
 * Loads the user's meal plan from Firestore.
 */
async function loadMealPlan() {
    if (!currentUserId) return;
    showLoader(mealPlanContainer);
    try {
        const userMealPlanRef = doc(db, 'mealPlans', currentUserId);
        const docSnap = await getDoc(userMealPlanRef);
        if (docSnap.exists()) {
            currentMealPlan = docSnap.data();
        } else {
            console.log("No existing meal plan found for user. Creating a new one.");
            currentMealPlan = {};
        }
        renderMealPlan(currentMealPlan);
    } catch (error) {
        console.error("Error loading meal plan:", error);
    } finally {
        hideLoader(mealPlanContainer);
    }
}

/**
 * Handles the click event for generating a new AI meal plan.
 */
async function handleGeneratePlan() {
    const userPrompt = mealPlanPromptInput.value.trim();
    if (!userPrompt) {
        alert("Please enter your dietary needs or preferences.");
        return;
    }
    
    showLoader(mealPlanContainer);
    generateMealPlanBtn.disabled = true;

    try {
        const aiResponse = await generateAiMealPlan(userPrompt);
        const planObject = JSON.parse(aiResponse); // The API is configured to return JSON
        currentMealPlan = planObject;
        renderMealPlan(currentMealPlan);
        
        // Save the newly generated plan to Firestore
        if (currentUserId) {
            const userMealPlanRef = doc(db, 'mealPlans', currentUserId);
            await setDoc(userMealPlanRef, currentMealPlan);
        }
    } catch (error) {
        console.error("Error generating or parsing meal plan:", error);
        alert("Sorry, there was an issue generating the meal plan. Please try again.");
    } finally {
        hideLoader(mealPlanContainer);
        generateMealPlanBtn.disabled = false;
    }
}

/**
 * Initializes the meal planner functionality.
 * @param {string} userId - The current user's ID.
 */
export function initMealPlanner(userId) {
    if (!userId) {
        console.log("Meal Planner: User not logged in.");
        mealPlanContainer.innerHTML = '<p class="text-center text-gray-500">Please sign in to use the meal planner.</p>';
        return;
    }
    currentUserId = userId;

    // Setup event listeners
    generateMealPlanBtn.addEventListener('click', handleGeneratePlan);
    mealModalSaveBtn.addEventListener('click', saveMealChange);
    mealModalCloseBtn.addEventListener('click', closeMealModal);
    mealModal.addEventListener('click', (event) => {
        if (event.target === mealModal) closeMealModal();
    });

    // Load initial data
    loadMealPlan();
}