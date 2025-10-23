import { db } from './firebase.js';
import { getCurrentUserId } from './auth.js';
import { doc, collection, addDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- STATE ---
let calmMoodLogsRef;
let currentUserId;
let wellnessData;
let activeBreathingInterval = null;
let activeMeditationInterval = null;
let oceanWavesPlayer = null;
let heartbeatPlayer = null;
let waterReminderSynth = null;
let activeMood = null;
let currentExerciseName = null; // To track what exercise was just finished

// --- DOM ELEMENTS ---
let elements = {};

// --- BREATHING EXERCISES ---
const breathingExercises = {
    'diaphragmatic': {
        name: 'Diaphragmatic Breathing',
        instructions: [
            { text: "Breathe in deeply through your nose, letting your belly expand.", duration: 4000 },
            { text: "Exhale slowly through your mouth, letting your belly fall.", duration: 6000 }
        ],
        animationClass: 'animate-breathe-diaphragmatic'
    },
    'pursed-lip': {
        name: 'Pursed-Lip Breathing',
        instructions: [
            { text: "Breathe in through your nose for 2 seconds.", duration: 2000 },
            { text: "Pucker your lips and exhale slowly for 4 seconds.", duration: 4000 }
        ],
        animationClass: 'animate-breathe-pursed'
    },
    'alternate-nostril': {
        name: 'Alternate Nostril Breathing',
        instructions: [
            { text: "Close right nostril, inhale through left.", duration: 4000 },
            { text: "Close left, exhale through right.", duration: 6000 },
            { text: "Inhale through right nostril.", duration: 4000 },
            { text: "Close right, exhale through left.", duration: 6000 }
        ],
        animationClass: 'animate-breathe-alternate' // Will just pulse gently
    },
    'box': {
        name: 'Box Breathing',
        instructions: [
            { text: "Inhale for 4 seconds.", duration: 4000 },
            { text: "Hold your breath for 4 seconds.", duration: 4000 },
            { text: "Exhale for 4 seconds.", duration: 4000 },
            { text: "Hold the exhale for 4 seconds.", duration: 4000 }
        ],
        animationClass: 'animate-breathe-box'
    },
    '4-7-8': {
        name: '4-7-8 Breathing',
        instructions: [
            { text: "Breathe in for 4 seconds.", duration: 4000 },
            { text: "Hold your breath for 7 seconds.", duration: 7000 },
            { text: "Exhale completely for 8 seconds.", duration: 8000 }
        ],
        animationClass: 'animate-breathe-478'
    }
};

// --- MEDITATION TEXTS ---
const meditationTexts = [
    "Imagine your baby smiling inside.",
    "You are your baby's safe and loving home.",
    "Send a wave of love from your heart to your baby.",
    "Your baby feels your calmness and your joy.",
    "You are already a wonderful mother.",
    "Breathe in love, breathe out any tension."
];

/**
 * Initializes the Calm Space tab
 * @param {string} userId - The current user's ID
 * @param {object} initialWellnessData - The user's wellness data
 */
export function initializeCalmSpace(userId, initialWellnessData) {
    currentUserId = userId;
    wellnessData = initialWellnessData;
    calmMoodLogsRef = collection(db, `users/${currentUserId}/calmMoodLogs`);

    // Cache DOM elements
    elements = {
        breathingVisualizer: document.getElementById('breathing-visualizer'),
        breathingInstructions: document.getElementById('breathing-instructions'),
        breathingSelector: document.getElementById('breathing-selector'),
        stopBreathingBtn: document.getElementById('stop-breathing-btn'),
        meditationCard: document.getElementById('meditation-card'),
        meditationText: document.getElementById('meditation-text'),
        meditationBelly: document.getElementById('meditation-belly'),
        stretchGrid: document.getElementById('stretch-grid'),
        stretchPlayer: document.getElementById('stretch-player'),
        stretchTitle: document.getElementById('stretch-title'),
        stretchAnimation: document.getElementById('stretch-animation'),
        stretchCountdown: document.getElementById('stretch-countdown'),
        stretchCloseBtn: document.getElementById('stretch-close-btn'),
        waterReminderBtn: document.getElementById('water-reminder-btn'),
        journalModal: document.getElementById('journal-modal'),
        journalCloseBtn: document.getElementById('journal-modal-close-btn'),
        journalTitle: document.getElementById('journal-modal-title'),
        journalEmojiButtons: document.getElementById('journal-emoji-buttons'),
        journalSaveBtn: document.getElementById('journal-save-btn'),
        particlesContainer: document.getElementById('calm-particles')
    };

    // Initialize audio players (will start on first user interaction)
    setupAudio();

    // Setup event listeners
    setupEventListeners();

    // Create floating particles
    createFloatingParticles();
}

/**
 * Sets up all audio components using Tone.js
 */
function setupAudio() {
    // Ocean Waves: A looping noise generator
    oceanWavesPlayer = new Tone.NoisePlayer({
        noise: { type: 'pink' },
        envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 },
        filter: { type: 'lowpass', Q: 2, frequency: 600 },
        volume: -20 // Softer
    }).toDestination();
    oceanWavesPlayer.playbackRate = 0.5;

    // Heartbeat: A simple synth pulse
    heartbeatPlayer = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.001 },
        volume: -10
    }).toDestination();

    // Water Reminder: A simple, pleasant synth
    waterReminderSynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.5 },
        volume: -10
    }).toDestination();
}

