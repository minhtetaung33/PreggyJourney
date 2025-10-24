import { db } from './firebase.js';
import { getCurrentUserId } from './auth.js';
import { elements, createSparkleAnimation } from './ui.js'; // Import elements from ui.js
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    limit,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements (Now populated by ui.js) ---
// We will use the 'elements' object imported from ui.js directly.

// --- Helper Function ---
function formatTime(seconds) {
    // Ensure seconds is non-negative
    const safeSeconds = Math.max(0, seconds);
    return `${Math.floor(safeSeconds / 60)}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}

// --- Data from Instructions ---
const breathingData = {
    '4-7-8': {
        name: '4-7-8 Breathing',
        steps: [
            { instruction: 'Inhale through your nose for 4 seconds', duration: 4000, type: 'inhale' },
            { instruction: 'Hold your breath for 7 seconds', duration: 7000, type: 'hold' },
            { instruction: 'Exhale through your mouth for 8 seconds', duration: 8000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-blue-400', // Example color
        instructions: ["Sit comfortably, shoulders relaxed.", "Inhale through your nose for 4 seconds — let your belly expand.", "Hold your breath gently for 7 seconds.", "Exhale slowly through your mouth for 8 seconds, as if blowing through a straw.", "Repeat 4–5 cycles."]
    },
    'box': {
        name: 'Box Breathing',
        steps: [
            { instruction: 'Inhale for 4 seconds', duration: 4000, type: 'inhale' },
            { instruction: 'Hold for 4 seconds', duration: 4000, type: 'hold' },
            { instruction: 'Exhale for 4 seconds', duration: 4000, type: 'exhale' },
            { instruction: 'Hold for 4 seconds', duration: 4000, type: 'hold' },
        ],
        visual: 'box-glow',
        color: 'bg-green-400', // Example color
        instructions: ["Sit upright, close eyes softly.", "Inhale through your nose for 4 seconds.", "Hold your breath for 4 seconds.", "Exhale through your mouth for 4 seconds.", "Hold again for 4 seconds.", "Imagine tracing a glowing square with your breath — one side per step."]
    },
    'wave': {
        name: 'Wave Breathing',
        steps: [
            { instruction: 'Inhale as the wave rises', duration: 5000, type: 'inhale' },
            { instruction: 'Exhale as the wave falls', duration: 5000, type: 'exhale' },
        ],
        visual: 'wave-glow',
        color: 'bg-cyan-400', // Example color
        instructions: ["Sit or lie down comfortably.", "Watch the wave rise — inhale slowly through your nose.", "As it falls, exhale softly through your mouth.", "Continue matching your breath with each wave."]
    },
    'heartbeat': {
        name: 'Heartbeat Sync',
        steps: [
            { instruction: 'Inhale gently', duration: 4000, type: 'inhale' },
            { instruction: 'Exhale slowly', duration: 6000, type: 'exhale' },
        ],
        visual: 'heartbeat-pulse',
        color: 'bg-pink-400', // Example color
        instructions: ["Place one hand on your heart and one on your belly.", "Breathe in gently to the rhythm of your heartbeat.", "Exhale longer, feeling your heart slow down.", "Imagine a warm pink light connecting your heartbeat with your baby’s."]
    },
    'energizer': { // Corrected key from HTML
        name: 'Morning Energizer',
        steps: [
            { instruction: 'Inhale for 3 seconds', duration: 3000, type: 'inhale' },
            { instruction: 'Exhale for 3 seconds', duration: 3000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-yellow-400', // Example color
        instructions: ["Sit up or stand tall, open your chest.", "Inhale through your nose for 3 seconds.", "Exhale through your mouth for 3 seconds.", "Smile as you exhale — imagine light filling your body.", "Repeat 5–6 cycles."]
    },
    'sleep': {
        name: 'Sleep Wind-Down',
        steps: [
            { instruction: 'Inhale for 5 seconds', duration: 5000, type: 'inhale' },
            { instruction: 'Hold for 2 seconds', duration: 2000, type: 'hold' },
            { instruction: 'Exhale for 7 seconds', duration: 7000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-indigo-400', // Example color
        instructions: ["Lie comfortably with pillow support.", "Close your eyes, hands on your belly.", "Inhale for 5 seconds, hold for 2, exhale for 7.", "Let your body sink deeper into relaxation each time.", "Imagine stars fading in and out with your breath."]
    },
};

const meditationData = {
    'first-connection': {
        name: 'First Connection',
        instructions: [
            "Sit comfortably and rest your hands on your belly.",
            "Take a deep breath through your nose, exhale softly.",
            "As you breathe, imagine light traveling to your baby.",
            "Whisper softly, “I’m here, my little one.”",
            "Feel the warmth and connection growing stronger.",
            "Continue breathing, just feeling this connection for a few moments."
        ],
        color: 'bg-pink-500',
        audio: null,
        emoji: '💞'
    },
    'love-visualization': {
        name: 'Love Visualization',
        instructions: [
            "Close your eyes and imagine your baby surrounded by soft light.",
            "With each inhale, draw in love.",
            "With each exhale, send that love toward your baby.",
            "Smile and say, “You are loved, and you are safe.”",
            "Continue this pattern, breathing in love, and breathing out love to your baby."
        ],
        color: 'bg-rose-500',
        audio: null,
        emoji: '🥰'
    },
    'heartbeat-harmony': {
        name: 'Heartbeat Harmony',
        instructions: [
            "We will now play a gentle heartbeat sound. Breathe slowly in rhythm with it.",
            "In for 4 counts, out for 6.",
            "Place your hand over your heart, then your belly.",
            "Feel both beats connecting in sync.",
            "Visualize a golden thread between you and your baby.",
            "Stay with this feeling."
        ],
        color: 'bg-red-500',
        audio: 'https://archive.org/download/human-heartbeat-sound-effect/Human%20Heartbeat%20Sound%20Effect.mp3', // Example sound
        emoji: '❤️'
    },
    'peaceful-night': {
        name: 'Peaceful Night Bond',
        instructions: [
            "Lie down on your side or recline safely.",
            "Close your eyes and imagine your baby resting peacefully.",
            "Breathe softly. Imagine stars appearing with each breath.",
            "Let your mind empty as you feel peace and gratitude.",
            "Relax your body fully, from your toes to your head.",
            "Good night, little one."
        ],
        color: 'bg-indigo-600',
        audio: null,
        emoji: '😴'
    },
    'morning-gratitude': {
        name: 'Morning Gratitude',
        instructions: [
            "Sit by a window or soft light.",
            "Take a deep, fresh breath of morning air.",
            "Whisper, “Thank you, body, for today.”",
            "Feel the baby gently surrounded by calm energy.",
            "Set an intention for a peaceful day for both of you.",
            "Good morning, little one."
        ],
        color: 'bg-yellow-500',
        audio: null,
        emoji: '☀️'
    }
};

const stretchData = {
    'morning-flow': { // Corrected key from HTML
        name: 'Morning Energizer Flow',
        poses: [
            { name: "Stand Tall", instruction: "Stand tall, feet hip-width apart. Breathe deeply.", duration: 10000, visual: 'stand', emoji: '🧍‍♀️' },
            { name: "Overhead Reach", instruction: "Inhale — raise arms overhead.", duration: 10000, visual: 'reach', emoji: '🙌' },
            { name: "Slight Forward Bend", instruction: "Exhale — bend slightly forward with a flat back.", duration: 10000, visual: 'bend', emoji: '🙇‍♀️' },
            { name: "Shoulder Rolls", instruction: "Roll shoulders up and back slowly, 5 times.", duration: 15000, visual: 'shoulders', emoji: '🙆‍♀️' },
            { name: "Neck Circles", instruction: "Circle neck slowly, 3 times each way.", duration: 20000, visual: 'neck', emoji: '↪️' },
            { name: "Deep Breaths", instruction: "Finish with 3 deep breaths.", duration: 15000, visual: 'stand', emoji: '🧍‍♀️' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'back-hip': { // Corrected key from HTML
        name: 'Back & Hip Relief',
        poses: [
            { name: "Tabletop", instruction: "Get on hands and knees (tabletop position).", duration: 10000, visual: 'tabletop', emoji: '🐾' },
            { name: "Cow Pose", instruction: "Inhale — drop your belly, lift your gaze (cow pose).", duration: 10000, visual: 'cow-pose', emoji: '🐄' },
            { name: "Cat Pose", instruction: "Exhale — round your back, tuck your chin (cat pose).", duration: 10000, visual: 'cat-pose', emoji: '🐈' },
            { name: "Repeat Cat/Cow", instruction: "Flow between Cat and Cow 3 more times.", duration: 30000, visual: 'cat-cow-flow', emoji: '🔄' },
            { name: "Hip Circles", instruction: "Do gentle hip circles clockwise, 5 times.", duration: 15000, visual: 'hips', emoji: '🔄' },
            { name: "Hip Circles (Reverse)", instruction: "Now circle counter-clockwise, 5 times.", duration: 15000, visual: 'hips', emoji: '🔄' },
            { name: "Child's Pose", instruction: "End in Child’s Pose (knees wide, arms forward). Breathe.", duration: 30000, visual: 'childs-pose', emoji: '🙇‍♀️' }
        ],
        safe: ['early', 'mid'] // Child's pose might be uncomfortable late
    },
    'leg-relax': { // Corrected key from HTML
        name: 'Leg & Foot Relax',
        poses: [
            { name: "Sit Comfortably", instruction: "Sit comfortably with legs extended.", duration: 5000, visual: 'sit', emoji: '🧘‍♀️' },
            { name: "Ankle Rotations", instruction: "Rotate ankles 5 times each direction.", duration: 20000, visual: 'ankles', emoji: '👟' },
            { name: "Point and Flex", instruction: "Point and flex toes slowly, 10 times.", duration: 20000, visual: 'toes', emoji: '🦶' },
            { name: "Calf Massage", instruction: "Massage calves lightly while breathing deep.", duration: 30000, visual: 'calf', emoji: '🦵' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'shoulder-neck': { // Corrected key from HTML
        name: 'Shoulder & Neck Release',
        poses: [
            { name: "Sit Tall", instruction: "Sit cross-legged, spine straight.", duration: 5000, visual: 'sit-cross', emoji: '🧘‍♀️' },
            { name: "Shoulder Rolls", instruction: "Roll shoulders backward 5 times.", duration: 15000, visual: 'shoulders', emoji: '🙆‍♀️' },
            { name: "Side Neck Tilt", instruction: "Tilt head gently to the right. Hold.", duration: 15000, visual: 'neck-tilt', emoji: '↪️' },
            { name: "Side Neck Tilt", instruction: "Tilt head gently to the left. Hold.", duration: 15000, visual: 'neck-tilt', emoji: '↪️' },
            { name: "Chest Opener", instruction: "Interlace fingers behind back and open chest.", duration: 20000, visual: 'chest', emoji: '💖' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'sleep-wind': { // Corrected key from HTML
        name: 'Sleep Wind-Down Yoga',
        poses: [
            { name: "Lie Comfortably", instruction: "Lie on your side with pillow support.", duration: 10000, visual: 'side-lie', emoji: '😴' },
            { name: "Gentle Butterfly", instruction: "Sitting up, do a gentle butterfly pose (soles of feet together).", duration: 30000, visual: 'butterfly', emoji: '🦋' },
            { name: "Slow Breaths", instruction: "Return to side. Inhale slowly.", duration: 10000, visual: 'side-lie', emoji: '😴' },
            { name: "Humming Exhale", instruction: "Exhale with a gentle hum.", duration: 10000, visual: 'side-lie', emoji: '😴' },
            { name: "Relax", instruction: "Imagine each breath melting away tension.", duration: 30000, visual: 'side-lie', emoji: '😴' },
            { name: "Rest", instruction: "Stay still for 1 min, breathing deeply.", duration: 60000, visual: 'side-lie', emoji: '😴' }
        ],
        safe: ['early', 'mid', 'late']
    }
};

// --- NEW: Daily Summary Constants ---
const positiveMessages = [
    "You stayed mindful and grounded today 🌙",
    "Your calm energy is shining bright ✨",
    "What a peaceful day for you and your baby 💞",
    "You showed courage by slowing down today 🌙",
    "Even rest is progress — your calm is healing 💫",
    "Breathe, mama — you did your best, and that’s enough 💕",
    "Today you listened to your body, and that’s powerful 🌾",
    "Peace doesn’t always mean energy — it means presence 🌷",
    "You are learning to flow with your feelings, beautifully 🌊",
    "Calm takes practice — and today you showed grace 🌸",
    "Even quiet days build strength inside you 💗",
    "The world can wait; your peace matters most today ☁️",
    "You gave yourself the gift of stillness — that’s real self-love 🕊️"
];

const moodLabels = {
    low: "Breathing Through It",
    balanced: "Finding Balance",
    flow: "Peaceful Flow",
    joy: "Glowing with Joy"
};

const moodEmojis = {
    1: "😣",
    2: "😐",
    3: "🙂",
    4: "😊",
    5: "🥰"
};

const moodColors = {
    1: { gauge: "#60a5fa", bar: "bar-low", label: "label-g-low", theme: "summary-theme-low", glow: "#93c5fd" }, // blue
    2: { gauge: "#818cf8", bar: "bar-balanced", label: "label-g-balanced", theme: "summary-theme-balanced", glow: "#a78bfa" }, // indigo
    3: { gauge: "#a78bfa", bar: "bar-balanced", label: "label-g-balanced", theme: "summary-theme-balanced", glow: "#a78bfa" }, // purple
    4: { gauge: "#7dd3fc", bar: "bar-flow", label: "label-g-flow", theme: "summary-theme-flow", glow: "#0ea5e9" }, // sky
    5: { gauge: "#f9a8d4", bar: "bar-joy", label: "label-g-joy", theme: "summary-theme-joy", glow: "#f472b6" }  // pink
};


// --- State Variables ---
let userId = null;
let appId = null;
let synth = window.speechSynthesis;
let utterance = new SpeechSynthesisUtterance();
let femaleVoice = null; // For female voice
let activeBreathingTimer = null;
let activeMeditationTimer = null;

// --- UPDATED Stretch State Variables ---
let activeStretchTimer = null; // This will be the MAIN timer (e.g., 5 minutes)
let stretchTimeLeft = 0; // Remaining time for the MAIN timer
let currentStretchPoseTimer = null; // This will be the timer for *each pose*
let currentStretchRoutine = [];
let currentStretchPoseIndex = 0;
let isStretchPaused = true; // Start in paused state
// --- END UPDATED ---

let currentBreathingCycle;
let currentBreathingStep = 0;
let currentMeditationInstructions = [];
let currentMeditationStep = 0;
// UPDATED: Added durationMinutes to reflectionData
let reflectionData = { type: '', name: '', mood: '', durationMinutes: 0 };
let isDomCached = false; // Flag to prevent re-caching
let summaryListenerUnsubscribe = null; // For Firestore listener

// --- NEW: Helper to get YYYY-MM-DD date string ---
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- NEW: Helper to get yesterday's date string ---
function getYesterdayDateString(date) {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = (yesterday.getMonth() + 1).toString().padStart(2, '0');
    const day = yesterday.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}


// --- Main Initialization ---
export function initializeCalmSpace(uid, aid) {
    userId = uid;
    // Use __app_id if available, otherwise fall back
    appId = typeof __app_id !== 'undefined' ? __app_id : aid;
    
    // DOM elements are now cached by ui.js, so we can use them immediately.
    isDomCached = true; // Mark as "cached"
    loadVoices(); // Load speech synthesis voices

    if (!userId || !appId) {
        console.warn("Calm Space: Missing User ID or App ID. Saving will fail."); // Changed to warn
    }
    
    // Check if elements were found before adding listeners
    if (elements.breathingExerciseButtons) {
        initBreathing();
    } else {
        console.error("Calm Space: Could not find breathing exercise buttons to initialize.");
    }
    
    if (elements.meditationTypeButtons) {
        initMeditation();
    } else {
        console.error("Calm Space: Could not find meditation type buttons to initialize.");
    }
    
    if (elements.stretchRoutineButtons) {
        initStretches();
    } else {
        console.error("Calm Space: Could not find stretch routine buttons to initialize.");
    }

    if (elements.mindfulReflectionModal) {
        initReflectionModal();
    } else {
        console.error("Calm Space: Could not find reflection modal to initialize.");
    }

    // --- NEW: Initialize Daily Summary Listener ---
    initDailySummaryListener();
}

export function unloadCalmSpace() {
    stopBreathing();
    stopMeditation();
    stopStretches();
    
    // --- NEW: Unsubscribe from summary listener ---
    if (summaryListenerUnsubscribe) {
        summaryListenerUnsubscribe();
        summaryListenerUnsubscribe = null;
    }
    
    isDomCached = false; // Reset cache flag on unload
    // elements object is managed by ui.js, no need to clear it here
}

// --- Speech Synthesis ---
function loadVoices() {
    // getVoices() is tricky, it might be empty on first call.
    const setVoice = () => {
        const voices = synth.getVoices();
        if (voices.length > 0) {
            // Try to find a common female voice
            femaleVoice = voices.find(v => v.name.includes('Female') && v.lang.startsWith('en'));
            if (!femaleVoice) femaleVoice = voices.find(v => v.name.includes('Google US English') && v.gender === 'female'); // Common fallback
            if (!femaleVoice) femaleVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google UK English Female')); // Other common names
            if (!femaleVoice) femaleVoice = voices.find(v => v.lang.startsWith('en-US') && v.gender === 'female'); // Any US English female
            if (!femaleVoice) femaleVoice = voices.find(v => v.lang.startsWith('en-US')); // Any US English
        }
    };

    setVoice();
    if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = setVoice;
    }
}

function speak(text, isSilent) {
    if (isSilent || !text) return;
    synth.cancel(); // Stop any previous speech
    utterance.text = text;
    utterance.rate = 0.9;
    
    // --- VOICE CHANGE ---
    if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.pitch = 1; // Use natural pitch if voice is found
    } else {
        utterance.pitch = 1.2; // Fallback to higher pitch
    }
    // --- END VOICE CHANGE ---
    
    synth.speak(utterance);
}

// --- Breathing Visualizer ---
function initBreathing() {
    elements.breathingExerciseButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button && button.dataset.breath) {
            document.querySelectorAll('#breathing-exercise-buttons button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectBreathing(button.dataset.breath);
        }
    });

    if (elements.breathingPlayBtn) {
        elements.breathingPlayBtn.addEventListener('click', startBreathing);
    }
    if (elements.breathingStopBtn) {
        elements.breathingStopBtn.addEventListener('click', stopBreathing);
    }

    if (elements.breathingSilentToggle) {
        elements.breathingSilentToggle.addEventListener('change', toggleBreathingSoundIcon);
        toggleBreathingSoundIcon(); // Set initial state
    }

    // Select 4-7-8 by default
    const defaultBreathButton = elements.breathingExerciseButtons.querySelector('button[data-breath="4-7-8"]');
    if (defaultBreathButton) {
        defaultBreathButton.classList.add('active');
        selectBreathing('4-7-8');
    }
    
    stopBreathing(); // Reset to default "stopped" state with emoji
}

function toggleBreathingSoundIcon() {
    if (!elements.breathingSilentToggle || !elements.breathingSoundOnIcon || !elements.breathingSoundOffIcon) return;
    
    if (elements.breathingSilentToggle.checked) {
        // Silent mode is ON
        elements.breathingSoundOnIcon.classList.add('hidden');
        elements.breathingSoundOffIcon.classList.remove('hidden');
        synth.cancel(); // Stop any current speech
    } else {
        // Silent mode is OFF
        elements.breathingSoundOnIcon.classList.remove('hidden');
        elements.breathingSoundOffIcon.classList.add('hidden');
    }
}

function selectBreathing(type) {
    stopBreathing();
    currentBreathingCycle = breathingData[type];
    currentBreathingStep = 0;

    // Reset visuals
    elements.breathingOrb.style.display = 'none';
    elements.breathingVisualEmoji.style.display = 'none';
    elements.breathingAnimationElement.style.display = 'none';
    elements.breathingAnimationElement.className = 'w-full h-full absolute inset-0';
    
    elements.breathingOrb.className = 'w-40 h-40 rounded-full transition-all duration-3000 ease-in-out';
    
    // Remove previous color classes before adding new one
    elements.breathingOrb.classList.remove('bg-blue-400', 'bg-green-400', 'bg-cyan-400', 'bg-pink-400', 'bg-yellow-400', 'bg-indigo-400');
    elements.breathingOrb.classList.add(currentBreathingCycle.color);

    if (currentBreathingCycle.visual === 'orb-glow') {
        elements.breathingOrb.style.display = 'block';
    } else {
        elements.breathingAnimationElement.style.display = 'block';
        elements.breathingAnimationElement.classList.add(currentBreathingCycle.visual);
    }
    
    // Set instructions text
    if(elements.breathingInstruction) {
        elements.breathingInstruction.querySelector('p').textContent = `Now showing: ${currentBreathingCycle.name}`;
    }
    // Set instructions steps list
    const instructionHtml = currentBreathingCycle.instructions.map(step => `<li>${step}</li>`).join('');
    const stepsList = elements.breathingStepsList; // Use cached element
    if (stepsList) {
        stepsList.innerHTML = instructionHtml;
    }
    
    // Hide the emoji again after selecting
    elements.breathingVisualEmoji.style.display = 'none';
}

function startBreathing() {
    const durationMinutes = parseInt(elements.breathingTimerInput.value);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
        if(elements.breathingInstruction) {
            elements.breathingInstruction.querySelector('p').textContent = "Please set a valid timer duration (in minutes).";
        }
        return;
    }
    
    if (!currentBreathingCycle) {
        if(elements.breathingInstruction) {
            elements.breathingInstruction.querySelector('p').textContent = "Please select an exercise first!";
        }
        return;
    }
    
    const duration = durationMinutes * 60; // Convert minutes to seconds
    
    stopBreathing(); // Clear any previous state
    
    // Update UI
    elements.breathingPlayBtn.classList.add('hidden');
    elements.breathingStopBtn.classList.remove('hidden');
    if (elements.breathingVisualEmoji) elements.breathingVisualEmoji.style.display = 'none';
    
    // Show the correct visual for the selected exercise
    if (currentBreathingCycle.visual === 'orb-glow') {
        elements.breathingOrb.style.display = 'block';
    } else {
        elements.breathingAnimationElement.style.display = 'block';
    }

    let timeLeft = duration;
    elements.breathingTimerDisplay.textContent = formatTime(timeLeft);
    
    activeBreathingTimer = setInterval(() => {
        timeLeft--;
        elements.breathingTimerDisplay.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            stopBreathing();
            // UPDATED: Pass durationMinutes
            openReflectionModal('breathing', currentBreathingCycle.name, durationMinutes);
        }
    }, 1000);

    runBreathingAnimation();
}


function runBreathingAnimation() {
    if (!currentBreathingCycle || !activeBreathingTimer) return; // Check timer too
    const isSilent = elements.breathingSilentToggle.checked;
    
    const step = currentBreathingCycle.steps[currentBreathingStep];
    speak(step.instruction, isSilent);
    if(elements.breathingInstruction) {
        elements.breathingInstruction.querySelector('p').textContent = step.instruction; // Update instruction text
    }

    // Handle animation
    const orb = elements.breathingOrb;
    const animEl = elements.breathingAnimationElement;
    orb.style.transitionDuration = `${step.duration}ms`;
    animEl.style.transitionDuration = `${step.duration}ms`;

    if (step.type === 'inhale') {
        orb.style.transform = 'scale(1.5)';
        orb.style.opacity = '1';
        if (currentBreathingCycle.visual === 'box-glow') animEl.classList.add('box-inhale');
        if (currentBreathingCycle.visual === 'wave-glow') animEl.style.transform = 'scaleY(0.8)';
    } else if (step.type === 'exhale') {
        orb.style.transform = 'scale(1)';
        orb.style.opacity = '0.7';
        if (currentBreathingCycle.visual === 'box-glow') animEl.classList.add('box-exhale');
        if (currentBreathingCycle.visual === 'wave-glow') animEl.style.transform = 'scaleY(0.2)';
    } else if (step.type === 'hold') {
        if (currentBreathingCycle.visual === 'box-glow') {
            animEl.classList.add(animEl.classList.contains('box-inhale') ? 'box-hold1' : 'box-hold2');
        }
        // Orb just stays at current scale/opacity during hold
    }
    
    if (currentBreathingCycle.visual === 'heartbeat-pulse') {
        // Heartbeat animation is CSS only, just need the class
        if (!orb.classList.contains('heartbeat')) { // Add only once
           orb.classList.add('heartbeat');
        }
    } else {
        orb.classList.remove('heartbeat'); // Remove if not heartbeat type
    }

    // Loop to next step
    setTimeout(() => {
        // Reset box animation classes
        if (currentBreathingCycle.visual === 'box-glow') {
            // Reset carefully to avoid breaking the base class
            animEl.className = animEl.className.replace(/box-(inhale|hold1|exhale|hold2)/g, '').trim();
        }
        
        currentBreathingStep = (currentBreathingStep + 1) % currentBreathingCycle.steps.length;
        if (activeBreathingTimer) { // Only continue if timer is active
            runBreathingAnimation();
        } else {
            // Timer stopped mid-cycle, reset visuals
            stopBreathing(); 
        }
    }, step.duration);
}

function stopBreathing() {
    clearInterval(activeBreathingTimer);
    activeBreathingTimer = null;
    synth.cancel();
    if (elements.breathingTimerDisplay) {
        elements.breathingTimerDisplay.textContent = '0:00';
    }
    if (elements.breathingInstruction && elements.breathingInstruction.querySelector('p')) {
        elements.breathingInstruction.querySelector('p').textContent = 'Select an exercise and timer to begin.';
        // Clear steps list too
        if(elements.breathingStepsList) elements.breathingStepsList.innerHTML = '';
    }
    if (elements.breathingOrb) {
        elements.breathingOrb.style.transform = 'scale(1)';
        elements.breathingOrb.style.opacity = '0.7';
        elements.breathingOrb.classList.remove('heartbeat');
        elements.breathingOrb.style.display = 'none'; // Hide orb
    }
    // NEW: Reset UI
    if (elements.breathingAnimationElement) {
        elements.breathingAnimationElement.style.display = 'none'; // Hide animations
        elements.breathingAnimationElement.className = 'w-full h-full absolute inset-0';
    }
    if (elements.breathingVisualEmoji) {
        elements.breathingVisualEmoji.textContent = '🧘‍♀️'; // Show default emoji
        elements.breathingVisualEmoji.style.display = 'block';
    }
    if (elements.breathingPlayBtn) elements.breathingPlayBtn.classList.remove('hidden');
    if (elements.breathingStopBtn) elements.breathingStopBtn.classList.add('hidden');
}

// --- Meditation ---
function initMeditation() {
    elements.meditationTypeButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button && button.dataset.meditation) {
            document.querySelectorAll('#meditation-type-buttons button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectMeditation(button.dataset.meditation);
        }
    });

    elements.startMeditationBtn.addEventListener('click', startMeditation);
    elements.stopMeditationBtn.addEventListener('click', stopMeditation); // NEW

    // NEW: Silent Toggle Listener
    if (elements.meditationVoiceToggle) {
        elements.meditationVoiceToggle.addEventListener('change', toggleMeditationSoundIcon);
        toggleMeditationSoundIcon(); // Set initial state
    }

    // Select first one by default
    const defaultMeditationButton = elements.meditationTypeButtons.querySelector('button');
    if (defaultMeditationButton) {
        defaultMeditationButton.classList.add('active');
        selectMeditation(defaultMeditationButton.dataset.meditation);
    }
}

function toggleMeditationSoundIcon() {
    if (!elements.meditationVoiceToggle || !elements.meditationSoundOnIcon || !elements.meditationSoundOffIcon) return;
    if (elements.meditationVoiceToggle.checked) { // Silent is ON
        elements.meditationSoundOnIcon.classList.add('hidden');
        elements.meditationSoundOffIcon.classList.remove('hidden');
        synth.cancel();
    } else { // Silent is OFF
        elements.meditationSoundOnIcon.classList.remove('hidden');
        elements.meditationSoundOffIcon.classList.add('hidden');
    }
}


function selectMeditation(type) {
    stopMeditation();
    const meditation = meditationData[type];
    currentMeditationInstructions = meditation.instructions;
    
    elements.meditationOrb.className = 'w-24 h-24 rounded-full transition-all duration-3000 ease-in-out opacity-30'; // Reset class
    // Remove previous color classes before adding new one
    elements.meditationOrb.classList.remove('bg-pink-500', 'bg-rose-500', 'bg-red-500', 'bg-indigo-600', 'bg-yellow-500');
    elements.meditationOrb.classList.add(meditation.color);
    if(elements.meditationInstruction) {
        elements.meditationInstruction.textContent = 'Set your timer and press play to begin.';
    }
    
    // NEW: Set emoji
    if (elements.meditationVisualEmoji) {
        elements.meditationVisualEmoji.textContent = meditation.emoji || '💖';
    }
    
    if (meditation.audio) {
        elements.meditationAudioPlayer.src = meditation.audio;
    } else {
        elements.meditationAudioPlayer.src = ''; // Clear src if no audio
    }
}

function startMeditation() {
    // FIX: Get meditation type *before* starting
    const selectedButton = document.querySelector('#meditation-type-buttons button.active');
    if (!selectedButton) {
        if (elements.meditationInstruction) elements.meditationInstruction.textContent = 'Please select a meditation type first.';
        return;
    }
    const type = selectedButton.dataset.meditation;
    const meditation = meditationData[type];
    
    stopMeditation();
    // UPDATED: Get duration in minutes for reflection
    const durationMinutes = parseInt(elements.meditationTimerInput.value);
    const duration = durationMinutes * 60; // Get duration in seconds
    if (isNaN(duration) || duration <= 0) {
        if (elements.meditationInstruction) elements.meditationInstruction.textContent = 'Please set a valid timer duration (in minutes).';
        return;
    }

    // NEW: Update button UI
    elements.startMeditationBtn.classList.add('hidden');
    elements.stopMeditationBtn.classList.remove('hidden');
    elements.stopMeditationBtn.parentElement.classList.add('grid-cols-2');
    elements.stopMeditationBtn.parentElement.classList.remove('grid-cols-1');


    let timeLeft = duration;
    elements.meditationTimerDisplay.textContent = formatTime(timeLeft);
    elements.meditationOrb.classList.add('active'); // Start glow animation

    activeMeditationTimer = setInterval(() => {
        timeLeft--;
        elements.meditationTimerDisplay.textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            stopMeditation();
            // UPDATED: Pass durationMinutes
            openReflectionModal('meditation', meditation.name, durationMinutes); // Use stored meditation name
        }
    }, 1000);
    
    if (meditation && meditation.audio) {
       elements.meditationAudioPlayer.play().catch(e => console.error("Audio play failed:", e)); 
       elements.meditationAudioPlayer.loop = true;
    }


    currentMeditationStep = 0;
    runMeditationGuide();
}

function runMeditationGuide() {
    if (!activeMeditationTimer) return; // Stop if timer ended
    
    if (currentMeditationStep >= currentMeditationInstructions.length) {
        currentMeditationStep = 0; // Loop back to the beginning
    }
    
    const isSilent = elements.meditationVoiceToggle.checked;
    const instruction = currentMeditationInstructions[currentMeditationStep];
    if (elements.meditationInstruction) elements.meditationInstruction.textContent = instruction;
    speak(instruction, isSilent);

    // Set onend handler *before* speaking
    utterance.onend = () => {
        utterance.onend = null; 
        if (activeMeditationTimer) { // Only proceed if timer is still running
            currentMeditationStep++;
            setTimeout(runMeditationGuide, 3000); // Wait 3s, then play next (or first) instruction
        }
    };
    
    // Safety fallback if speak doesn't trigger onend (e.g., if isSilent is true or speech fails)
    if (isSilent || !synth.speaking) {
         const instructionDuration = (instruction.length * 60) + 3000; // rough guess: 60ms per char + 3s pause
         setTimeout(() => {
             if (utterance.onend) utterance.onend(); // Manually trigger onend if it's still set
         }, instructionDuration);
    }
}


function stopMeditation() {
    clearInterval(activeMeditationTimer);
    activeMeditationTimer = null;
    synth.cancel();
    utterance.onend = null;
    
    if (elements.meditationAudioPlayer) {
        elements.meditationAudioPlayer.pause();
        elements.meditationAudioPlayer.currentTime = 0;
    }
    
    if (elements.meditationTimerDisplay) {
        elements.meditationTimerDisplay.textContent = '0:00';
    }
    if (elements.meditationInstruction) {
        elements.meditationInstruction.textContent = 'Select a meditation and timer to begin.';
    }
    if (elements.meditationOrb) {
        elements.meditationOrb.classList.remove('active'); // Stop glow
    }
    if (elements.startMeditationBtn) {
        elements.startMeditationBtn.classList.remove('hidden');
    }
    if (elements.stopMeditationBtn) {
        elements.stopMeditationBtn.classList.add('hidden');
    }
    if (elements.meditationVisualEmoji) {
        elements.meditationVisualEmoji.textContent = '💖';
    }
}

// --- Stretches ---
function initStretches() {
    elements.stretchRoutineButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button && button.dataset.stretch) {
            document.querySelectorAll('#stretch-routine-buttons button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            selectStretchRoutine(button.dataset.stretch);
        }
    });

    elements.stretchPlayPauseBtn.addEventListener('click', playPauseStretches);
    elements.stretchNextPoseBtn.addEventListener('click', nextPose);
    elements.stretchPrevPoseBtn.addEventListener('click', prevPose);
    
    if (elements.stretchVoiceToggle) {
        elements.stretchVoiceToggle.addEventListener('change', toggleStretchSoundIcon);
        toggleStretchSoundIcon(); // Set initial state
    }
    
    const defaultStretchButton = elements.stretchRoutineButtons.querySelector('button');
    if (defaultStretchButton) {
        defaultStretchButton.classList.add('active');
        selectStretchRoutine(defaultStretchButton.dataset.stretch);
    }
    stopStretches(); // Set initial stopped state
}

function toggleStretchSoundIcon() {
    if (!elements.stretchVoiceToggle || !elements.stretchSoundOnIcon || !elements.stretchSoundOffIcon) return;
    if (elements.stretchVoiceToggle.checked) { // Silent is ON
        elements.stretchSoundOnIcon.classList.add('hidden');
        elements.stretchSoundOffIcon.classList.remove('hidden');
        synth.cancel();
    } else { // Silent is OFF
        elements.stretchSoundOnIcon.classList.remove('hidden');
        elements.stretchSoundOffIcon.classList.add('hidden');
    }
}


function selectStretchRoutine(type) {
    stopStretches(); // Stop any previous routine
    const routine = stretchData[type];
    
    if (!routine) {
        console.error("Selected stretch routine not found:", type);
        if (elements.stretchInstruction) {
            elements.stretchInstruction.querySelector('p').textContent = "Error: Could not find selected routine.";
        }
        return;
    }
    
    currentStretchRoutine = routine.poses;

    if (currentStretchRoutine.length === 0) {
        if (elements.stretchInstruction) {
            elements.stretchInstruction.querySelector('p').textContent = "This routine has no poses defined.";
        }
        if (elements.stretchPoseDisplay) elements.stretchPoseDisplay.textContent = "0 / 0";
        if (elements.stretchVisual) elements.stretchVisual.textContent = '🧘‍♀️'; // NEW
        currentStretchPoseIndex = 0; // Reset index
        return;
    }
    
    currentStretchPoseIndex = 0;
    displayPose(); // Display the first pose (will NOT auto-play)
}

function displayPoseUI(pose) {
    if (!pose) {
        // Default state
        if (elements.stretchInstruction) elements.stretchInstruction.querySelector('p').textContent = 'Select a routine and set a timer to begin.';
        if (elements.stretchPoseDisplay) elements.stretchPoseDisplay.textContent = 'Select a routine';
        if (elements.stretchVisual) elements.stretchVisual.textContent = '🧘‍♀️';
        return;
    }

    // Update with pose data
    if (elements.stretchInstruction) {
        elements.stretchInstruction.querySelector('p').textContent = pose.instruction;
    }
    if (elements.stretchPoseDisplay) {
        elements.stretchPoseDisplay.textContent = `${pose.name} (${currentStretchPoseIndex + 1}/${currentStretchRoutine.length})`;
    }
    
    if (elements.stretchVisual) {
        elements.stretchVisual.className = 'transition-all duration-500 text-6xl'; // Reset classes, add emoji size
        elements.stretchVisual.innerHTML = ''; // Clear previous content
    
        if (pose.emoji) {
            elements.stretchVisual.textContent = pose.emoji;
        } else {
            elements.stretchVisual.innerHTML = `<span class="text-3xl p-4">${pose.name}</span>`; // Default text if no visual
        }
    }
}

function displayPose() {
    if (!currentStretchRoutine || currentStretchRoutine.length === 0) {
        displayPoseUI(null); // Show default state
        return;
    }
    
    if (currentStretchPoseIndex < 0) currentStretchPoseIndex = 0;
    if (currentStretchPoseIndex >= currentStretchRoutine.length) currentStretchPoseIndex = currentStretchRoutine.length - 1;

    const pose = currentStretchRoutine[currentStretchPoseIndex];
    displayPoseUI(pose); // Update the visuals and text

    if (!isStretchPaused) { 
        clearTimeout(currentStretchPoseTimer);
        synth.cancel();
        runCurrentStretchPose(); // This will speak and set the timer for the *new* current pose
    } else {
        elements.stretchTimerDisplay.textContent = formatTime(stretchTimeLeft);
    }
}

function runCurrentStretchPose() {
    if (!activeStretchTimer || isStretchPaused) return; 
    if (!currentStretchRoutine || currentStretchRoutine.length === 0) return;

    if (currentStretchPoseIndex >= currentStretchRoutine.length) {
        currentStretchPoseIndex = 0;
    }

    const pose = currentStretchRoutine[currentStretchPoseIndex];
    displayPoseUI(pose); // Update UI to this pose

    const isSilent = elements.stretchVoiceToggle.checked;
    speak(pose.instruction, isSilent);

    clearTimeout(currentStretchPoseTimer);
    
    const duration = pose.duration || 15000; // Default to 15s

    currentStretchPoseTimer = setTimeout(() => {
        currentStretchPoseIndex++; // Advance index
        runCurrentStretchPose(); // Call self to run the next pose
    }, duration);
}


function playPauseStretches() {
    isStretchPaused = !isStretchPaused;

    if (isStretchPaused) {
        // --- PAUSING ---
        clearInterval(activeStretchTimer); // Stop main timer
        clearTimeout(currentStretchPoseTimer); // Stop pose timer
        activeStretchTimer = null;
        currentStretchPoseTimer = null;
        synth.cancel(); // Stop speech
        if(elements.stretchPlayIcon) elements.stretchPlayIcon.style.display = 'inline';
        if(elements.stretchPauseIcon) elements.stretchPauseIcon.style.display = 'none';
    } else {
        // --- PLAYING / RESUMING ---
        if (!currentStretchRoutine || currentStretchRoutine.length === 0) {
            if (elements.stretchInstruction) elements.stretchInstruction.querySelector('p').textContent = "Please select a routine first!";
            isStretchPaused = true; // Go back to paused state
            return;
        }

        // If starting fresh (not resuming), get time from input
        if (stretchTimeLeft <= 0) {
            const duration = parseInt(elements.stretchTimerInput.value) * 60; // Get duration in seconds
            if (isNaN(duration) || duration <= 0) {
                if (elements.stretchInstruction) elements.stretchInstruction.querySelector('p').textContent = 'Please set a valid timer duration (in minutes).';
                isStretchPaused = true; // Go back to paused state
                return;
            }
            stretchTimeLeft = duration;
        }

        if(elements.stretchPlayIcon) elements.stretchPlayIcon.style.display = 'none'; 
        if(elements.stretchPauseIcon) elements.stretchPauseIcon.style.display = 'inline';

        // Update main timer display immediately
        elements.stretchTimerDisplay.textContent = formatTime(stretchTimeLeft);

        // Start the MAIN timer interval (ticks every second)
        activeStretchTimer = setInterval(() => {
            stretchTimeLeft--;
            elements.stretchTimerDisplay.textContent = formatTime(stretchTimeLeft);
            
            if (stretchTimeLeft <= 0) {
                // Timer finished!
                const type = document.querySelector('#stretch-routine-buttons button.active').dataset.stretch;
                // UPDATED: Get duration in minutes for reflection
                const durationMinutes = parseInt(elements.stretchTimerInput.value);
                stopStretches();
                openReflectionModal('stretch', stretchData[type]?.name || 'Stretch Routine', durationMinutes);
            }
        }, 1000);

        // Start the pose sequence
        runCurrentStretchPose(); 
    }
}

function nextPose() {
    if (!currentStretchRoutine || currentStretchRoutine.length === 0) return;

    clearTimeout(currentStretchPoseTimer); // Stop current pose timer
    synth.cancel(); // Stop current speech

    currentStretchPoseIndex++;
    if (currentStretchPoseIndex >= currentStretchRoutine.length) {
        currentStretchPoseIndex = 0; // Loop to start
    }
    
    displayPose(); // Display the new pose (will restart timer if not paused)
}

function prevPose() {
    if (!currentStretchRoutine || currentStretchRoutine.length === 0) return;

    clearTimeout(currentStretchPoseTimer); // Stop current pose timer
    synth.cancel(); // Stop current speech

    currentStretchPoseIndex--;
    if (currentStretchPoseIndex < 0) {
         currentStretchPoseIndex = currentStretchRoutine.length - 1; // Loop to end
    }
    
    displayPose(); // Display the new pose (will restart timer if not paused)
}


function stopStretches() {
    clearInterval(activeStretchTimer);
    clearTimeout(currentStretchPoseTimer);
    activeStretchTimer = null;
    currentStretchPoseTimer = null;
    stretchTimeLeft = 0; // Reset main timer
    synth.cancel();
    isStretchPaused = true; // Ensure state is paused
    
    if (elements.stretchPlayIcon) {
        elements.stretchPlayIcon.style.display = 'inline'; // Show Play
    }
    if (elements.stretchPauseIcon) {
        elements.stretchPauseIcon.style.display = 'none'; // Hide Pause
    }
    
    // Reset displays
    displayPoseUI(null); // Use helper to reset UI
    if (elements.stretchTimerDisplay) elements.stretchTimerDisplay.textContent = '0:00';

    // Reset instruction text
    if (elements.stretchInstruction && elements.stretchInstruction.querySelector('p')) {
        elements.stretchInstruction.querySelector('p').textContent = 'Select a routine and set a timer to begin.';
    }
}

// --- Mindful Reflection Modal ---
function initReflectionModal() {
    elements.mindfulReflectionCloseBtn.addEventListener('click', closeReflectionModal);
    elements.mindfulReflectionModal.addEventListener('click', (e) => {
        if (e.target === elements.mindfulReflectionModal) {
            closeReflectionModal();
        }
    });
    
    elements.mindfulMoodButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button && button.dataset.mood) {
            reflectionData.mood = button.dataset.mood;
            document.querySelectorAll('#mindful-mood-buttons button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        }
    });

    elements.mindfulReflectionSaveBtn.addEventListener('click', saveReflection);
}

// UPDATED: Now accepts durationMinutes
function openReflectionModal(type, name, durationMinutes = 0) {
    reflectionData = { type: type, name: name, mood: '', durationMinutes: parseInt(durationMinutes) };
    
    elements.mindfulReflectionTitle.textContent = `Reflection for ${name}`;
    elements.mindfulReflectionTitle.classList.remove('text-red-400'); // Reset error color
    elements.mindfulReflectionTextarea.value = '';
    document.querySelectorAll('#mindful-mood-buttons button').forEach(btn => btn.classList.remove('selected'));
    
    elements.mindfulReflectionModal.classList.remove('hidden');
    setTimeout(() => elements.mindfulReflectionModal.classList.add('active'), 10);
}

function closeReflectionModal() {
    elements.mindfulReflectionModal.classList.remove('active');
    setTimeout(() => elements.mindfulReflectionModal.classList.add('hidden'), 300);
}

// *** NEW: REBUILT saveReflection FUNCTION ***
async function saveReflection() {
    if (!reflectionData.mood) {
        elements.mindfulReflectionTitle.textContent = "Please select a mood";
        elements.mindfulReflectionTitle.classList.add('text-red-400');
        return;
    }

    if (!userId || !appId) {
        console.error("Cannot save reflection: Missing userId or appId.");
        closeReflectionModal();
        return;
    }

    const todayId = getTodayDateString(); // "YYYY-MM-DD"
    const docPath = `/artifacts/${appId}/users/${userId}/calmSummary/${todayId}`;
    const docRef = doc(db, docPath);

    try {
        // Disable button to prevent double-save
        elements.mindfulReflectionSaveBtn.disabled = true;

        // Get today's document to see if it exists
        const docSnap = await getDoc(docRef);
        let todayData = {
            date: Timestamp.fromDate(new Date(todayId)), // Store a proper timestamp
            moods: [],
            breathingMinutes: 0,
            stretchMinutes: 0,
            meditationMinutes: 0,
        };

        if (docSnap.exists()) {
            // Document already exists, merge data
            todayData = docSnap.data();
            // Ensure fields are numbers
            todayData.breathingMinutes = todayData.breathingMinutes || 0;
            todayData.stretchMinutes = todayData.stretchMinutes || 0;
            todayData.meditationMinutes = todayData.meditationMinutes || 0;
            todayData.moods = todayData.moods || [];
        }

        // Add new data
        todayData.moods.push(parseInt(reflectionData.mood));
        
        if (reflectionData.type === 'breathing') {
            todayData.breathingMinutes += reflectionData.durationMinutes;
        } else if (reflectionData.type === 'stretch') {
            todayData.stretchMinutes += reflectionData.durationMinutes;
        } else if (reflectionData.type === 'meditation') {
            todayData.meditationMinutes += reflectionData.durationMinutes;
        }

        todayData.lastUpdated = serverTimestamp();

        // Save the document (create or overwrite)
        await setDoc(docRef, todayData, { merge: true });

        // Show sparkle animation on "save"!
        const btnRect = elements.mindfulReflectionSaveBtn.getBoundingClientRect();
        const sparkleX = window.scrollX + btnRect.left + btnRect.width / 2;
        const sparkleY = window.scrollY + btnRect.top + btnRect.height / 2;
        createSparkleAnimation(sparkleX, sparkleY);

    } catch (error) {
        console.error("Error saving reflection: ", error);
    } finally {
        // Re-enable button and close modal
        elements.mindfulReflectionSaveBtn.disabled = false;
        closeReflectionModal();
    }
}


// --- NEW: Daily Summary Functions ---

/**
 * Attaches a Firestore listener to the user's calmSummary collection
 */
function initDailySummaryListener() {
    if (summaryListenerUnsubscribe) {
        summaryListenerUnsubscribe(); // Unsubscribe from any old listener
    }
    
    if (!userId || !appId) return; // Wait for auth

    const collectionPath = `/artifacts/${appId}/users/${userId}/calmSummary`;
    const q = query(
        collection(db, collectionPath), 
        orderBy("date", "desc"), 
        limit(7) // We only need the last 7 days
    );

    summaryListenerUnsubscribe = onSnapshot(q, (snapshot) => {
        const summaryData = [];
        snapshot.forEach(doc => {
            summaryData.push({ id: doc.id, ...doc.data() });
        });
        
        // Ensure today's data is present even if empty
        const todayId = getTodayDateString();
        if (!summaryData.find(d => d.id === todayId)) {
            summaryData.unshift({
                id: todayId,
                date: Timestamp.fromDate(new Date(todayId)),
                moods: [],
                breathingMinutes: 0,
                stretchMinutes: 0,
                meditationMinutes: 0
            });
        }
        
        updateDailySummaryUI(summaryData);
    }, (error) => {
        console.error("Error listening to calm summary: ", error);
    });
}

/**
 * Main function to update the entire Daily Summary card
 * @param {Array} summaryData - Array of the last 7 days of summary objects, sorted desc
 */
function updateDailySummaryUI(summaryData) {
    if (!elements.dailySummaryCard || !summaryData || summaryData.length === 0) return;

    const todaySummary = summaryData[0];
    
    // --- 1. Calculate Today's Score & Mood ---
    const { totalScore, averageMood } = calculateTodayScore(todaySummary);
    const percentage = Math.min(100, Math.round(totalScore)); // Cap at 100
    
    const moodLevel = getMoodLevel(percentage); // 'low', 'balanced', 'flow', 'joy'
    const moodLabel = moodLabels[moodLevel];
    const moodEmoji = moodEmojis[Math.round(averageMood) || 3]; // Default to 3 (🙂) if no mood
    const colorTheme = moodColors[Math.round(averageMood) || 3];

    // --- 2. Update Gauge ---
    updateMoodGauge(percentage, colorTheme.gauge);
    elements.summaryMoodEmoji.textContent = moodEmoji;
    elements.summaryMoodLabel.textContent = moodLabel;
    
    // Update label gradient
    elements.summaryMoodLabel.className = 'text-lg font-bold text-transparent bg-clip-text'; // Reset
    elements.summaryMoodLabel.classList.add(colorTheme.label);

    // --- 3. Update Activity Levels ---
    elements.summaryBreathLevel.textContent = `${todaySummary.breathingMinutes} min`;
    elements.summaryStretchLevel.textContent = `${todaySummary.stretchMinutes} min`;
    elements.summaryMeditationLevel.textContent = `${todaySummary.meditationMinutes} min`;

    // --- 4. Update Positive Message ---
    const messageIndex = Math.floor(Math.random() * positiveMessages.length);
    elements.summaryPositiveMessage.textContent = positiveMessages[messageIndex];
    
    // --- 5. Update Card Theme ---
    elements.dailySummaryCard.className = 'glass-card anim-card p-4 md:p-6 transition-colors duration-1000'; // Reset
    elements.dailySummaryCard.classList.add(colorTheme.theme);

    // --- 6. Update 7-Day Chart ---
    renderSummaryChart(summaryData);

    // --- 7. Update Streak ---
    const streak = calculateStreak(summaryData);
    elements.summaryStreakBadge.textContent = `🔥 ${streak} Day Streak`;
    
    // --- 8. Trigger Animation (if data was added today) ---
    // (This part is tricky; we'll trigger it on save instead)
    // For now, we just update the UI.
}

/**
 * Calculates the total score and average mood for the day
 */
function calculateTodayScore(todaySummary) {
    let totalScore = 0;
    // Boosts: Breathing: 5pts/min, Stretch: 3pts/min, Meditation: 4pts/min
    totalScore += (todaySummary.breathingMinutes || 0) * 5;
    totalScore += (todaySummary.stretchMinutes || 0) * 3;
    totalScore += (todaySummary.meditationMinutes || 0) * 4;

    let averageMood = 0;
    if (todaySummary.moods && todaySummary.moods.length > 0) {
        const moodSum = todaySummary.moods.reduce((a, b) => a + b, 0);
        averageMood = moodSum / todaySummary.moods.length; // (1-5)
    }

    // Convert mood (1-5) to a score (0-100) and add it
    // (avgMood / 5) * 100 = avgMood * 20
    const moodScore = (averageMood || 2.5) * 20; // Default to 2.5 (50%) if no mood
    
    // Final score: 60% from activities, 40% from mood
    // We'll just add them and cap. Max activity score is arbitrary, let's aim for ~60.
    // 5min breath = 25. 5min stretch = 15. 5min meditation = 20. Total = 60.
    // This calculation makes `totalScore` the main driver.
    // Let's re-think: Base = mood. Bonus = activities.
    let baseScore = (averageMood || 2.5) * 20; // 0-100
    let bonus = 0;
    bonus += (todaySummary.breathingMinutes || 0) * 2; // Max 10min = 20pts
    bonus += (todaySummary.stretchMinutes || 0) * 1;  // Max 10min = 10pts
    bonus += (todaySummary.meditationMinutes || 0) * 2; // Max 10min = 20pts
    
    totalScore = baseScore + bonus;
    
    return { totalScore: Math.min(100, totalScore), averageMood };
}

/**
 * Gets the mood level string from a 0-100 percentage
 */
function getMoodLevel(percentage) {
    if (percentage <= 30) return 'low';
    if (percentage <= 60) return 'balanced';
    if (percentage <= 80) return 'flow';
    return 'joy';
}

/**
 * Updates the CSS conic-gradient for the mood gauge
 */
function updateMoodGauge(percentage, color) {
    const deg = (percentage / 100) * 360;
    const gradient = `conic-gradient(from 0deg, ${color} ${deg}deg, #1a203c ${deg}deg)`;
    elements.summaryMoodGauge.style.backgroundImage = gradient;
}

/**
 * Renders the 7-day bar chart
 */
function renderSummaryChart(summaryData) {
    elements.summaryBarChart.innerHTML = ''; // Clear old bars
    
    // We need 7 days, even if empty. Data is sorted desc.
    const last7Days = [];
    let currentDate = new Date(getTodayDateString());

    for (let i = 0; i < 7; i++) {
        const dateId = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        const dayData = summaryData.find(d => d.id === dateId);
        
        if (dayData && dayData.moods && dayData.moods.length > 0) {
            const moodSum = dayData.moods.reduce((a, b) => a + b, 0);
            const avgMood = moodSum / dayData.moods.length;
            last7Days.push({ mood: avgMood, title: `${dateId}: ${moodEmojis[Math.round(avgMood)]}` });
        } else {
            last7Days.push({ mood: 0, title: `${dateId}: No data` }); // No data
        }
        
        currentDate.setDate(currentDate.getDate() - 1); // Go to previous day
    }

    // Data is now [today, yesterday, ...]. We need to reverse for chart [Mon, Tue, ... Sun]
    last7Days.reverse();

    last7Days.forEach((day, index) => {
        const bar = document.createElement('div');
        bar.className = 'summary-bar';
        
        let heightPerc = 0;
        let colorClass = '';

        if (day.mood > 0) {
            heightPerc = (day.mood / 5) * 100; // 1-5 scale to 0-100%
            colorClass = moodColors[Math.round(day.mood)].bar;
            bar.classList.add(colorClass);
        } else {
            heightPerc = 5; // Minimum 5% height for empty days
            bar.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }

        bar.style.height = `${heightPerc}%`;
        bar.title = day.title;
        
        // Staggered animation
        setTimeout(() => {
            bar.classList.add('animated');
        }, index * 50); // 50ms delay per bar

        elements.summaryBarChart.appendChild(bar);
    });
}

/**
 * Calculates the current streak
 */
function calculateStreak(summaryData) {
    let streak = 0;
    let todayId = getTodayDateString();
    
    // Check today
    const todayData = summaryData.find(d => d.id === todayId);
    if (todayData && todayData.moods && todayData.moods.length > 0) {
        streak = 1;
        let currentId = getYesterdayDateString(new Date(todayId));
        
        // Check previous days
        for (let i = 1; i < summaryData.length; i++) {
            const dayData = summaryData.find(d => d.id === currentId);
            if (dayData && dayData.moods && dayData.moods.length > 0) {
                streak++;
                currentId = getYesterdayDateString(new Date(currentId)); // Go to previous day
            } else {
                break; // Streak broken
            }
        }
    }
    
    return streak;
}

/**
 * Triggers the glow/sparkle animation on card update
 */
function playSummaryAnimation(averageMood) {
    // This is called from saveReflection now, not updateUI
    const colorTheme = moodColors[Math.round(averageMood) || 3];
    elements.summaryGlowEffect.innerHTML = ''; // Clear old ones

    // 1. Gentle Pulse/Glow
    const glow = document.createElement('div');
    glow.className = 'summary-glow';
    glow.style.backgroundColor = colorTheme.glow;
    elements.summaryGlowEffect.appendChild(glow);
    setTimeout(() => glow.remove(), 1500);

    // 2. Sparkles
    for (let i = 0; i < 10; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'summary-sparkle-particle';
        sparkle.style.backgroundColor = colorTheme.glow;
        sparkle.style.boxShadow = `0 0 8px ${colorTheme.glow}`;
        
        // Random position within the gauge area
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 80; // 80px radius
        sparkle.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        sparkle.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;
        
        // Staggered start
        setTimeout(() => {
            elements.summaryGlowEffect.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1000); // Remove after anim
        }, Math.random() * 300);
    }
}
