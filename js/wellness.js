import { doc, onSnapshot, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentMealPlan, getMealNutrients } from './meal-planner.js';
import { getCurrentUserId } from "./auth.js";

// DOM Elements
const symptomInput = document.getElementById('symptom-input');
const symptomCheckBtn = document.getElementById('symptom-check-btn');
const symptomBtnText = document.getElementById('symptom-btn-text');
const symptomLoader = document.getElementById('symptom-loader');
const symptomResponseEl = document.getElementById('symptom-response');
const hydrationProgress = document.getElementById('hydration-progress');
const hydrationText = document.getElementById('hydration-text');
const hydrationPlusBtn = document.getElementById('hydration-plus');
const hydrationMinusBtn = document.getElementById('hydration-minus');
const babyGrowthSnapshotEl = document.getElementById('baby-growth-snapshot');
const moodLogButtons = document.getElementById('mood-log-buttons');
const energyLogButtons = document.getElementById('energy-log-buttons');
const babyGrowthCard = document.getElementById('baby-growth-card');
const startDateModal = document.getElementById('start-date-modal');
const startDateInput = document.getElementById('start-date-input');
const endDateInput = document.getElementById('end-date-input');
const startDateModalCancelBtn = document.getElementById('start-date-modal-cancel-btn');
const startDateModalSaveBtn = document.getElementById('start-date-modal-save-btn');
const sleepMonitorCard = document.getElementById('sleep-monitor-card');
const sleepModal = document.getElementById('sleep-modal');
const sleepScheduleContainer = document.getElementById('sleep-schedule-container');
const sleepModalCancelBtn = document.getElementById('sleep-modal-cancel-btn');
const sleepModalSaveBtn = document.getElementById('sleep-modal-save-btn');
const manageSupplementsBtnHeader = document.getElementById('manage-supplements-btn-header');
const nutritionHistoryBtn = document.getElementById('nutrition-history-btn');
const nutritionHistoryModal = document.getElementById('nutrition-history-modal');
const nutritionHistoryContainer = document.getElementById('nutrition-history-container');
const nutritionHistoryCloseBtn = document.getElementById('nutrition-history-close-btn');
const nutritionHistoryWeekDisplay = document.getElementById('nutrition-history-week-display');
const nutritionHistoryPrevBtn = document.getElementById('nutrition-history-prev-week-btn');
const nutritionHistoryNextBtn = document.getElementById('nutrition-history-next-week-btn');
const manageSupplementsModal = document.getElementById('manage-supplements-modal');
const supplementListContainer = document.getElementById('supplement-list-container');
const newSupplementInput = document.getElementById('new-supplement-input');
const addSupplementBtn = document.getElementById('add-supplement-btn');
const addSupplementText = document.getElementById('add-supplement-text');
const supplementApiLoader = document.getElementById('supplement-api-loader');
const supplementApiFeedback = document.getElementById('supplement-api-feedback');
const manageSupplementsCloseBtn = document.getElementById('manage-supplements-close-btn');
const dailySupplementsList = document.getElementById('daily-supplements-list');

let wellnessDataRef, symptomTrackerCollectionRef, userSupplementsRef, supplementNutrientsRef;
let unsubscribeWellnessData, unsubscribeUserSupplements, unsubscribeSupplementNutrients, unsubscribeSupplementLog;
let wellnessData = {};
export let wellnessChart = null; // Export the chart instance
let userSupplements = [];
let supplementNutrients = {};
let nutritionHistoryCurrentDate = new Date();
let supplementLogDate = new Date();


const defaultWellnessData = {
    pregnancyStartDate: '2025-08-01',
    pregnancyEndDate: '',
    dailyTip: "Stretch your legs for 5 minutes every hour to reduce swelling.",
    dailyNutrition: {},
    dailySupplements: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    mood: {
        emoji: "😊",
        level: "Happy",
        aiInsight: "Glad you're feeling happy! Embrace the positive energy today."
    },
    sleep: {
        monday: { sleep: '22:00', wake: '06:30' },
        tuesday: { sleep: '22:00', wake: '06:30' },
        wednesday: { sleep: '22:00', wake: '06:30' },
        thursday: { sleep: '22:00', wake: '06:30' },
        friday: { sleep: '22:30', wake: '07:00' },
        saturday: { sleep: '23:00', wake: '07:30' },
        sunday: { sleep: '22:30', wake: '07:30' }
    },
    water: {
        intake: 6,
        goal: 10
    },
    energy: {
        level: 'Moderate',
        color: 'text-green-400'
    },
    weeklyLog: {
        monday: { mood: '🙂', energy: 3 },
        tuesday: { mood: '😐', energy: 2 },
        wednesday: { mood: '😐', energy: 2 },
        thursday: { mood: '🙂', energy: 3 },
        friday: { mood: '😊', energy: 4 },
        saturday: { mood: '🥰', energy: 5 },
        sunday: { mood: '😊', energy: 4 }
    }
};

const defaultMealPlan = {
    breakfast: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    lunch: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    snackAM: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    snackPM: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    dinner: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" }
};

const wellnessTipsByWeek = {
    5: "Morning sickness is common. Try eating small, frequent meals and snacking on crackers.",
    6: "Fatigue can be intense. Prioritize rest and listen to your body.",
    7: "Stay hydrated! It's crucial for you and the baby, and can help with headaches.",
    8: "Food aversions are normal. Focus on nutritious foods you can tolerate.",
    9: "Your sense of smell might be heightened. Avoid strong odors that trigger nausea.",
    10: "Light exercise like walking is great for circulation and mood.",
    11: "Cravings kicking in? Balance them with healthy options.",
    12: "You're nearing the end of the first trimester! Many early symptoms may start to ease up.",
    13: "Your energy may be returning. A great time to enjoy gentle activities.",
    14: "As your belly grows, wear comfortable, supportive clothing.",
    15: "Consider sleeping on your side with pillows for support for better comfort and blood flow.",
    16: "You might feel the baby's first flutters soon! Pay attention to those gentle movements.",
    17: "Eating fiber-rich foods like fruits and vegetables can help prevent constipation.",
    18: "Your appetite might increase. Focus on nutrient-dense snacks.",
    19: "Backaches? Gentle stretches and good posture can provide relief.",
    20: "You're halfway there! Celebrate this milestone and continue to nourish your body."
};

const sleepDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayTitles = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };
const moodToValue = {'😣': 1, '😐': 2, '🙂': 3, '😊': 4, '🥰': 5};

// --- DATE HELPER FUNCTIONS ---
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

