import { db } from './firebase.js';
import { getCurrentUserId } from './auth.js';
import { doc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements ---
let startBreathingBtn, breathingContainer, breathingCircle, breathingGlow, breathingText;
let soundMoodButtons, calmSpaceThemeLayer, themePickerButtons;
let babyConnectionVisual;
let prevStretchBtn, nextStretchBtn, stretchVisual, stretchTitle, stretchDesc;
let waterReminderPopup, closeWaterReminderBtn;
let journalModal, journalMoodButtons, journalMoodText, journalCancelBtn, journalSaveBtn;

let userId = null;
let currentMoodSelection = null;
let moodJournalCollectionRef = null;

// --- State ---
let isBreathing = false;
let breathingTimer;
let waterReminderTimer;
let currentStretchIndex = 0;
let exerciseTimeout; // To trigger journal modal

// --- Audio Synthesis (Tone.js) ---
let sounds = {
    ocean: null,
    rain: null,
    lullaby: null,
    chimes: null,
    heartbeat: null
};
let currentSound = null;

// --- Stretch Data ---
const stretches = [
    {
        title: "Neck Rolls",
        desc: "Gently roll your head from side to side, then in slow circles.",
        svg: `<svg class="w-20 h-20 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.532 4.096a.75.75 0 01.936.464l.87 3.48a.75.75 0 01-.702.96h-1.97a.75.75 0 00-.75.75v.018a.75.75 0 01-1.5 0v-.018a.75.75 0 00-.75-.75h-1.332a.75.75 0 00-.75.75v.018a.75.75 0 01-1.5 0v-.018a.75.75 0 00-.75-.75H5.13a.75.75 0 01-.702-.96l.87-3.48a.75.75 0 01.936-.464l1.83.61a.75.75 0 00.81-.05l1.83-.87a.75.75 0 01.814 0l1.83.87a.75.75 0 00.81.05l1.83-.61zM12 12.75a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 12.75v6m0 0a.75.75 0 01-1.5 0v-6m1.5 0v6m0 0h.008v.008H12v-.008zM12 18.75a.75.75 0 01-1.5 0v-6m1.5 0v6m0 0h.008v.008H12v-.008z" /></svg>`
    },
    {
        title: "Shoulder Circles",
        desc: "Roll your shoulders up, back, and down. Repeat 5 times, then reverse.",
        svg: `<svg class="w-20 h-20 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.376c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" transform="rotate(90 12 12)" /></svg>`
    },
    {
        title: "Hip Tilts",
        desc: "While sitting or standing, gently tilt your pelvis forward and back.",
        svg: `<svg class="w-20 h-20 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 9.563C9 9.254 9.254 9 9.563 9h4.874c.31 0 .563.254.563.563v4.874c0 .31-.254.563-.563.563H9.563C9.254 15 9 14.746 9 14.437V9.564z" /></svg>`
    }
];

// --- Initialization ---
export function initializeCalmSpace(uid) {
    userId = uid;
    if (userId) {
        moodJournalCollectionRef = collection(db, `users/${userId}/moodJournal`);
    }

    // Get all DOM elements
    startBreathingBtn = document.getElementById('start-breathing-btn');
    breathingContainer = document.getElementById('breathing-visualizer-container');
    breathingCircle = document.getElementById('breathing-circle');
    breathingGlow = document.getElementById('breathing-glow-ring');
    breathingText = document.getElementById('breathing-text');
    
    soundMoodButtons = document.getElementById('sound-mood-buttons');
    calmSpaceThemeLayer = document.getElementById('calm-space-theme-layer');
    themePickerButtons = document.getElementById('theme-picker-buttons');
    
    babyConnectionVisual = document.getElementById('baby-connection-visual');
    
    prevStretchBtn = document.getElementById('prev-stretch-btn');
    nextStretchBtn = document.getElementById('next-stretch-btn');
    stretchVisual = document.getElementById('stretch-visual');
    stretchTitle = document.getElementById('stretch-title');
    stretchDesc = document.getElementById('stretch-desc');
    
    waterReminderPopup = document.getElementById('water-reminder-popup');
    closeWaterReminderBtn = document.getElementById('close-water-reminder-btn');
    
    journalModal = document.getElementById('journal-modal');
    journalMoodButtons = document.getElementById('journal-mood-buttons');
    journalMoodText = document.getElementById('journal-mood-text');
    journalCancelBtn = document.getElementById('journal-modal-cancel-btn');
    journalSaveBtn = document.getElementById('journal-modal-save-btn');

    // Add all event listeners
    startBreathingBtn.addEventListener('click', toggleBreathing);
    soundMoodButtons.addEventListener('click', handleSoundMoodClick);
    themePickerButtons.addEventListener('click', handleThemeClick);
    
    prevStretchBtn.addEventListener('click', showPrevStretch);
    nextStretchBtn.addEventListener('click', showNextStretch);
    
    closeWaterReminderBtn.addEventListener('click', () => waterReminderPopup.classList.add('hidden'));
    
    journalMoodButtons.addEventListener('click', handleJournalMoodSelect);
    journalCancelBtn.addEventListener('click', closeJournalModal);
    journalSaveBtn.addEventListener('click', saveJournalEntry);

    // Initial setup
    updateStretchContent();
    createParticles(15);
    calmSpaceThemeLayer.classList.add('theme-glow');
}

export function unloadCalmSpace() {
    // Stop all timers and animations
    if (isBreathing) {
        toggleBreathing(); // This will stop it
    }
    clearTimeout(breathingTimer);
    clearTimeout(exerciseTimeout);
    clearInterval(waterReminderTimer);

    // Stop all sounds
    stopAllSounds();
    currentSound = null;

    // Remove event listeners (basic, not all anonymous)
    // In a real app, you'd store and remove specific listeners
    startBreathingBtn.removeEventListener('click', toggleBreathing);
    soundMoodButtons.removeEventListener('click', handleSoundMoodClick);
    themePickerButtons.removeEventListener('click', handleThemeClick);
    prevStretchBtn.removeEventListener('click', showPrevStretch);
    nextStretchBtn.removeEventListener('click', showNextStretch);
    closeWaterReminderBtn.removeEventListener('click', () => waterReminderPopup.classList.add('hidden'));
    journalMoodButtons.removeEventListener('click', handleJournalMoodSelect);
    journalCancelBtn.removeEventListener('click', closeJournalModal);
    journalSaveBtn.removeEventListener('click', saveJournalEntry);

    userId = null;
    moodJournalCollectionRef = null;
}

export function triggerCalmSpaceIntro() {
    // Start water reminder interval (e.g., every 15 minutes)
    if (waterReminderTimer) clearInterval(waterReminderTimer);
    waterReminderTimer = setInterval(() => {
        waterReminderPopup.classList.remove('hidden');
    }, 1000 * 60 * 15); // 15 minutes
    
    // Start heartbeat sound softly
    playHeartbeat();
}

// --- 1. Guided Breathing ---
function toggleBreathing() {
    isBreathing = !isBreathing;
    if (isBreathing) {
        startBreathingBtn.textContent = 'Stop';
        breathingContainer.classList.add('breathing-animate');
        runBreathingTextCycle();
        // Start journal timer
        startExerciseTimer(1000 * 60 * 2); // 2 minutes
    } else {
        startBreathingBtn.textContent = 'Start (4-2-6)';
        breathingContainer.classList.remove('breathing-animate');
        clearTimeout(breathingTimer);
        breathingText.textContent = 'Press Start';
        // Stop journal timer
        clearTimeout(exerciseTimeout);
    }
}

function runBreathingTextCycle() {
    breathingText.textContent = 'Inhale...';
    breathingTimer = setTimeout(() => {
        breathingText.textContent = 'Hold...';
        breathingTimer = setTimeout(() => {
            breathingText.textContent = 'Exhale...';
            breathingTimer = setTimeout(runBreathingTextCycle, 6000); // 6s exhale
        }, 2000); // 2s hold
    }, 4000); // 4s inhale
}

// --- 2. Sound & Color Player ---
function handleSoundMoodClick(e) {
    const button = e.target.closest('.mood-sound-btn');
    if (!button) return;

    const mood = button.dataset.mood;
    
    // Update button active state
    soundMoodButtons.querySelectorAll('.mood-sound-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    stopAllSounds();

    if (mood === 'calm') {
        playOcean();
        currentSound = 'ocean';
        startExerciseTimer(1000 * 60 * 3); // 3 minutes
    } else if (mood === 'dreamy') {
        playLullaby();
        currentSound = 'lullaby';
        startExerciseTimer(1000 * 60 * 3);
    } else if (mood === 'sleepy') {
        playRain();
        currentSound = 'rain';
        startExerciseTimer(1000 * 60 * 3);
    } else if (mood === 'happy') {
        playChimes();
        currentSound = 'chimes';
        startExerciseTimer(1000 * 60 * 3);
    } else if (mood === 'stop') {
        button.classList.remove('active');
        clearTimeout(exerciseTimeout);
    }
}

function initializeSounds() {
    if (!sounds.ocean) {
        // Ocean: Filtered noise
        sounds.ocean = new Tone.Noise("brown").toDestination();
        const filter = new Tone.AutoFilter({
            frequency: 0.5,
            baseFrequency: 150,
            octaves: 4
        }).toDestination().start();
        sounds.ocean.connect(filter);
    }
    if (!sounds.rain) {
        // Rain: Filtered noise
        sounds.rain = new Tone.Noise("pink").toDestination();
        const rainFilter = new Tone.AutoFilter({
            frequency: 1,
            baseFrequency: 400,
            octaves: 3
        }).toDestination().start();
        sounds.rain.connect(rainFilter);
        sounds.rain.volume.value = -10;
    }
    if (!sounds.lullaby) {
        // Lullaby: Simple synth
        sounds.lullaby = new Tone.Synth({
            oscillator: { type: "fatsine" },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
        }).toDestination();
        sounds.lullaby.volume.value = -12;
    }
    if (!sounds.chimes) {
        // Chimes: Metal synth
        sounds.chimes = new Tone.MetalSynth({
            frequency: 200,
            envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 800,
            octaves: 1.5
        }).toDestination();
        sounds.chimes.volume.value = -15;
    }
    if (!sounds.heartbeat) {
        // Heartbeat: Membrane synth
        sounds.heartbeat = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" }
        }).toDestination();
        sounds.heartbeat.volume.value = -10;
    }
}

