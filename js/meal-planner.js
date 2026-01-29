import { doc, onSnapshot, setDoc, getDoc, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentUserId } from './auth.js';

// DOM Elements related to Meal Planner
const loadingSpinner = document.getElementById('loading-spinner');
const mealPlanGrid = document.getElementById('meal-plan-grid');
const modal = document.getElementById('meal-modal');
const modalTitle = document.getElementById('modal-title');
const modalSelect = document.getElementById('modal-meal-select');
const modalCloseBtn = document.getElementById('modal-close-btn');
const manageMealsBtn = document.getElementById('manage-meals-btn');
const manageMealsModal = document.getElementById('manage-meals-modal');
const manageModalTitle = document.getElementById('manage-modal-title');
const mealListContainer = document.getElementById('meal-list-container');
const newMealInput = document.getElementById('new-meal-input');
const addMealBtn = document.getElementById('add-meal-btn');
const addMealText = document.getElementById('add-meal-text');
const apiLoader = document.getElementById('api-loader');
const apiFeedback = document.getElementById('api-feedback');
const manageModalCloseBtn = document.getElementById('manage-modal-close-btn');
const editMealModal = document.getElementById('edit-meal-modal');
const editMealInput = document.getElementById('edit-meal-input');
const editModalCancelBtn = document.getElementById('edit-modal-cancel-btn');
const editModalSaveBtn = document.getElementById('edit-modal-save-btn');
const editMealText = document.getElementById('edit-meal-text');
const editApiLoader = document.getElementById('edit-api-loader');
const editApiFeedback = document.getElementById('edit-api-feedback');
const aiMealModal = document.getElementById('ai-meal-modal');
const aiModalTitle = document.getElementById('ai-modal-title');
const aiMealInitialView = document.getElementById('ai-meal-initial-view');
const cravingInput = document.getElementById('craving-input');
const generateFromCravingBtn = document.getElementById('generate-from-craving-btn');
const aiSuggestionBtn = document.getElementById('ai-suggestion-btn');
const aiMealPlanContainer = document.getElementById('ai-meal-plan-container');
const aiMealLoader = document.getElementById('ai-meal-loader');
const aiMealPlanDisplay = document.getElementById('ai-meal-plan-display');
const aiMealFeedback = document.getElementById('ai-meal-feedback');
const aiMealButtons = document.getElementById('ai-meal-buttons');
const aiMealRegenerateBtn = document.getElementById('ai-meal-regenerate-btn');
const aiMealSaveBtn = document.getElementById('ai-meal-save-btn');
const aiMealCloseBtn = document.getElementById('ai-meal-close-btn');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');
const weekDisplay = document.getElementById('week-display');

let mealPlanRef, mealOptionsRef, customMealNutrientsRef;
let unsubscribeMealPlan, unsubscribeMealOptions, unsubscribeCustomMealNutrients;

let dynamicMealOptions = {};
let customMealNutrients = {};
let currentMealPlanData = {};
let currentGeneratedPlan = null;
let currentDayForAI = null;
let lastCraving = null;
let wellnessDataForMealPlanner = {};
let currentDate = new Date();
let onMealPlanUpdateCallback;

const defaultMealPlan = {
    breakfast: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    lunch: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    snackAM: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    snackPM: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    dinner: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" }
};

const defaultMealOptions = {
    breakfast: ["Chicken rice porridge with ginger", "Oatmeal with banana and honey", "Toast with peanut butter + warm soy milk", "Fish congee with soft tofu", "Boiled egg + toast + orange juice"],
    lunch: ["Steamed rice + chicken + veggies", "Rice noodle soup with tofu and spinach", "Small pasta with tomato and ground turkey", "Rice + ginger fish + steamed broccoli", "Chicken porridge"],
    snack: ["Crackers + warm tea", "Banana or apple", "Yogurt cup", "Nuts (almond, cashew – small handful)", "Smoothie (banana + oats + milk)"],
    dinner: ["Chicken soup + rice + steamed veggies", "Tofu soup with mushroom", "Noodle soup with egg", "Rice porridge with fish", "Clear veggie soup + rice + boiled egg"]
};

