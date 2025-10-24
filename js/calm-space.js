import { db } from './firebase.js';
// This line is fixed: 'in' has been changed to 'from'
import { getCurrentUserId } from './auth.js';
import { createSparkleAnimation } from './ui.js';
import { doc, setDoc, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements ---
const elements = {
    // Breathing
    breathingExerciseButtons: document.getElementById('breathing-exercise-buttons'),
    breathingVisualizerContainer: document.getElementById('breathing-visualizer-container'),
    breathingOrb: document.getElementById('breathing-orb'),
    breathingInstruction: document.getElementById('breathing-instruction'),
    breathingTimerDisplay: document.getElementById('breathing-timer-display'),
    breathingAnimationElement: document.getElementById('breathing-animation-element'),
    breathingTimerButtons: document.getElementById('breathing-timer-buttons'),
    breathingSilentToggle: document.getElementById('breathing-silent-toggle'),

    // Meditation
    meditationTypeButtons: document.getElementById('meditation-type-buttons'),
    meditationVisualContainer: document.getElementById('meditation-visual-container'),
    meditationOrb: document.getElementById('meditation-orb'),
    meditationInstruction: document.getElementById('meditation-instruction'),
    meditationTimerDisplay: document.getElementById('meditation-timer-display'),
    meditationVoiceToggle: document.getElementById('meditation-voice-toggle'),
    meditationTimerInput: document.getElementById('meditation-timer-input'),
    startMeditationBtn: document.getElementById('start-meditation-btn'),
    meditationAudioPlayer: document.getElementById('meditation-audio-player'),

    // Stretches
    stretchRoutineButtons: document.getElementById('stretch-routine-buttons'),
    stretchVisualContainer: document.getElementById('stretch-visual-container'),
    stretchVisual: document.getElementById('stretch-visual'),
    stretchInstruction: document.getElementById('stretch-instruction'),
    stretchPoseDisplay: document.getElementById('stretch-pose-display'),
    stretchTrimesterSelector: document.getElementById('stretch-trimester-selector'),
    stretchVoiceToggle: document.getElementById('stretch-voice-toggle'),
    stretchLoopToggle: document.getElementById('stretch-loop-toggle'),
    stretchPrevPoseBtn: document.getElementById('stretch-prev-pose-btn'),
    stretchPlayPauseBtn: document.getElementById('stretch-play-pause-btn'),
    stretchPlayIcon: document.getElementById('stretch-play-icon'),
    stretchPauseIcon: document.getElementById('stretch-pause-icon'),
    stretchNextPoseBtn: document.getElementById('stretch-next-pose-btn'),

    // Reflection Modal
    mindfulReflectionModal: document.getElementById('mindful-reflection-modal'),
    mindfulReflectionCloseBtn: document.getElementById('mindful-reflection-close-btn'),
    mindfulReflectionSaveBtn: document.getElementById('mindful-reflection-save-btn'),
    mindfulReflectionTextarea: document.getElementById('mindful-reflection-textarea'),
    mindfulMoodButtons: document.getElementById('mindful-mood-buttons'),
    mindfulReflectionTitle: document.getElementById('mindful-reflection-title'),
};

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
        color: 'bg-blue-400',
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
        color: 'bg-green-400',
        instructions: ["Sit upright, close eyes softly.", "Inhale through your nose for 4 seconds.", "Hold your breath for 4 seconds.", "Exhale through your mouth for 4 seconds.", "Hold again for 4 seconds.", "Imagine tracing a glowing square with your breath — one side per step."]
    },
    'wave': {
        name: 'Wave Breathing',
        steps: [
            { instruction: 'Inhale as the wave rises', duration: 5000, type: 'inhale' },
            { instruction: 'Exhale as the wave falls', duration: 5000, type: 'exhale' },
        ],
        visual: 'wave-glow',
        color: 'bg-cyan-400',
        instructions: ["Sit or lie down comfortably.", "Watch the wave rise — inhale slowly through your nose.", "As it falls, exhale softly through your mouth.", "Continue matching your breath with each wave."]
    },
    'heartbeat': {
        name: 'Heartbeat Sync',
        steps: [
            { instruction: 'Inhale gently', duration: 4000, type: 'inhale' },
            { instruction: 'Exhale slowly', duration: 6000, type: 'exhale' },
        ],
        visual: 'heartbeat-pulse',
        color: 'bg-pink-400',
        instructions: ["Place one hand on your heart and one on your belly.", "Breathe in gently to the rhythm of your heartbeat.", "Exhale longer, feeling your heart slow down.", "Imagine a warm pink light connecting your heartbeat with your baby’s."]
    },
    'energizer': {
        name: 'Morning Energizer',
        steps: [
            { instruction: 'Inhale for 3', duration: 3000, type: 'inhale' },
            { instruction: 'Exhale for 3', duration: 3000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-yellow-400',
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
        color: 'bg-indigo-400',
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
        audio: 'https://cdn.pixabay.com/audio/2022/05/12/audio_1cba11019d.mp3', // Placeholder
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
    'morning-flow': {
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
    'back-hip': {
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
    'leg-relax': {
        name: 'Leg & Foot Relax',
        poses: [
            { name: "Sit Comfortably", instruction: "Sit comfortably with legs extended.", duration: 5000, visual: 'sit' },
            { name: "Ankle Rotations", instruction: "Rotate ankles 5 times each direction.", duration: 20000, visual: 'ankles' },
            { name: "Point and Flex", instruction: "Point and flex toes slowly, 10 times.", duration: 20000, visual: 'toes' },
            { name: "Calf Massage", instruction: "Massage calves lightly while breathing deep.", duration: 30000, visual: 'calf' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'shoulder-neck': {
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
    'sleep-wind': {
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

// --- Main Initialization ---
export function initializeCalmSpace(uid, aid) {
    userId = uid;
    // Use __app_id if available, otherwise fall back
    appId = typeof __app_id !== 'undefined' ? __app_id : aid;
    
    if (!userId || !appId) {
        console.error("Calm Space: Missing User ID or App ID. Saving will fail.");
    }
    
    initBreathing();
    initMeditation();
    initStretches();
    initReflectionModal();
}

export function unloadCalmSpace() {
    stopBreathing();
    stopMeditation();
    stopStretches();
    // Remove all event listeners if necessary (or check if they are added once)
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

    elements.breathingTimerButtons.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button && button.dataset.timer) {
            document.querySelectorAll('#breathing-timer-buttons button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            startBreathingTimer(parseInt(button.dataset.timer) * 60);
        }
    });

    // Select 4-7-8 by default
    elements.breathingExerciseButtons.querySelector('button[data-breath="4-7-8"]').classList.add('active');
    selectBreathing('4-7-8');
}

function selectBreathing(type) {
    stopBreathing();
    currentBreathingCycle = breathingData[type];
    currentBreathingStep = 0;

    // Reset visuals
    elements.breathingOrb.className = 'w-40 h-40 rounded-full transition-all duration-3000 ease-in-out';
    elements.breathingAnimationElement.className = 'w-full h-full absolute inset-0';
    elements.breathingOrb.classList.add(currentBreathingCycle.color);

    if (currentBreathingCycle.visual === 'orb-glow') {
        elements.breathingOrb.style.display = 'block';
        elements.breathingAnimationElement.style.display = 'none';
    } else {
        elements.breathingOrb.style.display = 'none';
        elements.breathingAnimationElement.style.display = 'block';
        elements.breathingAnimationElement.classList.add(currentBreathingCycle.visual);
    }
    
    // Set instructions
    const instructionHtml = currentBreathingCycle.instructions.map(step => `<li>${step}</li>`).join('');
    document.getElementById('breathing-steps-list').innerHTML = instructionHtml;
}

function startBreathingTimer(duration) {
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
    if (!currentBreathingCycle) return;
    const isSilent = elements.breathingSilentToggle.checked;
    
    const step = currentBreathingCycle.steps[currentBreathingStep];
    speak(step.instruction, isSilent);
    elements.breathingInstruction.textContent = step.instruction;

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
    }
    
    if (currentBreathingCycle.visual === 'heartbeat-pulse') {
        orb.classList.add('heartbeat');
    }

    // Loop to next step
    setTimeout(() => {
        // Reset box animation classes
        if (currentBreathingCycle.visual === 'box-glow') {
            animEl.classList.remove('box-inhale', 'box-hold1', 'box-exhale', 'box-hold2');
            animEl.className = 'w-full h-full absolute inset-0 box-glow'; // Reset
        }
        
        currentBreathingStep = (currentBreathingStep + 1) % currentBreathingCycle.steps.length;
        if (activeBreathingTimer) { // Only continue if timer is active
            runBreathingAnimation();
        }
    }, step.duration);
}

function stopBreathing() {
    clearInterval(activeBreathingTimer);
    activeBreathingTimer = null;
    synth.cancel();
    elements.breathingTimerDisplay.textContent = '0:00';
    elements.breathingInstruction.textContent = 'Select an exercise and timer to begin.';
    elements.breathingOrb.style.transform = 'scale(1)';
    elements.breathingOrb.style.opacity = '0.7';
    elements.breathingOrb.classList.remove('heartbeat');
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
    elements.meditationTypeButtons.querySelector('button').classList.add('active');
    selectMeditation(elements.meditationTypeButtons.querySelector('button').dataset.meditation);
}

function selectMeditation(type) {
    stopMeditation();
    const meditation = meditationData[type];
    currentMeditationInstructions = meditation.instructions;
    
    elements.meditationOrb.className = 'w-40 h-40 rounded-full transition-all duration-3000 ease-in-out opacity-30';
    elements.meditationOrb.classList.add(meditation.color);
    elements.meditationInstruction.textContent = 'Set your timer and press play to begin.';
    
    if (meditation.audio) {
        elements.meditationAudioPlayer.src = meditation.audio;
    } else {
        elements.meditationAudioPlayer.src = '';
    }
}

function startMeditation() {
    stopMeditation();
    const duration = parseInt(elements.meditationTimerInput.value) * 60;
    if (isNaN(duration) || duration <= 0) {
        elements.meditationInstruction.textContent = 'Please set a valid timer duration (in minutes).';
        return;
    }

    let timeLeft = duration;
    elements.meditationTimerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
    elements.meditationOrb.classList.add('active');

    activeMeditationTimer = setInterval(() => {
        timeLeft--;
        elements.meditationTimerDisplay.textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
        if (timeLeft <= 0) {
            stopMeditation();
            const type = document.querySelector('#meditation-type-buttons button.active').dataset.meditation;
            openReflectionModal('meditation', meditationData[type].name);
        }
    }, 1000);
    
    if (elements.meditationAudioPlayer.src) {
        elements.meditationAudioPlayer.play();
        elements.meditationAudioPlayer.loop = true;
    }

    currentMeditationStep = 0;
    runMeditationGuide();
}

function runMeditationGuide() {
    if (currentMeditationStep >= currentMeditationInstructions.length) {
        elements.meditationInstruction.textContent = "Continue breathing and resting in this space.";
        return; // Guide is finished
    }
    
    const isSilent = elements.meditationVoiceToggle.checked;
    const instruction = currentMeditationInstructions[currentMeditationStep];
    elements.meditationInstruction.textContent = instruction;
    speak(instruction, isSilent);

    utterance.onend = () => {
        if (activeMeditationTimer) { // Only proceed if timer is still running
            currentMeditationStep++;
            // Wait a bit before next instruction
            setTimeout(runMeditationGuide, 3000); 
        }
    };
}

function stopMeditation() {
    clearInterval(activeMeditationTimer);
    activeMeditationTimer = null;
    synth.cancel();
    utterance.onend = null;
    
    elements.meditationAudioPlayer.pause();
    elements.meditationAudioPlayer.currentTime = 0;
    
    elements.meditationTimerDisplay.textContent = '0:00';
    elements.meditationInstruction.textContent = 'Select a meditation and timer to begin.';
    elements.meditationOrb.classList.remove('active');
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
    elements.stretchRoutineButtons.querySelector('button').classList.add('active');
    selectStretchRoutine(elements.stretchRoutineButtons.querySelector('button').dataset.stretch);
}

function selectStretchRoutine(type) {
    stopStretches();
    const routine = stretchData[type];
    const trimester = elements.stretchTrimesterSelector.value;
    
    // Filter poses by trimester
    currentStretchRoutine = routine.poses.filter(pose => {
        // This is a basic filter. The data needs to be updated to be more specific
        // For now, we use the `safe` array on the *routine*
        return routine.safe.includes(trimester);
    });

    if (currentStretchRoutine.length === 0) {
        elements.stretchInstruction.textContent = "This routine isn't recommended for your selected trimester. Please choose another.";
        elements.stretchPoseDisplay.textContent = "0 / 0";
        return;
    }
    
    currentStretchPoseIndex = 0;
    displayPose();
}

function displayPose() {
    if (currentStretchRoutine.length === 0) return;
    
    const pose = currentStretchRoutine[currentStretchPoseIndex];
    elements.stretchInstruction.textContent = pose.instruction;
    elements.stretchPoseDisplay.textContent = `Pose ${currentStretchPoseIndex + 1} / ${currentStretchRoutine.length}`;
    
    // Update visual (simple text/class for now)
    elements.stretchVisual.className = 'transition-all duration-1000';
    // Reset
    elements.stretchVisual.innerHTML = '';
    
    if (pose.visual === 'cat-pose') {
        elements.stretchVisual.classList.add('cat-pose');
    } else if (pose.visual === 'cow-pose') {
        elements.stretchVisual.classList.add('cow-pose');
    } else {
        elements.stretchVisual.innerHTML = `<span class="text-3xl p-4">${pose.name}</span>`;
    }

    const isSilent = elements.stretchVoiceToggle.checked;
    speak(pose.instruction, isSilent);

    // Set up timer for next pose if playing
    if (!isStretchPaused) {
        if (elements.stretchLoopToggle.checked && currentStretchPoseIndex === currentStretchRoutine.length - 1) {
            // Loop back to start
            activeStretchTimer = setTimeout(() => {
                currentStretchPoseIndex = 0;
                displayPose();
                if (window.chime) window.chime.play();
            }, pose.duration);
        } else if (currentStretchPoseIndex < currentStretchRoutine.length - 1) {
            // Go to next pose
            activeStretchTimer = setTimeout(() => {
                currentStretchPoseIndex++;
                displayPose();
                if (window.chime) window.chime.play();
            }, pose.duration);
        } else {
            // End of routine
            stopStretches();
            const type = document.querySelector('#stretch-routine-buttons button.active').dataset.stretch;
            openReflectionModal('stretch', stretchData[type].name);
        }
    }
}

function playPauseStretches() {
    isStretchPaused = !isStretchPaused;
    if (isStretchPaused) {
        clearTimeout(activeStretchTimer);
        activeStretchTimer = null;
        synth.cancel();
        elements.stretchPlayIcon.style.display = 'block';
        elements.stretchPauseIcon.style.display = 'none';
    } else {
        elements.stretchPlayIcon.style.display = 'none';
        elements.stretchPauseIcon.style.display = 'block';
        // Resume/start
        displayPose();
    }
}

function nextPose() {
    if (currentStretchPoseIndex < currentStretchRoutine.length - 1) {
        currentStretchPoseIndex++;
        displayPose();
        if (window.chime) window.chime.play();
    }
}

function prevPose() {
    if (currentStretchPoseIndex > 0) {
        currentStretchPoseIndex--;
        displayPose();
        if (window.chime) window.chime.play();
    }
}

function stopStretches() {
    clearTimeout(activeStretchTimer);
    activeStretchTimer = null;
    synth.cancel();
    isStretchPaused = true;
    elements.stretchPlayIcon.style.display = 'block';
    elements.stretchPauseIcon.style.display = 'none';
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
        return;
    }
    
    reflectionData.note = elements.mindfulReflectionTextarea.value;
    if (!reflectionData.mood) {
        alert("Please select a mood."); // Replace with a proper modal later
        return;
    }

    try {
        const reflectionsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/calmReflections`);
        await addDoc(reflectionsCollectionRef, {
            ...reflectionData,
            createdAt: serverTimestamp()
        });
        
        // Show sparkle animation on success!
        const btnRect = elements.mindfulReflectionSaveBtn.getBoundingClientRect();
        createSparkleAnimation(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2);
        
        closeReflectionModal();

    } catch (error) {
        console.error("Error saving reflection: ", error);
        alert("Could not save your reflection. Please try again."); // Replace
    }
}