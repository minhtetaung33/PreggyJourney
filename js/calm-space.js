import { db } from './firebase.js';
import { getCurrentUserId } from './auth.js';
import { createSparkleAnimation } from './ui.js';
import { doc, setDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements (Initialized as empty) ---
let elements = {};

// --- Data from Instructions ---
const breathingData = {
    '4-7-8': {
        name: '4-7-8 Breathing',
        steps: [
            { instruction: 'Inhale through your nose for 4', duration: 4000, type: 'inhale' },
            { instruction: 'Hold your breath for 7', duration: 7000, type: 'hold' },
            { instruction: 'Exhale through your mouth for 8', duration: 8000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-blue-400', // Example color
        instructions: ["Sit comfortably, shoulders relaxed.", "Inhale through your nose for 4 seconds — let your belly expand.", "Hold your breath gently for 7 seconds.", "Exhale slowly through your mouth for 8 seconds, as if blowing through a straw.", "Repeat 4–5 cycles."]
    },
    'box': {
        name: 'Box Breathing',
        steps: [
            { instruction: 'Inhale for 4', duration: 4000, type: 'inhale' },
            { instruction: 'Hold for 4', duration: 4000, type: 'hold' },
            { instruction: 'Exhale for 4', duration: 4000, type: 'exhale' },
            { instruction: 'Hold for 4', duration: 4000, type: 'hold' },
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
            { instruction: 'Inhale for 3', duration: 3000, type: 'inhale' },
            { instruction: 'Exhale for 3', duration: 3000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-yellow-400', // Example color
        instructions: ["Sit up or stand tall, open your chest.", "Inhale through your nose for 3 seconds.", "Exhale through your mouth for 3 seconds.", "Smile as you exhale — imagine light filling your body.", "Repeat 5–6 cycles."]
    },
    'sleep': {
        name: 'Sleep Wind-Down',
        steps: [
            { instruction: 'Inhale for 5', duration: 5000, type: 'inhale' },
            { instruction: 'Hold for 2', duration: 2000, type: 'hold' },
            { instruction: 'Exhale for 7', duration: 7000, type: 'exhale' },
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
    }
};

const stretchData = {
    'morning-flow': { // Corrected key from HTML
        name: 'Morning Energizer Flow',
        poses: [
            { name: "Stand Tall", instruction: "Stand tall, feet hip-width apart. Breathe deeply.", duration: 10000, visual: 'stand' },
            { name: "Overhead Reach", instruction: "Inhale — raise arms overhead.", duration: 10000, visual: 'reach' },
            { name: "Slight Forward Bend", instruction: "Exhale — bend slightly forward with a flat back.", duration: 10000, visual: 'bend' },
            { name: "Shoulder Rolls", instruction: "Roll shoulders up and back slowly, 5 times.", duration: 15000, visual: 'shoulders' },
            { name: "Neck Circles", instruction: "Circle neck slowly, 3 times each way.", duration: 20000, visual: 'neck' },
            { name: "Deep Breaths", instruction: "Finish with 3 deep breaths.", duration: 15000, visual: 'stand' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'back-hip': { // Corrected key from HTML
        name: 'Back & Hip Relief',
        poses: [
            { name: "Tabletop", instruction: "Get on hands and knees (tabletop position).", duration: 10000, visual: 'tabletop' },
            { name: "Cow Pose", instruction: "Inhale — drop your belly, lift your gaze (cow pose).", duration: 10000, visual: 'cow-pose' },
            { name: "Cat Pose", instruction: "Exhale — round your back, tuck your chin (cat pose).", duration: 10000, visual: 'cat-pose' },
            { name: "Repeat Cat/Cow", instruction: "Flow between Cat and Cow 3 more times.", duration: 30000, visual: 'cat-cow-flow' },
            { name: "Hip Circles", instruction: "Do gentle hip circles clockwise, 5 times.", duration: 15000, visual: 'hips' },
            { name: "Hip Circles (Reverse)", instruction: "Now circle counter-clockwise, 5 times.", duration: 15000, visual: 'hips' },
            { name: "Child's Pose", instruction: "End in Child’s Pose (knees wide, arms forward). Breathe.", duration: 30000, visual: 'childs-pose' }
        ],
        safe: ['early', 'mid'] // Child's pose might be uncomfortable late
    },
    'leg-relax': { // Corrected key from HTML
        name: 'Leg & Foot Relax',
        poses: [
            { name: "Sit Comfortably", instruction: "Sit comfortably with legs extended.", duration: 5000, visual: 'sit' },
            { name: "Ankle Rotations", instruction: "Rotate ankles 5 times each direction.", duration: 20000, visual: 'ankles' },
            { name: "Point and Flex", instruction: "Point and flex toes slowly, 10 times.", duration: 20000, visual: 'toes' },
            { name: "Calf Massage", instruction: "Massage calves lightly while breathing deep.", duration: 30000, visual: 'calf' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'shoulder-neck': { // Corrected key from HTML
        name: 'Shoulder & Neck Release',
        poses: [
            { name: "Sit Tall", instruction: "Sit cross-legged, spine straight.", duration: 5000, visual: 'sit-cross' },
            { name: "Shoulder Rolls", instruction: "Roll shoulders backward 5 times.", duration: 15000, visual: 'shoulders' },
            { name: "Side Neck Tilt", instruction: "Tilt head gently to the right. Hold.", duration: 15000, visual: 'neck-tilt' },
            { name: "Side Neck Tilt", instruction: "Tilt head gently to the left. Hold.", duration: 15000, visual: 'neck-tilt' },
            { name: "Chest Opener", instruction: "Interlace fingers behind back and open chest.", duration: 20000, visual: 'chest' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'sleep-wind': { // Corrected key from HTML
        name: 'Sleep Wind-Down Yoga',
        poses: [
            { name: "Lie Comfortably", instruction: "Lie on your side with pillow support.", duration: 10000, visual: 'side-lie' },
            { name: "Gentle Butterfly", instruction: "Sitting up, do a gentle butterfly pose (soles of feet together).", duration: 30000, visual: 'butterfly' },
            { name: "Slow Breaths", instruction: "Return to side. Inhale slowly.", duration: 10000, visual: 'side-lie' },
            { name: "Humming Exhale", instruction: "Exhale with a gentle hum.", duration: 10000, visual: 'side-lie' },
            { name: "Relax", instruction: "Imagine each breath melting away tension.", duration: 30000, visual: 'side-lie' },
            { name: "Rest", instruction: "Stay still for 1 min, breathing deeply.", duration: 60000, visual: 'side-lie' }
        ],
        safe: ['early', 'mid', 'late']
    }
};

// --- State Variables ---
let userId = null;
let appId = null;
let synth = window.speechSynthesis;
let utterance = new SpeechSynthesisUtterance();
let activeBreathingTimer = null;
let activeMeditationTimer = null;
let activeStretchTimer = null;
let currentBreathingCycle;
let currentBreathingStep = 0;
let currentMeditationInstructions = [];
let currentMeditationStep = 0;
let currentStretchRoutine = [];
let currentStretchPoseIndex = 0;
let isStretchPaused = true;
let reflectionData = { type: '', mood: '', note: '' };
let isDomCached = false; // Flag to prevent re-caching

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
        breathingTimerButtons: document.getElementById('breathing-timer-buttons'), // Corrected ID from HTML
        breathingSilentToggle: document.getElementById('breathing-silent-toggle'), // Corrected ID from HTML
        breathingStepsList: document.getElementById('breathing-steps-list'), // Added

        // Meditation
        meditationTypeButtons: document.getElementById('meditation-type-buttons'),
        meditationVisualContainer: document.getElementById('meditation-visual-container'), // Corrected ID from HTML
        meditationOrb: document.getElementById('meditation-orb'),
        meditationInstruction: document.getElementById('meditation-instruction'), // Corrected ID from HTML
        meditationTimerDisplay: document.getElementById('meditation-timer-display'),
        meditationVoiceToggle: document.getElementById('meditation-voice-toggle'), // Corrected ID from HTML
        meditationTimerInput: document.getElementById('meditation-timer-input'), // Corrected ID from HTML
        startMeditationBtn: document.getElementById('start-meditation-btn'),
        meditationAudioPlayer: document.getElementById('meditation-audio-player'), // Corrected ID from HTML

        // Stretches
        stretchRoutineButtons: document.getElementById('stretch-routine-buttons'),
        stretchVisualContainer: document.getElementById('stretch-visual-container'), // Corrected ID from HTML
        stretchVisual: document.getElementById('stretch-visual'),
        stretchInstruction: document.getElementById('stretch-instruction'), // Corrected ID from HTML
        stretchPoseDisplay: document.getElementById('stretch-pose-display'), // Corrected ID from HTML
        stretchTrimesterSelector: document.getElementById('stretch-trimester-selector'), // Corrected ID from HTML
        stretchVoiceToggle: document.getElementById('stretch-voice-toggle'), // Corrected ID from HTML
        stretchLoopToggle: document.getElementById('stretch-loop-toggle'), // Added
        stretchPrevPoseBtn: document.getElementById('stretch-prev-pose-btn'), // Corrected ID
        stretchPlayPauseBtn: document.getElementById('stretch-play-pause-btn'), // Corrected ID
        stretchPlayIcon: document.getElementById('stretch-play-icon'), // Added
        stretchPauseIcon: document.getElementById('stretch-pause-icon'), // Added
        stretchNextPoseBtn: document.getElementById('stretch-next-pose-btn'), // Corrected ID

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
function speak(text, isSilent) {
    if (isSilent || !text) return;
    synth.cancel(); // Stop any previous speech
    utterance.text = text;
    utterance.rate = 0.9;
    utterance.pitch = 1;
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

    // --- FIX: Use elements cache instead of getElementById ---
    if (elements.breathingTimerButtons) {
        elements.breathingTimerButtons.addEventListener('click', e => {
            const button = e.target.closest('button');
            if (button && button.dataset.timer) {
                document.querySelectorAll('#breathing-timer-buttons button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                // Pass duration in seconds (original had * 60 which made it minutes)
                startBreathingTimer(parseInt(button.dataset.timer)); 
            }
        });
    } else {
        console.error("Breathing timer buttons container not found!");
    }
    // --- END FIX ---


    // Select 4-7-8 by default
    const defaultBreathButton = elements.breathingExerciseButtons.querySelector('button[data-breath="4-7-8"]');
    if (defaultBreathButton) {
        defaultBreathButton.classList.add('active');
        selectBreathing('4-7-8');
    }
}

function selectBreathing(type) {
    stopBreathing();
    currentBreathingCycle = breathingData[type];
    currentBreathingStep = 0;

    // Reset visuals
    elements.breathingOrb.className = 'w-40 h-40 rounded-full transition-all duration-3000 ease-in-out';
    elements.breathingAnimationElement.className = 'w-full h-full absolute inset-0';
    
    // Remove previous color classes before adding new one
    elements.breathingOrb.classList.remove('bg-blue-400', 'bg-green-400', 'bg-cyan-400', 'bg-pink-400', 'bg-yellow-400', 'bg-indigo-400');
    elements.breathingOrb.classList.add(currentBreathingCycle.color);

    if (currentBreathingCycle.visual === 'orb-glow') {
        elements.breathingOrb.style.display = 'block';
        elements.breathingAnimationElement.style.display = 'none';
    } else {
        elements.breathingOrb.style.display = 'none';
        elements.breathingAnimationElement.style.display = 'block';
        elements.breathingAnimationElement.classList.add(currentBreathingCycle.visual);
    }
    
    // Set instructions text
    elements.breathingInstruction.querySelector('p').textContent = `Now showing: ${currentBreathingCycle.name}`;
    // Set instructions steps list
    const instructionHtml = currentBreathingCycle.instructions.map(step => `<li>${step}</li>`).join('');
    const stepsList = elements.breathingStepsList; // Use cached element
    if (stepsList) {
        stepsList.innerHTML = instructionHtml;
    }
}

function startBreathingTimer(duration) { // Duration is now in seconds
    stopBreathing();
    let timeLeft = duration;
    elements.breathingTimerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
    
    activeBreathingTimer = setInterval(() => {
        timeLeft--;
        elements.breathingTimerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
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
    elements.breathingInstruction.querySelector('p').textContent = step.instruction; // Update instruction text

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
    }
    document.querySelectorAll('#breathing-timer-buttons button').forEach(btn => btn.classList.remove('active'));
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

    // Select first one by default
    const defaultMeditationButton = elements.meditationTypeButtons.querySelector('button');
    if (defaultMeditationButton) {
        defaultMeditationButton.classList.add('active');
        selectMeditation(defaultMeditationButton.dataset.meditation);
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
    elements.meditationInstruction.textContent = 'Set your timer and press play to begin.';
    
    if (meditation.audio) {
        elements.meditationAudioPlayer.src = meditation.audio;
    } else {
        elements.meditationAudioPlayer.src = ''; // Clear src if no audio
    }
}

function startMeditation() {
    stopMeditation();
    const duration = parseInt(elements.meditationTimerInput.value) * 60; // Get duration in seconds
    if (isNaN(duration) || duration <= 0) {
        elements.meditationInstruction.textContent = 'Please set a valid timer duration (in minutes).';
        return;
    }

    let timeLeft = duration;
    elements.meditationTimerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
    elements.meditationOrb.classList.add('active'); // Start glow animation

    activeMeditationTimer = setInterval(() => {
        timeLeft--;
        elements.meditationTimerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
        if (timeLeft <= 0) {
            stopMeditation();
            const type = document.querySelector('#meditation-type-buttons button.active').dataset.meditation;
            openReflectionModal('meditation', meditationData[type].name);
        }
    }, 1000);
    
    // Play audio if src is set
    if (elements.meditationAudioPlayer.src) {
       elements.meditationAudioPlayer.play().catch(e => console.error("Audio play failed:", e)); // Add catch for safety
       elements.meditationAudioPlayer.loop = true;
    }


    currentMeditationStep = 0;
    runMeditationGuide();
}

function runMeditationGuide() {
    if (!activeMeditationTimer) return; // Stop if timer ended
    
    if (currentMeditationStep >= currentMeditationInstructions.length) {
        elements.meditationInstruction.textContent = "Continue breathing and resting in this space.";
        // Stop looping instructions, but let timer run out
        utterance.onend = null; 
        return; 
    }
    
    const isSilent = elements.meditationVoiceToggle.checked;
    const instruction = currentMeditationInstructions[currentMeditationStep];
    elements.meditationInstruction.textContent = instruction;
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
                 elements.meditationInstruction.textContent = "Continue breathing and resting in this space.";
            }
        }
    };
    
    // Safety fallback if speak doesn't trigger onend (e.g., if isSilent is true)
    if (isSilent) {
        utterance.onend = null; // Clear handler
         if (activeMeditationTimer) {
             currentMeditationStep++;
             if (currentMeditationStep < currentMeditationInstructions.length) {
                 setTimeout(runMeditationGuide, 3000 + 1000); // Add a bit more delay for silent mode
             } else {
                 elements.meditationInstruction.textContent = "Continue breathing and resting in this space.";
             }
         }
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

    elements.stretchTrimesterSelector.addEventListener('change', () => {
        const selectedRoutine = document.querySelector('#stretch-routine-buttons button.active')?.dataset.stretch;
        if (selectedRoutine) {
            selectStretchRoutine(selectedRoutine);
        }
    });
    
    elements.stretchPlayPauseBtn.addEventListener('click', playPauseStretches);
    elements.stretchNextPoseBtn.addEventListener('click', nextPose);
    elements.stretchPrevPoseBtn.addEventListener('click', prevPose);
    
    // Select first routine by default
    const defaultStretchButton = elements.stretchRoutineButtons.querySelector('button');
    if (defaultStretchButton) {
        defaultStretchButton.classList.add('active');
        selectStretchRoutine(defaultStretchButton.dataset.stretch);
    }
}

function selectStretchRoutine(type) {
    stopStretches(); // Stop any previous routine
    const routine = stretchData[type];
    const trimester = elements.stretchTrimesterSelector.value;
    
    if (!routine) {
        console.error("Selected stretch routine not found:", type);
        elements.stretchInstruction.textContent = "Error: Could not find selected routine.";
        return;
    }
    
    // Filter poses by trimester
    currentStretchRoutine = routine.poses.filter(pose => {
        // Use the `safe` array on the *routine* level for filtering
        return routine.safe.includes(trimester) || trimester === 'all';
    });

    if (currentStretchRoutine.length === 0) {
        elements.stretchInstruction.textContent = "This routine isn't recommended for your selected trimester. Please choose another.";
        elements.stretchPoseDisplay.textContent = "0 / 0";
        currentStretchPoseIndex = 0; // Reset index
        return;
    }
    
    currentStretchPoseIndex = 0;
    displayPose(); // Display the first pose of the selected routine
}

function displayPose() {
    if (!currentStretchRoutine || currentStretchRoutine.length === 0) return; // Exit if no routine selected or empty
    
    // Ensure index is within bounds
    if (currentStretchPoseIndex < 0) currentStretchPoseIndex = 0;
    if (currentStretchPoseIndex >= currentStretchRoutine.length) currentStretchPoseIndex = currentStretchRoutine.length - 1;

    const pose = currentStretchRoutine[currentStretchPoseIndex];
    elements.stretchInstruction.textContent = pose.instruction;
    elements.stretchPoseDisplay.textContent = `${pose.name} (${currentStretchPoseIndex + 1}/${currentStretchRoutine.length})`;
    
    // Update visual (simple text/class for now, assuming CSS handles visuals)
    elements.stretchVisual.className = 'transition-all duration-1000'; // Reset classes
    elements.stretchVisual.innerHTML = ''; // Clear previous content
    
    if (pose.visual) {
         // Add class based on visual name if CSS exists for it
        elements.stretchVisual.classList.add(pose.visual); 
        // Fallback or additional text
        elements.stretchVisual.innerHTML = `<span class="text-xl p-4 opacity-50">${pose.name} Visual</span>`; // Placeholder text
    } else {
        elements.stretchVisual.innerHTML = `<span class="text-3xl p-4">${pose.name}</span>`; // Default text if no visual
    }


    const isSilent = elements.stretchVoiceToggle.checked;
    speak(pose.instruction, isSilent);

    // --- Timer Logic for advancing poses ---
    clearTimeout(activeStretchTimer); // Clear any existing timer before setting a new one
    activeStretchTimer = null; // Reset timer variable

    if (!isStretchPaused) { // Only set a timer if not paused
        const duration = pose.duration || 15000; // Default to 15s if duration missing

        activeStretchTimer = setTimeout(() => {
            const shouldLoop = elements.stretchLoopToggle.checked;
            
            if (currentStretchPoseIndex < currentStretchRoutine.length - 1) {
                // Go to next pose
                currentStretchPoseIndex++;
                displayPose();
                // Optionally play a sound (chime) - requires setup not included here
                // if (window.chime) window.chime.play();
            } else if (shouldLoop) {
                 // Loop back to start
                currentStretchPoseIndex = 0;
                displayPose();
                // if (window.chime) window.chime.play();
            } else {
                // End of routine (not looping)
                stopStretches();
                const type = document.querySelector('#stretch-routine-buttons button.active').dataset.stretch;
                openReflectionModal('stretch', stretchData[type]?.name || 'Stretch Routine'); // Use ?. for safety
            }
        }, duration);
    }
}


function playPauseStretches() {
    isStretchPaused = !isStretchPaused;
    if (isStretchPaused) {
        clearTimeout(activeStretchTimer);
        activeStretchTimer = null;
        synth.cancel(); // Stop speech
        elements.stretchPlayIcon.style.display = 'inline'; // Show Play text/icon
        elements.stretchPauseIcon.style.display = 'none'; // Hide Pause text/icon
    } else {
        elements.stretchPlayIcon.style.display = 'none'; // Hide Play
        elements.stretchPauseIcon.style.display = 'inline'; // Show Pause
        // Resume/start from the current pose
        displayPose(); // This will speak the instruction and set the timer if not paused
    }
}

function nextPose() {
    clearTimeout(activeStretchTimer); // Stop current timer
    activeStretchTimer = null;
    synth.cancel(); // Stop current speech

    if (currentStretchPoseIndex < currentStretchRoutine.length - 1) {
        currentStretchPoseIndex++;
    } else if (elements.stretchLoopToggle.checked) { // Loop if enabled
        currentStretchPoseIndex = 0;
    } else {
        // Already at the last pose and not looping, do nothing or provide feedback
        console.log("End of routine.");
        stopStretches(); // Ensure stopped state
        return; // Don't proceed
    }
    
    displayPose(); // Display the new pose (will restart timer if not paused)
    // if (window.chime) window.chime.play(); // Optional chime
}

function prevPose() {
    clearTimeout(activeStretchTimer); // Stop current timer
    activeStretchTimer = null;
    synth.cancel(); // Stop current speech
    
    if (currentStretchPoseIndex > 0) {
        currentStretchPoseIndex--;
    } else if (elements.stretchLoopToggle.checked) { // Loop back to end if enabled
         currentStretchPoseIndex = currentStretchRoutine.length - 1;
    } else {
        // Already at the first pose and not looping
        console.log("Start of routine.");
        return; // Don't proceed
    }
    
    displayPose(); // Display the new pose (will restart timer if not paused)
    // if (window.chime) window.chime.play(); // Optional chime
}


function stopStretches() {
    clearTimeout(activeStretchTimer);
    activeStretchTimer = null;
    synth.cancel();
    isStretchPaused = true; // Ensure state is paused
    if (elements.stretchPlayIcon) {
        elements.stretchPlayIcon.style.display = 'inline'; // Show Play
    }
    if (elements.stretchPauseIcon) {
        elements.stretchPauseIcon.style.display = 'none'; // Hide Pause
    }
    // Maybe reset instruction text?
    // elements.stretchInstruction.textContent = "Routine stopped. Select a routine to begin.";
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
        // Use a less obtrusive error message
        elements.mindfulReflectionTitle.textContent = "Error: Could not save. User not found.";
        elements.mindfulReflectionTitle.classList.add('text-red-400');
        setTimeout(() => {
             // Attempt to restore original title after showing error
             if (reflectionData.name) {
                 elements.mindfulReflectionTitle.textContent = `Reflection for ${reflectionData.name}`;
                 elements.mindfulReflectionTitle.classList.remove('text-red-400');
             } else {
                 // Fallback if name wasn't set somehow
                 elements.mindfulReflectionTitle.textContent = "Reflection"; 
                 elements.mindfulReflectionTitle.classList.remove('text-red-400');
             }
        }, 3000);
        return;
    }
    
    reflectionData.note = elements.mindfulReflectionTextarea.value;
    if (!reflectionData.mood) {
        // Use a non-blocking way to show error
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
        // Use the correct Firestore path structure
        const reflectionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/calmReflections`);
        await addDoc(reflectionsCollectionRef, {
            ...reflectionData,
            createdAt: serverTimestamp()
        });
        
        // Show sparkle animation on success!
        const btnRect = elements.mindfulReflectionSaveBtn.getBoundingClientRect();
        // Calculate center relative to viewport
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