// Updated nutrient data to include protein and carbs (scale 0-3)
const mealNutrients = {
    "Chicken rice porridge with ginger": { iron: 2, calcium: 1, folate: 1, fiber: 1, protein: 2, carbs: 2 },
    "Oatmeal with banana and honey": { iron: 1, calcium: 1, folate: 1, fiber: 3, protein: 1, carbs: 3 },
    "Toast with peanut butter + warm soy milk": { iron: 1, calcium: 2, folate: 2, fiber: 2, protein: 2, carbs: 2 },
    "Fish congee with soft tofu": { iron: 1, calcium: 2, folate: 1, fiber: 1, protein: 2, carbs: 2 },
    "Boiled egg + toast + orange juice": { iron: 2, calcium: 1, folate: 3, fiber: 2, protein: 2, carbs: 2 },
    "Steamed rice + chicken + veggies": { iron: 2, calcium: 1, folate: 2, fiber: 2, protein: 3, carbs: 2 },
    "Rice noodle soup with tofu and spinach": { iron: 3, calcium: 2, folate: 3, fiber: 2, protein: 2, carbs: 2 },
    "Small pasta with tomato and ground turkey": { iron: 2, calcium: 1, folate: 2, fiber: 2, protein: 2, carbs: 2 },
    "Rice + ginger fish + steamed broccoli": { iron: 2, calcium: 1, folate: 3, fiber: 3, protein: 3, carbs: 2 },
    "Chicken porridge": { iron: 2, calcium: 1, folate: 1, fiber: 1, protein: 2, carbs: 2 },
    "Crackers + warm tea": { iron: 0, calcium: 0, folate: 1, fiber: 1, protein: 0, carbs: 2 },
    "Banana or apple": { iron: 0, calcium: 0, folate: 1, fiber: 2, protein: 0, carbs: 2 },
    "Yogurt cup": { iron: 0, calcium: 3, folate: 0, fiber: 0, protein: 2, carbs: 1 },
    "Nuts (almond, cashew – small handful)": { iron: 1, calcium: 1, folate: 1, fiber: 2, protein: 2, carbs: 1 },
    "Smoothie (banana + oats + milk)": { iron: 1, calcium: 2, folate: 1, fiber: 3, protein: 1, carbs: 2 },
    "Chicken soup + rice + steamed veggies": { iron: 2, calcium: 1, folate: 2, fiber: 2, protein: 2, carbs: 1 },
    "Tofu soup with mushroom": { iron: 2, calcium: 2, folate: 2, fiber: 2, protein: 2, carbs: 1 },
    "Noodle soup with egg": { iron: 2, calcium: 1, folate: 2, fiber: 1, protein: 2, carbs: 2 },
    "Rice porridge with fish": { iron: 2, calcium: 1, folate: 1, fiber: 1, protein: 2, carbs: 2 },
    "Clear veggie soup + rice + boiled egg": { iron: 2, calcium: 1, folate: 2, fiber: 2, protein: 2, carbs: 1 }
};