/**
 * Binds all event listeners for the Calm Space tab
 */
function setupEventListeners() {
    // Breathing exercise selection
    if (elements.breathingSelector) {
        elements.breathingSelector.addEventListener('click', (e) => {
            const button = e.target.closest('.breathing-btn');
            if (button && button.dataset.exercise) {
                // Highlight selected button
                elements.breathingSelector.querySelectorAll('.breathing-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                startBreathingExercise(button.dataset.exercise);
            }
        });
    }

    // Stop breathing exercise
    if (elements.stopBreathingBtn) {
        elements.stopBreathingBtn.addEventListener('click', stopActiveExercise);
    }

    // Meditation card
    if (elements.meditationCard) {
        elements.meditationCard.addEventListener('click', () => {
            if (activeMeditationInterval) {
                stopMeditation();
            } else {
                startMeditation();
            }
        });
    }

    // Stretch selection
    if (elements.stretchGrid) {
        elements.stretchGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.stretch-card');
            if (card && card.dataset.stretch) {
                startStretch(card.dataset.stretch, card.querySelector('h4').textContent);
            }
        });
    }

    // Close stretch player
    if (elements.stretchCloseBtn) {
        elements.stretchCloseBtn.addEventListener('click', stopStretch);
    }

    // Water reminder
    if (elements.waterReminderBtn) {
        elements.waterReminderBtn.addEventListener('click', playWaterReminder);
    }

    // Journal Modal
    if (elements.journalCloseBtn) {
        elements.journalCloseBtn.addEventListener('click', closeJournalModal);
    }
    if (elements.journalModal) {
        elements.journalModal.addEventListener('click', (e) => {
            if (e.target === elements.journalModal) {
                closeJournalModal();
            }
        });
    }
    if (elements.journalEmojiButtons) {
        elements.journalEmojiButtons.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button) {
                activeMood = button.dataset.mood;
                elements.journalEmojiButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                elements.journalSaveBtn.disabled = false;
            }
        });
    }
    if (elements.journalSaveBtn) {
        elements.journalSaveBtn.addEventListener('click', saveMoodEntry);
    }
}

/**
 * Stops any currently running exercise (breathing or meditation)
 */
function stopActiveExercise() {
    if (activeBreathingInterval) {
        clearInterval(activeBreathingInterval);
        activeBreathingInterval = null;
        if (oceanWavesPlayer.state === 'started') {
            oceanWavesPlayer.stop();
        }
        elements.breathingVisualizer.className = 'breathing-circle';
        elements.breathingInstructions.textContent = 'Select an exercise to begin.';
        elements.breathingSelector.querySelectorAll('.breathing-btn').forEach(btn => btn.classList.remove('active'));
        showJournalPopup(currentExerciseName); // Show journal on stop
        currentExerciseName = null;
    }
}

/**
 * Starts a selected breathing exercise
 * @param {string} exerciseKey - The key (e.g., 'box') of the exercise
 */