export async function initializeWellness(userId, onWellnessDataUpdate) {
    // This ref now points to the CURRENT week's wellness data
    wellnessDataRef = doc(db, `users/${userId}/wellness`, getWeekId(new Date()));
    symptomTrackerCollectionRef = collection(db, `users/${userId}/symptomLogs`);
    userSupplementsRef = doc(db, `users/${userId}/supplements`, 'list-v1');
    supplementNutrientsRef = doc(db, `users/${userId}/supplements`, 'nutrients-v1');

    await initializeWellnessData(wellnessDataRef, onWellnessDataUpdate);
    await initializeSupplements();
    loadWellnessData(onWellnessDataUpdate);
    loadSupplements();
    setupEventListeners();
}

async function initializeWellnessData(docRef, onWellnessDataUpdate) {
    if (!docRef) return;
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, defaultWellnessData);
        wellnessData = { ...defaultWellnessData };
    } else {
        const firestoreData = docSnap.data();
        const mergedSleep = { ...defaultWellnessData.sleep, ...firestoreData.sleep };
        const mergedWeeklyLog = { ...defaultWellnessData.weeklyLog, ...firestoreData.weeklyLog };
        const mergedSupplements = { ...defaultWellnessData.dailySupplements, ...firestoreData.dailySupplements };
        wellnessData = {
            ...defaultWellnessData,
            ...firestoreData,
            dailyNutrition: firestoreData.dailyNutrition || {},
            dailySupplements: mergedSupplements,
            sleep: mergedSleep,
            weeklyLog: mergedWeeklyLog,
            mood: { ...defaultWellnessData.mood, ...firestoreData.mood },
            water: { ...defaultWellnessData.water, ...firestoreData.water },
            energy: { ...defaultWellnessData.energy, ...firestoreData.energy },
        };
    }
    onWellnessDataUpdate(wellnessData);
}


async function initializeSupplements() {
    if (userSupplementsRef && supplementNutrientsRef) {
        const listSnap = await getDoc(userSupplementsRef);
        if (!listSnap.exists()) await setDoc(userSupplementsRef, { list: [] });
        const nutrientsSnap = await getDoc(supplementNutrientsRef);
        if (!nutrientsSnap.exists()) await setDoc(supplementNutrientsRef, {});
    }
}

function loadWellnessData(onWellnessDataUpdate) {
    if(unsubscribeWellnessData) unsubscribeWellnessData();
    // Re-point to the current week's document every time we load
    wellnessDataRef = doc(db, `users/${getCurrentUserId()}/wellness`, getWeekId(new Date()));

    if (!wellnessDataRef) return;

    unsubscribeWellnessData = onSnapshot(wellnessDataRef, (docSnap) => {
        if(docSnap.exists()){
            const firestoreData = docSnap.data();
            const mergedSleep = { ...defaultWellnessData.sleep, ...firestoreData.sleep };
            const mergedWeeklyLog = { ...defaultWellnessData.weeklyLog, ...firestoreData.weeklyLog };
            const mergedSupplements = { ...defaultWellnessData.dailySupplements, ...firestoreData.dailySupplements };
            wellnessData = {
                ...defaultWellnessData,
                ...firestoreData,
                dailyNutrition: firestoreData.dailyNutrition || {},
                dailySupplements: mergedSupplements,
                sleep: mergedSleep,
                weeklyLog: mergedWeeklyLog,
                mood: { ...defaultWellnessData.mood, ...firestoreData.mood },
                water: { ...defaultWellnessData.water, ...firestoreData.water },
                energy: { ...defaultWellnessData.energy, ...firestoreData.energy },
            };
            updateDashboardUI();
            updateWellnessChartData();
            onWellnessDataUpdate(wellnessData);
        } else {
            // If the doc for the current week doesn't exist, create it.
            setDoc(wellnessDataRef, defaultWellnessData);
        }
    });
}

function loadSupplements() {
    if (userSupplementsRef) {
        if (unsubscribeUserSupplements) unsubscribeUserSupplements();
        unsubscribeUserSupplements = onSnapshot(userSupplementsRef, (docSnap) => {
            userSupplements = docSnap.exists() ? docSnap.data().list || [] : [];
            if (manageSupplementsModal.classList.contains('active')) populateSupplementList();
        });
    }
    if (supplementNutrientsRef) {
        if (unsubscribeSupplementNutrients) unsubscribeSupplementNutrients();
        unsubscribeSupplementNutrients = onSnapshot(supplementNutrientsRef, (docSnap) => {
            supplementNutrients = docSnap.exists() ? docSnap.data() : {};
             if (manageSupplementsModal.classList.contains('active')) populateSupplementList();
        });
    }
}

