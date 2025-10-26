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
// *** UPDATED with more detailed instructions ***
const breathingData = {
    '4-7-8': {
        name: '4-7-8 Breathing',
        steps: [
            { instruction: 'Begin... Inhale softly through your nose for... 4... 3... 2... 1...', duration: 8000, type: 'inhale' },
            { instruction: 'Now.., gently hold that breath for... 7... 6... 5... 4... 3... 2... 1...', duration: 10000, type: 'hold' },
            { instruction: 'And exhale slowly through your mouth with a soft "whoosh" sound for... 8... 7... 6... 5... 4... 3... 2... 1...', duration: 13000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-blue-400',
        instructions: [
            "Find a comfortable, seated position, resting your hands gently.",
            "Allow your shoulders to soften away from your ears.",
            "Close your eyes or lower your gaze.",
            "You will inhale quietly through your nose, hold the breath, and then exhale audibly through your mouth.",
            "This technique is deeply relaxing for the nervous system. Let's begin the cycle."
        ]
    },
    'box': {
        name: 'Box Breathing',
        steps: [
            { instruction: 'Inhale through your nose for... 4... 3... 2... 1...', duration: 7000, type: 'inhale' },
            { instruction: 'Gently hold the breath at the top for... 4... 3... 2... 1...', duration: 7000, type: 'hold' },
            { instruction: 'Exhale slowly through your mouth for... 4... 3... 2... 1...', duration: 7000, type: 'exhale' },
            { instruction: 'And hold the breath at the bottom, empty and relaxed, for... 4... 3... 2... 1...', duration: 9000, type: 'hold' },
        ],
        visual: 'box-glow',
        color: 'bg-green-400',
        instructions: [
            "Sit upright, feeling both feet grounded on the floor.",
            "Visualize your breath tracing the four equal sides of a square.",
            "Each step—inhale, hold, exhale, hold—will be for the same duration.",
            "This practice builds focus, calms the mind, and regulates your energy.",
            "Let's trace the first side together."
        ]
    },
    'wave': {
        name: 'Wave Breathing',
        steps: [
            { instruction: 'Inhale... watch the wave rise as you breathe in for... 5... 4... 3... 2... 1...', duration: 8000, type: 'inhale' },
            { instruction: 'Exhale... watch the wave fall as you breathe out for... 5... 4... 3... 2... 1...', duration: 8000, type: 'exhale' },
        ],
        visual: 'wave-glow',
        color: 'bg-cyan-400',
        instructions: [
            "Settle into your seat and bring your awareness to your body.",
            "Imagine your breath is like a gentle ocean wave.",
            "As you inhale, the wave rises, filling your lungs completely.",
            "As you exhale, the wave softly recedes.",
            "There's no pause, just a smooth, continuous rhythm. Let your breath match the visual.",
        ]
    },
    'heartbeat': {
        name: 'Heartbeat Sync',
        steps: [
            { instruction: 'Inhale gently, feeling your belly and chest expand... 4... 3... 2... 1...', duration: 9000, type: 'inhale' },
            { instruction: 'Exhale slowly, letting everything soften... 6... 5... 4... 3... 2... 1...', duration: 10000, type: 'exhale' },
        ],
        visual: 'heartbeat-pulse',
        color: 'bg-pink-400',
        instructions: [
            "Place one hand on your heart and one hand on your belly.",
            "Close your eyes and feel the gentle rhythm of your own heartbeat.",
            "We will use a slightly longer exhale to invite calm.",
            "Imagine your breath and your heartbeat connecting, sending warmth and safety to your baby.",
            "Let's begin this gentle rhythm."
        ]
    },
    'energizer': {
        name: 'Morning Energizer',
        steps: [
            { instruction: 'Take a bright inhale for... 3... 2... 1...', duration: 6000, type: 'inhale' },
            { instruction: 'And a matching exhale, letting it go... 3... 2... 1...', duration: 8000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-yellow-400',
        instructions: [
            "Sit or stand tall, lifting your chest and opening your heart.",
            "This is a simple, rhythmic breath to waken the body and mind.",
            "Imagine you are breathing in bright, golden sunlight.",
            "With each exhale, feel a gentle smile.",
            "Let's create some positive energy for the day."
        ]
    },
    'sleep': {
        name: 'Sleep Wind-Down',
        steps: [
            { instruction: 'Inhale slowly and deeply for... 5... 4... 3... 2... 1...', duration: 8000, type: 'inhale' },
            { instruction: 'A soft pause at the top... just for... 2... 1...', duration: 5000, type: 'hold' },
            { instruction: 'And a long, slow exhale, releasing the day... 7... 6... 5... 4... 3... 2... 1...', duration: 11000, type: 'exhale' },
        ],
        visual: 'orb-glow',
        color: 'bg-indigo-400',
        instructions: [
            "Lie down comfortably, supported by pillows.",
            "Rest your hands on your belly or at your sides.",
            "This breathing pattern helps to signal to your body that it is time for rest.",
            "Focus on making the exhale longer than the inhale.",
            "Allow your body to feel heavy and supported by the bed."
        ]
    },
};

const meditationData = {
    'first-connection': {
        name: 'First Connection',
        instructions: [
            "Welcome.... Find a comfortable position..., either sitting or lying down...",
            "Gently rest your hands on your belly... Close your eyes...",
            "Take a deep, cleansing breath in through your nose.... and let it all go with a soft sigh out...",
            "Bring all your awareness to your hands.. Feel the warmth they create...",
            "Feel the gentle rise and fall of your belly with each breath...",
            "Now, bring your attention inward..., beneath your hands., to the space where your baby is growing...",
            "You don't need to feel for movement., just bring your loving awareness to this space...",
            "As you breathe in, imagine you are sending a wave of warmth and welcome to your baby...",
            "As you breathe out, feel a sense of peace settling over you both...",
            "In your mind, or in a soft whisper., say the words: 'I am here, my little one...'",
            "'I am so happy you are here...'",
            "Feel the connection, this invisible., unbreakable bond between you...",
            "It's a bond of love, a bond of life...",
            "Continue to breathe., just resting in this shared space...",
            "Know that you are already connected, already communicating in the most profound way...",
            "Stay here for a few more moments, just feeling.. Just being.. Together..."
        ],
        color: 'bg-pink-500',
        audio: null,
        emoji: '💞'
    },
    'love-visualization': {
        name: 'Love Visualization',
        instructions: [
            "Settle in and close your eyes... Place your hands on your belly...",
            "Take a deep breath in..., filling your lungs... and as you exhale, release any tension from your day...",
            "Let your shoulders drop., your jaw soften...",
            "Now, begin to imagine a soft.., warm light... Perhaps it's a glowing pink, or a gentle golden color...",
            "See this light glowing brightly right in your heart center...",
            "This is a light of pure., unconditional love...",
            "With your next inhale, feel this light grow brighter, filling your entire chest...",
            "As you exhale.., visualize this warm light traveling from your heart, down through your body.",
            "...and through your hands., flowing directly into your baby...",
            "Imagine your baby being surrounded.., held.., and nourished by this beautiful.., loving light...",
            "With each breath, you are sending waves of love., safety.., and peace...",
            "Inhale, drawing in love for yourself...",
            "Exhale, sending that love to your baby...",
            "Whisper in your mind.., 'You are loved.. You are safe.. You are welcome...'",
            "Continue this pattern., breathing in love.., and breathing out love...",
            "See your baby floating peacefully in this warm., protective glow you are creating...",
            "You are their safe harbor.. You are their world...",
            "Rest in this visualization.., knowing you are wrapping your baby in pure love..."
        ],
        color: 'bg-rose-500',
        audio: null,
        emoji: '🥰'
    },
    'heartbeat-harmony': {
        name: 'Heartbeat Harmony',
        instructions: [
            "Begin by finding your comfortable resting position...",
            "Place one hand over your heart.., and the other gently on your belly...",
            "Close your eyes and first.., just listen. Listen to the quiet sounds around you...",
            "Now, bring your attention to the hand on your heart.. Feel its gentle., steady rhythm...",
            "This is your life force.., your constant companion...",
            "Breathe with it.. In for 4 counts.... and out for 6......",
            "We will now play a gentle heartbeat sound.. Let it blend with your own...",
            "Imagine this is the rhythm of the universe.., a rhythm of safety and life...",
            "Now, bring your awareness to the hand on your belly...",
            "Feel the connection between these two points... Your heart., and this new life...",
            "Visualize a soft.., golden thread of light flowing from your heart... down to your baby...",
            "With every beat., this thread pulses with love.., with strength.., with connection...",
            "Your heartbeat and their developing one.., already in harmony...",
            "Your body is a symphony.., and your baby is its newest, most precious note...",
            "Stay with this feeling... The feeling of two hearts.., one journey...",
            "Breathing in calm... Breathing out love... Beating as one..."
        ],
        color: 'bg-red-500',
        audio: 'https://archive.org/download/human-heartbeat-sound-effect/Human%20Heartbeat%20Sound%20Effect.mp3', // Example sound
        emoji: '❤️'
    },
    'peaceful-night': {
        name: 'Peaceful Night Bond',
        instructions: [
            "Lie down in your most comfortable position for sleep.. Use pillows for support wherever you need them.",
            "Let your body feel heavy and fully supported...",
            "Close your eyes and take a long.., slow breath in...",
            "...and as you exhale.., let out a sigh, releasing the entire day...",
            "Let it all go... Nothing else matters right now...",
            "Gently rest your hands on your belly...",
            "Imagine you and your baby are floating in a calm., quiet sea under a sky full of soft., twinkling stars...",
            "With every breath you take., imagine one of those stars glowing a little brighter...",
            "Breathe in peace. Breathe out and let your body sink deeper into relaxation...",
            "Feel your toes and feet become heavy and warm...",
            "Feel your legs relax completely...",
            "Feel your hips and belly soften., holding your baby in perfect peace...",
            "Let your back, shoulders.., and arms melt into the bed...",
            "Relax your jaw., your cheeks., and the space between your eyebrows...",
            "You are safe.. Your baby is safe...",
            "Whisper good night.., little one.. We are resting together...",
            "Allow your mind to drift.., feeling nothing but peace and gratitude...",
            "Good night... sleep well.."
        ],
        color: 'bg-indigo-600',
        audio: null,
        emoji: '😴'
    },
    'morning-gratitude': {
        name: 'Morning Gratitude',
        instructions: [
            "Good morning... Begin by sitting up.., perhaps by a window or in a softly lit room...",
            "Sit tall., but comfortably... Rest your hands on your belly or in your lap...",
            "Close your eyes and take a deep., fresh breath of morning air.. Fill your lungs completely...",
            "Exhale with a sigh.., welcoming the new day...",
            "Let's set an intention for this day., for both you and your baby...",
            "As you breathe in.., think 'I welcome peace...'",
            "As you breathe out.., think 'I release worry...'",
            "Now, bring a gentle smile to your face and send a 'good morning' to your baby...",
            "Feel the miracle of this new life.., growing and changing every moment...",
            "Whisper, 'Thank you, body... Thank you for the incredible work you are doing...'",
            "Feel gratitude for your body.., for its strength and wisdom...",
            "Feel gratitude for this baby.., for the joy and love they already bring...",
            "Feel gratitude for this day.., a fresh start.., a new opportunity for peace and connection...",
            "Imagine a warm., gentle light filling you and your baby.., a light of health and calm...",
            "Carry this light with you as you open your eyes and move into your day...",
            "Good morning..., little one... We are ready for today.."
        ],
        color: 'bg-yellow-500',
        audio: null,
        emoji: '☀️'
    }
};

const stretchData = {
    'morning-flow': {
        name: 'Morning Energizer Flow',
        poses: [
            { name: "Stand Tall", instruction: "Stand tall, feet hip-width apart. Root your feet into the ground. Roll your shoulders back and down. Take a deep, grounding breath.", duration: 20000, visual: 'stand', emoji: '🧍‍♀️' },
            { name: "Overhead Reach", instruction: "Inhale, sweeping your arms wide and reaching up overhead. Look up if it feels good. Feel the length in your spine.", duration: 20000, visual: 'reach', emoji: '🙌' },
            { name: "Slight Forward Bend", instruction: "Exhale, soften your knees, and hinge at your hips. Fold forward only as far as is comfortable, keeping your back flat. Rest hands on thighs.", duration: 20000, visual: 'bend', emoji: '🙇‍♀️' },
            { name: "Shoulder Rolls", instruction: "Slowly roll your shoulders up toward your ears, and then back and down. Feel the tension melting. Repeat 5 times.", duration: 25000, visual: 'shoulders', emoji: '🙆‍♀️' },
            { name: "Neck Circles", instruction: "Gently drop your chin to your chest. Slowly roll your right ear to your right shoulder. Pause. Roll back to center, and over to the left. Be very gentle. 3 times each way.", duration: 30000, visual: 'neck', emoji: '↪️' },
            { name: "Deep Breaths", instruction: "Return to standing tall. Take 3 final, deep breaths, filling your belly and chest. You are ready for the day.", duration: 25000, visual: 'stand', emoji: '🧍‍♀️' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'back-hip': {
        name: 'Back & Hip Relief',
        poses: [
            { name: "Tabletop", instruction: "Come onto your hands and knees. Place wrists directly under shoulders, and knees directly under hips. Your back is flat like a table.", duration: 20000, visual: 'tabletop', emoji: '🐾' },
            { name: "Cow Pose", instruction: "Inhale. Drop your belly, lift your tailbone, and draw your heart forward. Gaze gently upward. Feel the stretch in your front body.", duration: 20000, visual: 'cow-pose', emoji: '🐄' },
            { name: "Cat Pose", instruction: "Exhale. Press into your hands, round your upper back toward the sky. Tuck your chin and tailbone. Feel the release in your spine.", duration: 20000, visual: 'cat-pose', emoji: '🐈' },
            { name: "Repeat Cat/Cow", instruction: "Flow with your own breath. Inhale for Cow pose, exhale for Cat pose. Let the movement be fluid and nourishing for your back.", duration: 40000, visual: 'cat-cow-flow', emoji: '🔄' },
            { name: "Hip Circles", instruction: "From tabletop, begin to circle your hips back, to the right, forward, and to the left. Make the circles as big or small as feels good. 5 times clockwise.", duration: 25000, visual: 'hips', emoji: '🔄' },
            { name: "Hip Circles (Reverse)", instruction: "Now, pause and reverse direction. Circle your hips counter-clockwise, 5 times. Releasing tension in the hip joints.", duration: 25000, visual: 'hips', emoji: '🔄' },
            { name: "Child's Pose", instruction: "Bring your big toes to touch and take your knees wide apart to make space for your belly. Sink your hips back toward your heels. Rest your forehead on the mat. Breathe deeply into your back.", duration: 45000, visual: 'childs-pose', emoji: '🙇‍♀️' }
        ],
        safe: ['early', 'mid']
    },
    'leg-relax': {
        name: 'Leg & Foot Relax',
        poses: [
            { name: "Sit Comfortably", instruction: "Sit on the floor, perhaps on a cushion, with your legs extended out in front of you. Sit tall through your spine.", duration: 15000, visual: 'sit', emoji: '🧘‍♀️' },
            { name: "Ankle Rotations", instruction: "Lift one foot slightly and slowly rotate your ankle 5 times in one direction, then 5 times in the other. Repeat with the other foot.", duration: 30000, visual: 'ankles', emoji: '👟' },
            { name: "Point and Flex", instruction: "With both legs extended, point your toes forward, feeling a stretch in your shins. Hold. Then, flex your feet, pulling your toes back toward you. Feel the stretch in your calves. Repeat 10 times.", duration: 35000, visual: 'toes', emoji: '🦶' },
            { name: "Calf Massage", instruction: "Bend one knee and gently use your hands to massage your opposite calf muscle, from the ankle up toward the knee. Breathe deeply. Switch legs.", duration: 40000, visual: 'calf', emoji: '🦵' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'shoulder-neck': {
        name: 'Shoulder & Neck Release',
        poses: [
            { name: "Sit Tall", instruction: "Sit comfortably, cross-legged or on a chair. Lengthen your spine and relax your shoulders down and back.", duration: 15000, visual: 'sit-cross', emoji: '🧘‍♀️' },
            { name: "Shoulder Rolls", instruction: "Inhale and shrug your shoulders up to your ears. Exhale and roll them back and down. Feel the shoulder blades slide down your back. Repeat 5 times.", duration: 25000, visual: 'shoulders', emoji: '🙆‍♀️' },
            { name: "Side Neck Tilt", instruction: "Gently tilt your right ear toward your right shoulder. Don't force it. Feel a gentle stretch along the left side of your neck. Breathe. Hold.", duration: 25000, visual: 'neck-tilt', emoji: '↪️' },
            { name: "Side Neck Tilt", instruction: "Slowly bring your head back to center. Now, gently tilt your left ear toward your left shoulder. Breathe into the right side of your neck. Hold.", duration: 25000, visual: 'neck-tilt', emoji: '↪️' },
            { name: "Chest Opener", instruction: "Interlace your fingers behind your back. Straighten your arms (or keep them bent) and lift your hands away from your body, opening your chest. Lift your gaze. Breathe into your heart.", duration: 35000, visual: 'chest', emoji: '💖' }
        ],
        safe: ['early', 'mid', 'late']
    },
    'sleep-wind': {
        name: 'Sleep Wind-Down Yoga',
        poses: [
            { name: "Lie Comfortably", instruction: "Lie on your side with pillows supporting your head, belly, and between your knees. Settle in and get comfortable.", duration: 25000, visual: 'side-lie', emoji: '😴' },
            { name: "Gentle Butterfly", instruction: "Slowly come to a seated position. Bring the soles of your feet together, letting your knees fall open. Sit tall, or fold forward gently if that feels better. Breathe.", duration: 45000, visual: 'butterfly', emoji: '🦋' },
            { name: "Slow Breaths", instruction: "Return to your comfortable side-lying position. Close your eyes. Take a slow, deep inhale, filling your belly.", duration: 25000, visual: 'side-lie', emoji: '😴' },
            { name: "Humming Exhale", instruction: "Now, as you exhale, create a gentle humming sound. Feel the vibration in your chest and face. This is very calming for the nervous system.", duration: 25000, visual: 'side-lie', emoji: '😴' },
            { name: "Relax", instruction: "Continue breathing, perhaps humming on each exhale. Imagine each breath is a wave of relaxation, melting away any remaining tension.", duration: 4000, visual: 'side-lie', emoji: '😴' },
            { name: "Rest", instruction: "Stay still for 1 minute. Just breathe. Feel your body heavy, relaxed, and ready for sleep. Good night.", duration: 60000, visual: 'side-lie', emoji: '😴' }
        ],
        safe: ['early', 'mid', 'late']
    }
};
// *** END of updated instructions ***

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
// UPDATED: Removed appId from initialization parameters
export function initializeCalmSpace(uid) {
    userId = uid;
    // Removed appId assignment

    // DOM elements are now cached by ui.js, so we can use them immediately.
    isDomCached = true; // Mark as "cached"
    loadVoices(); // Load speech synthesis voices

    // UPDATED: Removed appId check
    if (!userId) {
        console.warn("Calm Space: Missing User ID. Saving will fail."); // Changed to warn
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
    utterance.rate = 0.7;

    // --- VOICE CHANGE ---
    if (femaleVoice) {
        utterance.voice = femaleVoice;
        utterance.pitch = 1.4; // Use natural pitch if voice is found
    } else {
        utterance.pitch = 1.4; // Fallback to higher pitch
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
    // Check if parentElement exists before modifying classList
    if (elements.stopMeditationBtn.parentElement) {
        elements.stopMeditationBtn.parentElement.classList.add('grid-cols-2');
        elements.stopMeditationBtn.parentElement.classList.remove('grid-cols-1');
    }


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
        // Meditation guide is finished, but timer is still running.
        // We'll just stay silent and let the timer run out.
        // Or, we could loop back to the beginning:
        currentMeditationStep = 0; // Loop back to the beginning
        // Let's loop. If we don't loop, the 60-second requirement is harder.
    }

    const isSilent = elements.meditationVoiceToggle.checked;
    const instruction = currentMeditationInstructions[currentMeditationStep];
    if (elements.meditationInstruction) elements.meditationInstruction.textContent = instruction;
    
    // Set onend handler *before* speaking
    utterance.onend = () => {
        utterance.onend = null; // Clear handler
        if (activeMeditationTimer) { // Only proceed if timer is still running
            currentMeditationStep++;
            // Wait 3s, then play next instruction
            // This pause is crucial for the "60 second" feel
            setTimeout(runMeditationGuide, 3000); 
        }
    };
    
    // Speak the instruction
    speak(instruction, isSilent);

    // Safety fallback if speak doesn't trigger onend (e.g., if isSilent is true or speech fails)
    if (isSilent || !synth.speaking) {
         // Estimate duration: 80ms per char (slower speech) + 3s pause
         const instructionDuration = (instruction.length * 80) + 3000; 
         setTimeout(() => {
             if (utterance.onend) {
                // Manually trigger onend if it's still set and timer is active
                if(activeMeditationTimer) {
                    utterance.onend(); 
                } else {
                    utterance.onend = null; // Timer stopped, clear handler
                }
             }
         }, instructionDuration);
    }
}


function stopMeditation() {
    clearInterval(activeMeditationTimer);
    activeMeditationTimer = null;
    synth.cancel();
    utterance.onend = null; // Clear the onend callback

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
        currentStretchPoseIndex = 0; // Loop back if timer is still going
    }

    const pose = currentStretchRoutine[currentStretchPoseIndex];
    displayPoseUI(pose); // Update UI to this pose

    const isSilent = elements.stretchVoiceToggle.checked;
    speak(pose.instruction, isSilent);

    clearTimeout(currentStretchPoseTimer);

    const duration = pose.duration || 15000; // Default to 15s

    currentStretchPoseTimer = setTimeout(() => {
        currentStretchPoseIndex++; // Advance index
        // Only run next pose if the main timer is still active
        if (activeStretchTimer) {
             runCurrentStretchPose(); // Call self to run the next pose
        }
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
            const durationMinutes = parseInt(elements.stretchTimerInput.value);
            const duration = durationMinutes * 60; // Get duration in seconds
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
                const selectedButton = document.querySelector('#stretch-routine-buttons button.active');
                const type = selectedButton ? selectedButton.dataset.stretch : null;
                const durationMinutes = parseInt(elements.stretchTimerInput.value); // Get duration again for reflection
                stopStretches();
                if (type) {
                     openReflectionModal('stretch', stretchData[type]?.name || 'Stretch Routine', durationMinutes);
                }
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

    // UPDATED: Removed appId check
    if (!userId) {
        console.error("Cannot save reflection: Missing userId.");
        closeReflectionModal();
        return;
    }

    const todayId = getTodayDateString(); // "YYYY-MM-DD"
    // --- CHANGE: Removed /artifacts/${appId} prefix ---
    const docPath = `users/${userId}/calmSummary/${todayId}`;
    const docRef = doc(db, docPath);

    try {
        // Disable button to prevent double-save
        elements.mindfulReflectionSaveBtn.disabled = true;

        // Get today's document to see if it exists
        const docSnap = await getDoc(docRef);
        let todayData = {
            date: Timestamp.fromDate(new Date(todayId + 'T00:00:00')), // Store a proper timestamp (ensure it's UTC or consistent)
            moods: [],
            breathingMinutes: 0,
            stretchMinutes: 0,
            meditationMinutes: 0,
        };

        if (docSnap.exists()) {
            // Document already exists, merge data
            todayData = docSnap.data();
            // Ensure fields are numbers and arrays exist
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

        // --- NEW: Trigger Summary Animation ---
        let avgMoodForAnim = 3; // Default
        if (todayData.moods.length > 0) {
             const moodSum = todayData.moods.reduce((a, b) => a + b, 0);
             avgMoodForAnim = moodSum / todayData.moods.length;
        }
        playSummaryAnimation(avgMoodForAnim);
        // --- END NEW ---

        // Show sparkle animation on "save"! (Keep this too)
        const btnRect = elements.mindfulReflectionSaveBtn.getBoundingClientRect();
        // Adjust coordinates if needed based on scroll position
        const sparkleX = window.scrollX + btnRect.left + btnRect.width / 2;
        const sparkleY = window.scrollY + btnRect.top + btnRect.height / 2;
        createSparkleAnimation(sparkleX, sparkleY);

    } catch (error) {
        console.error("Error saving reflection: ", error);
        // Optionally show user feedback here
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

    // UPDATED: Removed appId check
    if (!userId) return; // Wait for auth

    // --- CHANGE: Removed /artifacts/${appId} prefix ---
    const collectionPath = `users/${userId}/calmSummary`;
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
                date: Timestamp.fromDate(new Date(todayId + 'T00:00:00')),
                moods: [],
                breathingMinutes: 0,
                stretchMinutes: 0,
                meditationMinutes: 0
            });
        }

        updateDailySummaryUI(summaryData);
    }, (error) => {
        console.error("Error listening to calm summary: ", error);
        // Optionally display an error to the user in the summary card
        if(elements.dailySummaryCard) {
            elements.dailySummaryCard.innerHTML = `<p class="text-red-400 text-center p-4">Error loading daily summary.</p>`;
        }
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
    const moodEmoji = moodEmojis[Math.round(averageMood) || 3]; // Default to 3 (🙂) if no mood recorded
    const colorTheme = moodColors[Math.round(averageMood) || 3];

    // --- 2. Update Gauge ---
    updateMoodGauge(percentage, colorTheme.gauge);
    elements.summaryMoodEmoji.textContent = moodEmoji;
    elements.summaryMoodLabel.textContent = moodLabel;

    // Update label gradient
    elements.summaryMoodLabel.className = 'text-lg font-bold text-transparent bg-clip-text'; // Reset
    elements.summaryMoodLabel.classList.add(colorTheme.label);

    // --- 3. Update Activity Levels ---
    elements.summaryBreathLevel.textContent = `${todaySummary.breathingMinutes || 0} min`;
    elements.summaryStretchLevel.textContent = `${todaySummary.stretchMinutes || 0} min`;
    elements.summaryMeditationLevel.textContent = `${todaySummary.meditationMinutes || 0} min`;

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
    // Animation is now triggered on saveReflection
}

/**
 * Calculates the total score and average mood for the day
 */
function calculateTodayScore(todaySummary) {
    let averageMood = 0;
    if (todaySummary.moods && todaySummary.moods.length > 0) {
        const moodSum = todaySummary.moods.reduce((a, b) => a + b, 0);
        averageMood = moodSum / todaySummary.moods.length; // (1-5)
    }

    // Calculation: Base = mood score. Bonus = activities.
    let baseScore = (averageMood || 2.5) * 20; // 0-100, default mood 2.5 if none logged
    let bonus = 0;
    bonus += (todaySummary.breathingMinutes || 0) * 2; // Max 10min = 20pts
    bonus += (todaySummary.stretchMinutes || 0) * 1;  // Max 10min = 10pts
    bonus += (todaySummary.meditationMinutes || 0) * 2; // Max 10min = 20pts

    let totalScore = baseScore + bonus;

    return { totalScore: Math.min(100, totalScore), averageMood }; // Cap score at 100
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
    const gradient = `conic-gradient(from 0deg, ${color} ${deg}deg, #1a203c ${deg}deg)`; // Use dark color for unfilled part
    elements.summaryMoodGauge.style.backgroundImage = gradient;
}

/**
 * Renders the 7-day bar chart
 */
function renderSummaryChart(summaryData) {
    elements.summaryBarChart.innerHTML = ''; // Clear old bars

    // We need 7 days, even if empty. Data is sorted desc.
    const last7Days = [];
    let currentDate = new Date(getTodayDateString() + 'T00:00:00'); // Use today's date

    for (let i = 0; i < 7; i++) {
        const dateId = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        const dayData = summaryData.find(d => d.id === dateId);

        let avgMood = 0;
        let title = `${dateId}: No data`;
        if (dayData && dayData.moods && dayData.moods.length > 0) {
            const moodSum = dayData.moods.reduce((a, b) => a + b, 0);
            avgMood = moodSum / dayData.moods.length;
            title = `${dateId}: ${moodEmojis[Math.round(avgMood)] || '❓'}`;
        }
        last7Days.push({ mood: avgMood, title: title });

        currentDate.setDate(currentDate.getDate() - 1); // Go to previous day
    }

    // Data is now [today, yesterday, ...]. Reverse for chart [Mon, Tue, ... Sun appearance]
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
        bar.title = day.title; // Tooltip on hover

        // Staggered animation
        setTimeout(() => {
            bar.classList.add('animated');
        }, index * 50); // 50ms delay per bar

        elements.summaryBarChart.appendChild(bar);
    });
}

/**
 * Calculates the current streak based on days with logged moods.
 */
function calculateStreak(summaryData) {
    let streak = 0;
    let todayId = getTodayDateString();
    let currentDateToCheck = new Date(todayId + 'T00:00:00');

    // Check consecutive days starting from today backwards
    for (let i = 0; i < summaryData.length; i++) {
        const dateIdToCheck = `${currentDateToCheck.getFullYear()}-${(currentDateToCheck.getMonth() + 1).toString().padStart(2, '0')}-${currentDateToCheck.getDate().toString().padStart(2, '0')}`;
        const dayData = summaryData.find(d => d.id === dateIdToCheck);

        if (dayData && dayData.moods && dayData.moods.length > 0) {
            streak++;
            currentDateToCheck.setDate(currentDateToCheck.getDate() - 1); // Move to the previous day
        } else {
            // If today wasn't logged or streak breaks, stop checking
            break;
        }
    }

    return streak;
}

/**
 * Triggers the glow/sparkle animation on card update (called from saveReflection)
 */
function playSummaryAnimation(averageMood) {
    if (!elements.summaryGlowEffect) return;
    const colorTheme = moodColors[Math.round(averageMood) || 3];
    elements.summaryGlowEffect.innerHTML = ''; // Clear old ones

    // 1. Gentle Pulse/Glow
    const glow = document.createElement('div');
    glow.className = 'summary-glow';
    glow.style.backgroundColor = colorTheme.glow;
    elements.summaryGlowEffect.appendChild(glow);
    setTimeout(() => glow.remove(), 1500); // Animation duration is 1.5s

    // 2. Sparkles
    for (let i = 0; i < 10; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'summary-sparkle-particle';
        sparkle.style.backgroundColor = colorTheme.glow;
        sparkle.style.boxShadow = `0 0 8px ${colorTheme.glow}`;

        // Random position within the gauge area
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 80 + 20; // 20px to 100px radius from center
        sparkle.style.left = `calc(50% + ${Math.cos(angle) * radius}px)`;
        sparkle.style.top = `calc(50% + ${Math.sin(angle) * radius}px)`;

        // Staggered start
        setTimeout(() => {
            elements.summaryGlowEffect.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1000); // Remove after anim (1s duration)
        }, Math.random() * 300); // Start within 0.3s
    }

}











