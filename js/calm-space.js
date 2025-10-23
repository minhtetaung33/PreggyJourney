import { doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentUserId } from "./auth.js";

// ... (keep existing code above) ...

function initializeSounds() {
    // Check if Tone is available (it might fail to load in some environments)
    if (typeof Tone === 'undefined') {
        console.error("Tone.js library not loaded.");
        return false; // Indicate failure
    }
    try {
        // Configure Tone.js latency for better performance on various devices
        // REMOVED: Tone.context.latencyHint = 'interactive'; // or 'balanced' <-- This line caused the error

        // 1. Ocean Sound
        oceanNoise = new Tone.Noise("pink"); // Don't start noise immediately
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

        return true; // Indicate success
    } catch (e) {
        console.error("Error initializing Tone.js sounds:", e);
        return false; // Indicate failure
    }
}

// ... (keep existing code below) ...

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

    // Attempt to initialize sounds and handle potential failure
    const soundsInitialized = initializeSounds();
    if (!soundsInitialized) {
        // Disable sound-related UI elements if initialization failed
        if(soundPlayer) soundPlayer.innerHTML = "<p class='text-center text-red-300'>Could not initialize audio engine. Sound features disabled.</p>";
        if(playSoundBtn) playSoundBtn.disabled = true;
        if(soundMoodSelect) soundMoodSelect.disabled = true;
    }
    
    setupEventListeners();
}

export function updateWellnessDataForCalmSpace(newData) {
    wellnessData = newData;
}

function setupEventListeners() {
    // Breathing
    document.getElementById('start-breathing-btn')?.addEventListener('click', startBreathing);
    
    // Sound Player (only add if sounds initialized)
    if (playSoundBtn) playSoundBtn.addEventListener('click', toggleSound);
    if (soundMoodSelect) soundMoodSelect.addEventListener('change', changeSoundMood);

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
    if (breathCircle) breathCircle.classList.remove('animate-breathe');
    if (breathText) breathText.textContent = "Click 'Start' to begin";
    activeExercise = null;

    // Stop Sound - Check if objects exist before calling methods
    if (currentToneSound) {
        try {
            if (currentToneSound instanceof Tone.Noise) {
                currentToneSound.stop();
            } else if (currentToneSound instanceof Tone.Loop) {
                currentToneSound.stop(0);
                currentToneSound.dispose(); // Important for loops
            } else if (currentToneSound instanceof Tone.Part) {
                currentToneSound.stop(0);
                currentToneSound.dispose(); // Important for parts
                 lullabyPart = null; // Clear reference
            }
            // For simple synths, stopping triggers might be enough, handled implicitly
        } catch (e) {
            console.warn("Minor error stopping sound:", e); // Log as warning
        }
        currentToneSound = null;
    }
     // Always reset button state
    if(playSoundBtn) {
        playSoundBtn.textContent = 'Play';
        playSoundBtn.classList.remove('playing');
    }
    if(lightTherapyBox) {
        lightTherapyBox.classList.remove('animate-color-therapy-calm', 'animate-color-therapy-happy', 'animate-color-therapy-dreamy', 'animate-color-therapy-sleepy');
    }


    // Stop Meditation
    if (meditationInterval) {
        clearInterval(meditationInterval);
        meditationInterval = null;
    }
    if(meditationVisual) meditationVisual.classList.remove('animate-pulse-belly');
    if(meditationText) meditationText.textContent = "Click 'Start' to begin";
    
    // Reset button text
    const startBreathingBtn = document.getElementById('start-breathing-btn');
    if (startBreathingBtn) startBreathingBtn.textContent = 'Start';
    const startMeditationBtn = document.getElementById('start-meditation-btn');
    if(startMeditationBtn) startMeditationBtn.textContent = 'Start';
}

export function stopCalmSpaceActivities() {
    stopAllActivities();
}

// 1. Breathing
function startBreathing(e) {
    if (!breathCircle || !breathText) return; // Ensure elements exist

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
         if (activeExercise !== 'breathing') { // Check if still active
            if(meditationInterval) clearInterval(meditationInterval);
             return;
         }
        breathText.textContent = 'Breathe in...';
        setTimeout(() => {
            if (activeExercise === 'breathing') breathText.textContent = '...Hold...';
        }, 4000);
        setTimeout(() => {
            if (activeExercise === 'breathing') breathText.textContent = '...Breathe out...';
        }, 6000);
    }
    updateBreathText();
    // Clear any previous interval before starting a new one
    if (meditationInterval) clearInterval(meditationInterval);
    meditationInterval = setInterval(updateBreathText, cycle);
    
    setTimeout(() => {
        if (activeExercise === 'breathing') openJournalModal();
    }, 30000); // Open journal after 30s
}