function stopAllSounds() {
    Object.values(sounds).forEach(sound => {
        if (sound) {
            if (sound instanceof Tone.Noise) {
                sound.stop();
            }
            if (sound.name === "Loop") {
                sound.stop(0);
                sound.cancel();
            }
        }
    });
    currentSound = null;
}

function playOcean() {
    if (Tone.context.state !== 'running') Tone.context.resume();
    initializeSounds();
    sounds.ocean.start();
}

function playRain() {
    if (Tone.context.state !== 'running') Tone.context.resume();
    initializeSounds();
    sounds.rain.start();
}

function playLullaby() {
    if (Tone.context.state !== 'running') Tone.context.resume();
    initializeSounds();
    const notes = ["C4", "E4", "G4", "E4", "C4", null, "G3", "C4", "E4", "C4", null];
    const loop = new Tone.Loop(time => {
        const note = notes[Math.floor(Math.random() * notes.length)];
        if (note) {
            sounds.lullaby.triggerAttackRelease(note, "8n", time);
        }
    }, "2n").start(0);
    sounds.lullaby.loop = loop; // Store loop to stop it later
    Tone.Transport.start();
}

function playChimes() {
    if (Tone.context.state !== 'running') Tone.context.resume();
    initializeSounds();
    const notes = [600, 700, 800, 900, 1000];
    const loop = new Tone.Loop(time => {
        const note = notes[Math.floor(Math.random() * notes.length)];
        sounds.chimes.triggerAttackRelease(note, "4n", time);
    }, "1n").start(0);
    sounds.chimes.loop = loop;
    Tone.Transport.start();
}