function setupEventListeners() {
    hydrationPlusBtn.addEventListener('click', async () => {
        if (wellnessData.water.intake < wellnessData.water.goal) {
            wellnessData.water.intake++;
            await setDoc(wellnessDataRef, { water: wellnessData.water }, { merge: true });
        }
    });

    hydrationMinusBtn.addEventListener('click', async () => {
        if (wellnessData.water.intake > 0) {
            wellnessData.water.intake--;
            await setDoc(wellnessDataRef, { water: wellnessData.water }, { merge: true });
        }
    });
    
    moodLogButtons.addEventListener('click', async (e) => {
        const button = e.target.closest('.mood-btn'); if(!button) return;
        const todayIndex = new Date().getDay(); const currentDayKey = sleepDays[(todayIndex === 0 ? 6 : todayIndex - 1)];
        const newMoodEmoji = button.dataset.mood;
        const moodMessages = {
            '😣': { level: "Stressed", aiInsight: "It's okay to have tough days. Try some deep breathing or a short, calming walk." },
            '😐': { level: "Neutral", aiInsight: "A neutral day is a good day for rest. What's one small thing that could bring a smile?" },
            '🙂': { level: "Okay", aiInsight: "Feeling okay is a great baseline. Keep taking care of yourself." },
            '😊': { level: "Happy", aiInsight: "Glad you're feeling happy! Embrace the positive energy today." },
            '🥰': { level: "Blissful", aiInsight: "Wonderful! Cherish these blissful moments." }
        };
        const newMoodData = { emoji: newMoodEmoji, ...moodMessages[newMoodEmoji] };
        const newWeeklyLog = { ...wellnessData.weeklyLog };
        if (!newWeeklyLog[currentDayKey]) newWeeklyLog[currentDayKey] = {};
        newWeeklyLog[currentDayKey].mood = newMoodEmoji;
        await setDoc(wellnessDataRef, { mood: newMoodData, weeklyLog: newWeeklyLog }, { merge: true });
    });

    energyLogButtons.addEventListener('click', async (e) => {
        const button = e.target.closest('.energy-btn'); if(!button) return;
        const todayIndex = new Date().getDay(); const currentDayKey = sleepDays[(todayIndex === 0 ? 6 : todayIndex - 1)];
        const newEnergyLevel = parseInt(button.dataset.energy);
        const energyMap = { 1: { level: 'Very Low', color: 'text-red-400' }, 2: { level: 'Low', color: 'text-yellow-400' }, 3: { level: 'Moderate', color: 'text-green-400' }, 4: { level: 'Good', color: 'text-teal-400' }, 5: { level: 'High', color: 'text-purple-400' } };
        const newEnergyData = energyMap[newEnergyLevel];
        const newWeeklyLog = { ...wellnessData.weeklyLog };
        if (!newWeeklyLog[currentDayKey]) newWeeklyLog[currentDayKey] = {};
        newWeeklyLog[currentDayKey].energy = newEnergyLevel;
        await setDoc(wellnessDataRef, { energy: newEnergyData, weeklyLog: newWeeklyLog }, { merge: true });
    });

    symptomCheckBtn.addEventListener('click', handleSymptomCheck);
    babyGrowthCard.addEventListener('click', () => {
        startDateInput.value = wellnessData.pregnancyStartDate; endDateInput.value = wellnessData.pregnancyEndDate || '';
        startDateModal.classList.remove('hidden'); setTimeout(() => startDateModal.classList.add('active'), 10);
    });
    startDateModalCancelBtn.addEventListener('click', closeStartDateModal);
    startDateModal.addEventListener('click', (e) => e.target === startDateModal && closeStartDateModal());
    startDateModalSaveBtn.addEventListener('click', async () => {
        const newStartDate = startDateInput.value; let newEndDate = endDateInput.value;
        if (newStartDate) {
            if (!newEndDate) { const startDate = new Date(newStartDate); startDate.setDate(startDate.getDate() + (40 * 7)); newEndDate = startDate.toISOString().split('T')[0]; }
            if (newStartDate !== wellnessData.pregnancyStartDate || newEndDate !== wellnessData.pregnancyEndDate) await setDoc(wellnessDataRef, { pregnancyStartDate: newStartDate, pregnancyEndDate: newEndDate }, { merge: true });
        }
        closeStartDateModal();
    });
    sleepMonitorCard.addEventListener('click', () => {
        populateSleepModal(); sleepModal.classList.remove('hidden');
        setTimeout(() => sleepModal.classList.add('active'), 10);
    });
    sleepModalCancelBtn.addEventListener('click', closeSleepModal);
    sleepModal.addEventListener('click', (e) => e.target === sleepModal && closeSleepModal());
    sleepModalSaveBtn.addEventListener('click', async () => {
        const newSleepData = {}; let hasChanged = false;
        sleepDays.forEach(day => {
            const sleepInput = document.getElementById(`sleep-time-${day}`); const wakeInput = document.getElementById(`wake-time-${day}`);
            newSleepData[day] = { sleep: sleepInput.value, wake: wakeInput.value };
            if (newSleepData[day].sleep !== (wellnessData.sleep[day] || {}).sleep || newSleepData[day].wake !== (wellnessData.sleep[day] || {}).wake) hasChanged = true;
        });
        if (hasChanged) await setDoc(wellnessDataRef, { sleep: newSleepData }, { merge: true });
        closeSleepModal();
    });
    
    manageSupplementsBtnHeader.addEventListener('click', () => openSupplementModal(new Date()));
    nutritionHistoryBtn.addEventListener('click', openNutritionHistoryModal);
    nutritionHistoryCloseBtn.addEventListener('click', closeNutritionHistoryModal);
    nutritionHistoryModal.addEventListener('click', e => e.target === nutritionHistoryModal && closeNutritionHistoryModal());
    manageSupplementsCloseBtn.addEventListener('click', closeSupplementModal);
    manageSupplementsModal.addEventListener('click', e => e.target === manageSupplementsModal && closeSupplementModal());
    addSupplementBtn.addEventListener('click', handleAddSupplement);
    newSupplementInput.addEventListener('keyup', e => e.key === 'Enter' && handleAddSupplement());
    
    nutritionHistoryPrevBtn.addEventListener('click', () => {
        nutritionHistoryCurrentDate.setDate(nutritionHistoryCurrentDate.getDate() - 7);
        populateNutritionHistory(nutritionHistoryCurrentDate);
    });

    nutritionHistoryNextBtn.addEventListener('click', () => {
        nutritionHistoryCurrentDate.setDate(nutritionHistoryCurrentDate.getDate() + 7);
        populateNutritionHistory(nutritionHistoryCurrentDate);
    });
}

export function updateDashboardUI() {
    if (!wellnessData || Object.keys(wellnessData).length === 0) return;
    updateDailySummary();
    updateHydrationCircle();
    updateNutritionTracker();
    updateSleepMonitor();
    updateMoodLog();
    updateEnergyLog();
    updateDynamicContent();
}

function updateDailySummary() {
    const { mood, water, energy } = wellnessData;
    const lastNightSleep = calculateLastNightSleep();
    document.getElementById('summary-mood').textContent = mood.emoji;
    document.getElementById('summary-sleep').textContent = `${lastNightSleep.hours} hours`;
    document.getElementById('summary-water').textContent = `${water.intake} / ${water.goal} glasses`;
    const energySpan = document.getElementById('summary-energy');
    energySpan.textContent = energy.level;
    energySpan.className = `font-semibold ${energy.color}`;
    let insight = `You slept ${lastNightSleep.hours} hours and drank ${water.intake} glasses of water. `;
    if(lastNightSleep.hours < 7) insight += "Try to get a bit more rest tonight. ";
    if(water.intake < 5) insight += "Don't forget to hydrate! ";
    if(energy.level === 'Low' || energy.level === 'Very Low') insight += "A short walk might boost your energy."
    document.getElementById('summary-ai-insight').textContent = insight;
}

function updateHydrationCircle() {
    const { intake, goal } = wellnessData.water;
    const circle = hydrationProgress;
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (intake / goal) * circumference;
    circle.style.strokeDasharray = circumference; circle.style.strokeDashoffset = offset;
    hydrationText.innerHTML = `${intake}<span class="text-sm">/${goal}</span>`;
    document.getElementById('hydration-ai-insight').textContent = intake < goal ? `You're doing great! Just ${goal - intake} more glasses to go.` : "You've hit your hydration goal for today! 🎉";
}

