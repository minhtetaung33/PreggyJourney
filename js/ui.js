// We define elements as an empty object first.
export const elements = {};

/**
 * Caches all DOM elements after the page has loaded.
 * This function is called by main.js once the DOM is ready.
 */
export const cacheDomElements = () => {
    // Hero and App containers
    elements.heroSection = document.getElementById('hero-section');
    elements.mainApp = document.getElementById('main-app');
    elements.authButtons = document.getElementById('auth-buttons');
    elements.userInfo = document.getElementById('user-info');
    elements.userNameEl = document.getElementById('user-name');
    
    // Auth
    elements.signUpBtn = document.getElementById('sign-up-btn');
    elements.signOutBtn = document.getElementById('sign-out-btn');
    elements.authModal = document.getElementById('auth-modal');
    elements.googleSignInBtn = document.getElementById('google-signin-btn');
    elements.authModalCloseBtn = document.getElementById('auth-modal-close-btn');

    // Tabs
    elements.mealPlanTab = document.getElementById('tab-meal-plan');
    elements.symptomTrackerTab = document.getElementById('tab-symptom-tracker');
    elements.journeyTab = document.getElementById('tab-journey');
    elements.mealPlanContent = document.getElementById('content-meal-plan');
    elements.symptomTrackerContent = document.getElementById('content-symptom-tracker');
    elements.journeyContent = document.getElementById('content-journey');

    // --- CALM SPACE Elements (Added) ---
    elements.calmSpaceTab = document.getElementById('tab-calm-space');
    elements.calmSpaceContent = document.getElementById('content-calm-space');
    elements.sparkleContainer = document.getElementById('sparkle-container');

    // Breathing
    elements.breathingExerciseButtons = document.getElementById('breathing-exercise-buttons');
    elements.breathingPlayBtn = document.getElementById('breathing-play-btn');
    elements.breathingStopBtn = document.getElementById('breathing-stop-btn');
    elements.breathingSilentToggle = document.getElementById('breathing-silent-toggle');
    elements.breathingSoundOnIcon = document.getElementById('breathing-sound-on-icon');
    elements.breathingSoundOffIcon = document.getElementById('breathing-sound-off-icon');
    elements.breathingOrb = document.getElementById('breathing-orb');
    elements.breathingVisualEmoji = document.getElementById('breathing-visual-emoji');
    elements.breathingAnimationElement = document.getElementById('breathing-animation-element');
    elements.breathingInstruction = document.getElementById('breathing-instruction');
    elements.breathingStepsList = document.getElementById('breathing-steps-list');
    elements.breathingTimerInput = document.getElementById('breathing-timer-input');
    elements.breathingTimerDisplay = document.getElementById('breathing-timer-display');

    // Meditation
    elements.meditationTypeButtons = document.getElementById('meditation-type-buttons');
    elements.startMeditationBtn = document.getElementById('start-meditation-btn');
    elements.stopMeditationBtn = document.getElementById('stop-meditation-btn');
    elements.meditationVoiceToggle = document.getElementById('meditation-voice-toggle');
    elements.meditationSoundOnIcon = document.getElementById('meditation-sound-on-icon');
    elements.meditationSoundOffIcon = document.getElementById('meditation-sound-off-icon');
    elements.meditationOrb = document.getElementById('meditation-orb');
    elements.meditationVisualEmoji = document.getElementById('meditation-visual-emoji');
    elements.meditationInstruction = document.getElementById('meditation-instruction');
    elements.meditationTimerInput = document.getElementById('meditation-timer-input');
    elements.meditationTimerDisplay = document.getElementById('meditation-timer-display');
    elements.meditationAudioPlayer = document.getElementById('meditation-audio-player');

    // Stretches
    elements.stretchRoutineButtons = document.getElementById('stretch-routine-buttons');
    elements.stretchPlayPauseBtn = document.getElementById('stretch-play-pause-btn');
    elements.stretchNextPoseBtn = document.getElementById('stretch-next-pose-btn');
    elements.stretchPrevPoseBtn = document.getElementById('stretch-prev-pose-btn');
    elements.stretchVoiceToggle = document.getElementById('stretch-voice-toggle');
    elements.stretchSoundOnIcon = document.getElementById('stretch-sound-on-icon');
    elements.stretchSoundOffIcon = document.getElementById('stretch-sound-off-icon');
    elements.stretchVisual = document.getElementById('stretch-visual');
    elements.stretchPoseDisplay = document.getElementById('stretch-pose-display');
    elements.stretchTimerDisplay = document.getElementById('stretch-timer-display');
    elements.stretchInstruction = document.getElementById('stretch-instruction');
    elements.stretchTimerInput = document.getElementById('stretch-timer-input');
    elements.stretchPlayIcon = document.getElementById('stretch-play-icon');
    elements.stretchPauseIcon = document.getElementById('stretch-pause-icon');

    // Reflection Modal
    elements.mindfulReflectionModal = document.getElementById('mindful-reflection-modal');
    elements.mindfulReflectionCloseBtn = document.getElementById('mindful-reflection-close-btn');
    elements.mindfulMoodButtons = document.getElementById('mindful-mood-buttons');
    elements.mindfulReflectionSaveBtn = document.getElementById('mindful-reflection-save-btn');
    elements.mindfulReflectionTitle = document.getElementById('mindful-reflection-title');
    elements.mindfulReflectionTextarea = document.getElementById('mindful-reflection-textarea');

    // --- Daily Summary Elements (Added) ---
    elements.dailySummaryCard = document.getElementById('daily-summary-card');
    elements.summaryMoodGauge = document.getElementById('summary-mood-gauge');
    elements.summaryMoodEmoji = document.getElementById('summary-mood-emoji');
    elements.summaryMoodLabel = document.getElementById('summary-mood-label');
    elements.summaryGlowEffect = document.getElementById('summary-glow-effect');
    elements.summaryBreathLevel = document.getElementById('summary-breath-level');
    elements.summaryStretchLevel = document.getElementById('summary-stretch-level');
    elements.summaryMeditationLevel = document.getElementById('summary-meditation-level');
    elements.summaryPositiveMessage = document.getElementById('summary-positive-message');
    elements.summaryStreakBadge = document.getElementById('summary-streak-badge');
    elements.summaryBarChart = document.getElementById('summary-bar-chart');

    // --- NEW JOURNEY TAB APPOINTMENT FIELDS ---
    // New To-Do Form
    elements.newAppointmentFields = document.getElementById('new-appointment-fields');
    elements.newAppointmentFname = document.getElementById('new-appointment-fname');
    elements.newAppointmentLname = document.getElementById('new-appointment-lname');
    elements.newAppointmentAddress = document.getElementById('new-appointment-address');
    elements.newAppointmentContact = document.getElementById('new-appointment-contact');
    elements.newAppointmentEmail = document.getElementById('new-appointment-email');
    elements.newAppointmentType = document.getElementById('new-appointment-type');
    elements.newAppointmentCustomType = document.getElementById('new-appointment-custom-type');

    // Edit To-Do Modal
    elements.editAppointmentFields = document.getElementById('edit-appointment-fields');
    elements.editAppointmentFname = document.getElementById('edit-appointment-fname');
    elements.editAppointmentLname = document.getElementById('edit-appointment-lname');
    elements.editAppointmentAddress = document.getElementById('edit-appointment-address');
    elements.editAppointmentContact = document.getElementById('edit-appointment-contact');
    elements.editAppointmentEmail = document.getElementById('edit-appointment-email');
    elements.editAppointmentType = document.getElementById('edit-appointment-type');
    elements.editAppointmentCustomType = document.getElementById('edit-appointment-custom-type');
    // --- END NEW JOURNEY FIELDS ---

    // --- Animation Elements ---
    elements.bubbleBackground = document.getElementById('bubble-background');
    elements.pageLoadOverlay = document.getElementById('page-load-overlay');
};


