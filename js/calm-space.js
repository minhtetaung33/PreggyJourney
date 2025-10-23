import { db } from './firebase.js';
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// import { getWeekId, getDayId } from './wellness.js'; // Assuming wellness.js exports these
// --- FIX 1: Remove getDayId from import ---
import { getWeekId } from './wellness.js'; // Assuming wellness.js exports getWeekId

// --- DOM Elements ---
let breathingSelect, startBreathingBtn, stopBreathingBtn, breathingCircle, breathingText, breathingGlowRing, breathingDescription;
let startMeditationBtn, stopMeditationBtn, bellyGlow, bellyOutline, meditationGuideText, meditationTextPopup;
let stretchSelect, startStretchBtn, stopStretchBtn, stretchEmoji, stretchTitle, stretchDescription, stretchCountdown;
let playWaterReminderBtn;
let journalModal, journalModalContent, journalPrompt, journalMoodButtons, journalSaveBtn, journalSkipBtn;
let audioOcean, audioHeartbeat, audioCalmTone, audioSparkle, audioWaterReminder;
let sparkleContainer;

// --- State Variables ---
let currentUserId = null;
let activeBreathingTimer = null;
let activeMeditationInterval = null;
let activeStretchTimer = null;
let activeExerciseName = '';
let selectedJournalMood = null;

// --- FIX 2: Add a local getDayId helper function ---
/**
 * Gets the string name for the day of the week.
 * @param {Date} date - The date object.
 * @returns {string} - Day name (e.g., "monday").
 */