function updateNutritionTracker() {
    const todayIndex = new Date().getDay(); const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1; const dayKey = days[dayIndex];
    const aiSummary = wellnessData.dailyNutrition ? wellnessData.dailyNutrition[dayKey] : null;
    updateDailySupplementsUI(dayKey);

    const allMealNutrients = getMealNutrients();
    const currentMealPlanData = getCurrentMealPlan();

    if (aiSummary) {
        const nutritionData = { iron: getStatusFromAI(aiSummary.iron), calcium: getStatusFromAI(aiSummary.calcium), folate: getStatusFromAI(aiSummary.folate), fiber: getStatusFromAI(aiSummary.fiber) };
        updateNutritionUI(nutritionData);
    } else {
        const dailyGoals = { iron: 8, calcium: 10, folate: 10, fiber: 8 };
        const totals = { iron: 0, calcium: 0, folate: 0, fiber: 0 };
        
        if (currentMealPlanData) {
            for (const mealKey in currentMealPlanData) {
                if (currentMealPlanData[mealKey] && typeof currentMealPlanData[mealKey] === 'object') {
                    const mealName = currentMealPlanData[mealKey][dayKey];
                    if (mealName && allMealNutrients[mealName]) {
                        const nutrients = allMealNutrients[mealName];
                        totals.iron += nutrients.iron || 0; totals.calcium += nutrients.calcium || 0; totals.folate += nutrients.folate || 0; totals.fiber += nutrients.fiber || 0;
                    }
                }
            }
        }

        const todaysSupplements = wellnessData.dailySupplements[dayKey] || [];
        todaysSupplements.forEach(suppName => {
            if (supplementNutrients[suppName]) {
                const nutrients = supplementNutrients[suppName];
                totals.iron += nutrients.iron || 0; totals.calcium += nutrients.calcium || 0; totals.folate += nutrients.folate || 0; totals.fiber += nutrients.fiber || 0;
            }
        });

        const nutritionData = { iron: calculateNutrientStatus(totals.iron, dailyGoals.iron), calcium: calculateNutrientStatus(totals.calcium, dailyGoals.calcium), folate: calculateNutrientStatus(totals.folate, dailyGoals.folate), fiber: calculateNutrientStatus(totals.fiber, dailyGoals.fiber) };
        updateNutritionUI(nutritionData);
    }
}

function getStatusFromAI(statusString) {
    statusString = (statusString || 'low').toLowerCase();
     let status, color, bgColor, percentage;
    if (statusString === 'good') { status = 'Good'; color = 'text-green-400'; bgColor = 'bg-green-500'; percentage = 90; } 
    else if (statusString === 'okay') { status = 'Okay'; color = 'text-yellow-400'; bgColor = 'bg-yellow-500'; percentage = 60; } 
    else { status = 'Low'; color = 'text-red-400'; bgColor = 'bg-red-500'; percentage = 25; }
    return { status, percentage, color, bgColor };
}

function calculateNutrientStatus(total, goal) {
    const percentage = goal > 0 ? Math.min(Math.round((total / goal) * 100), 100) : 0;
    let status, color, bgColor;
    if (percentage >= 80) { status = 'Good'; color = 'text-green-400'; bgColor = 'bg-green-500'; } 
    else if (percentage >= 40) { status = 'Okay'; color = 'text-yellow-400'; bgColor = 'bg-yellow-500'; } 
    else { status = 'Low'; color = 'text-red-400'; bgColor = 'bg-red-500'; }
    return { status, percentage, color, bgColor };
}

function updateNutritionUI(nutrition) {
    Object.keys(nutrition).forEach(key => {
        const nutrient = nutrition[key];
        const container = document.getElementById(`nutrition-${key}`);
        if(container) {
            const statusEl = container.querySelector('.status-text');
            const progressEl = container.querySelector('.progress-bar');
            statusEl.textContent = nutrient.status;
            statusEl.className = `status-text font-semibold ${nutrient.color}`;
            progressEl.style.width = `${nutrient.percentage}%`;
            progressEl.className = `progress-bar h-1.5 rounded-full ${nutrient.bgColor}`;
        }
    });
    const lowNutrients = Object.keys(nutrition).filter(k => nutrition[k].status === 'Low');
    let insight = "Your nutrition looks balanced for today's plan.";
     if (lowNutrients.length > 0) {
        insight = `Today's plan seems a bit low in ${lowNutrients.join(' and ')}. Consider adding a snack rich in these nutrients.`
    } else {
        const goodNutrients = Object.keys(nutrition).filter(k => nutrition[k].status === 'Good');
        if (goodNutrients.length >= 3) {
            insight = `Great job with today's meal plan! It looks well-balanced in ${goodNutrients.join(', ')}.`
        }
    }
    const insightEl = document.getElementById('nutrition-ai-insight');
    if(insightEl) insightEl.textContent = insight;
}

function calculateSleepDuration(sleepTimeStr, wakeTimeStr) {
    if (!sleepTimeStr || !wakeTimeStr) return 0;
    const [sleepH, sleepM] = sleepTimeStr.split(':').map(Number);
    const [wakeH, wakeM] = wakeTimeStr.split(':').map(Number);
    let sleepDate = new Date(); sleepDate.setHours(sleepH, sleepM, 0, 0);
    let wakeDate = new Date(); wakeDate.setHours(wakeH, wakeM, 0, 0);
    if (wakeDate < sleepDate) wakeDate.setDate(wakeDate.getDate() + 1);
    const durationMillis = wakeDate - sleepDate;
    const durationHours = durationMillis / (1000 * 60 * 60);
    return Math.round(durationHours * 10) / 10;
}

function calculateLastNightSleep() {
    const todayIndex = new Date().getDay(); const yesterdayIndex = (todayIndex + 6) % 7;
    const sleepDayKey = sleepDays[yesterdayIndex];
    const { sleep, wake } = wellnessData.sleep[sleepDayKey] || { sleep: '', wake: '' };
    const hours = calculateSleepDuration(sleep, wake);
    return { hours };
}

function updateSleepMonitor() {
    const { hours } = calculateLastNightSleep();
    document.getElementById('sleep-hours').textContent = hours;
    let insight = "A consistent sleep schedule does wonders. Keep it up!";
    if (hours < 7) insight = `You slept less than 7 hours. Try relaxing tea or a warm bath before bed.`;
    else if (hours > 9) insight = `You got plenty of rest! Great job prioritizing sleep.`;
    document.getElementById('sleep-ai-insight').textContent = insight;
}

