// js/calm-space.js
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentUserId } from "./auth.js";

// --- STATE VARIABLES ---
let currentUserId = null;
let activeBreathingInterval = null;
let activeMeditationInterval = null;
let activeStretchInterval = null;
let activeAmbientAudio = null;
let activeWaterAudio = null;
let activeToneAudio = null;

// --- DATA ---
const breathingExercises = {
    "diaphragmatic": { name: "Diaphragmatic Breathing", timings: [4000, 0, 6000, 0], steps: ["Inhale (4s)", "Hold", "Exhale (6s)", "Hold"] },
    "pursed-lip": { name: "Pursed-Lip Breathing", timings: [2000, 0, 4000, 0], steps: ["Inhale (2s)", "Hold", "Exhale (4s)", "Hold"] },
    "box": { name: "Box Breathing", timings: [4000, 4000, 4000, 4000], steps: ["Inhale (4s)", "Hold (4s)", "Exhale (4s)", "Hold (4s)"] },
    "4-7-8": { name: "4-7-8 Breathing", timings: [4000, 7000, 8000, 0], steps: ["Inhale (4s)", "Hold (7s)", "Exhale (8s)", "Hold"] },
    "alternate-nostril": { name: "Alternate Nostril (Guided)", timings: [4000, 0, 4000, 0], steps: ["Inhale Left (4s)", "Hold", "Exhale Right (4s)", "Hold"] } // Simplified for visualizer
};

const meditationTexts = [
    "Imagine your baby smiling inside.",
    "You are creating a safe, loving space for your baby.",
    "Breathe in love, breathe out any tension.",
    "Your baby feels your calm and your love.",
    "You are strong. You are connected.",
    "Every breath you take also nourishes your baby."
];

const stretchGuides = {
    "neck": { name: "Gentle Neck Tilt", desc: "Slowly tilt your head to one side, hold for 15s. Repeat on the other side.", duration: 30, svg: `<svg class="w-24 h-24" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><circle cx="50" cy="30" r="10"/><path d="M50 40 V 60 M 40 70 H 60 M 50 60 L 40 80 M 50 60 L 60 80"/><path d="M50 30 C 45 30, 40 35, 40 40 C 40 45, 45 50, 50 50 M 45 25 A 5 5 0 0 1 55 25"/></svg>` },
    "back": { name: "Cat-Cow Stretch", desc: "On all fours, inhale to arch your back down. Exhale to round your spine up. Repeat for 60s.", duration: 60, svg: `<svg class="w-24 h-24" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M 20 60 Q 50 40, 80 60 M 20 70 L 25 90 M 30 70 L 35 90 M 70 70 L 65 90 M 80 70 L 75 90"/><circle cx="75" cy="50" r="5"/></svg>` },
    "legs": { name: "Seated Forward Fold", desc: "Sit with legs extended. Gently lean forward, keeping your back straight. Hold for 30s.", duration: 30, svg: `<svg class="w-24 h-24" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M 30 80 H 90 M 30 80 L 40 60 Q 50 50, 70 60 L 80 70"/><circle cx="75" cy="50" r="5"/></svg>` },
    "hips": { name: "Butterfly Pose", desc: "Sit with the soles of your feet together. Gently press your knees toward the floor. Hold for 45s.", duration: 45, svg: `<svg class="w-24 h-24" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2"><path d="M 50 50 L 30 80 H 70 L 50 50 M 45 80 L 30 90 M 55 80 L 70 90"/><path d="M 50 50 Q 40 50, 35 60 L 30 80"/><path d="M 50 50 Q 60 50, 65 60 L 70 80"/><circle cx="50" cy="40" r="5"/></svg>` }
};

// --- AUDIO CONTEXT for TONES ---
// We use this for generating tones dynamically without external files.
let audioCtx;
function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// Function to play a simple, gentle tone
function playTone(frequency, duration, type = 'sine') {
    try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05); // Fade in
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration - 0.05); // Fade out

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
        console.error("AudioContext error:", e);
    }
}


