import { db } from './firebase.js';
import { getCurrentUserId } from './auth.js';
import { createSparkleAnimation } from './ui.js';
import { doc, setDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements (Initialized as empty) ---
let elements = {};

// --- Helper Function ---
function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
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
        audio: 'https://cdn.pixabay.com/audio/2022/05/12/audio_1cba11019d.mp3', // Example sound
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
        safe: ['early', 'mid', 'late'] // This is now unused but kept for reference
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
        safe: ['early', 'mid']
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

// --- State Variables ---
let userId = null;
let appId = null;
let synth = window.speechSynthesis;
let utterance = new SpeechSynthesisUtterance();
let femaleVoice = null; // For female voice
let activeBreathingTimer = null;
let activeMeditationTimer = null;
let currentBreathingCycle;
let currentBreathingStep = 0;
let currentMeditationInstructions = [];
let currentMeditationStep = 0;
let reflectionData = { type: '', mood: '', note: '' };
let isDomCached = false; // Flag to prevent re-caching

// --- NEW STRETCH STATE ---
let activeStretchRoutineTimer = null; // Main timer for the whole routine
let activeStretchPoseTimer = null;  // Timer for the *current pose*
let currentStretchRoutine = [];
let currentStretchPoseIndex = 0;
let isStretchPaused = true;
let stretchTimeRemaining = 0; // Time left on the main routine timer
let poseTimeRemaining = 0; // Time left on the current pose
// --- END NEW STRETCH STATE ---


// --- NEW: Function to cache DOM elements ---
function cacheDomElements() {
    if (isDomCached) return; // Only run once
    
    elements = {
        // Breathing
        breathingExerciseButtons: document.getElementById('breathing-exercise-buttons'),
        breathingVisualizerContainer: document.getElementById('breathing-visualizer-container'),
        breathingOrb: document.getElementById('breathing-orb'),
        breathingInstruction: document.getElementById('breathing-instruction'), // Corrected ID from HTML
        breathingTimerDisplay: document.getElementById('breathing-timer-display'),
        breathingAnimationElement: document.getElementById('breathing-animation-element'),
        breathingVisualEmoji: document.getElementById('breathing-visual-emoji'), // NEW
        breathingTimerInput: document.getElementById('breathing-timer-input'), // UPDATED from buttons
        breathingPlayBtn: document.getElementById('breathing-play-btn'), // NEW
        breathingStopBtn: document.getElementById('breathing-stop-btn'), // NEW
        breathingSilentToggle: document.getElementById('breathing-silent-toggle'), // Corrected ID from HTML
        breathingSoundOnIcon: document.getElementById('breathing-sound-on-icon'), // NEW
        breathingSoundOffIcon: document.getElementById('breathing-sound-off-icon'), // NEW
        breathingStepsList: document.getElementById('breathing-steps-list'), // Added

        // Meditation
        meditationTypeButtons: document.getElementById('meditation-type-buttons'),
        meditationVisualContainer: document.getElementById('meditation-visual-container'), // Corrected ID from HTML
        meditationOrb: document.getElementById('meditation-orb'),
        meditationVisualEmoji: document.getElementById('meditation-visual-emoji'), // NEW
        meditationInstruction: document.getElementById('meditation-instruction'), // Corrected ID from HTML
        meditationTimerDisplay: document.getElementById('meditation-timer-display'),
        meditationVoiceToggle: document.getElementById('meditation-voice-toggle'), // Corrected ID from HTML
        meditationSoundOnIcon: document.getElementById('meditation-sound-on-icon'), // NEW
        meditationSoundOffIcon: document.getElementById('meditation-sound-off-icon'), // NEW
        meditationTimerInput: document.getElementById('meditation-timer-input'), // Corrected ID from HTML
        startMeditationBtn: document.getElementById('start-meditation-btn'),
        stopMeditationBtn: document.getElementById('stop-meditation-btn'), // NEW
        meditationAudioPlayer: document.getElementById('meditation-audio-player'), // Corrected ID from HTML

        // Stretches
        stretchRoutineButtons: document.getElementById('stretch-routine-buttons'),
        stretchVisualContainer: document.getElementById('stretch-visual-container'), // Corrected ID from HTML
        stretchVisual: document.getElementById('stretch-visual'),
        stretchInstruction: document.getElementById('stretch-instruction'), // Corrected ID from HTML
        stretchPoseDisplay: document.getElementById('stretch-pose-display'), // Corrected ID from HTML
        stretchTimerDisplay: document.getElementById('stretch-timer-display'), // NEW
        stretchTimerInput: document.getElementById('stretch-timer-input'), // UPDATED from trimester selector
        stretchVoiceToggle: document.getElementById('stretch-voice-toggle'), // Corrected ID from HTML
        stretchSoundOnIcon: document.getElementById('stretch-sound-on-icon'), // NEW
        stretchSoundOffIcon: document.getElementById('stretch-sound-off-icon'), // NEW
        stretchLoopToggle: document.getElementById('stretch-loop-toggle'), // Added
        stretchPrevPoseBtn: document.getElementById('stretch-prev-pose-btn'), // Corrected ID
        stretchPlayPauseBtn: document.getElementById('stretch-play-pause-btn'), // Corrected ID
        stretchPlayIcon: document.getElementById('stretch-play-icon'), // Added
        stretchPauseIcon: document.getElementById('stretch-pause-icon'), // Added

        // Reflection Modal
        mindfulReflectionModal: document.getElementById('mindful-reflection-modal'),
        mindfulReflectionCloseBtn: document.getElementById('mindful-reflection-close-btn'), // Corrected ID
        mindfulReflectionSaveBtn: document.getElementById('mindful-reflection-save-btn'),
        mindfulReflectionTextarea: document.getElementById('mindful-reflection-textarea'), // Corrected ID
        mindfulMoodButtons: document.getElementById('mindful-mood-buttons'),
        mindfulReflectionTitle: document.getElementById('mindful-reflection-title'), // Corrected ID
    };
    
    isDomCached = true;
}


// --- Main Initialization ---
export function initializeCalmSpace(uid, aid) {
    userId = uid;
    // Use __app_id if available, otherwise fall back
    appId = typeof __app_id !== 'undefined' ? __app_id : aid;
    
    // NEW: Cache DOM elements now that we know the DOM is loaded
    cacheDomElements();
    loadVoices(); // Load speech synthesis voices

    if (!userId || !appId) {
        console.error("Calm Space: Missing User ID or App ID. Saving will fail.");
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
}

export function unloadCalmSpace() {
    stopBreathing();
    stopMeditation();
    stopStretches();
    isDomCached = false; // Reset cache flag on unload
    elements = {}; // Clear cached elements
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

    // --- NEW: Play/Stop button listeners ---
    if (elements.breathingPlayBtn) {
        elements.breathingPlayBtn.addEventListener('click', startBreathing);
    }
    if (elements.breathingStopBtn) {
        elements.breathingStopBtn.addEventListener('click', stopBreathing);
    }
    // --- END NEW ---

    // --- NEW: Silent Toggle Listener ---
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
    // Get selected timer from input
    const durationInMinutes = parseInt(elements.breathingTimerInput.value);
    
    if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
        // Show an error
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
    
    const duration = durationInMinutes * 60; // Convert to seconds
    
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
            openReflectionModal('breathing', currentBreathingCycle.name);
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
    const duration = parseInt(elements.meditationTimerInput.value) * 60; // Get duration in seconds
    if (isNaN(duration) || duration <= 0) {
        if (elements.meditationInstruction) elements.meditationInstruction.textContent = 'Please set a valid timer duration (in minutes).';
        return;
    }

    // NEW: Update button UI
    elements.startMeditationBtn.classList.add('hidden');
    elements.stopMeditationBtn.classList.remove('hidden');
    // Ensure parent grid is 2-col (it is by default, but good to be sure)
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
            openReflectionModal('meditation', meditation.name); // Use stored meditation name
        }
    }, 1000);
    
    // FIX: Check meditation.audio, not src
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
        if (elements.meditationInstruction) elements.meditationInstruction.textContent = "Continue breathing and resting in this space.";
        // Stop looping instructions, but let timer run out
        utterance.onend = null; 
        return; 
    }
    
    const isSilent = elements.meditationVoiceToggle.checked;
    const instruction = currentMeditationInstructions[currentMeditationStep];
    if (elements.meditationInstruction) elements.meditationInstruction.textContent = instruction;
    speak(instruction, isSilent);

    // Set onend handler *before* speaking
    utterance.onend = () => {
        // Clear handler immediately after it fires to prevent potential loops
        utterance.onend = null; 
        if (activeMeditationTimer) { // Only proceed if timer is still running
            currentMeditationStep++;
            // Wait a bit before next instruction, unless it's the last one
            if (currentMeditationStep < currentMeditationInstructions.length) {
                 setTimeout(runMeditationGuide, 3000); 
            } else {
                 // Last instruction finished, let the timer run out with final message
                 if (elements.meditationInstruction) elements.meditationInstruction.textContent = "Continue breathing and resting in this space.";
            }
        }
    };
    
    // Safety fallback if speak doesn't trigger onend (e.g., if isSilent is true or speech fails)
    if (isSilent || !synth.speaking) {
         // Use a timeout approximation
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
    // NEW: Reset button UI
    if (elements.startMeditationBtn) {
        elements.startMeditationBtn.classList.remove('hidden');
    }
    if (elements.stopMeditationBtn) {
        elements.stopMeditationBtn.classList.add('hidden');
    }
    // NEW: Reset emoji
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

    // Event listener for the new timer input
    elements.stretchTimerInput.addEventListener('change', () => {
        if (!isStretchPaused) {
            // If routine is playing, stop it and restart with new time
            stopStretches(false); // Stop but don't reset index
            playPauseStretches(); // This will read the new time
        } else {
            // If paused, just update the main timer display
            const durationInMinutes = parseInt(elements.stretchTimerInput.value, 10);
            if (!isNaN(durationInMinutes) && durationInMinutes > 0) {
                stretchTimeRemaining = durationInMinutes * 60;
                elements.stretchTimerDisplay.textContent = formatTime(stretchTimeRemaining);
            } else {
                elements.stretchTimerDisplay.textContent = '0:00';
            }
        }
    });
    
    elements.stretchPlayPauseBtn.addEventListener('click', playPauseStretches);
    elements.stretchNextPoseBtn.addEventListener('click', nextPose);
    elements.stretchPrevPoseBtn.addEventListener('click', prevPose);
    
    // NEW: Silent Toggle Listener
    if (elements.stretchVoiceToggle) {
        elements.stretchVoiceToggle.addEventListener('change', toggleStretchSoundIcon);
        toggleStretchSoundIcon(); // Set initial state
    }
    
    // Select first routine by default
    const defaultStretchButton = elements.stretchRoutineButtons.querySelector('button');
    if (defaultStretchButton) {
        defaultStretchButton.classList.add('active');
        selectStretchRoutine(defaultStretchButton.dataset.stretch);
    }
    stopStretches(true); // Set initial stopped state and reset index
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
    stopStretches(true); // Stop any previous routine and reset index
    const routine = stretchData[type];
    
    if (!routine) {
        console.error("Selected stretch routine not found:", type);
        if (elements.stretchInstruction) {
            elements.stretchInstruction.querySelector('p').textContent = "Error: Could not find selected routine.";
        }
        return;
    }
    
    // Routine is no longer filtered
    currentStretchRoutine = routine.poses;

    if (currentStretchRoutine.length === 0) {
        if (elements.stretchInstruction) {
            elements.stretchInstruction.querySelector('p').textContent = "This routine has no poses.";
        }
        if (elements.stretchPoseDisplay) elements.stretchPoseDisplay.textContent = "0 / 0";
        if (elements.stretchVisual) elements.stretchVisual.textContent = '🧘‍♀️';
        currentStretchPoseIndex = 0; // Reset index
        return;
    }
    
    currentStretchPoseIndex = 0;
    displayPose(true); // Display the first pose, set as 'new pose'
}