function updateMoodLog() {
    const { mood } = wellnessData;
    const buttons = moodLogButtons.querySelectorAll('.mood-btn');
    buttons.forEach(btn => {
        if (btn.dataset.mood === mood.emoji) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
    document.getElementById('mood-ai-insight').textContent = mood.aiInsight;
}

function updateEnergyLog() {
    const todayIndex = new Date().getDay(); const currentDayKey = sleepDays[(todayIndex === 0 ? 6 : todayIndex - 1)];
    const currentEnergy = wellnessData.weeklyLog[currentDayKey]?.energy || 3;
    const buttons = energyLogButtons.querySelectorAll('.energy-btn');
    buttons.forEach(btn => {
        if (parseInt(btn.dataset.energy) === currentEnergy) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
}

async function handleSymptomCheck() {
    const symptomText = symptomInput.value.trim();
    if (!symptomText) return;
    symptomLoader.classList.remove('hidden'); symptomBtnText.textContent = 'Analyzing...'; symptomCheckBtn.disabled = true; symptomResponseEl.innerHTML = '';
    const systemPrompt = `You are a caring wellness assistant for pregnant women. Analyze the symptom, provide potential non-medical causes and gentle remedies. Crucially, always include a disclaimer to consult a doctor. Your response must be ONLY a valid JSON object matching this structure: { "possibleCauses": string[], "gentleRemedies": string[], "disclaimer": string }.`;
    const userQuery = `My symptom today: "${symptomText}"`;
    const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI";
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
        displaySymptomResponse(data);
        if (symptomTrackerCollectionRef) await addDoc(symptomTrackerCollectionRef, { symptom: symptomText, aiResponse: data, createdAt: serverTimestamp() });
    } catch (error) {
        console.error("Symptom check API call failed:", error);
        symptomResponseEl.innerHTML = `<div class="p-3 rounded-md bg-red-500 bg-opacity-30 text-red-200">Sorry, something went wrong. Please try again.</div>`;
    } finally {
        symptomLoader.classList.add('hidden'); symptomBtnText.textContent = 'Get Suggestions'; symptomCheckBtn.disabled = false;
    }
}

function displaySymptomResponse(data) {
    let html = '<div class="space-y-4">';
    if (data.possibleCauses && data.possibleCauses.length > 0) {
        html += `<div><h4 class="font-semibold text-purple-300">Possible Causes:</h4><ul class="list-disc list-inside text-gray-300">`;
        data.possibleCauses.forEach(cause => { html += `<li>${cause}</li>`; });
        html += `</ul></div>`;
    }
    if (data.gentleRemedies && data.gentleRemedies.length > 0) {
        html += `<div><h4 class="font-semibold text-green-300">Gentle Suggestions:</h4><ul class="list-disc list-inside text-gray-300">`;
        data.gentleRemedies.forEach(remedy => { html += `<li>${remedy}</li>`; });
        html += `</ul></div>`;
    }
    if (data.disclaimer) {
        html += `<div class="p-3 mt-4 text-sm rounded-md bg-yellow-500 bg-opacity-20 text-yellow-200"><strong>Important:</strong> ${data.disclaimer}</div>`;
    }
    html += '</div>';
    symptomResponseEl.innerHTML = html;
}

export function updateWellnessChartData() {
    if (!wellnessChart || !getCurrentUserId() || !wellnessData.sleep) return;
    const sleepData = sleepDays.map(day => { const { sleep, wake } = wellnessData.sleep[day] || { sleep: '', wake: '' }; return calculateSleepDuration(sleep, wake); });
    const energyData = sleepDays.map(day => (wellnessData.weeklyLog[day] || {energy: 0}).energy);
    const moodData = sleepDays.map(day => moodToValue[(wellnessData.weeklyLog[day] || {mood: '😐'}).mood] || 2);
    wellnessChart.data.datasets[0].data = energyData; wellnessChart.data.datasets[1].data = moodData; wellnessChart.data.datasets[2].data = sleepData;
    wellnessChart.update();
    const avgSleep = sleepData.reduce((a, b) => a + b, 0) / sleepData.length;
    const avgMood = moodData.reduce((a, b) => a + b, 0) / moodData.length;
    let insight = `Your average sleep this week is ${avgSleep.toFixed(1)} hours. `;
    if (avgMood > 3.5) insight += "It seems like you've had a great week overall! ";
    else if (avgMood < 2.5) insight += "It looks like a tough week. Remember to rest and be kind to yourself. ";
    document.getElementById('chart-ai-insight').textContent = insight;
}

export function renderWellnessChart() {
    if (wellnessChart) {
        wellnessChart.destroy();
    }
    const ctx = document.getElementById('wellnessChart').getContext('2d');
    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            { label: 'Energy (1-5)', data: [], borderColor: '#facc15', backgroundColor: '#facc1533', type: 'line', tension: 0.4, yAxisID: 'y' },
            { label: 'Mood (1-5)', data: [], borderColor: '#a78bfa', backgroundColor: '#a78bfa33', type: 'line', tension: 0.4, yAxisID: 'y' },
            { label: 'Sleep (hours)', data: [], borderColor: '#60a5fa', backgroundColor: '#60a5fa', type: 'bar', yAxisID: 'y1' }
        ]
    };
     wellnessChart = new Chart(ctx, {
        type: 'bar', data: data,
        options: {
            responsive: true, interaction: { mode: 'index', intersect: false },
            scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: '#ffffff1a'} },
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Energy / Mood', color: '#d1d5db' }, ticks: { color: '#d1d5db' }, grid: { color: '#ffffff1a' }, max: 5, min: 0 },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Sleep Hours', color: '#60a5fa' }, ticks: { color: '#60a5fa' }, grid: { drawOnChartArea: false } }
            },
            plugins: { legend: { labels: { color: '#d1d5db' } } }
        }
    });
    updateWellnessChartData();
}

function updateDynamicContent() {
    if(!wellnessData.pregnancyStartDate) return;
    const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
    const today = new Date();
    const diffTime = Math.abs(today - pregnancyStartDate);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    const babySizes = {
        4: {fruit: 'poppy seed', emoji: '🌱'}, 5: {fruit: 'peppercorn', emoji: '🌶️'}, 6: {fruit: 'sweet pea', emoji: '🟢'}, 7: {fruit: 'blueberry', emoji: '🫐'}, 8: {fruit: 'raspberry', emoji: '🍓'}, 9: {fruit: 'cherry', emoji: '🍒'}, 10: {fruit: 'strawberry', emoji: '🍓'}, 11: {fruit: 'lime', emoji: '🍈'}, 12: {fruit: 'plum', emoji: '🍑'}, 13: {fruit: 'peach', emoji: '🍑'}, 14: {fruit: 'lemon', emoji: '🍋'}, 15: {fruit: 'apple', emoji: '🍎'}, 16: {fruit: 'avocado', emoji: '🥑'}, 17: {fruit: 'pear', emoji: '🍐'}, 18: {fruit: 'bell pepper', emoji: '🫑'}, 19: {fruit: 'mango', emoji: '🥭'}, 20: {fruit: 'banana', emoji: '🍌'},
    };
    const size = babySizes[diffWeeks] || {fruit: 'a little miracle', emoji: '✨'};
    babyGrowthSnapshotEl.innerHTML = `Week ${diffWeeks} — baby is the size of a ${size.fruit} ${size.emoji}`;
    const wellnessTipEl = document.getElementById('wellness-tip');
    const tip = wellnessTipsByWeek[diffWeeks] || "Stay hydrated and listen to your body's needs today.";
    wellnessTipEl.textContent = tip; wellnessData.dailyTip = tip;
}

function openSupplementModal(date = new Date()) {
    supplementLogDate = date;
    const dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    manageSupplementsModal.querySelector('h3').textContent = `Log Supplements for ${dateString}`;

    populateSupplementList();
    manageSupplementsModal.classList.remove('hidden');
    setTimeout(() => manageSupplementsModal.classList.add('active'), 10);
}