// --- HELPER FUNCTIONS ---
function getWeekId(d) {
    d = new Date(d);
    d.setHours(0, 0, 0, 0); // Normalize time
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function formatWeekDisplay(d) {
    const monday = new Date(getWeekId(d) + 'T00:00:00Z');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    const mondayStr = monday.toLocaleDateString('en-US', options);
    const sundayStr = sunday.toLocaleDateString('en-US', options);

    return `${mondayStr} - ${sundayStr}`;
}

function getNutrientLevelInfo(level) {
    if (level === 3) return { text: 'Good', percentage: 100, color: 'text-green-300' };
    if (level === 2) return { text: 'Okay', percentage: 67, color: 'text-yellow-300' };
    if (level === 1) return { text: 'Low', percentage: 33, color: 'text-red-300' };
    if (level === 0) return { text: 'None', percentage: 0, color: 'text-gray-400' };
    return { text: 'N/A', percentage: 0, color: 'text-gray-400' };
}


// --- INITIALIZATION AND DATA LOADING ---
export function initializeMealPlanner(userId, onMealPlanUpdate, initialWellnessData) {
    onMealPlanUpdateCallback = onMealPlanUpdate;
    wellnessDataForMealPlanner = initialWellnessData;
    mealOptionsRef = doc(db, `users/${userId}/mealOptions`, 'v1');
    customMealNutrientsRef = doc(db, `users/${userId}/mealNutrients`, 'custom-v1');

    initializeMealOptions();
    initializeCustomMealNutrients();
    
    loadMealPlanForDate(userId, currentDate, onMealPlanUpdate);
    
    loadMealOptions();
    loadCustomMealNutrients();
    setupEventListeners();
}

function loadMealPlanForDate(userId, date, onMealPlanUpdate) {
    const weekId = getWeekId(date);
    weekDisplay.textContent = formatWeekDisplay(date);

    // Meal plans are now stored in a 'mealPlans' collection, with one doc per week
    mealPlanRef = doc(db, `users/${userId}/mealPlans`, weekId);
    
    loadMealPlan(onMealPlanUpdate);
}

export function updateWellnessDataForMealPlanner(newData) {
    wellnessDataForMealPlanner = newData;
}

async function initializeMealOptions() {
    if (!mealOptionsRef) return;
    const docSnap = await getDoc(mealOptionsRef);
    if (!docSnap.exists()) await setDoc(mealOptionsRef, defaultMealOptions);
}

async function initializeCustomMealNutrients() {
    if (!customMealNutrientsRef) return;
    const docSnap = await getDoc(customMealNutrientsRef);
    if (!docSnap.exists()) await setDoc(customMealNutrientsRef, {});
}

// --- NEW HELPER FUNCTION ---
// This function checks if the weekly meal plan doc exists and creates it if not.
// This is safer than creating it inside the onSnapshot listener.
async function initializeMealPlanDoc() {
    if (!mealPlanRef) return false;
    try {
        const docSnap = await getDoc(mealPlanRef);
        if (!docSnap.exists()) {
            await setDoc(mealPlanRef, defaultMealPlan);
        }
        return true;
    } catch (error) {
        console.error("Error initializing meal plan doc:", error);
        return false;
    }
}

// --- UPDATED loadMealPlan FUNCTION ---
async function loadMealPlan(onMealPlanUpdate) {
    if (!mealPlanRef) return;
    if (unsubscribeMealPlan) unsubscribeMealPlan();
    
    loadingSpinner.style.display = 'flex';
    mealPlanGrid.style.display = 'none';

    // Ensure the document exists *before* listening
    const docInitialized = await initializeMealPlanDoc();

    if (!docInitialized) {
        loadingSpinner.style.display = 'none';
        mealPlanGrid.style.display = 'grid';
        mealPlanGrid.innerHTML = '<p class="text-red-400 text-center col-span-8">Error: Could not initialize meal plan.</p>';
        return;
    }

    unsubscribeMealPlan = onSnapshot(mealPlanRef, (docSnap) => {
        loadingSpinner.style.display = 'none';
        mealPlanGrid.style.display = 'grid';
        // We can be more confident the doc exists, but still good to check
        let data = docSnap.exists() ? docSnap.data() : defaultMealPlan;
        currentMealPlanData = data;
        renderMealPlan(data);
        onMealPlanUpdate(data);
    }, (error) => {
        console.error("Error listening to meal plan:", error);
        loadingSpinner.style.display = 'none';
        mealPlanGrid.style.display = 'grid';
        mealPlanGrid.innerHTML = '<p class="text-red-400 text-center col-span-8">Error: Could not load meal plan data.</p>';
    });
}


function loadMealOptions() {
    if (!mealOptionsRef) return;
    if (unsubscribeMealOptions) unsubscribeMealOptions();
    unsubscribeMealOptions = onSnapshot(mealOptionsRef, (docSnap) => {
        dynamicMealOptions = docSnap.exists() ? docSnap.data() : { ...defaultMealOptions };
        if (manageMealsModal.classList.contains('active')) populateMealList();
    }, (error) => console.error("Error listening to meal options:", error));
}

function loadCustomMealNutrients() {
    if (!customMealNutrientsRef) return;
    if (unsubscribeCustomMealNutrients) unsubscribeCustomMealNutrients();
    unsubscribeCustomMealNutrients = onSnapshot(customMealNutrientsRef, (docSnap) => {
        customMealNutrients = docSnap.exists() ? docSnap.data() : {};
         if (manageMealsModal.classList.contains('active')) populateMealList();
    }, (error) => console.error("Error listening to custom meal nutrients:", error));
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
    modalCloseBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => e.target === modal && closeModal());
    modalSelect.addEventListener('change', (e) => { if (currentMeal && currentDay) { updateMealPlan(currentMeal, currentDay, e.target.value); } });
    manageMealsBtn.addEventListener('click', openManageMealsModal);
    manageModalCloseBtn.addEventListener('click', closeManageMealsModal);
    manageMealsModal.addEventListener('click', (e) => e.target === manageMealsModal && closeManageMealsModal());
    addMealBtn.addEventListener('click', handleAddMeal);
    newMealInput.addEventListener('keyup', (e) => e.key === 'Enter' && handleAddMeal());
    editModalCancelBtn.addEventListener('click', closeEditModal);
    editMealModal.addEventListener('click', (e) => e.target === editMealModal && closeEditModal());
    aiMealCloseBtn.addEventListener('click', closeAiMealPlannerModal);
    aiMealModal.addEventListener('click', (e) => e.target === aiMealModal && closeAiMealPlannerModal());
    aiMealRegenerateBtn.addEventListener('click', () => generateAiMealPlan(currentDayForAI, lastCraving));
    aiMealSaveBtn.addEventListener('click', handleSaveAiPlan);
    generateFromCravingBtn.addEventListener('click', () => { const cravingText = cravingInput.value.trim(); if(cravingText) generateAiMealPlan(currentDayForAI, cravingText); });
    aiSuggestionBtn.addEventListener('click', () => generateAiMealPlan(currentDayForAI, null));

    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        const userId = getCurrentUserId();
        if (userId) loadMealPlanForDate(userId, currentDate, onMealPlanUpdateCallback);
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        const userId = getCurrentUserId();
        if (userId) loadMealPlanForDate(userId, currentDate, onMealPlanUpdateCallback);
    });
}