/**
 * Creates the rising bubble background effect.
 */
export const createBubbleBackground = () => {
    if (!elements.bubbleBackground) return;
    const numBubbles = 30; // More bubbles
    for (let i = 0; i < numBubbles; i++) {
        const bubble = document.createElement('span');
        bubble.className = 'background-bubble';
        
        const size = Math.random() * 80 + 20; // Size from 20px to 100px
        const duration = Math.random() * 10 + 10; // Duration from 10s to 20s
        const delay = Math.random() * 15; // Start delay up to 15s
        const horizontal = Math.random() * 100; // Horizontal position
        const drift = (Math.random() - 0.5) * 20; // Horizontal drift

        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `calc(${horizontal}vw - ${size / 2}px)`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;
        
        // Custom property for horizontal drift
        bubble.style.setProperty('--drift', `${drift}vw`); 
        
        elements.bubbleBackground.appendChild(bubble);
    }
    
    // Update keyframes in CSS to use drift (we can't, but we can slightly modify the animation)
    // We'll modify the `rise` keyframe in CSS to include a horizontal movement.
    // For simplicity, we'll stick to the vertical rise defined in CSS.
};

/**
 * Resets the entrance animations for a given tab content area.
 * @param {HTMLElement} tabContentElement - The tab content element (e.g., elements.mealPlanContent)
 */