function displayPose(isNewPose = false) {
    if (!currentStretchRoutine || currentStretchRoutine.length === 0) return; // Exit if no routine selected or empty
    
    // Ensure index is within bounds
    if (currentStretchPoseIndex < 0) currentStretchPoseIndex = 0;
    if (currentStretchPoseIndex >= currentStretchRoutine.length) currentStretchPoseIndex = currentStretchRoutine.length - 1;

    const pose = currentStretchRoutine[currentStretchPoseIndex];
    
    if (elements.stretchInstruction) {
        elements.stretchInstruction.querySelector('p').textContent = pose.instruction;
    }
    if (elements.stretchPoseDisplay) {
        elements.stretchPoseDisplay.textContent = `${pose.name} (${currentStretchPoseIndex + 1}/${currentStretchRoutine.length})`;
    }
    
    if (elements.stretchVisual) {
        elements.stretchVisual.className = 'transition-all duration-500 text-6xl';
        elements.stretchVisual.innerHTML = ''; 
    
        if (pose.emoji) {
            elements.stretchVisual.textContent = pose.emoji;
        } else {
            elements.stretchVisual.innerHTML = `<span class="text-3xl p-4">${pose.name}</span>`; // Default text
        }
    }

    const isSilent = elements.stretchVoiceToggle.checked;
    speak(pose.instruction, isSilent);

    // --- Timer Logic ---
    clearTimeout(activeStretchPoseTimer); // Clear any existing pose timer
    
    if (isNewPose) {
        // If it's a new pose (from play, next, prev), reset pose timer
        poseTimeRemaining = (pose.duration || 15000) / 1000; // in seconds
    }
    // If resuming, poseTimeRemaining will already be set
    
    runPoseTimer(); // Start or resume the pose countdown
}