function closeSupplementModal() {
    if (unsubscribeSupplementLog) unsubscribeSupplementLog();
    manageSupplementsModal.classList.remove('active');
    setTimeout(() => manageSupplementsModal.classList.add('hidden'), 300);
}

async function populateSupplementList() {
    supplementListContainer.innerHTML = `<p class="text-center text-gray-400">Loading supplements...</p>`;
    
    const weekId = getWeekId(supplementLogDate);
    const dayIndex = (supplementLogDate.getDay() + 6) % 7; // Monday is 0
    const dayKey = days[dayIndex];
    const userId = getCurrentUserId();
    const wellnessDocRefForLog = doc(db, `users/${userId}/wellness`, weekId);

    if (unsubscribeSupplementLog) unsubscribeSupplementLog();

    unsubscribeSupplementLog = onSnapshot(wellnessDocRefForLog, (docSnap) => {
        const wellnessDataForLog = docSnap.exists() ? docSnap.data() : defaultWellnessData;
        const loggedSupplements = wellnessDataForLog.dailySupplements[dayKey] || [];
        
        supplementListContainer.innerHTML = '';
        if (userSupplements.length === 0) {
            supplementListContainer.innerHTML = `<p class="text-center text-gray-400">No supplements added yet.</p>`;
            return;
        }

        userSupplements.forEach(supp => {
            const item = document.createElement('div');
            const isLogged = loggedSupplements.includes(supp);
            item.className = `flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer`;
            if (isLogged) {
                item.classList.add('bg-purple-500/20');
            }
            const nutrients = supplementNutrients[supp] || { iron: '?', calcium: '?', folate: '?' };

            item.innerHTML = `
                <div class="flex-1 pr-2">
                    <span class="font-semibold text-white">${supp}</span>
                    <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mt-1.5 text-gray-300">
                        <span>Iron: ${nutrients.iron}</span>
                        <span>Ca: ${nutrients.calcium}</span>
                        <span>Folate: ${nutrients.folate}</span>
                    </div>
                </div>
                <div class="flex items-center">
                    ${isLogged ? '<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'}
                </div>`;
            item.addEventListener('click', () => toggleSupplementForDay(supp));
            supplementListContainer.appendChild(item);
        });
    });
}

async function toggleSupplementForDay(suppName) {
    const dayIndex = (supplementLogDate.getDay() + 6) % 7; // Monday is 0
    const dayKey = days[dayIndex];
    const weekId = getWeekId(supplementLogDate);
    const userId = getCurrentUserId();
    const wellnessDocRefForLog = doc(db, `users/${userId}/wellness`, weekId);

    const docSnap = await getDoc(wellnessDocRefForLog);
    const wellnessDataForLog = docSnap.exists() ? docSnap.data() : defaultWellnessData;
    const loggedSupplements = wellnessDataForLog.dailySupplements[dayKey] || [];

    const isLogged = loggedSupplements.includes(suppName);
    const updateOperation = isLogged ? arrayRemove(suppName) : arrayUnion(suppName);

    await setDoc(wellnessDocRefForLog, {
        dailySupplements: {
            [dayKey]: updateOperation
        }
    }, { merge: true });
}

function updateDailySupplementsUI(dayKey) {
    dailySupplementsList.innerHTML = '';
    const todaysSupplements = wellnessData.dailySupplements[dayKey] || [];
    if (todaysSupplements.length === 0) {
        dailySupplementsList.innerHTML = `<p class="text-xs text-gray-400 italic">No supplements logged for today.</p>`;
        return;
    }
    todaysSupplements.forEach(suppName => {
        const pill = document.createElement('div');
        pill.className = 'flex items-center bg-purple-500 bg-opacity-20 text-purple-200 text-xs font-semibold px-2.5 py-1 rounded-full';
        pill.innerHTML = `<span>${suppName}</span>
        <button class="ml-2 remove-supp-btn" data-supp="${suppName}">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>`;
        pill.querySelector('.remove-supp-btn').addEventListener('click', () => removeSupplementFromDay(suppName));
        dailySupplementsList.appendChild(pill);
    });
}

async function removeSupplementFromDay(suppName) {
    const todayIndex = new Date().getDay(); const dayKey = days[(todayIndex === 0 ? 6 : todayIndex - 1)];
    await updateDoc(wellnessDataRef, { [`dailySupplements.${dayKey}`]: arrayRemove(suppName) });
}

async function deleteSupplement(suppToDelete) {
    await updateDoc(userSupplementsRef, { list: arrayRemove(suppToDelete) });
    await updateDoc(supplementNutrientsRef, { [suppToDelete]: deleteField() });
}

async function handleAddSupplement() {
    const userSupp = newSupplementInput.value.trim(); if (!userSupp) return;
    supplementApiLoader.classList.remove('hidden'); addSupplementText.textContent = 'Checking...'; addSupplementBtn.disabled = true; supplementApiFeedback.classList.add('hidden');
    const systemPrompt = "You are a prenatal nutritionist. Evaluate if a supplement is generally safe for pregnancy. Provide an estimated nutritional profile (integers 0-3) for iron, calcium, and folate. Your response MUST be ONLY a valid JSON object matching this structure: { \"isSuitable\": boolean, \"supplementName\": string, \"reasoning\": string, \"nutrients\": { \"iron\": number, \"calcium\": number, \"folate\": number } }.";
    const userQuery = `Evaluate this supplement for pregnancy: "${userSupp}"`; const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
    };
     try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json(); const text = result.candidates[0].content.parts[0].text; const data = JSON.parse(text);
        if (data.isSuitable) {
            if (!userSupplements.includes(data.supplementName)) {
                await updateDoc(userSupplementsRef, { list: arrayUnion(data.supplementName) });
                if (supplementNutrientsRef && data.nutrients) {
                    await updateDoc(supplementNutrientsRef, { [data.supplementName]: {...data.nutrients, fiber: 0} });
                }
                newSupplementInput.value = ''; showApiFeedback(`Success! "${data.supplementName}" was added.`, 'success', supplementApiFeedback);
            } else { showApiFeedback(`"${data.supplementName}" is already on the list.`, 'warning', supplementApiFeedback); }
        } else {
            showApiFeedback(`<strong>Caution:</strong><br>${data.reasoning}`, 'error', supplementApiFeedback);
        }
    } catch (error) { console.error("Gemini API call failed for supplement:", error); showApiFeedback("Sorry, I couldn't verify that right now.", 'error', supplementApiFeedback); } 
    finally { supplementApiLoader.classList.add('hidden'); addSupplementText.textContent = 'Check & Add Supplement'; addSupplementBtn.disabled = false; }
}

function openNutritionHistoryModal() {
    nutritionHistoryCurrentDate = new Date(); // Reset to current week
    populateNutritionHistory(nutritionHistoryCurrentDate);
    nutritionHistoryModal.classList.remove('hidden');
    setTimeout(() => nutritionHistoryModal.classList.add('active'), 10);
}