function playHeartbeat() {
    if (Tone.context.state !== 'running') Tone.context.resume();
    initializeSounds();
    const loop = new Tone.Loop(time => {
        sounds.heartbeat.triggerAttackRelease("C2", "8n", time);
        sounds.heartbeat.triggerAttackRelease("C2", "8n", time + 0.25);
    }, "1n").start(0);
    sounds.heartbeat.loop = loop;
    Tone.Transport.start();
}

// --- 4. Stretch Guide ---
function showNextStretch() {
    currentStretchIndex = (currentStretchIndex + 1) % stretches.length;
    updateStretchContent();
}

function showPrevStretch() {
    currentStretchIndex = (currentStretchIndex - 1 + stretches.length) % stretches.length;
    updateStretchContent();
}

function updateStretchContent() {
    const stretch = stretches[currentStretchIndex];
    stretchVisual.innerHTML = stretch.svg;
    stretchTitle.textContent = stretch.title;
    stretchDesc.textContent = stretch.desc;
}

// --- 5. Journal Modal ---
function startExerciseTimer(duration) {
    clearTimeout(exerciseTimeout);
    exerciseTimeout = setTimeout(() => {
        openJournalModal();
    }, duration);
}

function openJournalModal() {
    currentMoodSelection = null;
    journalSaveBtn.disabled = true;
    journalMoodText.textContent = "";
    journalMoodButtons.querySelectorAll('.journal-mood-btn').forEach(btn => btn.classList.remove('selected'));
    
    journalModal.classList.remove('hidden');
    setTimeout(() => journalModal.classList.add('active'), 10);
}