// --- INITIALIZATION ---
export function initializeCalmSpace() {
    currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    // --- Create Audio Elements ---
    // We create them in JS to keep the HTML cleaner
    if (!document.getElementById('ambient-ocean-audio')) {
        const oceanAudio = document.createElement('audio');
        oceanAudio.id = 'ambient-ocean-audio';
        oceanAudio.src = 'https://cdn.pixabay.com/audio/2022/03/16/audio_94229b1b6a.mp3'; // Replace with a safe, reliable audio source
        oceanAudio.loop = true;
        document.body.appendChild(oceanAudio);

        const heartbeatAudio = document.createElement('audio');
        heartbeatAudio.id = 'ambient-heartbeat-audio';
        heartbeatAudio.src = 'https://cdn.pixabay.com/audio/2021/08/09/audio_b2f8e21a8a.mp3'; // Replace with safe audio
        heartbeatAudio.loop = true;
        document.body.appendChild(heartbeatAudio);
    }
    
    // Select the newly created audio elements
    activeAmbientAudio = document.getElementById('ambient-ocean-audio');
    
    // This tone is for the water reminder
    activeWaterAudio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_7564d3c52e.mp3'); // Gentle bell sound
    
    // This tone is for the stretch countdown
    activeToneAudio = new Audio('https://cdn.pixabay.com/audio/2022/05/27/audio_882f09ada8.mp3'); // Short tone

    // --- Setup Listeners ---
    setupCalmEventListeners();
    
    // --- Populate Dynamic Content ---
    populateSelect('breathing-select', Object.keys(breathingExercises), Object.values(breathingExercises).map(e => e.name));
    populateStretchCards();
}

function populateSelect(elementId, keys, values) {
    const select = document.getElementById(elementId);
    if (!select) return;
    
    select.innerHTML = ''; // Clear existing
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.textContent = `Select exercise...`;
    select.appendChild(defaultOpt);

    keys.forEach((key, index) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = values[index];
        select.appendChild(opt);
    });
}

function populateStretchCards() {
    const container = document.getElementById('stretch-guide-container');
    if (!container) return;
    
    container.innerHTML = ''; // Clear existing
    
    Object.keys(stretchGuides).forEach(key => {
        const guide = stretchGuides[key];
        const card = document.createElement('div');
        card.className = 'glass-card anim-card p-4 text-center cursor-pointer hover:bg-white/20 transition-colors stretch-card';
        card.dataset.stretchKey = key;
        
        card.innerHTML = `
            <div class="w-24 h-24 mx-auto text-purple-300 mb-2">
                ${guide.svg}
            </div>
            <h4 class="text-lg font-bold text-white">${guide.name}</h4>
        `;
        
        container.appendChild(card);
    });
}