function runPoseTimer() {
    if (isStretchPaused || !activeStretchRoutineTimer) return; // Don't run if paused or main timer is off

    // Display current pose time
    // We don't have a separate pose timer display anymore,
    // but this logic is needed to advance the pose.
    
    // Clear any existing intervals
    clearTimeout(activeStretchPoseTimer); 

    activeStretchPoseTimer = setTimeout(() => {
        // Pose duration finished
        const shouldLoop = elements.stretchLoopToggle.checked;
            
        if (currentStretchPoseIndex < currentStretchRoutine.length - 1) {
            // Go to next pose
            currentStretchPoseIndex++;
            displayPose(true); // true = isNewPose
        } else if (shouldLoop) {
            // Loop back to start
            currentStretchPoseIndex = 0;
            displayPose(true);
        } else {
            // End of routine, but main timer is still running?
            // This shouldn't really happen if loop is off, but just in case
            // We let the main timer run out. We'll just loop.
            currentStretchPoseIndex = 0;
            displayPose(true);
        }
    }, poseTimeRemaining * 1000); // Use remaining pose time
}

// This is the main timer for the whole routine
function runRoutineTimer() {
    clearInterval(activeStretchRoutineTimer); // Clear any existing *main* timer
    
    activeStretchRoutineTimer = setInterval(() => {
        if (isStretchPaused) {
            clearInterval(activeStretchRoutineTimer);
            return;
        }

        stretchTimeRemaining--;
        if (elements.stretchTimerDisplay) {
            elements.stretchTimerDisplay.textContent = formatTime(stretchTimeRemaining);
        }
        
        if (stretchTimeRemaining <= 0) {
            // Main timer is up!
            stopStretches(true);
            const type = document.querySelector('#stretch-routine-buttons button.active')?.dataset.stretch;
            if (type) {
                openReflectionModal('stretch', stretchData[type]?.name || 'Stretch Routine');
            }
        }
    }, 1000);
}


