import { doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentUserId } from "./auth.js";

// DOM Elements for Calm Space
let calmSpaceContainer, breathingVisualizer, breathCircle, breathText;
let soundPlayer, soundMoodSelect, playSoundBtn, lightTherapyBox;
let meditationPlayer, meditationText, meditationVisual;
let stretchGuide, stretchSelect, stretchSvgContainer, stretchTitle;
let journalModal, journalCloseBtn, journalSaveBtn, journalMoodButtons;

// State
let currentUserId = null;
let wellnessData = {};
let activeExercise = null; // 'breathing', 'sound', 'meditation', 'stretch'
let currentToneSound = null;
let meditationInterval = null;

// --- Sound Generation (Tone.js) ---
let oceanNoise, lullabySynth, chimesSynth;

function initializeSounds() {
    // 1. Ocean Sound
    oceanNoise = new Tone.Noise("pink").start();
    const autoFilter = new Tone.AutoFilter({
        frequency: 0.5,
        baseFrequency: 150,
        octaves: 4,
        depth: 0.8
    }).toDestination();
    oceanNoise.connect(autoFilter);

    // 2. Lullaby Sound
    lullabySynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 1 }
    }).toDestination();
    lullabySynth.volume.value = -12;

    // 3. Wind Chimes
    chimesSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).toDestination();
    chimesSynth.volume.value = -10;
}

// --- Date Helper ---
function getWeekId(d) {
    d = new Date(d);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
}

function getDayKey(d) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const todayIndex = d.getDay();
    return days[todayIndex === 0 ? 6 : todayIndex - 1];
}

// --- Core Functions ---
export function initializeCalmSpace(userId, initialWellnessData) {
    currentUserId = userId;
    wellnessData = initialWellnessData;

    // Find all DOM elements
    calmSpaceContainer = document.getElementById('content-calm-space');
    breathingVisualizer = document.getElementById('breathing-visualizer');
    breathCircle = document.getElementById('breath-circle');
    breathText = document.getElementById('breath-text');
    soundPlayer = document.getElementById('sound-player');
    soundMoodSelect = document.getElementById('sound-mood-select');
    playSoundBtn = document.getElementById('play-sound-btn');
    lightTherapyBox = document.getElementById('light-therapy-box');
    meditationPlayer = document.getElementById('meditation-player');
    meditationText = document.getElementById('meditation-text');
    meditationVisual = document.getElementById('meditation-visual');
    stretchGuide = document.getElementById('stretch-guide');
    stretchSelect = document.getElementById('stretch-select');
    stretchSvgContainer = document.getElementById('stretch-svg-container');
    stretchTitle = document.getElementById('stretch-title');
    journalModal = document.getElementById('journal-modal');
    journalCloseBtn = document.getElementById('journal-modal-close-btn');
    journalSaveBtn = document.getElementById('journal-modal-save-btn');
    journalMoodButtons = document.getElementById('journal-mood-buttons');

    if (!calmSpaceContainer) {
        console.error("Calm Space content not found.");
        return;
    }

    try {
        initializeSounds();
    } catch (e) {
        console.error("Tone.js failed to initialize:", e);
        // Disable sound-related UI
        if(soundPlayer) soundPlayer.innerHTML = "<p class='text-center text-red-300'>Could not initialize audio engine.</p>";
    }
    
    setupEventListeners();
}

export function updateWellnessDataForCalmSpace(newData) {
    wellnessData = newData;
}

function setupEventListeners() {
    // Breathing
    document.getElementById('start-breathing-btn')?.addEventListener('click', startBreathing);
    
    // Sound Player
    playSoundBtn?.addEventListener('click', toggleSound);
    soundMoodSelect?.addEventListener('change', changeSoundMood);

    // Meditation
    document.getElementById('start-meditation-btn')?.addEventListener('click', startMeditation);

    // Stretch Guide
    stretchSelect?.addEventListener('change', changeStretch);

    // Journal Modal
    journalCloseBtn?.addEventListener('click', closeJournalModal);
    journalModal?.addEventListener('click', (e) => e.target === journalModal && closeJournalModal());
    journalSaveBtn?.addEventListener('click', saveJournalMood);

    journalMoodButtons?.addEventListener('click', (e) => {
        const button = e.target.closest('.mood-btn');
        if (button) {
            journalMoodButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            journalSaveBtn.dataset.mood = button.dataset.mood;
        }
    });
}

// --- Feature Logic ---

function stopAllActivities() {
    // Stop Breathing
    breathCircle?.classList.remove('animate-breathe');
    breathText.textContent = "Click 'Start' to begin";
    activeExercise = null;

    // Stop Sound
    if (currentToneSound) {
        if (currentToneSound.name === "Noise") {
            currentToneSound.stop();
        } else if (currentToneSound.name === "Loop") {
            currentToneSound.stop(0);
            currentToneSound.dispose();
        } else {
            // For synths, just stop triggers
        }
        currentToneSound = null;
    }
    playSoundBtn.textContent = 'Play';
    playSoundBtn.classList.remove('playing');
    lightTherapyBox.classList.remove('animate-color-therapy-calm', 'animate-color-therapy-happy', 'animate-color-therapy-dreamy', 'animate-color-therapy-sleepy');

    // Stop Meditation
    if (meditationInterval) {
        clearInterval(meditationInterval);
        meditationInterval = null;
    }
    meditationVisual.classList.remove('animate-pulse-belly');
    meditationText.textContent = "Click 'Start' to begin";
    
    document.getElementById('start-breathing-btn').textContent = 'Start';
    document.getElementById('start-meditation-btn').textContent = 'Start';
}

