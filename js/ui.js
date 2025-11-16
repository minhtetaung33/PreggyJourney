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
    // NEW: Preggy Steps summary level
    elements.summaryMovementLevel = document.getElementById('summary-movement-level');
    elements.summaryPositiveMessage = document.getElementById('summary-positive-message');
    elements.summaryStreakBadge = document.getElementById('summary-streak-badge');
    elements.summaryBarChart = document.getElementById('summary-bar-chart');

    // --- Preggy Steps Elements (NEW SECTION) ---
    elements.preggyTimerDisplay = document.getElementById('preggy-timer-display');
    elements.preggyCaloriesDisplay = document.getElementById('preggy-calories-display');
    elements.preggyPlayBtn = document.getElementById('preggy-play-btn');
    elements.preggyPauseBtn = document.getElementById('preggy-pause-btn');
    elements.preggyStopBtn = document.getElementById('preggy-stop-btn');
    elements.preggyManualToggleBtn = document.getElementById('preggy-manual-toggle-btn');
    elements.preggyActivitySelect = document.getElementById('preggy-activity-select');
    elements.preggyIntensitySlider = document.getElementById('preggy-intensity-slider');
    elements.preggyManualForm = document.getElementById('preggy-manual-form');
    elements.preggyManualInput = document.getElementById('preggy-manual-input');
    elements.preggyManualSaveBtn = document.getElementById('preggy-manual-save-btn');
    // --- END Preggy Steps Elements ---


    // --- JOURNEY TAB ELEMENTS ---

    // NEW: Calendar and To-Do List Elements
    elements.calendarHeader = document.getElementById('calendar-header');
    elements.calendarPrevBtn = document.getElementById('calendar-prev-btn');
    elements.calendarMonthYear = document.getElementById('calendar-month-year');
    elements.calendarNextBtn = document.getElementById('calendar-next-btn');
    elements.calendarContainer = document.getElementById('calendar-container');
    elements.calendarGrid = document.getElementById('calendar-grid');
    elements.todoListHeader = document.getElementById('todo-list-header'); // Replaces todo-header
    elements.todoListToggleIcon = document.getElementById('todo-list-toggle-icon'); // Replaces todo-toggle-icon
    elements.collapsibleTodoContent = document.getElementById('collapsible-todo-content');
    elements.todoListContainer = document.getElementById('todo-list-container');
    
    // === MODIFICATION START: Task 2 & 3 - Recipe List Elements ===
    elements.recipeListHeader = document.getElementById('recipe-list-header');
    elements.recipeListToggleIcon = document.getElementById('recipe-list-toggle-icon');
    elements.collapsibleRecipeContent = document.getElementById('collapsible-recipe-content');
    elements.recipeListContainer = document.getElementById('recipe-list-container');
    // === MODIFICATION END: Task 2 & 3 - Recipe List Elements ===

    // To-Do Inputs
    elements.addTodoBtn = document.getElementById('add-todo-btn');
    elements.newTodoInput = document.getElementById('new-todo-input');
    elements.newTodoCategory = document.getElementById('new-todo-category');
    elements.customTodoCategoryInput = document.getElementById('custom-todo-category-input');
    elements.newTodoDate = document.getElementById('new-todo-date');
    elements.newTodoTime = document.getElementById('new-todo-time');
    elements.aiGenerateTodosBtn = document.getElementById('ai-generate-todos-btn');

    // Appointments
    elements.newAppointmentFields = document.getElementById('new-appointment-fields');
    elements.newAppointmentFname = document.getElementById('new-appointment-fname');
    elements.newAppointmentLname = document.getElementById('new-appointment-lname');
    elements.newAppointmentAddress = document.getElementById('new-appointment-address');
    elements.newAppointmentContact = document.getElementById('new-appointment-contact');
    elements.newAppointmentEmail = document.getElementById('new-appointment-email');
    elements.newAppointmentType = document.getElementById('new-appointment-type');
    elements.newAppointmentCustomType = document.getElementById('new-appointment-custom-type');
    elements.editAppointmentFields = document.getElementById('edit-appointment-fields');
    elements.editAppointmentFname = document.getElementById('edit-appointment-fname');
    elements.editAppointmentLname = document.getElementById('edit-appointment-lname');
    elements.editAppointmentAddress = document.getElementById('edit-appointment-address');
    elements.editAppointmentContact = document.getElementById('edit-appointment-contact');
    elements.editAppointmentEmail = document.getElementById('edit-appointment-email');
    elements.editAppointmentType = document.getElementById('edit-appointment-type');
    elements.editAppointmentCustomType = document.getElementById('edit-appointment-custom-type');

    // Wishlist
    elements.wishlistContainer = document.getElementById('wishlist-container');
    elements.wishlistProgressText = document.getElementById('wishlist-progress-text');
    elements.wishlistProgressBar = document.getElementById('wishlist-progress-bar');
    elements.newWishItem = document.getElementById('new-wish-item');
    elements.newWishCategory = document.getElementById('new-wish-category');
    elements.customCategoryInput = document.getElementById('custom-category-input');
    elements.newWishPrice = document.getElementById('new-wish-price');
    elements.newWishLink = document.getElementById('new-wish-link');
    elements.addWishBtn = document.getElementById('add-wish-btn');
    elements.aiWishForm = document.getElementById('ai-wish-form');
    elements.aiWishPrompt = document.getElementById('ai-wish-prompt');
    elements.wishlistHeader = document.getElementById('wishlist-header');
    elements.collapsibleWishlistContent = document.getElementById('collapsible-wishlist-content');
    elements.wishlistToggleIcon = document.getElementById('wishlist-toggle-icon');
    elements.wishlistSearchInput = document.getElementById('wishlist-search-input');
    elements.wishlistSortSelect = document.getElementById('wishlist-sort-select');
    
    // Wishlist Food Fields
    elements.newWishFoodFields = document.getElementById('new-wish-food-fields');
    elements.newWishFoodType = document.getElementById('new-wish-food-type');
    elements.newWishFoodExpiry = document.getElementById('new-wish-food-expiry');

    // Wish Quantity Fields (Add form)
    elements.newWishQuantityInput = document.getElementById('new-wish-quantity');
    elements.newWishQuantityMinusBtn = document.getElementById('new-wish-quantity-minus');
    elements.newWishQuantityPlusBtn = document.getElementById('new-wish-quantity-plus');

    // Edit Wish Modal Fields
    elements.editWishModal = document.getElementById('edit-wish-modal');
    elements.editWishItem = document.getElementById('edit-wish-item');
    elements.editWishCategory = document.getElementById('edit-wish-category');
    // --- THIS IS THE FIX ---
    // The line below was missing, causing the error.
    elements.editCustomCategoryInput = document.getElementById('edit-custom-category-input');
    // --- END OF FIX ---
    elements.editWishFoodFields = document.getElementById('edit-wish-food-fields');
    elements.editWishFoodType = document.getElementById('edit-wish-food-type');
    elements.editWishFoodExpiry = document.getElementById('edit-wish-food-expiry');
    elements.editWishPrice = document.getElementById('edit-wish-price');
    elements.editWishLink = document.getElementById('edit-wish-link');
    elements.editWishQuantityInput = document.getElementById('edit-wish-quantity');
    elements.editWishQuantityMinusBtn = document.getElementById('edit-wish-quantity-minus');
    elements.editWishQuantityPlusBtn = document.getElementById('edit-wish-quantity-plus');
    elements.editWishModalCancelBtn = document.getElementById('edit-wish-modal-cancel-btn');
    elements.editWishModalSaveBtn = document.getElementById('edit-wish-modal-save-btn');

    // Reflections
    elements.reflectionsContainer = document.getElementById('reflections-container');
    elements.reflectionHeader = document.getElementById('reflection-header');
    elements.collapsibleReflectionContent = document.getElementById('collapsible-reflection-content');
    elements.reflectionToggleIcon = document.getElementById('reflection-toggle-icon');
    elements.toggleReflectionsContainer = document.getElementById('toggle-reflections-container');
    elements.toggleReflectionsBtn = document.getElementById('toggle-reflections-btn');
    elements.addReflectionBtn = document.getElementById('add-reflection-btn');
    elements.reflectionModal = document.getElementById('reflection-modal');
    elements.reflectionModalTitle = document.getElementById('reflection-modal-title');
    elements.reflectionTitleInput = document.getElementById('reflection-title-input');
    elements.reflectionContentInput = document.getElementById('reflection-content-input');
    elements.reflectionColorTags = document.getElementById('reflection-color-tags');
    elements.reflectionModalCancelBtn = document.getElementById('reflection-modal-cancel-btn');
    elements.reflectionModalSaveBtn = document.getElementById('reflection-modal-save-btn');
    elements.aiSummarizeReflectionsBtn = document.getElementById('ai-summarize-reflections-btn');
    elements.aiSummaryModal = document.getElementById('ai-summary-modal');
    elements.aiSummaryContent = document.getElementById('ai-summary-content');
    elements.aiSummaryCloseBtn = document.getElementById('ai-summary-close-btn');
    elements.addReflectionImageBtn = document.getElementById('add-reflection-image-btn');
    elements.imageLinkModal = document.getElementById('image-link-modal');
    elements.imageLinkInput = document.getElementById('image-link-input');
    elements.imageLinkCancelBtn = document.getElementById('image-link-cancel-btn');
    elements.imageLinkSaveBtn = document.getElementById('image-link-save-btn');
    elements.reflectionImagePreviewContainer = document.getElementById('reflection-image-preview-container');
    elements.reflectionImagePreview = document.getElementById('reflection-image-preview');

    // Edit To-Do Modal
    elements.editTodoModal = document.getElementById('edit-todo-modal');
    elements.editTodoInput = document.getElementById('edit-todo-input');
    elements.editTodoDate = document.getElementById('edit-todo-date');
    elements.editTodoTime = document.getElementById('edit-todo-time');
    elements.editTodoCategory = document.getElementById('edit-todo-category');
    elements.editCustomTodoCategoryInput = document.getElementById('edit-custom-todo-category-input');
    elements.editTodoModalCancelBtn = document.getElementById('edit-todo-modal-cancel-btn');
    elements.editTodoModalSaveBtn = document.getElementById('edit-todo-modal-save-btn');
    
    // Baby Name Generator
    elements.nameFavoritesToggleBtn = document.getElementById('name-favorites-toggle-btn');
    elements.nameFavoritesContainer = document.getElementById('name-favorites-container');
    elements.nameFavoritesList = document.getElementById('name-favorites-list');
    elements.nameGenderSelector = document.getElementById('name-gender-selector');
    elements.nameOriginSelect = document.getElementById('name-origin-select');
    elements.nameOriginCustom = document.getElementById('name-origin-custom');
    elements.nameStyleSelect = document.getElementById('name-style-select');
    elements.nameStyleCustom = document.getElementById('name-style-custom');
    elements.nameMeaningInput = document.getElementById('name-meaning-input');
    elements.nameSyllableSelector = document.getElementById('name-syllable-selector');
    elements.nameRandomBtn = document.getElementById('name-random-btn');
    elements.nameGenerateBtn = document.getElementById('name-generate-btn');
    elements.nameGenerateBtnText = document.getElementById('name-generate-btn-text');
    elements.nameGenerateLoader = document.getElementById('name-generate-loader');
    elements.nameResultsContainer = document.getElementById('name-results-container');
    elements.nameGenerateAgainBtn = document.getElementById('name-generate-again-btn');
    
    // --- END JOURNEY TAB ELEMENTS ---

    // --- AI RECIPE ASSISTANT FIELDS ---
    elements.aiRecipePrompt = document.getElementById('ai-recipe-prompt');
    elements.aiGenerateRecipeBtn = document.getElementById('ai-generate-recipe-btn');
    elements.aiRecipeBtnText = document.getElementById('ai-recipe-btn-text');
    elements.aiRecipeLoader = document.getElementById('ai-recipe-loader');
    elements.aiRecipeResultsContainer = document.getElementById('ai-recipe-results-container');
    // --- END AI RECIPE ASSISTANT FIELDS ---

    // --- Animation Elements ---
    elements.bubbleBackground = document.getElementById('bubble-background');
    elements.pageLoadOverlay = document.getElementById('page-load-overlay');
    
    // --- NEW NOTIFICATION ELEMENTS ---
    elements.notificationBellBtn = document.getElementById('notification-bell-btn');
    elements.notificationBadge = document.getElementById('notification-badge');
    elements.notificationModal = document.getElementById('notification-modal');
    // --- FIX 1: Match the ID from index.html ---
    elements.notificationCloseBtn = document.getElementById('notification-modal-close-btn'); 
    // --- FIX 2: Match the ID from index.html ---
    elements.notificationList = document.getElementById('notification-list-container'); 
    elements.notificationClearAllBtn = document.getElementById('notification-clear-all-btn');
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