// --- UI RENDERING ---
const mealMap = { breakfast: { title: "Breakfast" }, lunch: { title: "Lunch" }, snackAM: { title: "Snack (AM)", optionsKey: 'snack' }, snackPM: { title: "Snack (PM)", optionsKey: 'snack' }, dinner: { title: "Dinner" } };
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayTitles = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };

function renderMealPlan(data) {
    mealPlanGrid.innerHTML = '';
    mealPlanGrid.appendChild(createGridHeader(''));

    // Calculate dates for the current week to display
    const weekId = getWeekId(currentDate);
    const monday = new Date(weekId + 'T00:00:00Z'); // Use Z to denote UTC and avoid timezone shifts
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setUTCDate(monday.getUTCDate() + i);
        weekDates.push(date.getUTCDate()); // Get the day number (e.g., 20)
    }

    days.forEach((dayKey, index) => {
        const header = createGridHeader(dayTitles[dayKey]);
        header.classList.add('day-header');
        header.addEventListener('click', () => openAiMealPlannerModal(dayKey));
        mealPlanGrid.appendChild(header);
    });

    Object.keys(mealMap).forEach(mealKey => {
        const mealInfo = mealMap[mealKey];
        const mealData = data[mealKey] || {};
        mealPlanGrid.appendChild(createGridHeader(mealInfo.title));
        days.forEach(dayKey => {
            const selectedValue = mealData[dayKey] || '';
            const slot = document.createElement('div');
            slot.className = 'meal-slot';
            slot.textContent = selectedValue || 'Tap to select...';
            if (!selectedValue) slot.classList.add('empty');
            slot.dataset.meal = mealKey;
            slot.dataset.day = dayKey;
            slot.addEventListener('click', () => openModal(mealKey, dayKey, selectedValue));
            mealPlanGrid.appendChild(slot);
        });
    });

    // Add the date row at the bottom
    mealPlanGrid.appendChild(createGridHeader('')); // Empty cell for the meal title column
    weekDates.forEach(dateNum => {
        const dateCell = document.createElement('div');
        dateCell.className = 'grid-header text-sm text-gray-400 pt-0 pb-0';
        dateCell.textContent = dateNum;
        mealPlanGrid.appendChild(dateCell);
    });
}

function createGridHeader(text) {
    const header = document.createElement('div');
    header.className = 'grid-header';
    header.textContent = text;
    return header;
}


// --- MODAL AND MEAL MANAGEMENT LOGIC ---
async function updateMealPlan(meal, day, value) {
    if (!mealPlanRef) return;
    await updateDoc(mealPlanRef, { [`${meal}.${day}`]: value });
}

let currentMeal, currentDay, currentMealKeyForManage;

function openModal(mealKey, dayKey, currentValue) {
    currentMeal = mealKey;
    currentDay = dayKey;
    currentMealKeyForManage = mealMap[mealKey].optionsKey || mealKey;
    const mealInfo = mealMap[mealKey];
    modalTitle.textContent = `${mealInfo.title} - ${dayTitles[dayKey]}`;
    populateMealSelect(currentMealKeyForManage, currentValue);
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
}

function populateMealSelect(mealOptionsKey, currentValue) {
    modalSelect.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Select a meal...';
    defaultOption.value = '';
    modalSelect.appendChild(defaultOption);
    const options = dynamicMealOptions[mealOptionsKey] || [];
    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        if (optionText === currentValue) option.selected = true;
        modalSelect.appendChild(option);
    });
}

function closeModal() { modal.classList.remove('active'); setTimeout(() => modal.classList.add('hidden'), 300); }
function openManageMealsModal() { manageModalTitle.textContent = `Manage ${mealMap[currentMeal].title} Options`; populateMealList(); manageMealsModal.classList.remove('hidden'); setTimeout(() => manageMealsModal.classList.add('active'), 10); }
function closeManageMealsModal() { apiFeedback.classList.add('hidden'); newMealInput.value = ''; manageMealsModal.classList.remove('active'); setTimeout(() => manageMealsModal.classList.add('hidden'), 300); }