function playPauseStretches() {
    isStretchPaused = !isStretchPaused;
    
    if (isStretchPaused) {
        // --- PAUSING ---
        clearTimeout(activeStretchPoseTimer); // Stop pose advancement
        clearInterval(activeStretchRoutineTimer); // Stop main timer
        
        // Save remaining pose time
        // This requires tracking when the pose timer started.
        // Simpler: just pause main timer. Pose timer will restart on resume.
        // We already saved stretchTimeRemaining.
        
        synth.cancel(); // Stop speech
        if(elements.stretchPlayIcon) elements.stretchPlayIcon.style.display = 'inline';
        if(elements.stretchPauseIcon) elements.stretchPauseIcon.style.display = 'none';
    } else {
        // --- PLAYING / RESUMING ---
        if(elements.stretchPlayIcon) elements.stretchPlayIcon.style.display = 'none';
        if(elements.stretchPauseIcon) elements.stretchPauseIcon.style.display = 'inline';

        if (stretchTimeRemaining <= 0) { // Starting new
            const durationInMinutes = parseInt(elements.stretchTimerInput.value, 10);
            if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
                if(elements.stretchInstruction) elements.stretchInstruction.querySelector('p').textContent = "Please set a valid timer duration (in minutes).";
                isStretchPaused = true; // Go back to paused state
                if(elements.stretchPlayIcon) elements.stretchPlayIcon.style.display = 'inline';
                if(elements.stretchPauseIcon) elements.stretchPauseIcon.style.display = 'none';
                return;
            }
            stretchTimeRemaining = durationInMinutes * 60;
            elements.stretchTimerDisplay.textContent = formatTime(stretchTimeRemaining);
            displayPose(true); // Start from current pose (it's new)
        } else {
            // Resuming
            displayPose(false); // Resume current pose (not new)
        }
        
        runRoutineTimer(); // Start/resume main countdown
    }
}

function nextPose() {
    if (currentStretchRoutine.length === 0) return; // Don't do anything if no routine is loaded

    if (currentStretchPoseIndex < currentStretchRoutine.length - 1) {
        currentStretchPoseIndex++;
    } else { // Loop back to start
        currentStretchPoseIndex = 0;
    }
    
    displayPose(true); // Display the new pose
}