// === Helper Functions for Formatting (Can be moved from journey.js if preferred) ===
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Adjust for timezone issues
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); // Added year
};

const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
};


// === NEW NOTIFICATION MODAL FUNCTIONS ===

/**
 * Opens the notification modal.
 */
const openNotificationModal = () => {
    console.log("openNotificationModal called!");
    if (elements.notificationModal) {
        console.log("Modal element found, attempting to show...");
        elements.notificationModal.classList.remove('hidden');
        setTimeout(() => {
            elements.notificationModal.classList.add('active');
            console.log("Modal 'active' class added.");
        }, 10); 
    } else {
        console.error("Notification modal element not found in 'elements'.");
    }
};

/**
 * Closes the notification modal.
 */
const closeNotificationModal = () => {
    console.log("closeNotificationModal called!");
    if (elements.notificationModal) {
        elements.notificationModal.classList.remove('active');
        setTimeout(() => {
            elements.notificationModal.classList.add('hidden');
            console.log("Modal 'hidden' class added.");
        }, 300); 
    } else {
        console.error("Notification modal element not found in 'elements'.");
    }
};

/**
 * Updates the notification UI (badge count and modal list).
 * @param {Array} notifications - Sorted array of notification objects.
 */
export const updateNotificationUI = (notifications) => {
    console.log("updateNotificationUI called with", notifications.length, "notifications.");
    if (!elements.notificationBadge || !elements.notificationList) {
        console.error("Notification UI elements (badge or list) not found.");
        return;
    }

    // Update badge
    if (notifications.length > 0) {
        elements.notificationBadge.textContent = notifications.length;
        elements.notificationBadge.classList.remove('hidden');
    } else {
        elements.notificationBadge.classList.add('hidden');
    }

    // Populate list
    elements.notificationList.innerHTML = ''; // Clear previous list
    if (notifications.length === 0) {
        elements.notificationList.innerHTML = '<p id="no-notifications-message" class="text-center text-gray-400 p-4">No new notifications.</p>';
        if (elements.notificationClearAllBtn) elements.notificationClearAllBtn.classList.add('hidden');
    } else {
        notifications.forEach(noti => {
            const item = document.createElement('div');
            item.className = `notification-item flex items-start gap-3 p-3 border-b border-white/10 type-${noti.type}`; // Added gap, padding, border

            // --- Determine Icon and Color ---
            let iconSvg = '';
            let titleColorClass = 'text-white'; // Default title color
            const isTodo = noti.id.startsWith('todo');

            if (isTodo) {
                iconSvg = '<svg class="w-6 h-6 text-purple-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>'; // Checklist
                if (noti.type === 'todo-urgent') titleColorClass = 'text-red-300';
            } else { // It's a wish (food expiry)
                iconSvg = '<svg class="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'; // Clock
                if (noti.type === 'wish-urgent') titleColorClass = 'text-yellow-300';
            }

            // --- Build Details HTML ---
            let detailsHtml = '';
            if (noti.details.appointment) {
                const appt = noti.details.appointment;
                const apptType = appt.customType || appt.type || 'Appointment';
                const apptName = [appt.fname, appt.lname].filter(Boolean).join(' ');
                const apptTime = formatTime(noti.details.time);

                detailsHtml += `<p class="text-xs text-indigo-300 font-semibold mt-1 mb-1">${apptType} ${apptTime ? `at ${apptTime}` : ''}</p>`;
                if (apptName) detailsHtml += `<p class="text-xs text-gray-400"><span class="font-medium text-gray-300">With:</span> ${apptName}</p>`;
                if (appt.address) detailsHtml += `<p class="text-xs text-gray-400"><span class="font-medium text-gray-300">At:</span> ${appt.address}</p>`;
                if (appt.contact) detailsHtml += `<p class="text-xs text-gray-400"><span class="font-medium text-gray-300">Call:</span> ${appt.contact}</p>`;
                 if (appt.email) detailsHtml += `<p class="text-xs text-gray-400"><span class="font-medium text-gray-300">Email:</span> ${appt.email}</p>`;
            } else if (noti.details.food) {
                const food = noti.details.food;
                 detailsHtml += `<p class="text-xs text-indigo-300 font-semibold mt-1 mb-1">Type: ${food.type || 'Food Item'}</p>`;
                if(food.expiry) detailsHtml += `<p classxs="text-xs text-yellow-400 font-semibold">Expires: ${formatDate(food.expiry)}</p>`;
            }


            // --- Combine into Inner HTML ---
            item.innerHTML = `
                ${iconSvg}
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-base break-words ${titleColorClass}">${noti.title}</p>
                    <p class="text-sm font-medium ${noti.daysLeft <= 0 ? 'text-red-400' : 'text-gray-300'}">${noti.message}</p>
                    ${detailsHtml ? `<div class="mt-2 pl-1 border-l-2 border-white/10 space-y-0.5">${detailsHtml}</div>` : ''}
                </div>
            `;
            elements.notificationList.appendChild(item);
        });
        if (elements.notificationClearAllBtn) elements.notificationClearAllBtn.classList.remove('hidden');
    }
};

// --- Add Event Listeners ---
// Moved event listeners here from cacheDomElements to ensure elements exist first
export const setupNotificationListeners = () => {
    if (elements.notificationBellBtn) {
        elements.notificationBellBtn.addEventListener('click', openNotificationModal);
        console.log("Event listener added to notification bell.");
    } else {
        console.error("Notification bell button not found to add listener.");
    }

    if (elements.notificationCloseBtn) {
        elements.notificationCloseBtn.addEventListener('click', closeNotificationModal);
        console.log("Event listener added to notification close button.");
    } else {
        console.error("Notification close button not found to add listener.");
    }

     if (elements.notificationModal) {
        // Close modal if clicking outside the content area
        elements.notificationModal.addEventListener('click', (e) => {
            if (e.target === elements.notificationModal) {
                closeNotificationModal();
            }
        });
         console.log("Event listener added to notification modal background.");
    } else {
         console.error("Notification modal not found to add background click listener.");
    }

     if (elements.notificationClearAllBtn) {
         // The actual clear logic is in journey.js, just log here if needed
         console.log("Clear All button found.");
     } else {
         console.error("Notification Clear All button not found.");
     }
}