function getDayId(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

// --- Constants ---
const BREATHING_EXERCISES = {
    'none': {
        name: 'Select an exercise...',
        description: '',
        pattern: []
    },
    'diaphragmatic': {
        name: 'Diaphragmatic Breathing',
        description: 'Breathe deep into your belly. Good for oxygen flow.',
        pattern: [
            { text: 'Breathe in', duration: 4000, state: 'inhale' },
            { text: 'Breathe out', duration: 6000, state: 'exhale' }
        ]
    },
    'pursed-lip': {
        name: 'Pursed-Lip Breathing',
        description: 'Inhale through your nose, exhale slowly through pursed lips.',
        pattern: [
            { text: 'Inhale (Nose)', duration: 3000, state: 'inhale' },
            { text: 'Exhale (Lips)', duration: 6000, state: 'exhale' }
        ]
    },
    'alternate-nostril': {
        name: 'Alternate Nostril',
        description: 'A calming practice. Follow the text prompts carefully.',
        pattern: [
            { text: 'Inhale Left', duration: 4000, state: 'inhale' },
            { text: 'Hold', duration: 2000, state: 'hold' },
            { text: 'Exhale Right', duration: 6000, state: 'exhale' },
            { text: 'Inhale Right', duration: 4000, state: 'inhale' },
            { text: 'Hold', duration: 2000, state: 'hold' },
            { text: 'Exhale Left', duration: 6000, state: 'exhale' },
        ]
    },
    'box': {
        name: 'Box Breathing',
        description: 'Calms the nervous system. Inhale, Hold, Exhale, Hold.',
        pattern: [
            { text: 'Inhale... 2... 3... 4', duration: 4000, state: 'inhale' },
            { text: 'Hold... 2... 3... 4', duration: 4000, state: 'hold' },
            { text: 'Exhale... 2... 3... 4', duration: 4000, state: 'exhale' },
            { text: 'Hold... 2... 3... 4', duration: 4000, state: 'hold' }
        ]
    },
    '4-7-8': {
        name: '4-7-8 Breathing',
        description: 'A relaxation technique. Inhale 4, Hold 7, Exhale 8.',
        pattern: [
            { text: 'Inhale... 2... 3... 4', duration: 4000, state: 'inhale' },
            { text: 'Hold... 2... 3... 4... 5... 6... 7', duration: 7000, state: 'hold' },
            { text: 'Exhale... 2... 3... 4... 5... 6... 7... 8', duration: 8000, state: 'exhale' }
        ]
    }
};

const MEDITATION_TEXTS = [
    "Imagine your baby smiling inside.",
    "You are strong. You are capable.",
    "Sending love and warmth to my baby.",
    "Every breath I take, my baby takes too.",
    "We are connected, heart to heart.",
    "My body is a safe and loving home."
];

const STRETCH_EXERCISES = {
    'none': {
        name: 'Select a stretch',
        description: 'Safe and gentle stretches to relieve tension.',
        emoji: '🧘‍♀️'
    },
    'neck-tilt': {
        name: 'Gentle Neck Tilt',
        description: 'Slowly tilt your head to one side, hold, then switch. Avoid rolling.',
        emoji: '🙆‍♀️'
    },
    'shoulder-roll': {
        name: 'Shoulder Rolls',
        description: 'Roll your shoulders up, back, and down. Repeat slowly.',
        emoji: '🤷‍♀️'
    },
    'cat-cow': {
        name: 'Cat-Cow Pose',
        description: 'On all fours, inhale to arch your back, exhale to round your spine.',
        emoji: '🐈'
    },
    'side-stretch': {
        name: 'Seated Side Stretch',
        description: 'Sit cross-legged. Lift one arm up and gently lean to the side.',
        emoji: '🙋‍♀️'
    },
    'hip-opener': {
        name: 'Butterfly Pose',
        description: 'Sit with the soles of your feet together. Gently lean forward.',
        emoji: '🦋'
    }
};

/**
 * Initialize all event listeners and state for the Calm Space tab.
 * @param {string} uid - The current user's ID.
 */
export function initializeCalmSpace(uid) {
    if (!uid) return;
    currentUserId = uid;

    // Cache DOM elements
    breathingSelect = document.getElementById('breathing-select');
    startBreathingBtn = document.getElementById('start-breathing-btn');
    stopBreathingBtn = document.getElementById('stop-breathing-btn');
    breathingCircle = document.getElementById('breathing-circle');
    breathingText = document.getElementById('breathing-text');
    breathingGlowRing = document.getElementById('breathing-glow-ring');
    breathingDescription = document.getElementById('breathing-description');
    sparkleContainer = document.getElementById('sparkle-container');

    startMeditationBtn = document.getElementById('start-meditation-btn');
    stopMeditationBtn = document.getElementById('stop-meditation-btn');
    bellyGlow = document.getElementById('belly-glow');
    bellyOutline = document.getElementById('belly-outline');
    meditationGuideText = document.getElementById('meditation-guide-text');
    meditationTextPopup = document.getElementById('meditation-text-popup');

    stretchSelect = document.getElementById('stretch-select');
    startStretchBtn = document.getElementById('start-stretch-btn');
    stopStretchBtn = document.getElementById('stop-stretch-btn');
    stretchEmoji = document.getElementById('stretch-emoji');
    stretchTitle = document.getElementById('stretch-title');
    stretchDescription = document.getElementById('stretch-description');
    stretchCountdown = document.getElementById('stretch-countdown');

    playWaterReminderBtn = document.getElementById('play-water-reminder-btn');

    journalModal = document.getElementById('mindful-journal-modal');
    journalModalContent = document.getElementById('mindful-journal-modal-content');
    journalPrompt = document.getElementById('mindful-journal-prompt');
    journalMoodButtons = document.getElementById('journal-mood-buttons');
    journalSaveBtn = document.getElementById('journal-save-btn');
    journalSkipBtn = document.getElementById('journal-skip-btn');

    audioOcean = document.getElementById('audio-ocean-waves');
    audioHeartbeat = document.getElementById('audio-heartbeat');
    audioCalmTone = document.getElementById('audio-calm-tone');
    audioSparkle = document.getElementById('audio-sparkle');
    audioWaterReminder = document.getElementById('audio-water-reminder');

    // Set volumes for ambient sounds
    audioOcean.volume = 0.3;
    audioHeartbeat.volume = 0.5;

    // Add Event Listeners
    startBreathingBtn.addEventListener('click', handleStartBreathing);
    stopBreathingBtn.addEventListener('click', stopAllActivities);
    breathingSelect.addEventListener('change', updateBreathingDescription);

    startMeditationBtn.addEventListener('click', handleStartMeditation);
    stopMeditationBtn.addEventListener('click', stopAllActivities);

    startStretchBtn.addEventListener('click', handleStartStretch);
    stopStretchBtn.addEventListener('click', stopAllActivities);
    stretchSelect.addEventListener('change', updateStretchDescription);

    playWaterReminderBtn.addEventListener('click', playWaterReminder);

    journalSkipBtn.addEventListener('click', closeJournalModal);
    journalSaveBtn.addEventListener('click', saveJournalEntry);
    journalMoodButtons.addEventListener('click', handleJournalMoodSelect);
}

/**
 * Remove all event listeners and stop activities to prevent memory leaks.
 */
export function unloadCalmSpace() {
    stopAllActivities();
    // Note: We don't remove event listeners here because the elements are persistent.
    // If elements were being dynamically created/destroyed, we would.
    // Instead, stopAllActivities() handles the cleanup.
}

// --- Breathing Visualizer ---

function updateBreathingDescription() {
    const exercise = breathingSelect.value;
    if (BREATHING_EXERCISES[exercise]) {
        breathingDescription.textContent = BREATHING_EXERCISES[exercise].description;
    }
}

function handleStartBreathing() {
    const exercise = breathingSelect.value;
    if (exercise === 'none') {
        breathingText.textContent = 'Select an exercise first!';
        return;
    }
    stopAllActivities(); // Stop anything else
    activeExerciseName = BREATHING_EXERCISES[exercise].name;

    startBreathingBtn.classList.add('hidden');
    stopBreathingBtn.classList.remove('hidden');
    breathingGlowRing.classList.add('glow-pulse');

    // Play ocean waves
    audioOcean.play();

    const pattern = BREATHING_EXERCISES[exercise].pattern;
    let step = 0;

    function runStep() {
        const currentStep = pattern[step % pattern.length];
        
        breathingText.textContent = currentStep.text;
        breathingCircle.className = `w-32 h-32 rounded-full breathing-${currentStep.state}`;
        breathingCircle.style.transitionDuration = `${currentStep.duration}ms`;
        breathingGlowRing.style.transitionDuration = `${currentStep.duration}ms`;

        activeBreathingTimer = setTimeout(runStep, currentStep.duration);
        step++;
    }

    runStep(); // Start the first step immediately
}

// --- Baby Connection ---

function handleStartMeditation() {
    stopAllActivities();
    activeExerciseName = 'Baby Connection';
    startMeditationBtn.classList.add('hidden');
    stopMeditationBtn.classList.remove('hidden');

    // Play heartbeat
    audioHeartbeat.play();

    let textIndex = 0;
    
    function showNextText() {
        meditationTextPopup.classList.remove('active');
        
        // Wait for fade out
        setTimeout(() => {
            textIndex = (textIndex + 1) % MEDITATION_TEXTS.length;
            meditationTextPopup.textContent = MEDITATION_TEXTS[textIndex];
            meditationTextPopup.classList.add('active');
        }, 500); // 0.5s to fade out
    }
    
    // Initial text
    meditationTextPopup.textContent = MEDITATION_TEXTS[0];
    meditationTextPopup.classList.add('active');
    
    activeMeditationInterval = setInterval(showNextText, 11000); // 11 seconds as requested
}

// --- Gentle Stretches ---

function updateStretchDescription() {
    const exercise = stretchSelect.value;
    if (STRETCH_EXERCISES[exercise]) {
        stretchTitle.textContent = STRETCH_EXERCISES[exercise].name;
        stretchDescription.textContent = STRETCH_EXERCISES[exercise].description;
        stretchEmoji.textContent = STRETCH_EXERCISES[exercise].emoji;
    }
}

function handleStartStretch() {
    const exercise = stretchSelect.value;
    if (exercise === 'none') {
        stretchTitle.textContent = 'Select a stretch first!';
        return;
    }
    stopAllActivities();
    activeExerciseName = STRETCH_EXERCISES[exercise].name;

    startStretchBtn.classList.add('hidden');
    stopStretchBtn.classList.remove('hidden');
    stretchCountdown.classList.add('active');

    // Play calm tone
    audioCalmTone.play();

    let secondsLeft = 30;
    stretchCountdown.textContent = secondsLeft;

    activeStretchTimer = setInterval(() => {
        secondsLeft--;
        stretchCountdown.textContent = secondsLeft;
        if (secondsLeft <= 0) {
            clearInterval(activeStretchTimer);
            playSparkle();
            showJournalModal();
            stopAllActivities(); // Resets UI
        }
    }, 1000);
}

// --- Water Reminder ---

function playWaterReminder() {
    audioWaterReminder.currentTime = 0;
    audioWaterReminder.play();
}

// --- Journal Pop-up ---

function showJournalModal() {
    journalPrompt.textContent = `After your '${activeExerciseName}' session.`;
    selectedJournalMood = null;
    journalSaveBtn.disabled = true;
    journalSaveBtn.classList.add('opacity-50');
    
    // Reset button styles
    journalMoodButtons.querySelectorAll('.journal-mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    journalModal.classList.remove('hidden');
    setTimeout(() => journalModal.classList.add('active'), 10);
}

function closeJournalModal() {
    journalModal.classList.remove('active');
    setTimeout(() => journalModal.classList.add('hidden'), 300);
}

function handleJournalMoodSelect(e) {
    const selectedBtn = e.target.closest('.journal-mood-btn');
    if (!selectedBtn) return;

    // Remove selected from all
    journalMoodButtons.querySelectorAll('.journal-mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Add selected to clicked
    selectedBtn.classList.add('selected');
    selectedJournalMood = selectedBtn.dataset.mood;
    
    journalSaveBtn.disabled = false;
    journalSaveBtn.classList.remove('opacity-50');
}

async function saveJournalEntry() {
    if (!selectedJournalMood || !currentUserId) return;

    try {
        // --- FIX 3: Correct the usage of getWeekId and getDayId ---
        // const { weekId, dayId } = getWeekId(new Date()); // This was the buggy line
        const today = new Date();
        const weekId = getWeekId(today);
        const dayId = getDayId(today); // Use our new local function

        const dayRef = doc(db, 'users', currentUserId, 'wellness', weekId, 'days', dayId);

        // We will save this as 'calmMood' to distinguish it from the main mood log
        // We use updateDoc to merge, so we don't overwrite other wellness data.
        await updateDoc(dayRef, {
            calmMood: parseInt(selectedJournalMood)
        });

        playSparkle();
        closeJournalModal();

    } catch (error) {
        console.error("Error saving journal entry: ", error);
        // Handle error (e.g., show a message to the user)
    }
}


// --- Utility Functions ---

function playSparkle() {
    audioSparkle.currentTime = 0;
    audioSparkle.play();

    // Create a few sparkles
    for (let i = 0; i < 10; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.animationDelay = `${Math.random() * 0.5}s`;
        
        sparkleContainer.appendChild(sparkle);
        
        // Remove sparkle after animation
        setTimeout(() => {
            sparkle.remove();
        }, 1000);
    }
}

/**
 * Stops all running timers, intervals, and audio.
 * Resets the UI to its initial state.
 */
function stopAllActivities() {
    // Stop timers
    if (activeBreathingTimer) {
        clearTimeout(activeBreathingTimer);
        activeBreathingTimer = null;
        playSparkle();
        showJournalModal(); // Show journal after stopping
    }
    if (activeMeditationInterval) {
        clearInterval(activeMeditationInterval);
        activeMeditationInterval = null;
        playSparkle();
        showJournalModal();
    }
    if (activeStretchTimer) {
        clearInterval(activeStretchTimer);
        activeStretchTimer = null;
        // Don't show journal, it shows on completion
    }

    // Stop audio
    audioOcean.pause();
    audioOcean.currentTime = 0;
    audioHeartbeat.pause();
    audioHeartbeat.currentTime = 0;

    // Reset Breathing UI
    startBreathingBtn.classList.remove('hidden');
    stopBreathingBtn.classList.add('hidden');
    breathingCircle.className = 'w-32 h-32 rounded-full';
    breathingCircle.style.transform = 'scale(1)';
    breathingText.textContent = 'Select an exercise';
    breathingGlowRing.classList.remove('glow-pulse');

    // Reset Meditation UI
    startMeditationBtn.classList.remove('hidden');
    stopMeditationBtn.classList.add('hidden');
    meditationTextPopup.classList.remove('active');
    meditationTextPopup.textContent = '';

    // Reset Stretch UI
    startStretchBtn.classList.remove('hidden');
    stopStretchBtn.classList.add('hidden');
    stretchCountdown.classList.remove('active');
    stretchCountdown.textContent = '30';

    activeExerciseName = '';
}