// 2. Sound & Color
async function toggleSound() { // Make async for Tone.start()
    if (typeof Tone === 'undefined' || !playSoundBtn) return; // Check Tone and button

    // --- NEW: Start AudioContext on first user interaction ---
    if (!audioStarted && Tone.context.state === 'suspended') {
        try {
            await Tone.start();
            audioStarted = true;
            console.log('AudioContext started by user gesture.');
        } catch (e) {
            console.error("Error starting AudioContext:", e);
            playSoundBtn.textContent = 'Error'; // Indicate error
            return; // Don't proceed if audio can't start
        }
    }
    // --- End of new part ---

    if (currentToneSound) {
        stopAllActivities(); // This will reset the button text to 'Play'
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
     // Don't proceed if Tone is not available or objects are missing
    if (typeof Tone === 'undefined' || !soundMoodSelect || !lightTherapyBox || !oceanNoise || !chimesSynth || !lullabySynth) return;

    // If a sound is playing, stop it first.
    if (currentToneSound) {
        stopAllActivities(); // This stops sound and resets button/light therapy
        // After stopping, we only restart if the sound player was the active exercise
        if (activeExercise === 'sound') {
             if(playSoundBtn) {
                playSoundBtn.textContent = 'Stop'; // Set button back to Stop
                playSoundBtn.classList.add('playing');
             }
        } else {
            return; // Don't auto-start if it wasn't already playing or stopped by switching tabs
        }
    }

    // Only proceed if sound is the intended active exercise
    if (activeExercise !== 'sound') return;


    const mood = soundMoodSelect.value;
    lightTherapyBox.className = 'absolute inset-0 z-0 transition-all duration-1000'; // Reset classes explicitly

    try {
        switch(mood) {
            case 'calm': // Ocean
                oceanNoise.start();
                currentToneSound = oceanNoise;
                lightTherapyBox.classList.add('animate-color-therapy-calm');
                break;
            case 'happy': // Wind Chimes
                 // Ensure previous loop is disposed if exists
                if (currentToneSound instanceof Tone.Loop) {
                    currentToneSound.dispose();
                }
                currentToneSound = new Tone.Loop(time => {
                     // Add try-catch around triggerAttackRelease as it can fail
                    try {
                        // Use a range of MIDI notes for more chime-like effect
                        const midiNote = Math.random() * 24 + 72; // Notes between MIDI 72 (C5) and 96 (C7)
                        chimesSynth.triggerAttackRelease(Tone.Frequency(midiNote, "midi").toFrequency(), "8n", time);
                    } catch (e) {
                        console.warn("Minor error triggering chime:", e);
                    }
                }, "2n").start(0); // Start the loop immediately
                lightTherapyBox.classList.add('animate-color-therapy-happy');
                break;
            case 'dreamy': // Lullaby
                const melody = [
                    ['C4', '8n'], ['E4', '8n'], ['G4', '8n'], ['E4', '8n'],
                    ['A4', '4n'], ['G4', '4n'],
                    ['C4', '8n'], ['E4', '8n'], ['G4', '8n'], ['E4', '8n'],
                    ['D4', '4n'], ['C4', '4n'], // Fixed duration for C4
                ];
                 // Ensure previous part is disposed if exists
                if (lullabyPart) {
                    lullabyPart.dispose();
                }
                lullabyPart = new Tone.Part((time, note) => {
                     // Add try-catch
                    try {
                        lullabySynth.triggerAttackRelease(note[0], note[1], time);
                    } catch (e) {
                        console.warn("Minor error triggering lullaby note:", e);
                    }
                }, melody).start(0);
                lullabyPart.loop = true;
                lullabyPart.loopEnd = '2m'; // Loop every 2 measures
                Tone.Transport.start(); // Ensure transport is started for Part to work
                currentToneSound = lullabyPart; // Store the part to stop it later
                lightTherapyBox.classList.add('animate-color-therapy-dreamy');
                break;
            case 'sleepy': // Low Hum (using filtered noise)
                 // Reconfigure noise for hum if needed, or use a synth
                 // Let's reuse oceanNoise but maybe lower the filter frequency if needed
                 // For now, just reusing oceanNoise as is.
                oceanNoise.start();
                currentToneSound = oceanNoise;
                lightTherapyBox.classList.add('animate-color-therapy-sleepy');
                break;
        }
    } catch (e) {
        console.error("Error changing sound mood:", e);
        stopAllActivities(); // Stop everything if setting the new sound failed
    }
}


// 3. Meditation
function startMeditation(e) {
     if (!meditationVisual || !meditationText) return; // Ensure elements exist

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
     // Clear any previous interval
    if (meditationInterval) clearInterval(meditationInterval);
    meditationInterval = setInterval(() => {
         if (activeExercise !== 'meditation') { // Check if still active
             if(meditationInterval) clearInterval(meditationInterval);
             return;
         }
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
    if (!stretchSelect || !stretchSvgContainer || !stretchTitle) return; // Ensure elements exist

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
        default:
             title = "Select a stretch";
             svg = `<text x="50" y="50" text-anchor="middle" fill="#a78bfa" font-size="10">Select a stretch</text>`; // Placeholder
    }
    
    stretchTitle.textContent = title;
    stretchSvgContainer.innerHTML = svg;

    setTimeout(() => {
        if (activeExercise === 'stretch') openJournalModal();
    }, 30000); // Open journal after 30s
}

// 5. Journal Modal
function openJournalModal() {
    if (!journalModal || !journalSaveBtn || !journalMoodButtons) return; // Check elements
    if (journalModal.classList.contains('active')) return; // Don't re-open

    // Reset
    journalSaveBtn.dataset.mood = '';
    journalMoodButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    
    journalModal.classList.remove('hidden');
    // Ensure content exists before adding active class
    const content = journalModal.querySelector('#journal-modal-content');
    if (content) {
        setTimeout(() => content.parentElement.classList.add('active'), 10);
    } else {
         setTimeout(() => journalModal.classList.add('active'), 10);
    }
}

function closeJournalModal() {
     if (!journalModal) return; // Check element
    const content = journalModal.querySelector('#journal-modal-content');
    if (content) {
         content.parentElement.classList.remove('active');
    } else {
        journalModal.classList.remove('active');
    }
    setTimeout(() => journalModal.classList.add('hidden'), 300);
}


async function saveJournalMood() {
    if (!journalSaveBtn || !currentUserId) { // Check element and user ID
        closeJournalModal();
        return;
    }
    const mood = journalSaveBtn.dataset.mood;
    if (!mood) {
        closeJournalModal(); // Close if no mood selected
        return;
    }
    
    try {
        const today = new Date();
        const weekId = getWeekId(today);
        const dayKey = getDayKey(today);
        
        const wellnessDocRef = doc(db, `users/${currentUserId}/wellness`, weekId);
        
        // Use setDoc with merge: true to handle document creation/update robustly
        await setDoc(wellnessDocRef, {
            weeklyLog: {
                [dayKey]: {
                    calmMood: mood // Save the mood under 'calmMood' field for the specific day
                }
            }
        }, { merge: true }); // merge: true is crucial here

        console.log(`Saved calm mood '${mood}' for ${dayKey} in week ${weekId}`);

    } catch (error) {
        console.error("Error saving calm mood:", error);
        // Optionally: Show an error message to the user
    }
    
    closeJournalModal();
}


export function unloadCalmSpace() {
    stopAllActivities(); // Ensure everything stops
    // Clean up Tone.js objects safely
    try {
        oceanNoise?.dispose();
        lullabySynth?.dispose();
        chimesSynth?.dispose();
        lullabyPart?.dispose(); // Dispose the lullaby part specifically
        // If currentToneSound holds a Loop or Part, it should have been disposed in stopAllActivities
    } catch (e) {
        console.warn("Minor error disposing Tone.js objects on unload:", e);
    }
    // Clear references
    oceanNoise = null;
    lullabySynth = null;
    chimesSynth = null;
    lullabyPart = null;
    currentToneSound = null;
    
    // Clear interval just in case
    if (meditationInterval) {
        clearInterval(meditationInterval);
        meditationInterval = null;
    }
    console.log("Calm Space unloaded.");
}
    // Clear references
    oceanNoise = null;
    lullabySynth = null;
    chimesSynth = null;
    lullabyPart = null;
    currentToneSound = null;
    
    // Clear interval just in case
    if (meditationInterval) {
        clearInterval(meditationInterval);
        meditationInterval = null;
    }
    console.log("Calm Space unloaded.");
}

