import { db } from './firebase.js';
import { getCurrentUserId } from './auth.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// DOM Elements
let calmThemeContainer, themePickerButtons, startBreathingBtn, breathingCircle, breathingText;
let colorTherapyDisplay, soundPlayerButtons, stopSoundBtn;
let startMeditationBtn, meditationText, bellyOutline, toggleVoiceBtn, voiceBtnText, voiceLoader;
let startStretchesBtn, neckRollAnim, shoulderRollAnim, stretchTimer1, stretchTimer2;
let journalModal, journalMoodButtons, journalModalCloseBtn;
let waterReminderToast;

// State
let userId, wellnessData;
let isBreathing = false;
let isMeditating = false;
let isStretching = false;
let isVoiceEnabled = false;
let activeMoodSound = null;
let waterInterval;
let stretchInterval;
let currentAudio = null; // To hold the current HTMLAudioElement for TTS

// Tone.js Synths
let noise, autoFilter, lullabySynth, chimeSynth;

// Meditation Script
const meditationScript = [
    { text: "Place your hands on your belly and take a deep, slow breath in...", duration: 5000 },
    { text: "...and slowly breathe out. Feel your hands, feel your baby.", duration: 5000 },
    { text: "Breathe in love and calm...", duration: 4000 },
    { text: "...breathe out any tension or worry.", duration: 4000 },
    { text: "Imagine your baby, safe and warm inside.", duration: 5000 },
    { text: "Picture your baby smiling and feeling your love.", duration: 5000 },
    { text: "Send a wave of love and peace from your heart to your baby.", duration: 6000 },
    { text: "You are connected. You are both safe. You are strong.", duration: 5000 },
    { text: "Take one more deep breath in...", duration: 4000 },
    { text: "...and let it all go. You've completed your connection.", duration: 5000 }
];

export function initializeCalmSpace(uid, wData) {
    userId = uid;
    wellnessData = wData;

    // Query DOM elements
    calmThemeContainer = document.getElementById('calm-theme-container');
    themePickerButtons = document.getElementById('theme-picker-buttons');
    startBreathingBtn = document.getElementById('start-breathing-btn');
    breathingCircle = document.getElementById('breathing-circle');
    breathingText = document.getElementById('breathing-text');
    colorTherapyDisplay = document.getElementById('color-therapy-display');
    soundPlayerButtons = document.getElementById('sound-player-buttons');
    stopSoundBtn = document.getElementById('stop-sound-btn');
    startMeditationBtn = document.getElementById('start-meditation-btn');
    meditationText = document.getElementById('meditation-text');
    bellyOutline = document.getElementById('belly-outline');
    toggleVoiceBtn = document.getElementById('toggle-voice-btn');
    voiceBtnText = document.getElementById('voice-btn-text');
    voiceLoader = document.getElementById('voice-loader');
    startStretchesBtn = document.getElementById('start-stretches-btn');
    neckRollAnim = document.getElementById('neck-roll-anim');
    shoulderRollAnim = document.getElementById('shoulder-roll-anim');
    stretchTimer1 = document.getElementById('stretch-timer-1');
    stretchTimer2 = document.getElementById('stretch-timer-2');
    journalModal = document.getElementById('journal-modal');
    journalMoodButtons = document.getElementById('journal-mood-buttons');
    journalModalCloseBtn = document.getElementById('journal-modal-close-btn');
    waterReminderToast = document.getElementById('water-reminder-toast');

    // Initialize Tone.js components
    initializeSounds();

    // Setup event listeners
    setupEventListeners();

    // Start water reminder
    if (waterInterval) clearInterval(waterInterval);
    waterInterval = setInterval(showWaterReminder, 20 * 60 * 1000); // 20 minutes
}

