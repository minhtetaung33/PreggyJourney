export const elements = {
    // Hero and App containers
    heroSection: document.getElementById('hero-section'),
    mainApp: document.getElementById('main-app'),
    authButtons: document.getElementById('auth-buttons'),
    userInfo: document.getElementById('user-info'),
    userNameEl: document.getElementById('user-name'),
    
    // Auth
    signUpBtn: document.getElementById('sign-up-btn'),
    signOutBtn: document.getElementById('sign-out-btn'),
    authModal: document.getElementById('auth-modal'),
    googleSignInBtn: document.getElementById('google-signin-btn'),
    authModalCloseBtn: document.getElementById('auth-modal-close-btn'),

    // Tabs
    mealPlanTab: document.getElementById('tab-meal-plan'),
    symptomTrackerTab: document.getElementById('tab-symptom-tracker'),
    journeyTab: document.getElementById('tab-journey'),
    mealPlanContent: document.getElementById('content-meal-plan'),
    symptomTrackerContent: document.getElementById('content-symptom-tracker'),
    journeyContent: document.getElementById('content-journey'),

    // Vortex
    vortexOverlay: document.getElementById('vortex-overlay'),
    vortexSpinner: document.getElementById('vortex-spinner'),
};

export function showMainApp() {
    elements.authButtons.classList.add('hidden');
    elements.userInfo.classList.add('flex');
    elements.userInfo.classList.remove('hidden');
    elements.mainApp.classList.remove('hidden');
    elements.heroSection.classList.add('hidden');

    // Run the page load animation *after* the app is shown
    // We wrap it in a small timeout to ensure the DOM is painted
    setTimeout(() => {
        playPageLoadAnimation();
    }, 100);
}

export function showHeroSection() {
    elements.authButtons.classList.remove('hidden');
    elements.userInfo.classList.remove('flex');
    elements.userInfo.classList.add('hidden');
    elements.mainApp.classList.add('hidden');
    elements.heroSection.classList.remove('hidden');
}

export function openAuthModal() {
    elements.authModal.classList.remove('hidden');
    setTimeout(() => elements.authModal.classList.add('active'), 10);
}

export function closeAuthModal() {
    elements.authModal.classList.remove('active');
    setTimeout(() => elements.authModal.classList.add('hidden'), 300);
}

// --- New Animation Logic ---

let isAnimating = false; // Prevent overlapping animations
const tabs = {
    meal: { btn: elements.mealPlanTab, content: elements.mealPlanContent },
    symptom: { btn: elements.symptomTrackerTab, content: elements.symptomTrackerContent },
    journey: { btn: elements.journeyTab, content: elements.journeyContent }
};

/**
 * Plays the full vortex transition.
 * @param {HTMLElement | null} outgoingContent - The content element to hide. (Can be null for page load)
 * @param {HTMLElement} incomingContent - The content element to show.
 */
async function playTransition(outgoingContent, incomingContent) {
    if (isAnimating) return;
    isAnimating = true;

    // 1. Prepare incoming content (set to initial state)
    gsap.set(incomingContent.querySelectorAll('.falling-card'), {
        y: -50,
        opacity: 0,
    });

    // 2. Animate vortex in and outgoing content out
    const tlIn = gsap.timeline();
    tlIn
        .set(elements.vortexOverlay, { display: 'flex' })
        .to(elements.vortexOverlay, {
            opacity: 1,
            duration: 0.4,
            ease: 'power2.inOut',
        })
        .to(elements.vortexSpinner, {
            opacity: 1,
            scale: 1,
            rotation: 720, // Spin in
            duration: 0.7,
            ease: 'power2.inOut',
        }, "-=0.2");

    if (outgoingContent) {
        // Animate the outgoing content fading and scaling down
        tlIn.to(outgoingContent, {
            opacity: 0,
            scale: 0.9,
            duration: 0.5,
            ease: 'power2.in',
        }, 0); // Start at the same time as the overlay fade
    }

    // Wait for the 'in' animation to complete
    await tlIn.play();

    // 3. Swap content in the DOM
    if (outgoingContent) {
        outgoingContent.classList.remove('active');
    }
    incomingContent.classList.add('active');

    // 4. Animate vortex out
    const tlOut = gsap.timeline();
    tlOut
        .to(elements.vortexSpinner, {
            opacity: 0,
            scale: 0.2,
            rotation: 1440, // Spin out further
            duration: 0.7,
            ease: 'power2.in',
        })
        .to(elements.vortexOverlay, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut',
        }, "-=0.2")
        .set(elements.vortexOverlay, { display: 'hidden' });
    
    // Wait for the vortex to disappear
    await tlOut.play();
    
    // 5. Animate new cards in (soft fall)
    gsap.to(incomingContent.querySelectorAll('.falling-card'), {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15, // Animate one by one
        ease: 'power2.out',
        onComplete: () => {
            isAnimating = false; // Allow new animations
        },
    });
}

/**
 * Handles tab switching.
 * @param {string} activeTabKey - The key ('meal', 'symptom', 'journey') of the tab to switch to.
 */
function switchTab(activeTabKey) {
    if (isAnimating) return;

    let outgoingContent = null;
    let incomingContent = tabs[activeTabKey].content;

    // Find the currently active content
    Object.keys(tabs).forEach(key => {
        if (tabs[key].content.classList.contains('active')) {
            outgoingContent = tabs[key].content;
        }
        tabs[key].btn.classList.remove('active');
    });

    // If we're clicking the already active tab, do nothing
    if (outgoingContent === incomingContent) return;

    // Set new active button
    tabs[activeTabKey].btn.classList.add('active');

    // Run the animation
    playTransition(outgoingContent, incomingContent);
}

/**
 * Sets up tab click listeners.
 * @param {function} onTabSwitch - A callback function (passed from main.js).
 */
export function setupTabs(onTabSwitch) {
    elements.mealPlanTab.addEventListener('click', () => {
        switchTab('meal');
        onTabSwitch('meal'); // Call original callback
    });
    elements.symptomTrackerTab.addEventListener('click', () => {
        switchTab('symptom');
        onTabSwitch('symptom'); // Call original callback
    });
    elements.journeyTab.addEventListener('click', () => {
        switchTab('journey');
        onTabSwitch('journey'); // Call original callback
    });
}

/**
 * Plays the initial animation on page load.
 */
export function playPageLoadAnimation() {
    // This function is called from showMainApp()
    
    // Ensure the default tab is active
    const defaultContent = elements.mealPlanContent;
    
    // Prepare all other tabs (make sure they are hidden)
    elements.symptomTrackerContent.classList.remove('active');
    elements.journeyContent.classList.remove('active');
    defaultContent.classList.add('active');

    // Run the transition with no outgoing content
    playTransition(null, defaultContent);
}