// --- EVENT LISTENERS ---
function setupCalmEventListeners() {
    // --- Breathing Visualizer ---
    const startBreathingBtn = document.getElementById('start-breathing-btn');
    if (startBreathingBtn) {
        startBreathingBtn.addEventListener('click', () => {
            if (activeBreathingInterval) {
                stopBreathingExercise();
            } else {
                startBreathingExercise();
            }
        });
    }

    // --- Ambient Sound ---
    const ambientSoundSelect = document.getElementById('ambient-sound-select');
    if (ambientSoundSelect) {
        ambientSoundSelect.addEventListener('change', (e) => {
            playAmbientSound(e.target.value);
        });
    }

    // --- Baby Connection ---
    const meditationCard = document.getElementById('baby-connection-card');
    if (meditationCard) {
        meditationCard.addEventListener('click', () => {
            if (activeMeditationInterval) {
                stopMeditation();
            } else {
                startMeditation();
            }
        });
    }
    
    // --- Stretches ---
    const stretchContainer = document.getElementById('stretch-guide-container');
    if (stretchContainer) {
        stretchContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.stretch-card');
            if (card && card.dataset.stretchKey) {
                startStretch(card.dataset.stretchKey);
            }
        });
    }
    
    const stopStretchBtn = document.getElementById('stop-stretch-btn');
    if(stopStretchBtn) {
        stopStretchBtn.addEventListener('click', stopStretch);
    }

    // --- Journal Modal ---
    const journalModal = document.getElementById('journal-modal');
    if (journalModal) {
        journalModal.addEventListener('click', (e) => {
            if (e.target === journalModal) closeJournalModal();
        });
    }

    const closeJournalBtn = document.getElementById('journal-close-btn');
    if (closeJournalBtn) {
        closeJournalBtn.addEventListener('click', closeJournalModal);
    }

    const moodEmojiContainer = document.getElementById('mood-emoji-container');
    if (moodEmojiContainer) {
        moodEmojiContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.mood-btn');
            if (button) {
                const mood = button.dataset.mood;
                // Highlight selected
                moodEmojiContainer.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                // Save
                saveMood(mood);
            }
        });
    }
    
    // --- Water Reminder ---
    const waterReminderBtn = document.getElementById('water-reminder-btn');
    if(waterReminderBtn) {
        waterReminderBtn.addEventListener('click', playWaterReminder);
    }
}

// --- BREATHING VISUALIZER LOGIC ---
function startBreathingExercise() {
    const select = document.getElementById('breathing-select');
    const visualizer = document.getElementById('breathing-visualizer');
    const statusText = document.getElementById('breathing-status-text');
    const startBtn = document.getElementById('start-breathing-btn');
    if (!select || !visualizer || !statusText || !startBtn) return;
    
    const exerciseKey = select.value;
    if (!exerciseKey) return;
    
    stopBreathingExercise(); // Stop any existing exercise

    const exercise = breathingExercises[exerciseKey];
    const totalDuration = exercise.timings.reduce((a, b) => a + b, 0);
    let step = 0;
    
    const runStep = () => {
        const duration = exercise.timings[step];
        const stepName = exercise.steps[step];
        
        statusText.textContent = stepName;
        
        // Handle animation
        if (stepName.includes("Inhale")) {
            visualizer.style.transform = 'scale(1)';
            visualizer.style.transitionDuration = `${duration}ms`;
            visualizer.classList.add('glowing');
        } else if (stepName.includes("Exhale")) {
            visualizer.style.transform = 'scale(0.5)';
            visualizer.style.transitionDuration = `${duration}ms`;
            visualizer.classList.remove('glowing');
        }
        
        // Move to next step after duration, if duration > 0
        if (duration > 0) {
            step = (step + 1) % exercise.timings.length;
        } else {
            // If duration is 0, skip to the next step immediately
            step = (step + 1) % exercise.timings.length;
            runStep(); // Run the next step immediately
            return;
        }
    };
    
    // Initial step
    runStep();
    
    // Set interval for subsequent steps
    // This is tricky. Let's restart the "loop" every totalDuration
    activeBreathingInterval = setInterval(() => {
        step = 0; // Reset to start
        runStep();
    }, totalDuration);
    
    // Set interval for the steps *within* the loop
    // This is a better approach.
    clearInterval(activeBreathingInterval); // Clear the previous interval
    
    let timeInCycle = 0;
    const tick = () => {
        if (timeInCycle === 0) { // Inhale
            statusText.textContent = exercise.steps[0];
            visualizer.style.transform = 'scale(1)';
            visualizer.style.transitionDuration = `${exercise.timings[0]}ms`;
            visualizer.classList.add('glowing');
        }
        if (timeInCycle === exercise.timings[0]) { // Hold 1
            if(exercise.timings[1] > 0) statusText.textContent = exercise.steps[1];
        }
        if (timeInCycle === exercise.timings[0] + exercise.timings[1]) { // Exhale
            statusText.textContent = exercise.steps[2];
            visualizer.style.transform = 'scale(0.5)';
            visualizer.style.transitionDuration = `${exercise.timings[2]}ms`;
            visualizer.classList.remove('glowing');
        }
        if (timeInCycle === exercise.timings[0] + exercise.timings[1] + exercise.timings[2]) { // Hold 2
             if(exercise.timings[3] > 0) statusText.textContent = exercise.steps[3];
        }
        
        timeInCycle += 100; // Check every 100ms
        if(timeInCycle >= totalDuration) {
            timeInCycle = 0;
        }
    };
    
    // Run first step immediately
    timeInCycle = 0;
    tick(); 
    // Set interval
    activeBreathingInterval = setInterval(tick, 100);

    startBtn.textContent = 'Stop';
    select.disabled = true;
    showJournalModal('Guided Breathing');
}