export function unloadCalmSpace() {
    // Stop all sounds
    stopAllSounds();
    if (noise) noise.stop();

    // Clear intervals
    if (waterInterval) clearInterval(waterInterval);
    if (stretchInterval) clearInterval(stretchInterval);

    // Reset states
    isBreathing = false;
    isMeditating = false;
    isStretching = false;
    
    // Audio cleanup
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

function initializeSounds() {
    // Ocean/Calm: Filtered noise
    noise = new Tone.Noise("pink").start();
    autoFilter = new Tone.AutoFilter({
        frequency: "8m",
        baseFrequency: 150,
        octaves: 4,
        depth: 0.5
    }).toDestination();
    
    // Dreamy/Lullaby: Simple synth
    lullabySynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 1 }
    }).toDestination();
    lullabySynth.volume.value = -12;

    // Happy/Wind Chimes: Metal synth for bright sounds
    chimeSynth = new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 1.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
    }).toDestination();
    chimeSynth.volume.value = -15;
}

function setupEventListeners() {
    // Theme Picker
    themePickerButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.theme-btn');
        if (!button) return;
        
        const theme = button.dataset.theme;
        calmThemeContainer.className = `space-y-8 calm-theme-${theme}`;
        
        themePickerButtons.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });

    // Breathing
    startBreathingBtn.addEventListener('click', toggleBreathing);
    breathingCircle.addEventListener('click', toggleBreathing);

    // Sound & Color
    soundPlayerButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.mood-sound-btn');
        if (button) {
            const mood = button.dataset.mood;
            playMoodSound(mood);
            soundPlayerButtons.querySelectorAll('.mood-sound-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    });
    stopSoundBtn.addEventListener('click', () => {
        stopAllSounds();
        colorTherapyDisplay.className = 'w-full h-24 rounded-lg mb-4 transition-all duration-1000';
        soundPlayerButtons.querySelectorAll('.mood-sound-btn').forEach(btn => btn.classList.remove('active'));
    });

    // Meditation
    startMeditationBtn.addEventListener('click', toggleMeditation);
    toggleVoiceBtn.addEventListener('click', () => {
        isVoiceEnabled = !isVoiceEnabled;
        voiceBtnText.textContent = isVoiceEnabled ? "Disable Voice" : "Enable Voice";
        toggleVoiceBtn.classList.toggle('active', isVoiceEnabled);
        
        if (!isVoiceEnabled && currentAudio) {
            currentAudio.pause(); // Stop TTS if disabled
        }
    });

    // Stretches
    startStretchesBtn.addEventListener('click', toggleStretches);

    // Journal
    journalMoodButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.journal-mood-btn');
        if (!button) return;

        const moodRating = parseInt(button.dataset.mood);
        saveJournalEntry(moodRating);
        
        journalMoodButtons.querySelectorAll('.journal-mood-btn').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        
        setTimeout(closeJournalModal, 500);
    });
    journalModalCloseBtn.addEventListener('click', closeJournalModal);
    journalModal.addEventListener('click', (e) => e.target === journalModal && closeJournalModal());
}

// --- Breathing Logic ---
function toggleBreathing() {
    isBreathing = !isBreathing;
    if (isBreathing) {
        breathingCircle.classList.remove('breathing-circle-paused');
        breathingCircle.classList.add('breathing-circle-active');
        startBreathingBtn.textContent = "Stop Breathing";
        runBreathingText();
    } else {
        breathingCircle.classList.add('breathing-circle-paused');
        breathingCircle.classList.remove('breathing-circle-active');
        startBreathingBtn.textContent = "Start 4-2-6 Breathing";
        breathingText.textContent = "Start";
        // Show journal pop-up on stop
        setTimeout(() => showJournalModal("Breathing"), 500);
    }
}

function runBreathingText() {
    if (!isBreathing) return;
    breathingText.textContent = "Inhale (4)";
    setTimeout(() => {
        if (!isBreathing) return;
        breathingText.textContent = "Hold (2)";
        setTimeout(() => {
            if (!isBreathing) return;
            breathingText.textContent = "Exhale (6)";
            setTimeout(runBreathingText, 6000);
        }, 2000);
    }, 4000);
}