function prevPose() {
    if (currentStretchRoutine.length === 0) return; // Don't do anything if no routine is loaded

    if (currentStretchPoseIndex > 0) {
        currentStretchPoseIndex--;
    } else { // Loop back to end
         currentStretchPoseIndex = currentStretchRoutine.length - 1;
    }
    
    displayPose(true); // Display the new pose
}


function stopStretches(resetIndex = true) {
    clearTimeout(activeStretchPoseTimer);
    clearInterval(activeStretchRoutineTimer);
    activeStretchPoseTimer = null;
    activeStretchRoutineTimer = null;
    synth.cancel();
    
    isStretchPaused = true;
    stretchTimeRemaining = 0;
    poseTimeRemaining = 0;

    if (resetIndex) {
        currentStretchPoseIndex = 0;
    }
    
    if (elements.stretchPlayIcon) {
        elements.stretchPlayIcon.style.display = 'inline'; // Show Play
    }
    if (elements.stretchPauseIcon) {
        elements.stretchPauseIcon.style.display = 'none'; // Hide Pause
    }
    
    // Reset displays
    if (elements.stretchVisual) elements.stretchVisual.textContent = '🧘‍♀️';
    if (elements.stretchPoseDisplay) elements.stretchPoseDisplay.textContent = 'Select a routine';
    if (elements.stretchInstruction && elements.stretchInstruction.querySelector('p')) {
        elements.stretchInstruction.querySelector('p').textContent = 'Select a routine and set your timer.';
    }
    if (elements.stretchTimerDisplay) elements.stretchTimerDisplay.textContent = '0:00';
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
            // Save the *emoji text*
            reflectionData.mood = button.textContent; 
            document.querySelectorAll('#mindful-mood-buttons button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        }
    });

    elements.mindfulReflectionSaveBtn.addEventListener('click', saveReflection);
}

function openReflectionModal(type, name) {
    reflectionData = { type: type, name: name, mood: '', note: '' };
    
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

async function saveReflection() {
    if (!userId || !appId) {
        console.error("Cannot save reflection: User ID or App ID is missing.");
        elements.mindfulReflectionTitle.textContent = "Error: Could not save. User not found.";
        elements.mindfulReflectionTitle.classList.add('text-red-400');
        // (rest of error handling)
        return;
    }
    
    reflectionData.note = elements.mindfulReflectionTextarea.value;
    if (!reflectionData.mood) {
        const originalText = elements.mindfulReflectionTitle.textContent;
        elements.mindfulReflectionTitle.textContent = "Please select a mood first!";
        elements.mindfulReflectionTitle.classList.add('text-red-400');
        setTimeout(() => {
            elements.mindfulReflectionTitle.textContent = originalText;
            elements.mindfulReflectionTitle.classList.remove('text-red-400');
        }, 2000);
        return;
    }

    try {
        // ******** FIX: Save to the 'reflections' collection *********
        // This is the same collection used by the "Tiny Reflections" feature in journey.js
        const reflectionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/reflections`);
        
        // Map data to match the "Tiny Reflections" structure
        const noteContent = reflectionData.note 
            ? `${reflectionData.mood} ${reflectionData.note}` 
            : `${reflectionData.mood} Felt good after my ${reflectionData.type} session.`;

        await addDoc(reflectionsCollectionRef, {
            title: reflectionData.name, // e.g., "Reflection for 4-7-8 Breathing"
            content: noteContent,
            color: 'pink', // Assign a default color
            type: reflectionData.type, // 'breathing', 'meditation', or 'stretch'
            createdAt: serverTimestamp()
        });
        // ******** END FIX *********
        
        // Show sparkle animation on success!
        const btnRect = elements.mindfulReflectionSaveBtn.getBoundingClientRect();
        const sparkleX = window.scrollX + btnRect.left + btnRect.width / 2;
        const sparkleY = window.scrollY + btnRect.top + btnRect.height / 2;
        createSparkleAnimation(sparkleX, sparkleY);
        
        closeReflectionModal();

    } catch (error) {
        console.error("Error saving reflection: ", error);
        const originalText = elements.mindfulReflectionTitle.textContent;
        elements.mindfulReflectionTitle.textContent = "Error: Could not save reflection.";
        elements.mindfulReflectionTitle.classList.add('text-red-400');
        setTimeout(() => {
            elements.mindfulReflectionTitle.textContent = originalText;
            elements.mindfulReflectionTitle.classList.remove('text-red-400');
        }, 3000);
    }
}
