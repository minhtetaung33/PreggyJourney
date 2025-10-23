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
    calmSpaceTab: document.getElementById('tab-calm-space'), // NEW TAB
    mealPlanContent: document.getElementById('content-meal-plan'),
    symptomTrackerContent: document.getElementById('content-symptom-tracker'),
    journeyContent: document.getElementById('content-journey'),
    calmSpaceContent: document.getElementById('content-calm-space'), // NEW CONTENT

    // --- NEW Animation Elements ---
    bubbleBackground: document.getElementById('bubble-background'),
    pageLoadOverlay: document.getElementById('page-load-overlay'),
};

/**
 * Creates the rising bubble background effect.
 */
export function createBubbleBackground() {
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
}

/**
 * Resets the entrance animations for a given tab content area.
 * @param {HTMLElement} tabContentElement - The tab content element (e.g., elements.mealPlanContent)
 */
function resetTabAnimation(tabContentElement) {
    if (!tabContentElement) return;
    const cards = tabContentElement.querySelectorAll('.anim-card');
    cards.forEach(card => {
        card.classList.remove('anim-bubble-in', 'anim-float');
        // Re-apply initial hidden state
        card.style.opacity = '0'; 
    });
}

/**
 * Plays the staggered bubble-in animation for a tab content area.
 * @param {HTMLElement} tabContentElement - The tab content element (e.g., elements.mealPlanContent)
 */
function playTabEntranceAnimation(tabContentElement) {
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
}

export function showMainApp() {
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

export function setupTabs(onTabSwitch) {
    elements.mealPlanTab.addEventListener('click', () => {
        switchTab('meal');
        onTabSwitch('meal');
    });
    elements.symptomTrackerTab.addEventListener('click', () => {
        switchTab('symptom');
        onTabSwitch('symptom');
    });
    elements.journeyTab.addEventListener('click', () => {
        switchTab('journey');
        onTabSwitch('journey');
    });
    // NEW TAB CLICK LISTENER
    elements.calmSpaceTab.addEventListener('click', () => {
        switchTab('calm');
        onTabSwitch('calm');
    });
}

function switchTab(activeTab) {
    // UPDATED TABS OBJECT
    const tabs = {
        meal: { btn: elements.mealPlanTab, content: elements.mealPlanContent },
        symptom: { btn: elements.symptomTrackerTab, content: elements.symptomTrackerContent },
        journey: { btn: elements.journeyTab, content: elements.journeyContent },
        calm: { btn: elements.calmSpaceTab, content: elements.calmSpaceContent } // NEW TAB
    };

    Object.keys(tabs).forEach(key => {
        // Handle potential null elements if HTML isn't updated
        if(tabs[key].btn) {
            tabs[key].btn.classList.remove('active');
        }
        if(tabs[key].content) {
            tabs[key].content.classList.remove('active');
        }
        
        // Reset animations on other tabs
        if (key !== activeTab && tabs[key].content) {
            resetTabAnimation(tabs[key].content);
        }
    });

    if (tabs[activeTab] && tabs[activeTab].btn && tabs[activeTab].content) {
        tabs[activeTab].btn.classList.add('active');
        tabs[activeTab].content.classList.add('active');
        
        // Play animation for the new active tab
        playTabEntranceAnimation(tabs[activeTab].content);
    } else {
        console.error(`Tab "${activeTab}" or its elements are not found.`);
    }
}