async function startBreathingExercise(exerciseKey) {
    // Start Tone.js context on user interaction
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    stopActiveExercise(); // Stop any previous exercise
    stopMeditation(); // Also stop meditation

    const exercise = breathingExercises[exerciseKey];
    if (!exercise) return;

    currentExerciseName = exercise.name;
    elements.breathingVisualizer.className = 'breathing-circle'; // Reset
    void elements.breathingVisualizer.offsetWidth; // Trigger reflow
    elements.breathingVisualizer.classList.add(exercise.animationClass);
    elements.stopBreathingBtn.classList.remove('hidden');

    // Start ocean sounds
    oceanWavesPlayer.start();

    let instructionIndex = 0;
    const runInstruction = () => {
        const instruction = exercise.instructions[instructionIndex];
        elements.breathingInstructions.textContent = instruction.text;
        
        activeBreathingInterval = setTimeout(() => {
            instructionIndex = (instructionIndex + 1) % exercise.instructions.length;
            runInstruction();
        }, instruction.duration);
    };

    runInstruction();
}

/**
 * Starts the Baby Connection Meditation
 */
async function startMeditation() {
    // Start Tone.js context on user interaction
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    stopActiveExercise(); // Stop breathing exercise

    if (activeMeditationInterval) return; // Already running

    currentExerciseName = "Baby Connection Meditation";
    elements.meditationCard.classList.add('active');
    elements.meditationBelly.classList.add('animate-pulse-belly');
    
    // Start heartbeat
    heartbeatPlayer.triggerAttackRelease("C2", "8n", Tone.now());
    heartbeatPlayer.triggerAttackRelease("C2", "8n", Tone.now() + 0.3);
    
    activeMeditationInterval = setInterval(() => {
        // Play heartbeat
        heartbeatPlayer.triggerAttackRelease("C2", "8n", Tone.now());
        heartbeatPlayer.triggerAttackRelease("C2", "8n", Tone.now() + 0.3);

        // Change text every 11 seconds (this interval is approx 1 second)
        // A bit of a hack, but simpler than multiple intervals
        const seconds = new Date().getSeconds();
        if (seconds % 11 === 0) {
            const randomIndex = Math.floor(Math.random() * meditationTexts.length);
            elements.meditationText.textContent = meditationTexts[randomIndex];
        }
    }, 1000); // Check every second

    // Set initial text
    elements.meditationText.textContent = meditationTexts[0];
}

/**
 * Stops the Baby Connection Meditation
 */
function stopMeditation() {
    if (activeMeditationInterval) {
        clearInterval(activeMeditationInterval);
        activeMeditationInterval = null;
        elements.meditationCard.classList.remove('active');
        elements.meditationBelly.classList.remove('animate-pulse-belly');
        elements.meditationText.textContent = "Tap to connect with your baby.";
        showJournalPopup(currentExerciseName); // Show journal on stop
        currentExerciseName = null;
    }
}

/**
 * Shows the stretch player modal
 * @param {string} stretchKey - The key for the stretch (e.g., 'cat-cow')
 * @param {string} stretchName - The display name (e.g., 'Cat-Cow')
 */
function startStretch(stretchKey, stretchName) {
    stopActiveExercise();
    stopMeditation();

    currentExerciseName = stretchName;
    elements.stretchTitle.textContent = stretchName;
    
    // TODO: Update animation/emoji
    // For now, we'll just show a generic emoji
    elements.stretchAnimation.innerHTML = `<div class="text-7xl">${getStretchEmoji(stretchKey)}</div>`;
    
    elements.stretchPlayer.classList.remove('hidden');
    elements.stretchPlayer.classList.add('active');

    let countdown = 30;
    elements.stretchCountdown.textContent = `${countdown}s`;
    
    activeBreathingInterval = setInterval(() => {
        countdown--;
        elements.stretchCountdown.textContent = `${countdown}s`;
        if (countdown <= 0) {
            stopStretch();
        }
    }, 1000);
}

/**
 * Hides the stretch player and shows the journal
 */
function stopStretch() {
    if (activeBreathingInterval) {
        clearInterval(activeBreathingInterval);
        activeBreathingInterval = null;
    }
    elements.stretchPlayer.classList.remove('active');
    setTimeout(() => {
        elements.stretchPlayer.classList.add('hidden');
    }, 300);
    
    showJournalPopup(currentExerciseName);
    currentExerciseName = null;
}