function closeJournalModal() {
    journalModal.classList.remove('active');
    setTimeout(() => journalModal.classList.add('hidden'), 300);
}

function handleJournalMoodSelect(e) {
    const button = e.target.closest('.journal-mood-btn');
    if (!button) return;

    currentMoodSelection = parseInt(button.dataset.mood);
    journalMoodButtons.querySelectorAll('.journal-mood-btn').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    const moodMap = { 1: "Stressed", 2: "A bit uneasy", 3: "Okay", 4: "Calm", 5: "Very relaxed" };
    journalMoodText.textContent = moodMap[currentMoodSelection];
    journalSaveBtn.disabled = false;
}

async function saveJournalEntry() {
    if (!currentMoodSelection || !moodJournalCollectionRef) return;
    
    journalSaveBtn.disabled = true;
    journalSaveBtn.textContent = "Saving...";

    try {
        await addDoc(moodJournalCollectionRef, {
            mood: currentMoodSelection,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving mood entry: ", error);
    } finally {
        journalSaveBtn.disabled = false;
        journalSaveBtn.textContent = "Save";
        closeJournalModal();
    }
}

// --- Theme Picker ---
function handleThemeClick(e) {
    const button = e.target.closest('.theme-btn');
    if (!button) return;

    const theme = button.dataset.theme;
    
    themePickerButtons.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    calmSpaceThemeLayer.classList.remove('theme-glow', 'theme-ocean', 'theme-sky', 'theme-blossom');
    calmSpaceThemeLayer.classList.add(`theme-${theme}`);
}

// --- Particle Effect ---
function createParticles(count) {
    const container = document.getElementById('calm-particles');
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        
        const size = Math.random() * 8 + 2; // 2px to 10px
        const delay = Math.random() * 20; // 0-20s delay
        const duration = Math.random() * 10 + 15; // 15-25s duration
        const left = Math.random() * 100;
        const drift = (Math.random() - 0.5) * 20; // -10vw to +10vw
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}vw`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.setProperty('--drift', `${drift}vw`);
        
        container.appendChild(particle);
    }
}