// --- Sound & Color Logic ---
function stopAllSounds() {
    if (activeMoodSound) {
        activeMoodSound.stop();
        activeMoodSound = null;
    }
    if (noise.state === 'started') noise.disconnect(autoFilter);
    if (lullabySynth) lullabySynth.triggerRelease();
    if (chimeSynth) chimeSynth.triggerRelease();
    Tone.Transport.stop();
    Tone.Transport.cancel();
}

function playMoodSound(mood) {
    stopAllSounds();
    Tone.Transport.start();

    if (mood === 'calm' || mood === 'sleepy') {
        // Ocean/Rain sound
        noise.connect(autoFilter);
        autoFilter.frequency.rampTo(mood === 'calm' ? "8m" : "20m", 10);
        activeMoodSound = noise;
    } else if (mood === 'dreamy') {
        // Lullaby
        const melody = [
            'C4', 'E4', 'G4', 'C5', 'G4', 'E4',
            'C4', 'E4', 'G4', 'C5', 'G4', 'E4',
        ];
        activeMoodSound = new Tone.Sequence((time, note) => {
            lullabySynth.triggerAttackRelease(note, '8n', time);
        }, melody, '4n').start(0);
        Tone.Transport.bpm.value = 60;
    } else if (mood === 'happy') {
        // Wind Chimes
        const notes = ['C5', 'D5', 'E5', 'G5', 'A5'];
        activeMoodSound = new Tone.Loop(time => {
            const note = notes[Math.floor(Math.random() * notes.length)];
            chimeSynth.triggerAttackRelease(note, '2n', time);
        }, '2n').start(0);
        Tone.Transport.bpm.value = 100;
    }
    
    // Set color
    colorTherapyDisplay.className = `w-full h-24 rounded-lg mb-4 transition-all duration-1000 color-${mood}`;
}

// --- Meditation Logic ---
function toggleMeditation() {
    isMeditating = !isMeditating;
    if (isMeditating) {
        startMeditationBtn.textContent = "Stop Meditation";
        bellyOutline.classList.remove('belly-outline-paused');
        bellyOutline.classList.add('belly-outline-active');
        runMeditationScript(0);
    } else {
        startMeditationBtn.textContent = "Start Meditation";
        meditationText.textContent = "Place your hands on your belly and take a deep breath.";
        bellyOutline.classList.add('belly-outline-paused');
        bellyOutline.classList.remove('belly-outline-active');
        if (currentAudio) currentAudio.pause();
        // Show journal pop-up on stop
        setTimeout(() => showJournalModal("Meditation"), 500);
    }
}

function runMeditationScript(index) {
    if (!isMeditating || index >= meditationScript.length) {
        toggleMeditation(); // Auto-stop when script ends
        return;
    }

    const step = meditationScript[index];
    meditationText.textContent = step.text;

    if (isVoiceEnabled) {
        playTTS(step.text, () => {
            if (isMeditating) { // Check again in case user stopped during TTS
                runMeditationScript(index + 1);
            }
        });
    } else {
        setTimeout(() => {
            runMeditationScript(index + 1);
        }, step.duration);
    }
}