/**
 * Gets an emoji for a given stretch key
 * @param {string} stretchKey 
 * @returns {string} Emoji
 */
function getStretchEmoji(stretchKey) {
    const emojis = {
        'cat-cow': '🐄',
        'pelvic-tilt': '🧘‍♀️',
        'side-stretch': '🙆‍♀️',
        'neck-release': '💆‍♀️',
        'childs-pose': '🙇‍♀️',
        'hip-opener': '🤸‍♀️'
    };
    return emojis[stretchKey] || '🧘‍♀️';
}

/**
 * Plays the water reminder sound
 */
async function playWaterReminder() {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
    const now = Tone.now();
    waterReminderSynth.triggerAttackRelease("C5", "8n", now);
    waterReminderSynth.triggerAttackRelease("E5", "8n", now + 0.2);
    waterReminderSynth.triggerAttackRelease("G5", "8n", now + 0.4);
}

/**
 * Shows the mindful journal pop-up
 * @param {string} exerciseName - The name of the exercise just completed
 */
function showJournalPopup(exerciseName = "your session") {
    if (!exerciseName) return; // Don't show if no exercise was active

    elements.journalTitle.textContent = `After ${exerciseName}, how do you feel?`;
    activeMood = null;
    elements.journalEmojiButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    elements.journalSaveBtn.disabled = true;
    elements.journalSaveBtn.textContent = 'Save';

    elements.journalModal.classList.remove('hidden');
    setTimeout(() => elements.journalModal.classList.add('active'), 10);
}

/**
 * Closes the mindful journal pop-up
 */
function closeJournalModal() {
    elements.journalModal.classList.remove('active');
    setTimeout(() => elements.journalModal.classList.add('hidden'), 300);
}

/**
 * Saves the selected mood to Firebase
 */
async function saveMoodEntry() {
    if (!activeMood || !currentUserId) return;

    elements.journalSaveBtn.disabled = true;
    elements.journalSaveBtn.textContent = 'Saving...';

    try {
        await addDoc(calmMoodLogsRef, {
            mood: activeMood,
            exercise: currentExerciseName || 'Unknown',
            createdAt: serverTimestamp(),
            week: wellnessData ? Math.floor(Math.abs(new Date() - new Date(wellnessData.pregnancyStartDate)) / (1000 * 60 * 60 * 24 * 7)) : 0
        });
        
        elements.journalSaveBtn.textContent = 'Saved! ✨';
        setTimeout(closeJournalModal, 1000);

    } catch (error) {
        console.error("Error saving mood log:", error);
        elements.journalSaveBtn.textContent = 'Error. Try again.';
        elements.journalSaveBtn.disabled = false;
    }
}

/**
 * Creates the floating particle effect
 */
function createFloatingParticles() {
    if (!elements.particlesContainer) return;
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'calm-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 10}s`;
        particle.style.width = `${Math.random() * 4 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.opacity = Math.random() * 0.5 + 0.2;
        elements.particlesContainer.appendChild(particle);
    }
}

/**
 * Function called by main.js when this tab is switched to.
 * We can use this to restart animations if needed.
 */
export function handleCalmSpaceTabSwitch() {
    // Re-create particles or restart animations if they were stopped
    if (elements.particlesContainer && elements.particlesContainer.children.length === 0) {
        createFloatingParticles();
    }
}

/**
 * Cleans up when the user logs out
 */
export function unloadCalmSpace() {
    stopActiveExercise();
    stopMeditation();
    stopStretch();

    if (oceanWavesPlayer) {
        oceanWavesPlayer.dispose();
        oceanWavesPlayer = null;
    }
    if (heartbeatPlayer) {
        heartbeatPlayer.dispose();
        heartbeatPlayer = null;
    }
    if (waterReminderSynth) {
        waterReminderSynth.dispose();
        waterReminderSynth = null;
    }

    if (elements.particlesContainer) {
        elements.particlesContainer.innerHTML = '';
    }

    // Clear intervals
    if (activeBreathingInterval) clearInterval(activeBreathingInterval);
    if (activeMeditationInterval) clearInterval(activeMeditationInterval);
    activeBreathingInterval = null;
    activeMeditationInterval = null;

    // TODO: Remove event listeners if necessary
}