function populateMealList() {
    mealListContainer.innerHTML = '';
    const meals = dynamicMealOptions[currentMealKeyForManage] || [];
    const allNutrients = { ...mealNutrients, ...customMealNutrients };

    if (meals.length === 0) {
        mealListContainer.innerHTML = `<p class="text-center text-gray-400">No meals added yet.</p>`;
        return;
    }
    meals.forEach(meal => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg';
        const nutrients = allNutrients[meal] || { iron: '?', calcium: '?', folate: '?', fiber: '?', protein: '?', carbs: '?' };
        const ironInfo = getNutrientLevelInfo(nutrients.iron);
        const calciumInfo = getNutrientLevelInfo(nutrients.calcium);
        const folateInfo = getNutrientLevelInfo(nutrients.folate);
        const fiberInfo = getNutrientLevelInfo(nutrients.fiber);
        const proteinInfo = getNutrientLevelInfo(nutrients.protein);
        const carbsInfo = getNutrientLevelInfo(nutrients.carbs);

        // Updated HTML to include Protein and Carbs
        item.innerHTML = `
            <div class="flex-1 pr-2">
                <span class="font-semibold text-white">${meal}</span>
                <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mt-1.5 text-gray-300">
                    <span class="flex items-center" title="Iron"><svg class="w-3 h-3 mr-1 text-red-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path></svg>Iron: <span class="${ironInfo.color} font-semibold ml-1">${ironInfo.text}</span></span>
                    <span class="flex items-center" title="Calcium"><svg class="w-3 h-3 mr-1 text-blue-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.706-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 7.072l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z"></path></svg>Ca: <span class="${calciumInfo.color} font-semibold ml-1">${calciumInfo.text}</span></span>
                    <span class="flex items-center" title="Folate"><svg class="w-3 h-3 mr-1 text-green-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>Folate: <span class="${folateInfo.color} font-semibold ml-1">${folateInfo.text}</span></span>
                    <span class="flex items-center" title="Fiber"><svg class="w-3 h-3 mr-1 text-yellow-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>Fiber: <span class="${fiberInfo.color} font-semibold ml-1">${fiberInfo.text}</span></span>
                    <span class="flex items-center" title="Protein"><svg class="w-3 h-3 mr-1 text-orange-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>Pro: <span class="${proteinInfo.color} font-semibold ml-1">${proteinInfo.text}</span></span>
                    <span class="flex items-center" title="Carbs"><svg class="w-3 h-3 mr-1 text-teal-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>Carbs: <span class="${carbsInfo.color} font-semibold ml-1">${carbsInfo.text}</span></span>
                </div>
            </div>
            <div class="flex items-center">
                <button class="icon-btn edit-btn" data-meal="${meal}"><svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg></button>
                <button class="icon-btn delete-btn" data-meal="${meal}"><svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>`;
        item.querySelector('.delete-btn').addEventListener('click', () => deleteMeal(currentMealKeyForManage, meal));
        item.querySelector('.edit-btn').addEventListener('click', () => openEditModal(currentMealKeyForManage, meal));
        mealListContainer.appendChild(item);
    });
}


async function deleteMeal(key, mealToDelete) {
    const currentMeals = [...(dynamicMealOptions[key] || [])];
    const newMeals = currentMeals.filter(m => m !== mealToDelete);
    await updateDoc(mealOptionsRef, { [key]: newMeals });
    if (customMealNutrientsRef) {
        await updateDoc(customMealNutrientsRef, { [mealToDelete]: deleteField() });
    }
}

let saveEditHandler = null; 
function openEditModal(key, oldMeal) {
    editMealInput.value = oldMeal;
    editApiFeedback.classList.add('hidden');
    if (saveEditHandler) { editModalSaveBtn.removeEventListener('click', saveEditHandler); }
    saveEditHandler = () => handleSaveEdit(key, oldMeal);
    editModalSaveBtn.addEventListener('click', saveEditHandler);
    editMealModal.classList.remove('hidden');
    setTimeout(() => editMealModal.classList.add('active'), 10);
}

function closeEditModal() {
    if (saveEditHandler) { editModalSaveBtn.removeEventListener('click', saveEditHandler); saveEditHandler = null; }
    editMealModal.classList.remove('active');
    setTimeout(() => editMealModal.classList.add('hidden'), 300);
}