const resetTabAnimation = (tabContentElement) => {
    if (!tabContentElement) return;
    const cards = tabContentElement.querySelectorAll('.anim-card');
    cards.forEach(card => {
        card.classList.remove('anim-bubble-in', 'anim-float');
        // Re-apply initial hidden state
        card.style.opacity = '0'; 
    });
};

/**
 * Plays the staggered bubble-in animation for a tab content area.
 * @param {HTMLElement} tabContentElement - The tab content element (e.g., elements.mealPlanContent)
 */
const playTabEntranceAnimation = (tabContentElement) => {
    if (!tabContentElement) return;
    const cards = tabContentElement.querySelectorAll('.anim-card');
    const staggerDelay = 300; // 0.3s delay between cards

    cards.forEach((card, index) => {
        // Ensure card is reset before animating
        card.classList.remove('anim-bubble-in', 'anim-float');
        card.style.opacity = '0';

        setTimeout(() => {
            card.style.opacity = '1'; // Make it visible *as* animation starts
            card.classList.add('anim-bubble-in');
        }, index * staggerDelay);
    });

    // Add the floating animation after all cards have bubbled in
    const totalAnimationTime = (cards.length - 1) * staggerDelay + 800; // Last card starts + 800ms animation
    setTimeout(() => {
        cards.forEach(card => {
            card.classList.add('anim-float');
        });
    }, totalAnimationTime);
};

// --- NEW SPARKLE ANIMATION ---
/**
 * Creates a sparkle animation at a specific (x, y) coordinate.
 * @param {number} x - The x coordinate.
 *.param {number} y - The y coordinate.
 */
export const createSparkleAnimation = (x, y) => {
    if (!elements.sparkleContainer) return;

    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;

    elements.sparkleContainer.appendChild(sparkle);

    // Remove the sparkle element after the animation completes
    setTimeout(() => {
        sparkle.remove();
    }, 1000); // Animation duration is 1s
};


export const showMainApp = () => {
    elements.authButtons.classList.add('hidden');
    elements.userInfo.classList.add('flex');
    elements.userInfo.classList.remove('hidden');
    elements.mainApp.classList.remove('hidden');
    elements.heroSection.classList.add('hidden');

    // Trigger animation for the default active tab
    setTimeout(() => {
        const activeContent = document.querySelector('.tab-content.active');
        if(activeContent) {
            playTabEntranceAnimation(activeContent);
        }
    }, 200); // Small delay for content to render
};

export const showHeroSection = () => {
    elements.authButtons.classList.remove('hidden');
    elements.userInfo.classList.remove('flex');
    elements.userInfo.classList.add('hidden');
    elements.mainApp.classList.add('hidden');
    elements.heroSection.classList.remove('hidden');
};

export const openAuthModal = () => {
    elements.authModal.classList.remove('hidden');
    setTimeout(() => elements.authModal.classList.add('active'), 10);
};

export const closeAuthModal = () => {
    elements.authModal.classList.remove('active');
    setTimeout(() => elements.authModal.classList.add('hidden'), 300);
};

export const setupTabs = (onTabSwitch) => {
    elements.mealPlanTab.addEventListener('click', () => {
        switchTab('meal');
        onTabSwitch('meal');
    });
    elements.symptomTrackerTab.addEventListener('click', () => {
        switchTab('symptom');
        onTabSwitch('symptom');
    });
    // --- NEW CALM SPACE TAB ---
    elements.calmSpaceTab.addEventListener('click', () => {
        switchTab('calm');
        onTabSwitch('calm');
    });
    elements.journeyTab.addEventListener('click', () => {
        switchTab('journey');
        onTabSwitch('journey');
    });
};

const switchTab = (activeTab) => {
    const tabs = {
        meal: { btn: elements.mealPlanTab, content: elements.mealPlanContent },
        symptom: { btn: elements.symptomTrackerTab, content: elements.symptomTrackerContent },
        calm: { btn: elements.calmSpaceTab, content: elements.calmSpaceContent }, // NEW
        journey: { btn: elements.journeyTab, content: elements.journeyContent }
    };

    Object.keys(tabs).forEach(key => {
        if (tabs[key].btn && tabs[key].content) {
            tabs[key].btn.classList.remove('active');
            tabs[key].content.classList.remove('active');
            // Reset animations on other tabs
            if (key !== activeTab) {
                resetTabAnimation(tabs[key].content);
            }
        }
    });

    if (tabs[activeTab].btn && tabs[activeTab].content) {
        tabs[activeTab].btn.classList.add('active');
        tabs[activeTab].content.classList.add('active');
        
        // Play animation for the new active tab
        playTabEntranceAnimation(tabs[activeTab].content);
    }
};