function closeNutritionHistoryModal() {
    nutritionHistoryModal.classList.remove('active');
    setTimeout(() => nutritionHistoryModal.classList.add('hidden'), 300);
}

async function populateNutritionHistory(date) {
    nutritionHistoryContainer.innerHTML = '<p class="text-center text-gray-400">Loading history...</p>';
    nutritionHistoryWeekDisplay.textContent = formatWeekDisplay(date);

    const weekId = getWeekId(date);
    const userId = getCurrentUserId();
    if (!userId) {
        nutritionHistoryContainer.innerHTML = '<p class="text-center text-red-400">Could not load data. User not found.</p>';
        return;
    }

    const weekMealPlanRef = doc(db, `users/${userId}/mealPlans`, weekId);
    const weekMealPlanSnap = await getDoc(weekMealPlanRef);
    const mealPlanForWeek = weekMealPlanSnap.exists() ? weekMealPlanSnap.data() : defaultMealPlan;

    // Fetch the corresponding wellness data for the same week
    const weekWellnessRef = doc(db, `users/${userId}/wellness`, weekId);
    const weekWellnessSnap = await getDoc(weekWellnessRef);
    const wellnessForWeek = weekWellnessSnap.exists() ? weekWellnessSnap.data() : defaultWellnessData;


    nutritionHistoryContainer.innerHTML = '';
    const allMealNutrients = getMealNutrients();
    const dailyGoals = { iron: 8, calcium: 10, folate: 10, fiber: 8 };

    days.forEach((dayKey, index) => {
        const dayTitle = dayTitles[dayKey];
        const totals = { iron: 0, calcium: 0, folate: 0, fiber: 0 };
        for (const mealKey in mealPlanForWeek) {
            if (mealPlanForWeek[mealKey] && typeof mealPlanForWeek[mealKey] === 'object') {
                const mealName = mealPlanForWeek[mealKey][dayKey];
                if (mealName && allMealNutrients[mealName]) {
                    const nutrients = allMealNutrients[mealName];
                    totals.iron += nutrients.iron || 0;
                    totals.calcium += nutrients.calcium || 0;
                    totals.folate += nutrients.folate || 0;
                    totals.fiber += nutrients.fiber || 0;
                }
            }
        }
        
        // Use supplements from the specific week's wellness data
        const daySupplements = wellnessForWeek.dailySupplements[dayKey] || [];
        daySupplements.forEach(suppName => {
            if (supplementNutrients[suppName]) {
                const nutrients = supplementNutrients[suppName];
                totals.iron += nutrients.iron || 0;
                totals.calcium += nutrients.calcium || 0;
                totals.folate += nutrients.folate || 0;
            }
        });
        
        const nutritionData = {
            iron: calculateNutrientStatus(totals.iron, dailyGoals.iron),
            calcium: calculateNutrientStatus(totals.calcium, dailyGoals.calcium),
            folate: calculateNutrientStatus(totals.folate, dailyGoals.folate),
            fiber: calculateNutrientStatus(totals.fiber, dailyGoals.fiber)
        };

        const item = document.createElement('div');
        item.className = 'p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors';
        item.innerHTML = `
            <h4 class="font-bold text-lg text-purple-300 mb-2">${dayTitle}</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                <div>Iron: <span class="font-semibold ${nutritionData.iron.color}">${nutritionData.iron.status} (${nutritionData.iron.percentage}%)</span></div>
                <div>Calcium: <span class="font-semibold ${nutritionData.calcium.color}">${nutritionData.calcium.status} (${nutritionData.calcium.percentage}%)</span></div>
                <div>Folate: <span class="font-semibold ${nutritionData.folate.color}">${nutritionData.folate.status} (${nutritionData.folate.percentage}%)</span></div>
                <div>Fiber: <span class="font-semibold ${nutritionData.fiber.color}">${nutritionData.fiber.status} (${nutritionData.fiber.percentage}%)</span></div>
            </div>
        `;
        const mondayOfRelevantWeek = new Date(getWeekId(date) + 'T00:00:00Z');
        const dayDate = new Date(mondayOfRelevantWeek);
        dayDate.setDate(mondayOfRelevantWeek.getDate() + index);

        item.addEventListener('click', () => openSupplementModal(dayDate));
        nutritionHistoryContainer.appendChild(item);
    });
}


function closeStartDateModal() { startDateModal.classList.remove('active'); setTimeout(() => startDateModal.classList.add('hidden'), 300); }
function populateSleepModal() {
    sleepScheduleContainer.innerHTML = '';
    sleepDays.forEach(day => {
        const dayData = wellnessData.sleep[day] || { sleep: '', wake: '' };
        const item = document.createElement('div');
        item.className = 'grid grid-cols-3 items-center gap-2';
        item.innerHTML = `<label class="font-semibold capitalize">${day}</label><input type="time" id="sleep-time-${day}" class="date-input" value="${dayData.sleep}"><input type="time" id="wake-time-${day}" class="date-input" value="${dayData.wake}">`;
        sleepScheduleContainer.appendChild(item);
    });
}
function closeSleepModal() { sleepModal.classList.remove('active'); setTimeout(() => sleepModal.classList.add('hidden'), 300); }