async function handleSaveEdit(key, oldMeal) {
    const newMeal = editMealInput.value.trim();
    if (!newMeal || newMeal === oldMeal) return;
    editApiLoader.classList.remove('hidden'); editMealText.textContent = 'Checking...'; editModalSaveBtn.disabled = true; editApiFeedback.classList.add('hidden');
    // Updated system prompt to include protein and carbs
    const systemPrompt = `You are a helpful and friendly prenatal nutritionist. Your goal is to evaluate if a meal is healthy and suitable for a pregnant woman. If the meal is suitable, provide an estimated nutritional profile with integer values from 0 (none) to 3 (high) for iron, calcium, folate, fiber, protein, and carbs. Your response must be ONLY a valid JSON object matching this structure: { "isSuitable": boolean, "mealName": string, "reasoning": string, "alternatives": string[], "nutrients": { "iron": number, "calcium": number, "folate": number, "fiber": number, "protein": number, "carbs": number } }. If the meal is not suitable, set isSuitable to false and explain why.`;
    const userQuery = `Evaluate this meal: "${newMeal}"`;
    const apiKey = "AIzaSyD7CtFP-DtypRWk2CQPFCsoP8EiBJjsCMM"; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { 
        contents: [{ parts: [{ text: userQuery }] }], 
        systemInstruction: { parts: [{ text: systemPrompt }] }, 
        generationConfig: { responseMimeType: "application/json" } 
    };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json(); const text = result.candidates[0].content.parts[0].text; const data = JSON.parse(text);
        if (data.isSuitable) {
            const currentMeals = [...(dynamicMealOptions[key] || [])];
            if (currentMeals.includes(data.mealName) && data.mealName !== oldMeal) { showApiFeedback(`"${data.mealName}" is already on the list.`, 'warning', editApiFeedback); return; }
            const mealIndex = currentMeals.indexOf(oldMeal);
            if (mealIndex > -1) { 
                currentMeals[mealIndex] = data.mealName; 
                await updateDoc(mealOptionsRef, { [key]: currentMeals }); 
                await updateMealPlanGrid(oldMeal, data.mealName);
                if (customMealNutrientsRef && data.nutrients) {
                    let nutrientUpdate = { [data.mealName]: data.nutrients };
                    if (oldMeal !== data.mealName) nutrientUpdate[oldMeal] = deleteField();
                    await updateDoc(customMealNutrientsRef, nutrientUpdate);
                }
                closeEditModal(); 
            }
        } else {
            let feedback = `<strong>That might not be the best choice.</strong><br>${data.reasoning}`;
            if (data.alternatives && data.alternatives.length > 0) { feedback += `<br>Maybe try: ${data.alternatives.join(' or ')}.`; }
            showApiFeedback(feedback, 'error', editApiFeedback);
        }
    } catch (error) { console.error("Gemini API call failed during edit:", error); showApiFeedback("Sorry, I couldn't verify that meal right now. Please try again.", 'error', editApiFeedback); } finally { editApiLoader.classList.add('hidden'); editMealText.textContent = 'Check & Save'; editModalSaveBtn.disabled = false; }
}

async function updateMealPlanGrid(oldMealName, newMealName) {
    if (!mealPlanRef) return;
    const mealPlanSnap = await getDoc(mealPlanRef);
    if (!mealPlanSnap.exists()) return;
    const currentPlan = mealPlanSnap.data(); const updates = {}; let hasUpdates = false;
    for (const mealKey in currentPlan) { for (const dayKey in currentPlan[mealKey]) { if (currentPlan[mealKey][dayKey] === oldMealName) { updates[`${mealKey}.${dayKey}`] = newMealName; hasUpdates = true; } } }
    if (hasUpdates) { await updateDoc(mealPlanRef, updates); }
}

async function handleAddMeal() {
    const userMeal = newMealInput.value.trim(); if (!userMeal) return;
    apiLoader.classList.remove('hidden'); addMealText.textContent = 'Checking...'; addMealBtn.disabled = true; apiFeedback.classList.add('hidden');
    // Updated system prompt to include protein and carbs
    const systemPrompt = `You are a helpful and friendly prenatal nutritionist. Your goal is to evaluate if a meal is healthy and suitable for a pregnant woman. If the meal is suitable, provide an estimated nutritional profile with integer values from 0 (none) to 3 (high) for iron, calcium, folate, fiber, protein, and carbs. Your response must be ONLY a valid JSON object matching this structure: { "isSuitable": boolean, "mealName": string, "reasoning": string, "alternatives": string[], "nutrients": { "iron": number, "calcium": number, "folate": number, "fiber": number, "protein": number, "carbs": number } }. If the meal is not suitable, set isSuitable to false and explain why.`;
    const userQuery = `Evaluate this meal: "${userMeal}"`; const apiKey = "AIzaSyD7CtFP-DtypRWk2CQPFCsoP8EiBJjsCMM"; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = { 
        contents: [{ parts: [{ text: userQuery }] }], 
        systemInstruction: { parts: [{ text: systemPrompt }] }, 
        generationConfig: { responseMimeType: "application/json" } 
    };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json(); const text = result.candidates[0].content.parts[0].text; const data = JSON.parse(text);
        if (data.isSuitable) {
            const currentMeals = [...(dynamicMealOptions[currentMealKeyForManage] || [])];
            if (!currentMeals.includes(data.mealName)) { 
                currentMeals.push(data.mealName); 
                await updateDoc(mealOptionsRef, { [currentMealKeyForManage]: currentMeals });
                if (customMealNutrientsRef && data.nutrients) {
                    await updateDoc(customMealNutrientsRef, { [data.mealName]: data.nutrients });
                }
                newMealInput.value = ''; 
                showApiFeedback(`Success! "${data.mealName}" was added.`, 'success', apiFeedback);
            } else { showApiFeedback(`"${data.mealName}" is already on the list.`, 'warning', apiFeedback); }
        } else {
            let feedback = `<strong>That might not be the best choice.</strong><br>${data.reasoning}`;
            if (data.alternatives && data.alternatives.length > 0) { feedback += `<br>Maybe try: ${data.alternatives.join(' or ')}.`; }
            showApiFeedback(feedback, 'error', apiFeedback);
        }
    } catch (error) { console.error("Gemini API call failed:", error); showApiFeedback("Sorry, I couldn't verify that meal right now. Please try again.", 'error', apiFeedback); } finally { apiLoader.classList.add('hidden'); addMealText.textContent = 'Check & Add Meal'; addMealBtn.disabled = false; }
}