export function stopCalmSpaceActivities() {
    stopAllActivities();
}

// 1. Breathing
function startBreathing(e) {
    if (activeExercise === 'breathing') {
        stopAllActivities();
        e.target.textContent = 'Start';
        return;
    }
    
    stopAllActivities();
    activeExercise = 'breathing';
    e.target.textContent = 'Stop';

    breathCircle.classList.add('animate-breathe');
    
    const cycle = 12000; // 4s in, 2s hold, 6s out
    function updateBreathText() {
        breathText.textContent = 'Breathe in...';
        setTimeout(() => {
            breathText.textContent = '...Hold...';
        }, 4000);
        setTimeout(() => {
            breathText.textContent = '...Breathe out...';
        }, 6000);
    }
    updateBreathText();
    meditationInterval = setInterval(updateBreathText, cycle); // Reuse interval
    
    setTimeout(() => {
        if (activeExercise === 'breathing') openJournalModal();
    }, 30000); // Open journal after 30s
}

// 2. Sound & Color
function toggleSound() {
    if (currentToneSound) {
        stopAllActivities();
    } else {
        stopAllActivities();
        activeExercise = 'sound';
        playSoundBtn.textContent = 'Stop';
        playSoundBtn.classList.add('playing');
        changeSoundMood(); // Start playing the selected sound

        setTimeout(() => {
            if (activeExercise === 'sound') openJournalModal();
        }, 60000); // Open journal after 1 min
    }
}

function changeSoundMood() {
    if (currentToneSound) {
        stopAllActivities();
        // After stopping, we might want to immediately start the new sound
        if (activeExercise === 'sound') {
             playSoundBtn.textContent = 'Stop';
             playSoundBtn.classList.add('playing');
        } else {
            return; // Don't auto-start if it wasn't already playing
        }
    }

    if (activeExercise !== 'sound') return;

    const mood = soundMoodSelect.value;
    lightTherapyBox.className = 'absolute inset-0 z-0 transition-all duration-1000'; // Reset
    
    switch(mood) {
        case 'calm': // Ocean
            oceanNoise.start();
            currentToneSound = oceanNoise;
            lightTherapyBox.classList.add('animate-color-therapy-calm');
            break;
        case 'happy': // Wind Chimes
            currentToneSound = new Tone.Loop(time => {
                chimesSynth.triggerAttackRelease(Tone.Frequency(Math.random() * 500 + 400, "midi").toFrequency(), "8n", time);
            }, "2n").start(0);
            lightTherapyBox.classList.add('animate-color-therapy-happy');
            break;
        case 'dreamy': // Lullaby
            const melody = [
                ['C4', '8n'], ['E4', '8n'], ['G4', '8n'], ['E4', '8n'],
                ['A4', '4n'], ['G4', '4n'],
                ['C4', '8n'], ['E4', '8n'], ['G4', '8n'], ['E4', '8n'],
                ['D4', '4n'], ['C4', '4a	n'],
            ];
            let part = new Tone.Part((time, note) => {
                lullabySynth.triggerAttackRelease(note[0], note[1], time);
            }, melody).start(0);
            part.loop = true;
            part.loopEnd = '2m';
            currentToneSound = part; // Store the part to stop it
            lightTherapyBox.classList.add('animate-color-therapy-dreamy');
            break;
        case 'sleepy': // Low Hum (reusing ocean noise, but filtered differently)
            oceanNoise.start();
            currentToneSound = oceanNoise;
            lightTherapyBox.classList.add('animate-color-therapy-sleepy');
            break;
    }
}

// 3. Meditation
function startMeditation(e) {
    if (activeExercise === 'meditation') {
        stopAllActivities();
        e.target.textContent = 'Start';
        return;
    }

    stopAllActivities();
    activeExercise = 'meditation';
    e.target.textContent = 'Stop';

    meditationVisual.classList.add('animate-pulse-belly');
    
    const prompts = [
        "Place your hands gently on your belly.",
        "Take a slow, deep breath in...",
        "...and breathe out, releasing all tension.",
        "Feel the warmth from your hands.",
        "Connect with the little one growing inside.",
        "Breathe in love and calm...",
        "...breathe out any worries.",
        "Imagine your baby peaceful and safe.",
        "Send them a feeling of love.",
        "Picture them smiling.",
        "You are connected. You are one.",
        "Take one more deep breath."
    ];
    let i = 0;
    meditationText.textContent = prompts[i];
    meditationInterval = setInterval(() => {
        i++;
        if (i >= prompts.length) {
            meditationText.textContent = "You're doing wonderfully. Stay here as long as you like.";
            clearInterval(meditationInterval);
            meditationInterval = null;
            setTimeout(() => {
                if (activeExercise === 'meditation') openJournalModal();
            }, 5000); // Open journal 5s after prompts end
            return;
        }
        meditationText.textContent = prompts[i];
    }, 5000); // 5 seconds per prompt
}