function stopBreathingExercise() {
    const visualizer = document.getElementById('breathing-visualizer');
    const statusText = document.getElementById('breathing-status-text');
    const startBtn = document.getElementById('start-breathing-btn');
    const select = document.getElementById('breathing-select');
    
    if (activeBreathingInterval) {
        clearInterval(activeBreathingInterval);
        activeBreathingInterval = null;
    }
    
    if(visualizer) {
        visualizer.style.transform = 'scale(0.75)';
        visualizer.style.transitionDuration = '1000ms';
        visualizer.classList.remove('glowing');
    }
    if(statusText) statusText.textContent = 'Tap "Start" to begin';
    if(startBtn) startBtn.textContent = 'Start';
    if(select) select.disabled = false;
}

// --- AMBIENT SOUND LOGIC ---
function playAmbientSound(sound) {
    // Stop any currently playing audio
    if (activeAmbientAudio) {
        activeAmbientAudio.pause();
        activeAmbientAudio.currentTime = 0;
    }
    
    if (sound === 'ocean') {
        activeAmbientAudio = document.getElementById('ambient-ocean-audio');
    } else if (sound === 'heartbeat') {
        activeAmbientAudio = document.getElementById('ambient-heartbeat-audio');
    } else {
        return; // "None" was selected
    }

    if (activeAmbientAudio) {
        activeAmbientAudio.play().catch(e => console.error("Audio play failed:", e));
    }
}

// --- MEDITATION LOGIC ---
function startMeditation() {
    const card = document.getElementById('baby-connection-card');
    const textEl = document.getElementById('meditation-text');
    const visualEl = document.getElementById('meditation-visual');
    if (!card || !textEl || !visualEl) return;
    
    stopMeditation(); // Stop any existing
    
    card.classList.add('active'); // e.g., to change border or glow
    visualEl.classList.add('pulsing'); // Add pulsing animation
    
    const showRandomText = () => {
        const randomIndex = Math.floor(Math.random() * meditationTexts.length);
        textEl.textContent = meditationTexts[randomIndex];
        textEl.classList.add('fade-in');
        setTimeout(() => textEl.classList.remove('fade-in'), 1000); // Match animation duration
    };
    
    showRandomText(); // Show one immediately
    activeMeditationInterval = setInterval(showRandomText, 11000);
    
    showJournalModal('Baby Connection Meditation');
}

function stopMeditation() {
    const card = document.getElementById('baby-connection-card');
    const textEl = document.getElementById('meditation-text');
    const visualEl = document.getElementById('meditation-visual');
    
    if (activeMeditationInterval) {
        clearInterval(activeMeditationInterval);
        activeMeditationInterval = null;
    }
    
    if(card) card.classList.remove('active');
    if(visualEl) visualEl.classList.remove('pulsing');
    if(textEl) textEl.textContent = 'Click to begin connecting with your baby.';
}