function showApiFeedback(message, type, element) {
    element.innerHTML = message; element.className = 'text-sm p-3 rounded-md bg-opacity-20';
    if (type === 'success') element.classList.add('bg-green-500', 'text-green-200'); else if (type === 'error') element.classList.add('bg-red-500', 'text-red-200'); else if (type === 'warning') element.classList.add('bg-yellow-500', 'text-yellow-200');
    element.classList.remove('hidden');
}

// --- AI MEAL PLANNER LOGIC ---
function openAiMealPlannerModal(dayKey) {
    currentDayForAI = dayKey;
    lastCraving = null;
    aiModalTitle.textContent = `AI Meal Plan for ${dayTitles[dayKey]}`;
    aiMealInitialView.classList.remove('hidden');
    aiMealPlanContainer.classList.add('hidden');
    aiMealButtons.classList.add('hidden');
    cravingInput.value = '';
    aiMealModal.classList.remove('hidden');
    setTimeout(() => aiMealModal.classList.add('active'), 10);
}

function closeAiMealPlannerModal() {
    aiMealModal.classList.remove('active');
    setTimeout(() => aiMealModal.classList.add('hidden'), 300);
}

async function generateAiMealPlan(dayKey, craving) {
    currentGeneratedPlan = null;
    lastCraving = craving; 
    aiMealInitialView.classList.add('hidden');
    aiMealPlanContainer.classList.remove('hidden');
    aiMealLoader.classList.remove('hidden');
    aiMealPlanDisplay.classList.add('hidden');
    aiMealFeedback.classList.add('hidden');
    aiMealButtons.classList.add('hidden');
    const pregnancyStartDate = new Date(wellnessDataForMealPlanner.pregnancyStartDate);
    const today = new Date();
    const diffTime = Math.abs(today - pregnancyStartDate);
    const pregnancyWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    const breakfastOpts = dynamicMealOptions.breakfast || [];
    const lunchOpts = dynamicMealOptions.lunch || [];
    const snackOpts = dynamicMealOptions.snack || [];
    const dinnerOpts = dynamicMealOptions.dinner || [];
    const cravingText = craving ? `The user's specific craving today is "${craving}". Please try to incorporate this.` : "The user has not specified a craving, so create a generally balanced and appealing plan.";
    
    // Updated system prompt to include protein and carbs in the example summary
    const systemPrompt = `You are an expert prenatal nutritionist creating a one-day meal plan for a woman in week ${pregnancyWeek} of her pregnancy.
Create a complete, balanced, and varied one-day meal plan. ${cravingText}
You can use the user's 'Available meal options' or invent new, healthy suggestions.
Your response MUST be ONLY a valid JSON object.
The object must have a top-level key "plan". The "plan" key's value must be an object containing exactly five keys: "breakfast", "snackAM", "lunch", "snackPM", and "dinner".
Each of these five keys must have an object as its value, containing "name" (string) and "calories" (number).
The response must also include top-level keys for "totalCalories" (number), "nutritionSummary" (an object with nutrient statuses like "iron": "Good"), and "feedback" (string).

Example structure:
{
  "plan": {
    "breakfast": { "name": "Oatmeal with berries", "calories": 350 },
    "snackAM": { "name": "Apple slices with almond butter", "calories": 180 },
    "lunch": { "name": "Grilled chicken salad", "calories": 500 },
    "snackPM": { "name": "Greek yogurt with honey", "calories": 150 },
    "dinner": { "name": "Baked salmon with quinoa", "calories": 600 }
  },
  "totalCalories": 1780,
  "nutritionSummary": { "iron": "Good", "calcium": "Okay", "folate": "Good", "fiber": "Good", "protein": "Good", "carbs": "Okay" },
  "feedback": "This plan provides a good balance of nutrients, focusing on your craving for salmon."
}`;

    let userQuery = `Available meal options:\n- Breakfast: [${breakfastOpts.join(', ')}]\n- Lunch: [${lunchOpts.join(', ')}]\n- Snack: [${snackOpts.join(', ')}]\n- Dinner: [${dinnerOpts.join(', ')}]\n\nGenerate a new, unique meal plan for a user in week ${pregnancyWeek}.`;
    if(craving) userQuery += ` The user is craving: "${craving}".`
    const apiKey = "AIzaSyD7CtFP-DtypRWk2CQPFCsoP8EiBJjsCMM";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
    };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json(); const text = result.candidates[0].content.parts[0].text; const data = JSON.parse(text);
        currentGeneratedPlan = data;
        displayAiMealPlan(data);
    } catch (error) {
        console.error("AI Meal Plan generation failed:", error);
        aiMealPlanDisplay.innerHTML = `<p class="text-center text-red-300">Sorry, something went wrong while generating the meal plan. Please try again.</p>`;
    } finally {
        aiMealLoader.classList.add('hidden');
        aiMealPlanDisplay.classList.remove('hidden');
        aiMealButtons.classList.remove('hidden');
    }
}