// --- Text-to-Speech (TTS) Logic ---
async function playTTS(textToSpeak, onEndedCallback) {
    if (currentAudio) {
        currentAudio.pause(); // Stop previous audio
    }
    
    voiceLoader.classList.remove('hidden');
    toggleVoiceBtn.disabled = true;

    try {
        const apiKey = ""; // Leave as-is, will be populated by runtime
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [{ text: `Say in a soft, soothing, and gentle voice: ${textToSpeak}` }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Aoede" } // Breezy voice
                    }
                }
            },
            model: "gemini-2.5-flash-preview-tts"
        };
        
        const response = await fetchWithBackoff(apiUrl, payload);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith("audio/")) {
            const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)[1], 10);
            const pcmData = base64ToArrayBuffer(audioData);
            const pcm16 = new Int16Array(pcmData);
            const wavBlob = pcmToWav(pcm16, sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);
            
            currentAudio = new Audio(audioUrl);
            currentAudio.onended = () => {
                if (onEndedCallback) onEndedCallback();
            };
            currentAudio.play();
        } else {
            console.error('Invalid TTS response structure:', result);
            if (onEndedCallback) onEndedCallback(); // Continue script even if TTS fails
        }

    } catch (error) {
        console.error("Error generating TTS:", error);
        if (onEndedCallback) onEndedCallback(); // Continue script on error
    } finally {
        voiceLoader.classList.add('hidden');
        toggleVoiceBtn.disabled = false;
    }
}

// --- Stretch Logic ---
function toggleStretches() {
    isStretching = !isStretching;
    if (isStretching) {
        startStretchesBtn.textContent = "Stop Stretches";
        neckRollAnim.classList.add('stretch-active');
        shoulderRollAnim.classList.add('stretch-active');
        runStretchTimer(10, stretchTimer1, () => {
            runStretchTimer(15, stretchTimer2, () => {
                if (isStretching) toggleStretches(); // Auto-stop
            });
        });
    } else {
        startStretchesBtn.textContent = "Start Stretches";
        neckRollAnim.classList.remove('stretch-active');
        shoulderRollAnim.classList.remove('stretch-active');
        if (stretchInterval) clearInterval(stretchInterval);
        stretchTimer1.textContent = "10s";
        stretchTimer2.textContent = "15s";
        // Show journal pop-up on stop
        setTimeout(() => showJournalModal("Stretching"), 500);
    }
}

function runStretchTimer(duration, timerEl, onComplete) {
    if (stretchInterval) clearInterval(stretchInterval);
    let timeLeft = duration;
    timerEl.textContent = `${timeLeft}s`;
    
    stretchInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(stretchInterval);
            if (onComplete) onComplete();
        }
    }, 1000);
}

// --- Journal Logic ---
function showJournalModal(source) {
    if (!userId) return; // Don't show if logged out
    
    journalModal.dataset.source = source || 'unknown'; // Store what triggered it
    journalMoodButtons.querySelectorAll('.journal-mood-btn').forEach(btn => btn.classList.remove('selected'));
    
    journalModal.classList.remove('hidden');
    setTimeout(() => journalModal.classList.add('active'), 10);
}

function closeJournalModal() {
    journalModal.classList.remove('active');
    setTimeout(() => journalModal.classList.add('hidden'), 300);
}

async function saveJournalEntry(moodRating) {
    if (!userId) {
        console.error("Cannot save journal: No user ID");
        return;
    }
    
    const journalRef = collection(db, `users/${userId}/calmJournal`);
    try {
        await addDoc(journalRef, {
            moodRating: moodRating,
            source: journalModal.dataset.source || 'unknown',
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving journal entry:", error);
    }
}

// --- Water Reminder Logic ---
function showWaterReminder() {
    waterReminderToast.classList.add('show');
    setTimeout(() => {
        waterReminderToast.classList.remove('show');
    }, 5000); // Hide after 5 seconds
}


// --- Utility Functions ---

// Retries fetch with exponential backoff
async function fetchWithBackoff(url, payload, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.status === 429) { // Rate limited
                console.warn(`Rate limited. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue;
            }
            return response;
        } catch (error) {
            console.error(`Fetch attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error; // Throw after last retry
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}

// Decodes base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Converts raw PCM data to a WAV file Blob
function pcmToWav(pcmData, sampleRate) {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit PCM
    const dataSize = pcmData.length * bytesPerSample;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF header
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + dataSize, true);
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // "fmt " sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // Bits per sample
    // "data" sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, dataSize, true);

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
        view.setInt16(offset, pcmData[i], true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
}