// 4. Stretch Guide
function changeStretch() {
    stopAllActivities();
    activeExercise = 'stretch';
    const stretch = stretchSelect.value;
    stretchSvgContainer.innerHTML = ''; // Clear previous
    
    let svg, title;
    switch(stretch) {
        case 'neck':
            title = "Gentle Neck Roll";
            svg = `
                <svg viewBox="0 0 100 100" class="w-full h-full">
                    <!-- Silhouette -->
                    <path d="M50 30 C 45 30, 40 35, 40 40 V 60 H 60 V 40 C 60 35, 55 30, 50 30 Z" fill="#c4b5fd" />
                    <rect x="40" y="60" width="20" height="20" fill="#c4b5fd" />
                    <!-- Head -->
                    <circle id="stretch-head" cx="50" cy="20" r="10" fill="#a78bfa" style="transform-origin: 50px 35px; animation: stretch-neck-roll 6s ease-in-out infinite;" />
                </svg>`;
            break;
        case 'shoulders':
            title = "Shoulder Circles";
            svg = `
                <svg viewBox="0 0 100 100" class="w-full h-full">
                    <!-- Torso -->
                    <path d="M50 30 C 45 30, 40 35, 40 40 V 80 H 60 V 40 C 60 35, 55 30, 50 30 Z" fill="#c4b5fd" />
                    <circle cx="50" cy="20" r="10" fill="#c4b5fd" />
                    <!-- Shoulders -->
                    <circle id="stretch-shoulder-l" cx="35" cy="40" r="5" fill="#a78bfa" style="transform-origin: 35px 40px; animation: stretch-shoulder-circle 4s linear infinite;" />
                    <circle id="stretch-shoulder-r" cx="65" cy="40" r="5" fill="#a78bfa" style="transform-origin: 65px 40px; animation: stretch-shoulder-circle 4s linear infinite;" />
                </svg>`;
            break;
        case 'hip':
            title = "Hip Tilt (Pelvic Rock)";
            svg = `
                <svg viewBox="0 0 100 100" class="w-full h-full">
                     <!-- Silhouette -->
                    <path d="M50 20 C 45 20, 40 25, 40 30 V 50 H 60 V 30 C 60 25, 55 20, 50 20 Z" fill="#c4b5fd" />
                    <path id="stretch-hip" d="M40 50 C 35 50, 30 55, 30 60 V 70 C 30 75, 35 80, 40 80 H 60 C 65 80, 70 75, 70 70 V 60 C 70 55, 65 50, 60 50 Z" fill="#a78bfa" style="transform-origin: 50px 65px; animation: stretch-hip-tilt 4s ease-in-out infinite;" />
                </svg>`;
            break;
    }
    
    stretchTitle.textContent = title;
    stretchSvgContainer.innerHTML = svg;

    setTimeout(() => {
        if (activeExercise === 'stretch') openJournalModal();
    }, 30000); // Open journal after 30s
}

// 5. Journal Modal
function openJournalModal() {
    if (journalModal.classList.contains('active')) return; // Don't re-open

    // Reset
    journalSaveBtn.dataset.mood = '';
    journalMoodButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    
    journalModal.classList.remove('hidden');
    setTimeout(() => journalModal.classList.add('active'), 10);
}

function closeJournalModal() {
    journalModal.classList.remove('active');
    setTimeout(() => journalModal.classList.add('hidden'), 300);
}

async function saveJournalMood() {
    const mood = journalSaveBtn.dataset.mood;
    if (!mood || !currentUserId) {
        closeJournalModal();
        return;
    }
    
    try {
        const today = new Date();
        const weekId = getWeekId(today);
        const dayKey = getDayKey(today);
        
        const wellnessDocRef = doc(db, `users/${currentUserId}/wellness`, weekId);
        
        // Use setDoc with merge to create the doc if it doesn't exist
        // or update it if it does.
        await setDoc(wellnessDocRef, {
            weeklyLog: {
                [dayKey]: {
                    calmMood: mood
                }
            }
        }, { merge: true });

    } catch (error) {
        console.error("Error saving calm mood:", error);
    }
    
    closeJournalModal();
}

export function unloadCalmSpace() {
    stopAllActivities();
    // Clean up Tone.js objects
    oceanNoise?.dispose();
    lullabySynth?.dispose();
    chimesSynth?.dispose();
    if (currentToneSound && currentToneSound.name === "Loop") {
        currentToneSound.dispose();
    }
    currentToneSound = null;
    
    if (meditationInterval) {
        clearInterval(meditationInterval);
        meditationInterval = null;
    }
}