function displayAiMealPlan(data) {
    const { plan, feedback, totalCalories } = data;
    
    // Check if 'plan' exists. If not, the API response was malformed.
    if (!plan) {
         aiMealPlanDisplay.innerHTML = `<p class="text-center text-red-300">Sorry, the AI returned an invalid plan. Please try generating again.</p>`;
         console.error("Invalid AI plan data received:", data);
         return;
    }

    aiMealPlanDisplay.innerHTML = `
        <div class="p-3 bg-white/5 rounded-lg flex justify-between items-center"><span><strong>Breakfast:</strong> ${plan.breakfast?.name || 'N/A'}</span> <span class="text-sm font-semibold text-purple-300">${plan.breakfast?.calories || 0} kcal</span></div>
        <div class="p-3 bg-white/5 rounded-lg flex justify-between items-center"><span><strong>Snack (AM):</strong> ${plan.snackAM?.name || 'N/A'}</span> <span class="text-sm font-semibold text-purple-300">${plan.snackAM?.calories || 0} kcal</span></div>
        <div class="p-3 bg-white/5 rounded-lg flex justify-between items-center"><span><strong>Lunch:</strong> ${plan.lunch?.name || 'N/A'}</span> <span class="text-sm font-semibold text-purple-300">${plan.lunch?.calories || 0} kcal</span></div>
        <div class="p-3 bg-white/5 rounded-lg flex justify-between items-center"><span><strong>Snack (PM):</strong> ${plan.snackPM?.name || 'N/A'}</span> <span class="text-sm font-semibold text-purple-300">${plan.snackPM?.calories || 0} kcal</span></div>
        <div class="p-3 bg-white/5 rounded-lg flex justify-between items-center"><span><strong>Dinner:</strong> ${plan.dinner?.name || 'N/A'}</span> <span class="text-sm font-semibold text-purple-300">${plan.dinner?.calories || 0} kcal</span></div>
        <div class="mt-4 p-3 bg-white/10 rounded-lg text-center"><strong>Total Estimated Calories:</strong> <span class="font-bold text-lg text-purple-300">${totalCalories || 0} kcal</span></div>
    `;
    if(feedback) {
        aiMealFeedback.textContent = feedback;
        aiMealFeedback.classList.remove('hidden');
    }
}

async function handleSaveAiPlan() {
    if (!currentGeneratedPlan || !currentDayForAI || !currentGeneratedPlan.plan) return;
    const updates = {}; const plan = currentGeneratedPlan.plan;
    if (plan.breakfast?.name) updates[`breakfast.${currentDayForAI}`] = plan.breakfast.name;
    if (plan.lunch?.name) updates[`lunch.${currentDayForAI}`] = plan.lunch.name;
    if (plan.snackAM?.name) updates[`snackAM.${currentDayForAI}`] = plan.snackAM.name;
    if (plan.snackPM?.name) updates[`snackPM.${currentDayForAI}`] = plan.snackPM.name;
    if (plan.dinner?.name) updates[`dinner.${currentDayForAI}`] = plan.dinner.name;
    if (Object.keys(updates).length > 0) await updateDoc(mealPlanRef, updates);

    if (currentGeneratedPlan.nutritionSummary) {
        const dailyNutritionUpdate = { ...wellnessDataForMealPlanner.dailyNutrition };
        dailyNutritionUpdate[currentDayForAI] = currentGeneratedPlan.nutritionSummary;
        await setDoc(doc(db, `users/${getCurrentUserId()}/wellness`, 'daily'), { dailyNutrition: dailyNutritionUpdate }, { merge: true });
    }
    closeAiMealPlannerModal();
}

// --- UTILITY AND CLEANUP ---
export function unloadMealPlanner() {
    if (unsubscribeMealPlan) unsubscribeMealPlan();
    if (unsubscribeMealOptions) unsubscribeMealOptions();
    if (unsubscribeCustomMealNutrients) unsubscribeCustomMealNutrients();
}

export function getCurrentMealPlan() {
    return currentMealPlanData;
}

export function getMealNutrients() {
    return { ...mealNutrients, ...customMealNutrients };
}
