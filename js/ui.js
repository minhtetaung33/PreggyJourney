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
};

export function showMainApp() {
    elements.authButtons.classList.add('hidden');
    elements.userInfo.classList.add('flex');
    elements.userInfo.classList.remove('hidden');
    elements.mainApp.classList.remove('hidden');
    elements.heroSection.classList.add('hidden');
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
    elements.mealPlanTab.addEventListener('click', async () => {
        switchTab('meal');
        await onTabSwitch('meal');
    });
    elements.symptomTrackerTab.addEventListener('click', async () => {
        switchTab('symptom');
        await onTabSwitch('symptom');
    });
    elements.journeyTab.addEventListener('click', async () => {
        switchTab('journey');
        await onTabSwitch('journey');
    });
}

function switchTab(activeTab) {
    const tabs = {
        meal: { btn: elements.mealPlanTab, content: elements.mealPlanContent },
        symptom: { btn: elements.symptomTrackerTab, content: elements.symptomTrackerContent },
        journey: { btn: elements.journeyTab, content: elements.journeyContent }
    };

    Object.keys(tabs).forEach(key => {
        tabs[key].btn.classList.remove('active');
        tabs[key].content.classList.remove('active');
    });

    tabs[activeTab].btn.classList.add('active');
    tabs[activeTab].content.classList.add('active');
}