// --- STRETCH LOGIC ---
function startStretch(stretchKey) {
    const guide = stretchGuides[stretchKey];
    if (!guide) return;
    
    const container = document.getElementById('stretch-guide-container');
    const activeView = document.getElementById('active-stretch-view');
    const titleEl = document.getElementById('stretch-title');
    const descEl = document.getElementById('stretch-desc');
    const timerEl = document.getElementById('stretch-timer');
    const svgEl = document.getElementById('stretch-svg-container');

    if (!container || !activeView || !titleEl || !descEl || !timerEl || !svgEl) return;
    
    stopStretch(); // Stop any active stretch

    // Show active view, hide list
    container.classList.add('hidden');
    activeView.classList.remove('hidden');
    
    // Populate content
    titleEl.textContent = guide.name;
    descEl.textContent = guide.desc;
    svgEl.innerHTML = guide.svg;
    
    let timeLeft = guide.duration;
    timerEl.textContent = `${timeLeft}s`;
    
    activeStretchInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s`;
        
        if(timeLeft > 0 && timeLeft <= 3) {
            // Play countdown tone
            if(activeToneAudio) activeToneAudio.play().catch(e => console.error("Tone play failed:", e));
        }
        
        if (timeLeft <= 0) {
            stopStretch();
            showJournalModal(guide.name); // Show journal when complete
        }
    }, 1000);
}

function stopStretch() {
    if (activeStretchInterval) {
        clearInterval(activeStretchInterval);
        activeStretchInterval = null;
    }
    
    const container = document.getElementById('stretch-guide-container');
    const activeView = document.getElementById('active-stretch-view');
    
    if(container) container.classList.remove('hidden');
    if(activeView) activeView.classList.add('hidden');
}

// --- JOURNAL MODAL LOGIC ---
function showJournalModal(exerciseName) {
    const modal = document.getElementById('journal-modal');
    const title = document.getElementById('journal-title');
    if (!modal || !title) return;
    
    title.textContent = `You completed: ${exerciseName}`;
    
    // Reset mood selection
    const moodEmojiContainer = document.getElementById('mood-emoji-container');
    if(moodEmojiContainer) {
        moodEmojiContainer.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeJournalModal() {
    const modal = document.getElementById('journal-modal');
    if (!modal) return;
    
    modal.classList.remove('active');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

async function saveMood(mood) {
    const titleEl = document.getElementById('journal-title');
    if (!currentUserId || !titleEl) {
        console.error("No user or title for mood log");
        return;
    }
    
    const exercise = titleEl.textContent.replace('You completed: ', '');
    const moodLog = {
        userId: currentUserId,
        mood: mood,
        activity: exercise,
        createdAt: serverTimestamp()
    };
    
    try {
        const docRef = await addDoc(collection(db, `users/${currentUserId}/moodLogs`), moodLog);
        console.log("Mood log saved with ID: ", docRef.id);
        
        // Give feedback (e.g., sparkle) and close
        const sparkleEl = document.getElementById('journal-sparkle');
        if(sparkleEl) {
            sparkleEl.classList.add('animate');
            setTimeout(() => sparkleEl.classList.remove('animate'), 1000);
        }
        
        setTimeout(closeJournalModal, 500); // Close modal after a short delay
        
    } catch (e) {
        console.error("Error adding mood log: ", e);
    }
}

// --- WATER REMINDER ---
function playWaterReminder() {
    if(activeWaterAudio) {
        activeWaterAudio.currentTime = 0;
        activeWaterAudio.play().catch(e => console.error("Water reminder audio failed:", e));
    }
    showJournalModal("Drink Water Reminder");
}

// --- CLEANUP ---
export function unloadCalmSpace() {
    stopBreathingExercise();
    stopMeditation();
    stopStretch();
    if (activeAmbientAudio) {
        activeAmbientAudio.pause();
    }
    
    currentUserId = null;
    // We don't need to remove event listeners if the tab content is simply hidden
    // If the content is *removed* from the DOM, they are garbage collected.
}