async function fetchWithBackoff(url, payload, maxRetries = 5) {
    let delay = 1000; // Initial delay of 1 second
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                // If we get a 429, wait and then continue to the next iteration to retry
                console.warn(`Rate limited. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Double the delay for the next potential retry
                continue;
            }
            
            return response; // If the response is not 429, return it
        } catch (error) {
            // This catches network errors, etc.
            console.error('Fetch failed:', error);
            if (i === maxRetries - 1) throw error; // If it's the last retry, rethrow the error
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    // If all retries fail, throw an error
    throw new Error('API request failed after multiple retries.');
}


export async function updateHydrationAndSnacks() {
    const container = document.getElementById('hydration-snacks-container');
    const loader = document.getElementById('hydration-snacks-loader');
    if (!container || !loader) return;
    loader.style.display = 'block'; container.innerHTML = ''; container.appendChild(loader);
    try {
        const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
        const today = new Date();
        const diffTime = Math.abs(today - pregnancyStartDate);
        const pregnancyWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) || 5;
        const todayIndex = new Date().getDay();
        const dayKey = days[todayIndex === 0 ? 6 : todayIndex - 1];
        const currentMealPlanData = getCurrentMealPlan();
        const todaysMeals = { breakfast: currentMealPlanData.breakfast[dayKey], lunch: currentMealPlanData.lunch[dayKey], snackAM: currentMealPlanData.snackAM[dayKey], snackPM: currentMealPlanData.snackPM[dayKey], dinner: currentMealPlanData.dinner[dayKey] };
        const mealPlanString = Object.entries(todaysMeals).map(([key, value]) => `${key}: ${value || 'Not set'}`).join(', ');
        const systemPrompt = `You are a prenatal nutritionist. Generate 3-4 short, actionable hydration and snacking tips based on the user's pregnancy week, mood, and meal plan. Your response MUST be ONLY a valid JSON array of strings, like ["Tip 1", "Tip 2"].`;
        const userQuery = `Context:\n- Week: ${pregnancyWeek}\n- Meals: ${mealPlanString}\n- Mood: ${wellnessData.mood.level}\n- Energy: ${wellnessData.energy.level}\n\nGenerate tips.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
        
        const response = await fetchWithBackoff(apiUrl, payload);

        if (!response.ok) throw new Error('API response not OK');
        const result = await response.json(); const tips = JSON.parse(result.candidates[0].content.parts[0].text);
        loader.style.display = 'none';
        if (tips && tips.length > 0) { container.innerHTML = ''; tips.forEach(tip => { const li = document.createElement('li'); li.textContent = tip; container.appendChild(li); }); } 
        else { container.innerHTML = `<p>Could not generate tips at the moment.</p>`; }
    } catch (error) {
        console.error("Failed to generate hydration/snack tips:", error);
        loader.style.display = 'none'; container.innerHTML = `<li>Keep a water bottle handy to sip throughout the day.</li><li>A handful of almonds can be a great energy-boosting snack.</li><li>Try adding a slice of lemon or cucumber to your water for a refreshing change.</li>`;
    }
}

export async function updatePartnerTips() {
    const container = document.getElementById('partner-tips-container');
    const loader = document.getElementById('partner-tips-loader');
    if (!container || !loader) return;
    loader.style.display = 'block'; container.innerHTML = ''; container.appendChild(loader);
    try {
        const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
        const today = new Date();
        const diffTime = Math.abs(today - pregnancyStartDate);
        const pregnancyWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) || 5;
        const systemPrompt = `You are a supportive assistant for a pregnant woman's partner. Generate 3-4 short, actionable tips for the partner based on the context. Focus on practical help and emotional support. Your response MUST be ONLY a valid JSON array of strings, like ["Tip 1", "Tip 2"].`;
        const userQuery = `Context:\n- Pregnancy Week: ${pregnancyWeek}\n- Her mood: ${wellnessData.mood.level}\n- Her energy: ${wellnessData.energy.level}\n\nGenerate tips.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
        
        const response = await fetchWithBackoff(apiUrl, payload);
        
        if (!response.ok) throw new Error('API response not OK');
        const result = await response.json(); const tips = JSON.parse(result.candidates[0].content.parts[0].text);
        loader.style.display = 'none';
        if (tips && tips.length > 0) { container.innerHTML = ''; tips.forEach(tip => { const li = document.createElement('li'); li.textContent = tip; container.appendChild(li); }); } 
        else { container.innerHTML = `<p>Could not generate tips at the moment.</p>`; }
    } catch (error) {
        console.error("Failed to generate partner tips:", error);
        loader.style.display = 'none'; container.innerHTML = `<li>Offer a gentle back rub tonight.</li><li>Make sure she has a full water bottle.</li><li>Ask if there's anything you can do to make her more comfortable.</li>`;
    }
}

export async function updateHydrationAvoidTips() {
    const container = document.getElementById('hydration-avoid-container');
    const loader = document.getElementById('hydration-avoid-loader');
    if (!container || !loader) return;
    loader.style.display = 'block'; container.innerHTML = ''; container.appendChild(loader);
    try {
        const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
        const today = new Date();
        const diffTime = Math.abs(today - pregnancyStartDate);
        const pregnancyWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) || 5;
        const systemPrompt = `You are a prenatal nutritionist. Generate 2-3 short, critical "to avoid" tips about food/drink for the user's pregnancy week. Your response MUST be ONLY a valid JSON array of strings, like ["Tip 1", "Tip 2"].`;
        const userQuery = `Pregnancy Week: ${pregnancyWeek}. Generate things to avoid.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };

        const response = await fetchWithBackoff(apiUrl, payload);

        if (!response.ok) throw new Error('API response not OK');
        const result = await response.json(); const tips = JSON.parse(result.candidates[0].content.parts[0].text);
        loader.style.display = 'none';
        if (tips && tips.length > 0) { container.innerHTML = ''; tips.forEach(tip => { const li = document.createElement('li'); li.textContent = tip; container.appendChild(li); }); } 
        else { container.innerHTML = `<p>Could not generate tips at the moment.</p>`; }
    } catch (error) {
        console.error("Failed to generate hydration/snack avoid tips:", error);
        loader.style.display = 'none'; container.innerHTML = `<li>Avoid unpasteurized juices or milk.</li><li>Limit caffeine intake.</li><li>Stay away from high-mercury fish like shark or swordfish.</li>`;
    }
}

export async function updatePartnerAvoidTips() {
    const container = document.getElementById('partner-avoid-container');
    const loader = document.getElementById('partner-avoid-loader');
    if (!container || !loader) return;
    loader.style.display = 'block'; container.innerHTML = ''; container.appendChild(loader);
    try {
        const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
        const today = new Date();
        const diffTime = Math.abs(today - pregnancyStartDate);
        const pregnancyWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) || 5;
        const systemPrompt = `You are a supportive assistant for a pregnant woman's partner. Generate 2-3 short things the partner should AVOID saying or doing, based on the context. Your response MUST be ONLY a valid JSON array of strings, like ["Tip 1", "Tip 2"].`;
        const userQuery = `Context:\n- Pregnancy Week: ${pregnancyWeek}\n- Her mood: ${wellnessData.mood.level}\n- Her energy: ${wellnessData.energy.level}\n\nGenerate things to avoid.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
        
        const response = await fetchWithBackoff(apiUrl, payload);

        if (!response.ok) throw new Error('API response not OK');
        const result = await response.json(); const tips = JSON.parse(result.candidates[0].content.parts[0].text);
        loader.style.display = 'none';
        if (tips && tips.length > 0) { container.innerHTML = ''; tips.forEach(tip => { const li = document.createElement('li'); li.textContent = tip; container.appendChild(li); }); } 
        else { container.innerHTML = `<p>Could not generate tips at the moment.</p>`; }
    } catch (error) {
        console.error("Failed to generate partner avoid tips:", error);
        loader.style.display = 'none'; container.innerHTML = `<li>Avoid commenting on her changing body unless it's a compliment.</li><li>Don't dismiss her feelings or symptoms, even if they seem minor.</li>`;
    }
}

export function unloadWellness() {
    if (unsubscribeWellnessData) unsubscribeWellnessData();
    if (unsubscribeUserSupplements) unsubscribeUserSupplements();
    if (unsubscribeSupplementNutrients) unsubscribeSupplementNutrients();
    if (unsubscribeSupplementLog) unsubscribeSupplementLog();
    if (wellnessChart) {
        wellnessChart.destroy();
        wellnessChart = null;
    }
}
