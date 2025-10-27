// Firebase Imports
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentUserId } from "./auth.js";
// IMPORT THE NEW NOTIFICATION UI FUNCTION
import { elements, updateNotificationUI } from './ui.js'; 

// === ORIGINAL DOM Elements ===
const todoListContainer = document.getElementById('todo-list-container');
const newTodoInput = document.getElementById('new-todo-input');
const newTodoCategory = document.getElementById('new-todo-category');
const addTodoBtn = document.getElementById('add-todo-btn');
const aiGenerateTodosBtn = document.getElementById('ai-generate-todos-btn');
const wishlistContainer = document.getElementById('wishlist-container');
const wishlistProgressText = document.getElementById('wishlist-progress-text');
const wishlistProgressBar = document.getElementById('wishlist-progress-bar');
const newWishItem = document.getElementById('new-wish-item');
const newWishCategory = document.getElementById('new-wish-category');
const newWishPrice = document.getElementById('new-wish-price');
const newWishLink = document.getElementById('new-wish-link');
const addWishBtn = document.getElementById('add-wish-btn');
const aiWishForm = document.getElementById('ai-wish-form');
const aiWishPrompt = document.getElementById('ai-wish-prompt');
const reflectionsContainer = document.getElementById('reflections-container');
const addReflectionBtn = document.getElementById('add-reflection-btn');
const reflectionModal = document.getElementById('reflection-modal');
const reflectionModalTitle = document.getElementById('reflection-modal-title');
const reflectionTitleInput = document.getElementById('reflection-title-input');
const reflectionContentInput = document.getElementById('reflection-content-input');
const reflectionColorTags = document.getElementById('reflection-color-tags');
const reflectionModalCancelBtn = document.getElementById('reflection-modal-cancel-btn');
const reflectionModalSaveBtn = document.getElementById('reflection-modal-save-btn');
const aiSummarizeReflectionsBtn = document.getElementById('ai-summarize-reflections-btn');
const aiSummaryModal = document.getElementById('ai-summary-modal');
const aiSummaryContent = document.getElementById('ai-summary-content');
const aiSummaryCloseBtn = document.getElementById('ai-summary-close-btn');
const customCategoryInput = document.getElementById('custom-category-input');
const todoHeader = document.getElementById('todo-header');
const collapsibleTodoContent = document.getElementById('collapsible-todo-content');
const todoToggleIcon = document.getElementById('todo-toggle-icon');
const wishlistHeader = document.getElementById('wishlist-header');
const collapsibleWishlistContent = document.getElementById('collapsible-wishlist-content');
const wishlistToggleIcon = document.getElementById('wishlist-toggle-icon');
const newTodoDate = document.getElementById('new-todo-date');
const newTodoTime = document.getElementById('new-todo-time');
const customTodoCategoryInput = document.getElementById('custom-todo-category-input');
const editTodoModal = document.getElementById('edit-todo-modal');
const editTodoInput = document.getElementById('edit-todo-input');
const editTodoDate = document.getElementById('edit-todo-date');
const editTodoTime = document.getElementById('edit-todo-time');
const editTodoCategory = document.getElementById('edit-todo-category');
const editCustomTodoCategoryInput = document.getElementById('edit-custom-todo-category-input');
const editTodoModalCancelBtn = document.getElementById('edit-todo-modal-cancel-btn');
const editTodoModalSaveBtn = document.getElementById('edit-todo-modal-save-btn');
const reflectionHeader = document.getElementById('reflection-header');
const collapsibleReflectionContent = document.getElementById('collapsible-reflection-content');
const reflectionToggleIcon = document.getElementById('reflection-toggle-icon');
const toggleReflectionsContainer = document.getElementById('toggle-reflections-container');
const toggleReflectionsBtn = document.getElementById('toggle-reflections-btn');
const addReflectionImageBtn = document.getElementById('add-reflection-image-btn');
const imageLinkModal = document.getElementById('image-link-modal');
const imageLinkInput = document.getElementById('image-link-input');
const imageLinkCancelBtn = document.getElementById('image-link-cancel-btn');
const imageLinkSaveBtn = document.getElementById('image-link-save-btn');
const reflectionImagePreviewContainer = document.getElementById('reflection-image-preview-container');
const reflectionImagePreview = document.getElementById('reflection-image-preview');
let aiTodoSuggestionsContainer = null; // Container for AI To-Do Suggestions

// === NEW AI Baby Name Generator DOM Elements ===
const nameFavoritesToggleBtn = document.getElementById('name-favorites-toggle-btn');
const nameFavoritesContainer = document.getElementById('name-favorites-container');
const nameFavoritesList = document.getElementById('name-favorites-list');
const nameGenderSelector = document.getElementById('name-gender-selector');
const nameOriginSelect = document.getElementById('name-origin-select');
const nameOriginCustom = document.getElementById('name-origin-custom');
const nameStyleSelect = document.getElementById('name-style-select');
const nameStyleCustom = document.getElementById('name-style-custom');
const nameMeaningInput = document.getElementById('name-meaning-input');
const nameSyllableSelector = document.getElementById('name-syllable-selector');
const nameRandomBtn = document.getElementById('name-random-btn');
const nameGenerateBtn = document.getElementById('name-generate-btn');
const nameGenerateBtnText = document.getElementById('name-generate-btn-text');
const nameGenerateLoader = document.getElementById('name-generate-loader');
const nameResultsContainer = document.getElementById('name-results-container');
const nameGenerateAgainBtn = document.getElementById('name-generate-again-btn');

// === State Variables ===
let todosRef, wishesRef, reflectionsRef, favoriteNamesRef;
let unsubscribeTodos, unsubscribeWishes, unsubscribeReflections, unsubscribeFavoriteNames;
let currentTodos = [], currentWishes = [], currentReflections = [], currentFavoriteNames = [];
let wellnessDataForJourney = {};
let activeReflectionId = null;
let activeColor = 'pink';
let activeTodoId = null;
let activeWishId = null; // Added for edit wish modal
let showAllReflections = false;
let activeReflectionImageUrl = null;

// === NEW Notification State ===
let allNotifications = [];
const DAY_IN_MS = 1000 * 60 * 60 * 24;

// === NEW Baby Name Generator State ===
let selectedNameGender = null;
let selectedNameOrigin = '';
let selectedNameStyle = '';
let selectedNameMeaning = '';
let selectedNameSyllables = '';
let currentNameSuggestions = []; // Store the latest suggestions


// === Initialization ===
export function initializeJourney(userId, initialWellnessData) {
    wellnessDataForJourney = initialWellnessData;
    // Firebase collection references
    todosRef = collection(db, `users/${userId}/todos`);
    wishesRef = collection(db, `users/${userId}/wishes`);
    reflectionsRef = collection(db, `users/${userId}/reflections`);
    favoriteNamesRef = collection(db, `users/${userId}/favoriteNames`); // NEW

    // Load data
    loadTodos();
    loadWishes();
    loadReflections();
    loadFavoriteNames(); // NEW

    // Setup listeners
    setupEventListeners();
    setupNameGeneratorListeners(); // NEW
}

// === Data Loading & Rendering (Original + Name Gen Favorites) ===

function loadTodos() {
    if (!todosRef) return;
    if(unsubscribeTodos) unsubscribeTodos();
    const q = query(todosRef, orderBy("createdAt", "desc"));
    unsubscribeTodos = onSnapshot(q, (snapshot) => {
        currentTodos = [];
        snapshot.forEach(doc => currentTodos.push({ id: doc.id, ...doc.data() }));
        renderTodos(currentTodos);
        checkNotifications(); // NEW: Check notifications when todos load
    });
}

function loadWishes() {
    if (!wishesRef) return;
    if(unsubscribeWishes) unsubscribeWishes();
    const q = query(wishesRef, orderBy("createdAt", "desc"));
    unsubscribeWishes = onSnapshot(q, (snapshot) => {
        currentWishes = [];
        snapshot.forEach(doc => currentWishes.push({ id: doc.id, ...doc.data() }));
        renderWishes(currentWishes);
        checkNotifications(); // NEW: Check notifications when wishes load
    });
}

function loadReflections() {
    if (!reflectionsRef) return;
    if(unsubscribeReflections) unsubscribeReflections();
    const q = query(reflectionsRef, orderBy("createdAt", "desc"));
    unsubscribeReflections = onSnapshot(q, (snapshot) => {
        currentReflections = [];
        snapshot.forEach(doc => currentReflections.push({ id: doc.id, ...doc.data() }));
        renderReflections(currentReflections);
    });
}

// NEW: Load Favorite Names
function loadFavoriteNames() {
    if (!favoriteNamesRef) return;
    if (unsubscribeFavoriteNames) unsubscribeFavoriteNames();
    // Order by name for consistency
    const q = query(favoriteNamesRef, orderBy("name"));
    unsubscribeFavoriteNames = onSnapshot(q, (snapshot) => {
        currentFavoriteNames = [];
        snapshot.forEach(doc => currentFavoriteNames.push({ id: doc.id, ...doc.data() }));
        renderFavoriteNames(currentFavoriteNames);
        // Re-render suggestions if they exist to update heart icons
        if (currentNameSuggestions.length > 0) {
            renderNameSuggestions(currentNameSuggestions);
        }
    });
}

// Original render functions (renderTodos, renderWishes, renderReflections, etc.) are assumed to be here
// ... (Keep existing renderTodos, renderWishes, renderReflections, renderAiWishSuggestions, renderAITodoSuggestions, renderAIRecipes)

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); // Adjust for timezone issues
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
};

function renderTodos(todos) {
    todoListContainer.innerHTML = '';
    if (todos.length === 0) {
        todoListContainer.innerHTML = `<p class="text-center text-gray-400">No tasks yet. Add one below!</p>`;
        return;
    }
    // ADDED 'Recipes'
    const categoryIcons = { Health: '🧘‍♀️', Baby: '🍼', Home: '🏡', Reminder: '💬', Appointment: '🗓️', Recipes: '🍳' };

    todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = `todo-item flex items-start justify-between p-3 bg-white/5 rounded-lg ${todo.completed ? 'completed' : ''}`;

        const displayDate = formatDate(todo.date);
        const displayTime = formatTime(todo.time);

        // NEW: Check if it's an Appointment
        if (todo.category === 'Appointment' && todo.appointment) {
            const appt = todo.appointment;
            const apptType = appt.customType || appt.type || '';
            const apptName = [appt.fname, appt.lname].filter(Boolean).join(' ');

            item.innerHTML = `
                <div class="flex items-start flex-1 min-w-0">
                    <label for="todo-${todo.id}" class="flex items-center cursor-pointer pt-1">
                        <input type="checkbox" id="todo-${todo.id}" class="hidden todo-checkbox">
                        <div class="w-6 h-6 border-2 border-purple-400 rounded-md mr-3 flex-shrink-0 flex items-center justify-center check-label">
                            ${todo.completed ? '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
                        </div>
                    </label>
                    <div class="flex-1">
                        <p class="font-semibold break-words">${todo.text}</p>
                        <div class="text-xs text-gray-400 mt-1">
                            <span class="font-bold text-indigo-300 text-sm">${categoryIcons[todo.category] || '✨'} ${apptType}</span>
                            ${(displayDate || displayTime) ? `<span class="text-lg font-semibold text-white ml-2">| ${displayDate} at ${displayTime}</span>` : ''}
                        </div>
                        <div class="mt-2 p-2 bg-black/20 rounded-md space-y-1 text-sm">
                            ${apptName ? `<p><span class="font-semibold text-gray-300">With:</span> ${apptName}</p>` : ''}
                            ${appt.address ? `<p><span class="font-semibold text-gray-300">At:</span> ${appt.address}</p>` : ''}
                            <div class="flex flex-wrap gap-x-4">
                                ${appt.contact ? `<p><span class="font-semibold text-gray-300">Call:</span> ${appt.contact}</p>` : ''}
                                ${appt.email ? `<p><span class="font-semibold text-gray-300">Email:</span> ${appt.email}</p>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center flex-shrink-0">
                    <button class="icon-btn edit-todo-btn"><svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg></button>
                    <button class="icon-btn delete-todo-btn ml-1"><svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
            `;
        } else {
            // Original HTML for other categories
            // NEW: Added 'whitespace-pre-wrap' to the task text <p> tag to respect newlines in recipes
            item.innerHTML = `
                <div class="flex items-start flex-1 min-w-0">
                    <label for="todo-${todo.id}" class="flex items-center cursor-pointer pt-1">
                        <input type="checkbox" id="todo-${todo.id}" class="hidden todo-checkbox">
                        <div class="w-6 h-6 border-2 border-purple-400 rounded-md mr-3 flex-shrink-0 flex items-center justify-center check-label">
                            ${todo.completed ? '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
                        </div>
                    </label>
                    <div class="flex-1">
                        <p class="font-semibold break-words whitespace-pre-wrap">${todo.text}</p>
                        <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                            <span>${categoryIcons[todo.category] || '✨'} ${todo.category}</span>
                            ${displayDate ? `<span>🗓️ ${displayDate}</span>` : ''}
                            ${displayTime ? `<span>⏰ ${displayTime}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center flex-shrink-0">
                    <button class="icon-btn edit-todo-btn"><svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg></button>
                    <button class="icon-btn delete-todo-btn ml-1"><svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
            `;
        }

        const toggleTodo = async () => {
             if (!todosRef) return;
             const todoDocRef = doc(db, `users/${getCurrentUserId()}/todos`, todo.id);
             await updateDoc(todoDocRef, { completed: !todo.completed });
        };

        item.querySelector('label').addEventListener('click', (e) => {
            e.preventDefault();
            toggleTodo();
        });

        item.querySelector('.edit-todo-btn').addEventListener('click', () => openEditTodoModal(todo));

        item.querySelector('.delete-todo-btn').addEventListener('click', async () => {
            if (!todosRef) return;
            const todoDocRef = doc(db, `users/${getCurrentUserId()}/todos`, todo.id);
            await deleteDoc(todoDocRef);
        });

        todoListContainer.appendChild(item);
    });
}

/**
 * Renders the wish list, sorting un-purchased items to the top.
 * @param {Array} wishes - The array of wish items from Firestore.
 */
function renderWishes(wishes) {
    wishlistContainer.innerHTML = '';

    // Sort wishes:
    // 1. Un-purchased (false) items first.
    // 2. Within purchased/un-purchased groups, sort by creation date (newest first).
    const sortedWishes = [...wishes].sort((a, b) => {
        if (a.purchased !== b.purchased) {
            return a.purchased - b.purchased; // false (0) comes before true (1)
        }
        // If 'purchased' status is the same, sort by 'createdAt' descending
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA; // Newest first
    });

    if (sortedWishes.length === 0) {
        wishlistContainer.innerHTML = `<p class="text-center text-gray-400">No wishes yet. Add one below!</p>`;
        // Reset progress bar for empty list
        wishlistProgressText.textContent = `0/0 Items`;
        wishlistProgressBar.style.width = '0%';
        return; // Exit function
    }

    // UPDATED food icons map
    const foodIcons = {
        'Meat': '🥩',
        'Fruit': '🍎',
        'Vege': '🥦',
        'Snack': '🥨',
        'Diary': '🧀',
        'Grain': '🍚', // Added Grain
        'Soup': '🍲', // Added Soup
        'Dog': '🐶',
        'Drinks': '🥤',
        '': '🥕' // Default
    };
    // NEW: Emojis for other categories (used in display)
    const categoryDisplayEmojis = {
        'Baby Care': '🍼',
        'Nursery': '🧸',
        'Hospital Bag': '👜',
        'Health': '🧘‍♀️',
        'Postpartum': '💖',
        'Food': '🥕',
        'Custom': '✨'
    };


    // Iterate over the newly sorted list
    sortedWishes.forEach(wish => {
        const item = document.createElement('div');
        item.className = `wish-item-card p-3 bg-white/5 rounded-lg border border-transparent ${wish.purchased ? 'purchased opacity-60' : ''}`;

        // Check for Food category
        let foodDetailsHtml = '';
        if (wish.category === 'Food' && wish.foodDetails) {
            const icon = foodIcons[wish.foodDetails.type] || '🥕';
            const expiryHtml = wish.foodDetails.expiry ? ` | <span class="text-yellow-400">Expires: ${formatDate(wish.foodDetails.expiry)}</span>` : '';
            foodDetailsHtml = `<p class="text-xs text-gray-400 mt-1">${icon} ${wish.foodDetails.type || 'Food'}${expiryHtml}</p>`;
        }

        // Use category emoji for display
        const displayCategory = `${categoryDisplayEmojis[wish.category] || '✨'} ${wish.category}`;

        item.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <p class="font-bold break-words">${wish.item}</p>
                    <p class="text-xs text-indigo-300">${displayCategory}</p> <!-- Display emoji + name -->
                    ${foodDetailsHtml}
                </div>
                <div class="flex items-center ml-2 flex-shrink-0"> <!-- ADDED flex-shrink-0 -->
                    <input type="checkbox" class="h-5 w-5 rounded bg-white/20 text-teal-400 focus:ring-teal-500 border-gray-500 cursor-pointer mr-2"> <!-- Added mr-2 -->
                    <!-- NEW EDIT BUTTON -->
                    <button class="icon-btn edit-wish-btn"><svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg></button>
                    <button class="icon-btn delete-wish-btn ml-1"><svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
            </div>
            <div class="flex justify-between items-center mt-2 text-sm">
                <span class="font-semibold text-teal-300">${wish.price ? `$${wish.price}`: ''}</span>
                ${wish.link ? `<a href="${wish.link}" target="_blank" class="text-blue-400 hover:underline">Store Link</a>` : ''}
            </div>
        `;
        // Set checkbox state AFTER innerHTML is set
        item.querySelector('input[type="checkbox"]').checked = wish.purchased;

        item.querySelector('input[type="checkbox"]').addEventListener('change', async (e) => {
            const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, wish.id);
            await updateDoc(wishDocRef, { purchased: e.target.checked });
        });
        item.querySelector('.delete-wish-btn').addEventListener('click', async () => {
            const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, wish.id);
            await deleteDoc(wishDocRef);
        });
        // NEW Event listener for edit button
        item.querySelector('.edit-wish-btn').addEventListener('click', () => openEditWishModal(wish));

        wishlistContainer.appendChild(item);
    });

    // This calculation remains correct as it's based on the original full 'wishes' array
    const purchasedCount = wishes.filter(w => w.purchased).length;
    wishlistProgressText.textContent = `${purchasedCount}/${wishes.length} Items`;
    wishlistProgressBar.style.width = wishes.length > 0 ? `${(purchasedCount / wishes.length) * 100}%` : '0%';
}

function renderReflections(reflections) {
    reflectionsContainer.innerHTML = '';
    const notesToRender = showAllReflections ? reflections : reflections.slice(0, 3);

    if (reflections.length === 0) {
        reflectionsContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full">No reflections yet. Add a new note to begin!</p>`;
        toggleReflectionsContainer.classList.add('hidden');
        return;
    }

    if (notesToRender.length === 0 && reflections.length > 0) {
        reflectionsContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full">All notes are hidden. Click "Show All" to see them.</p>`;
    }

    notesToRender.forEach(note => {
        const item = document.createElement('div');
        item.className = `reflection-note relative p-4 rounded-lg border-l-4 note-color-${note.color} cursor-pointer flex flex-col`;

        // Conditionally add image
        const imageHtml = note.imageUrl ?
            `<img src="${note.imageUrl}" alt="Reflection image" class="mb-3 rounded-md object-cover h-40 w-full">` : '';

        item.innerHTML = `
            ${imageHtml}
            <div class="flex-grow">
                <h4 class="font-bold break-words pr-6">${note.title}</h4>
            </div>
            <p class="text-xs text-gray-500 mt-3">${new Date(note.createdAt?.toDate()).toLocaleDateString()}</p>
            <button class="delete-reflection-btn icon-btn absolute top-1 right-1 opacity-50 hover:opacity-100 focus:opacity-100 transition-opacity">
                <svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        item.addEventListener('click', () => openReflectionModal(note));

        item.querySelector('.delete-reflection-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteReflection(note.id);
        });

        reflectionsContainer.appendChild(item);
    });

    if (reflections.length > 3) {
        toggleReflectionsContainer.classList.remove('hidden');
        toggleReflectionsBtn.textContent = showAllReflections ? 'Show Less' : `Show All (${reflections.length})`;
    } else {
        toggleReflectionsContainer.classList.add('hidden');
    }
}

function renderAiWishSuggestions(suggestions) {
    const container = document.getElementById('ai-wish-suggestions-container');
    container.innerHTML = ''; // Clear loading spinner or old results

    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 p-2">No suggestions found.</p>`;
        return;
    }

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-2 px-1';
    header.innerHTML = `<h4 class="font-semibold text-sm text-indigo-200">AI Suggestions</h4>
                        <button id="clear-suggestions-btn" class="text-xs text-gray-400 hover:text-white">Clear</button>`;
    container.appendChild(header);

    header.querySelector('#clear-suggestions-btn').addEventListener('click', () => {
        container.innerHTML = '';
    });

    suggestions.forEach(suggestion => {
        const card = document.createElement('div');
        card.className = 'ai-suggestion-card flex items-start justify-between gap-3';

        card.innerHTML = `
            <div class="flex-grow min-w-0">
                <p class="font-bold text-sm break-words">${suggestion.productName}</p>
                <p class="text-xs text-gray-400 mt-1">${suggestion.category} - ~\$${suggestion.price}</p>
                ${suggestion.productUrl ? `<a href="${suggestion.productUrl}" target="_blank" class="text-xs text-blue-400 hover:underline mt-1 inline-block">View Store Link</a>` : ''}
            </div>
            <button class="btn-secondary text-xs font-semibold py-1.5 px-3 rounded-md add-suggestion-btn flex-shrink-0 self-center">Add</button>
        `;
        card.querySelector('.add-suggestion-btn').addEventListener('click', () => {
            newWishItem.value = suggestion.productName;
            newWishPrice.value = suggestion.price;
            newWishLink.value = suggestion.productUrl;

            const categoryOption = Array.from(newWishCategory.options).find(opt => opt.value === suggestion.category);
            if (categoryOption) {
                newWishCategory.value = suggestion.category;
                customCategoryInput.classList.add('hidden');
                // NEW: Show/hide food fields based on AI category
                if (suggestion.category === 'Food') {
                    elements.newWishFoodFields.classList.remove('hidden');
                } else {
                    elements.newWishFoodFields.classList.add('hidden');
                }
            } else {
                newWishCategory.value = 'Custom';
                customCategoryInput.classList.remove('hidden');
                customCategoryInput.value = suggestion.category;
                elements.newWishFoodFields.classList.add('hidden'); // Hide for custom
            }
            newWishItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newWishItem.focus();
        });
        container.appendChild(card);
    });
}

// NEW: Renders the AI To-Do suggestions with "Add" buttons
function renderAITodoSuggestions(tasks, container) {
    container.innerHTML = ''; // Clear loading spinner or old results

    if (!tasks || tasks.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 p-2">No suggestions found.</p>`;
        return;
    }

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-2 px-1';
    header.innerHTML = `<h4 class="font-semibold text-sm text-indigo-200">AI To-Do Suggestions</h4>
                        <button id="clear-todo-suggestions-btn" class="text-xs text-gray-400 hover:text-white">Clear</button>`;
    container.appendChild(header);

    header.querySelector('#clear-todo-suggestions-btn').addEventListener('click', () => {
        container.innerHTML = '';
    });

    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'ai-suggestion-card flex items-start justify-between gap-3';

        card.innerHTML = `
            <div class="flex-grow min-w-0">
                <p class="font-bold text-sm break-words">${task.task}</p>
                <p class="text-xs text-gray-400 mt-1">${task.category}</p>
            </div>
            <button class="btn-secondary text-xs font-semibold py-1.5 px-3 rounded-md add-ai-todo-btn flex-shrink-0 self-center">Add</button>
        `;
        card.querySelector('.add-ai-todo-btn').dataset.task = task.task;
        card.querySelector('.add-ai-todo-btn').dataset.category = task.category;
        container.appendChild(card);
    });
}

// NEW: Renders the AI recipe results
function renderAIRecipes(recipes) {
    const container = elements.aiRecipeResultsContainer;
    container.innerHTML = ''; // Clear loading spinner or old results

    if (!recipes || recipes.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 p-2">Sorry, I couldn't find any recipes for that.</p>`;
        return;
    }

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'glass-card p-4 bg-white/5'; // A little internal card

        const stepsHtml = recipe.steps.map(step => `<li class="ml-4 list-decimal">${step}</li>`).join('');
        const stepsForTodo = recipe.steps.map((step, i) => `${i + 1}. ${step}`).join('\n');

        card.innerHTML = `
            <h4 class="text-lg font-bold text-white">${recipe.recipeName}</h4>
            <p class="text-sm font-semibold text-indigo-300 mb-2">As suggested by: ${recipe.chefPersona}</p>
            <ol class="text-sm text-gray-300 space-y-1 mb-4">
                ${stepsHtml}
            </ol>
            <button class="w-full btn-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors add-recipe-btn">
                Add Recipe to To-Do List
            </button>
        `;

        // Store the data on the button itself for the event listener
        const button = card.querySelector('.add-recipe-btn');
        button.dataset.recipeName = recipe.recipeName;
        button.dataset.recipeSteps = stepsForTodo;

        container.appendChild(card);
    });
}

// NEW: Render Favorite Names List
function renderFavoriteNames(favNames) {
    nameFavoritesList.innerHTML = '';
    if (favNames.length === 0) {
        nameFavoritesList.innerHTML = `<p class="text-gray-400 text-sm text-center">Your favorite names will appear here.</p>`;
    } else {
        favNames.forEach(nameData => {
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center p-2 bg-white/5 rounded';
            item.innerHTML = `
                <span class="font-semibold">${nameData.name}</span>
                <button class="icon-btn remove-favorite-name-btn" data-id="${nameData.id}">
                    <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            `;
            nameFavoritesList.appendChild(item);
        });
    }
    // Update favorite count on button - REMOVED "My Favorites" text
    nameFavoritesToggleBtn.textContent = `❤️ (${favNames.length})`;
}

// === Event Listener Setup ===

function setupEventListeners() {
    addTodoBtn.addEventListener('click', async () => {
        const text = newTodoInput.value.trim();
        let category = newTodoCategory.value;
        if (category === 'Custom') {
            category = customTodoCategoryInput.value.trim();
        }

        if (!text || !category || !todosRef) return;

        // NEW: Create data payload
        const todoData = {
            text,
            category,
            date: newTodoDate.value,
            time: newTodoTime.value,
            completed: false,
            createdAt: serverTimestamp()
        };

        // NEW: Add appointment data if category is correct
        if (category === 'Appointment') {
            let apptType = elements.newAppointmentType.value;
            if (apptType === 'Custom') {
                apptType = elements.newAppointmentCustomType.value.trim();
            }

            todoData.appointment = {
                fname: elements.newAppointmentFname.value.trim(),
                lname: elements.newAppointmentLname.value.trim(),
                address: elements.newAppointmentAddress.value.trim(),
                contact: elements.newAppointmentContact.value.trim(),
                email: elements.newAppointmentEmail.value.trim(),
                type: elements.newAppointmentType.value === 'Custom' ? '' : elements.newAppointmentType.value,
                customType: apptType
            };
        }

        await addDoc(todosRef, todoData);

        // Reset fields
        newTodoInput.value = '';
        newTodoDate.value = '';
        newTodoTime.value = '';
        newTodoCategory.value = 'Health';
        customTodoCategoryInput.value = '';
        customTodoCategoryInput.classList.add('hidden');

        // NEW: Reset appointment fields
        elements.newAppointmentFields.classList.add('hidden');
        elements.newAppointmentFname.value = '';
        elements.newAppointmentLname.value = '';
        elements.newAppointmentAddress.value = '';
        elements.newAppointmentContact.value = '';
        elements.newAppointmentEmail.value = '';
        elements.newAppointmentType.value = '';
        elements.newAppointmentCustomType.value = '';
        elements.newAppointmentCustomType.classList.add('hidden');
    });

    aiGenerateTodosBtn.addEventListener('click', async () => {
        // NEW: Create and cache the suggestions container if it doesn't exist
        if (!aiTodoSuggestionsContainer) {
            aiTodoSuggestionsContainer = document.createElement('div');
            aiTodoSuggestionsContainer.id = 'ai-todo-suggestions-container';
            aiTodoSuggestionsContainer.className = 'mt-4 space-y-3';
            // Insert it after the button's parent container
            aiGenerateTodosBtn.parentElement.insertAdjacentElement('afterend', aiTodoSuggestionsContainer);

            // Add a delegated listener to this new container
            aiTodoSuggestionsContainer.addEventListener('click', async (e) => {
                if (e.target.classList.contains('add-ai-todo-btn')) {
                    const button = e.target;
                    const task = button.dataset.task;
                    const category = button.dataset.category;

                    if (task && category && todosRef) {
                        await addDoc(todosRef, { text: task, category: category, completed: false, createdAt: serverTimestamp() });
                        button.textContent = 'Added! ✅';
                        button.disabled = true;
                    }
                }
                if (e.target.id === 'clear-todo-suggestions-btn') {
                    aiTodoSuggestionsContainer.innerHTML = '';
                }
            });
        }

        aiTodoSuggestionsContainer.innerHTML = `<div class="text-center p-4">
            <svg class="animate-spin mx-auto h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="mt-2 text-sm text-gray-300">Generating suggestions...</p>
        </div>`;

        const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(wellnessDataForJourney.pregnancyStartDate)) / (1000 * 60 * 60 * 24 * 7));
        const systemPrompt = `You are a helpful assistant. Generate a to-do list of 4-5 tasks for week ${pregnancyWeek} of pregnancy. Categorize each task as 'Health', 'Baby', 'Home', or 'Reminder'. Your response MUST be ONLY a valid JSON array of objects, where each object has "task" (string) and "category" (string) keys.`;
        const userQuery = `Generate a weekly to-do list for week ${pregnancyWeek}.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; // API Key will be injected
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json(); const data = JSON.parse(result.candidates[0].content.parts[0].text);

            // NEW: Render suggestions instead of auto-adding
            renderAITodoSuggestions(data, aiTodoSuggestionsContainer);

        } catch (error) {
            console.error("AI To-do generation failed:", error);
            aiTodoSuggestionsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate suggestions right now.</p>`;
        }
    });

    addWishBtn.addEventListener('click', async () => {
        const item = newWishItem.value.trim();
        let category = newWishCategory.value;
        if (category === 'Custom') {
            category = customCategoryInput.value.trim();
        }
        if (!item || !wishesRef || !category) return;

        // NEW: Create wish data object
        const wishData = {
            item,
            category: category,
            price: newWishPrice.value.trim(),
            link: newWishLink.value.trim(),
            purchased: false,
            createdAt: serverTimestamp()
        };

        // NEW: Add food details if category is Food
        if (category === 'Food') {
            wishData.foodDetails = {
                type: elements.newWishFoodType.value,
                expiry: elements.newWishFoodExpiry.value
            };
        }

        await addDoc(wishesRef, wishData); // Use the new data object

        newWishItem.value = newWishPrice.value = newWishLink.value = '';
        customCategoryInput.value = '';
        newWishCategory.value = 'Baby Care';
        customCategoryInput.classList.add('hidden');

        // NEW: Reset food fields
        elements.newWishFoodFields.classList.add('hidden');
        elements.newWishFoodType.value = '';
        elements.newWishFoodExpiry.value = '';
    });

    aiWishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = aiWishPrompt.value.trim();
        if(!prompt) return;

        const suggestionsContainer = document.getElementById('ai-wish-suggestions-container');
        suggestionsContainer.innerHTML = `<div class="text-center p-4">
            <svg class="animate-spin mx-auto h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="mt-2 text-sm text-gray-300">Finding suggestions...</p>
        </div>`;

        const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(wellnessDataForJourney.pregnancyStartDate)) / (1000 * 60 * 60 * 24 * 7));
        // MODIFIED: Added 'Food' to the list of categories
        const systemPrompt = `You are a helpful shopping assistant for a pregnant woman. Based on the user's request and their pregnancy week (${pregnancyWeek}), use the Google Search tool to find 3-4 real, relevant products. For each item, you MUST extract the actual product name, a relevant category (from "Baby Care", "Nursery", "Hospital Bag", "Health", "Postpartum", "Food"), price, and a working URL to the product page. Your response MUST be ONLY a valid JSON array of objects, with no other text or formatting. Each object must have these keys: "productName", "category", "price", "productUrl".`;
        const userQuery = `My request: "${prompt}". I am in week ${pregnancyWeek} of pregnancy.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; // API Key will be injected
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json();
            let jsonString = result.candidates[0].content.parts[0].text;
            // Attempt to clean potential markdown
            jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
            const data = JSON.parse(jsonString);
            renderAiWishSuggestions(data);
        } catch (error) {
            console.error("AI Wishlist generation failed:", error);
            suggestionsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate suggestions right now.</p>`;
        }
    });

    newWishCategory.addEventListener('change', () => {
        if (newWishCategory.value === 'Custom') {
            customCategoryInput.classList.remove('hidden');
            elements.newWishFoodFields.classList.add('hidden'); // Hide food fields
        } else if (newWishCategory.value === 'Food') {
            elements.newWishFoodFields.classList.remove('hidden');
            customCategoryInput.classList.add('hidden'); // Hide custom input
        } else {
            customCategoryInput.classList.add('hidden');
            elements.newWishFoodFields.classList.add('hidden');
        }
    });

    newTodoCategory.addEventListener('change', () => {
        if (newTodoCategory.value === 'Custom') {
            customTodoCategoryInput.classList.remove('hidden');
        } else {
            customTodoCategoryInput.classList.add('hidden');
        }
        // NEW: Show/hide appointment fields
        if (newTodoCategory.value === 'Appointment') {
            elements.newAppointmentFields.classList.remove('hidden');
        } else {
            elements.newAppointmentFields.classList.add('hidden');
        }
    });

    // NEW: Show/hide custom appointment type fields
    elements.newAppointmentType.addEventListener('change', () => {
        if (elements.newAppointmentType.value === 'Custom') {
            elements.newAppointmentCustomType.classList.remove('hidden');
        } else {
            elements.newAppointmentCustomType.classList.add('hidden');
        }
    });

    elements.editAppointmentType.addEventListener('change', () => {
        if (elements.editAppointmentType.value === 'Custom') {
            elements.editAppointmentCustomType.classList.remove('hidden');
        } else {
            elements.editAppointmentCustomType.classList.add('hidden');
        }
    });


    editTodoCategory.addEventListener('change', () => {
        if (editTodoCategory.value === 'Custom') {
            editCustomTodoCategoryInput.classList.remove('hidden');
        } else {
            editCustomTodoCategoryInput.classList.add('hidden');
        }
        // NEW: Show/hide edit appointment fields
        if (editTodoCategory.value === 'Appointment') {
            elements.editAppointmentFields.classList.remove('hidden');
        } else {
            elements.editAppointmentFields.classList.add('hidden');
        }
    });

    wishlistHeader.addEventListener('click', () => {
        collapsibleWishlistContent.classList.toggle('hidden');
        wishlistToggleIcon.classList.toggle('rotate-180');
    });

    todoHeader.addEventListener('click', () => {
        collapsibleTodoContent.classList.toggle('hidden');
        todoToggleIcon.classList.toggle('rotate-180');
    });

    reflectionHeader.addEventListener('click', () => {
        collapsibleReflectionContent.classList.toggle('hidden');
        reflectionToggleIcon.classList.toggle('rotate-180');
    });

    toggleReflectionsBtn.addEventListener('click', () => {
        showAllReflections = !showAllReflections;
        renderReflections(currentReflections);
    });

    addReflectionBtn.addEventListener('click', () => openReflectionModal());
    reflectionModalCancelBtn.addEventListener('click', closeReflectionModal);
    reflectionModal.addEventListener('click', e => e.target === reflectionModal && closeReflectionModal());

    reflectionColorTags.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            activeColor = e.target.dataset.color;
            updateColorTags();
        }
    });

    reflectionModalSaveBtn.addEventListener('click', async () => {
        const title = reflectionTitleInput.value.trim();
        const content = reflectionContentInput.value.trim();
        if (!title || !content) return;

        const reflectionData = {
            title,
            content,
            color: activeColor,
            imageUrl: activeReflectionImageUrl // Add the image URL
        };

        if (activeReflectionId) {
            const noteDocRef = doc(db, `users/${getCurrentUserId()}/reflections`, activeReflectionId);
            await updateDoc(noteDocRef, reflectionData);
        } else {
            reflectionData.createdAt = serverTimestamp();
            await addDoc(reflectionsRef, reflectionData);
        }
        closeReflectionModal();
    });

    aiSummarizeReflectionsBtn.addEventListener('click', async () => {
        if (currentReflections.length < 2) {
            aiSummaryContent.textContent = "You need at least two notes for a summary.";
            aiSummaryModal.classList.remove('hidden');
            setTimeout(() => aiSummaryModal.classList.add('active'), 10);
            return;
        }
        const notesToSummarize = currentReflections.slice(0, 3).map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n\n---\n\n');
        const systemPrompt = "You are an empathetic assistant. Summarize the user's reflection notes into one short, insightful, and emotional paragraph. Focus on the underlying feelings and themes.";
        const userQuery = `Here are my last few notes:\n${notesToSummarize}`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; // API Key will be injected
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }};

        aiSummaryContent.textContent = "Summarizing your thoughts...";
        aiSummaryModal.classList.remove('hidden');
        setTimeout(() => aiSummaryModal.classList.add('active'), 10);

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json();
            aiSummaryContent.textContent = result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("AI Summary failed:", error);
            aiSummaryContent.textContent = "Sorry, I couldn't generate a summary right now.";
        }
    });

    aiSummaryCloseBtn.addEventListener('click', () => {
        aiSummaryModal.classList.remove('active');
        setTimeout(() => aiSummaryModal.classList.add('hidden'), 300);
    });

    editTodoModalSaveBtn.addEventListener('click', handleSaveTodo);
    editTodoModalCancelBtn.addEventListener('click', closeEditTodoModal);
    editTodoModal.addEventListener('click', e => e.target === editTodoModal && closeEditTodoModal());

    // --- New Event Listeners for Image Link Modal ---
    const openImageLinkModal = () => {
        imageLinkModal.classList.remove('hidden');
        setTimeout(() => imageLinkModal.classList.add('active'), 10);
    };
    const closeImageLinkModal = () => {
        imageLinkModal.classList.remove('active');
        setTimeout(() => imageLinkModal.classList.add('hidden'), 300);
    };

    addReflectionImageBtn.addEventListener('click', openImageLinkModal);
    imageLinkCancelBtn.addEventListener('click', closeImageLinkModal);
    imageLinkModal.addEventListener('click', e => e.target === imageLinkModal && closeImageLinkModal());

    imageLinkSaveBtn.addEventListener('click', () => {
        const url = imageLinkInput.value.trim();
        if (url) {
            activeReflectionImageUrl = url;
            reflectionImagePreview.src = url;
            reflectionImagePreviewContainer.classList.remove('hidden');
        }
        closeImageLinkModal();
    });

    // --- NEW Event Listeners for AI Recipe Assistant ---
    elements.aiGenerateRecipeBtn.addEventListener('click', async () => {
        const prompt = elements.aiRecipePrompt.value.trim();
        if (!prompt) return;

        // Show loader
        elements.aiRecipeBtnText.textContent = 'Finding Recipes...';
        elements.aiRecipeLoader.classList.remove('hidden');
        elements.aiGenerateRecipeBtn.disabled = true;

        const systemPrompt = `You are a world-class, professional chef, like Gordon Ramsay, but you are also encouraging and helpful, not rude. A pregnant user is asking for recipe ideas. Provide three (3) distinct, healthy, and pregnancy-safe recipes based on their craving. For each recipe, provide a 'recipeName', a 'chefPersona' (e.g., 'Gordon Ramsay', 'Massimo Bottura', 'Clare Smyth'), and 'steps' as an array of strings. Your response MUST be ONLY a valid JSON object with a single key 'recipes' which is an array of these three recipe objects. Example: { "recipes": [ { "recipeName": "...", "chefPersona": "...", "steps": ["Step 1...", "Step 2..."] } ] }`;
        const userQuery = `My craving: "${prompt}"`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; // API Key will be injected
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
        };

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json();
            const data = JSON.parse(result.candidates[0].content.parts[0].text);
            renderAIRecipes(data.recipes);
        } catch (error) {
            console.error("AI Recipe generation failed:", error);
            elements.aiRecipeResultsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, I couldn't find recipes for that right now.</p>`;
        } finally {
            // Hide loader
            elements.aiRecipeBtnText.textContent = 'Find Recipes';
            elements.aiRecipeLoader.classList.add('hidden');
            elements.aiGenerateRecipeBtn.disabled = false;
        }
    });

    // Delegated event listener for adding recipes to to-do
    elements.aiRecipeResultsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('add-recipe-btn')) {
            const button = e.target;
            const title = button.dataset.recipeName;
            const steps = button.dataset.recipeSteps;

            if (title && steps && todosRef) {
                const todoText = `RECIPE: ${title}\n\n${steps}`;
                await addDoc(todosRef, {
                    text: todoText,
                    category: 'Recipes',
                    completed: false,
                    createdAt: serverTimestamp()
                });
                button.textContent = 'Added! ✅';
                button.disabled = true;
            }
        }
    });

    // --- NEW Event Listeners for Edit Wish Modal ---
    elements.editWishModalSaveBtn.addEventListener('click', handleSaveWish);
    elements.editWishModalCancelBtn.addEventListener('click', closeEditWishModal);
    elements.editWishModal.addEventListener('click', e => e.target === elements.editWishModal && closeEditWishModal());
    elements.editWishCategory.addEventListener('change', () => { // Listener for category change *inside* edit modal
        if (elements.editWishCategory.value === 'Custom') {
            elements.editCustomCategoryInput.classList.remove('hidden');
            elements.editWishFoodFields.classList.add('hidden');
        } else if (elements.editWishCategory.value === 'Food') {
            elements.editWishFoodFields.classList.remove('hidden');
            elements.editCustomCategoryInput.classList.add('hidden');
        } else {
            elements.editCustomCategoryInput.classList.add('hidden');
            elements.editWishFoodFields.classList.add('hidden');
        }
    });

    // NEW: Add listener for Clear All Notifications button
    if (elements.notificationClearAllBtn) {
        elements.notificationClearAllBtn.addEventListener('click', clearAllNotifications);
    }
}

// === NEW AI Baby Name Generator Listeners ===

function setupNameGeneratorListeners() {
    // Gender Selection
    nameGenderSelector.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            // Remove active class from all buttons
            nameGenderSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            e.target.classList.add('active');
            selectedNameGender = e.target.dataset.gender;
        }
    });

    // Origin Selection
    nameOriginSelect.addEventListener('change', () => {
        selectedNameOrigin = nameOriginSelect.value;
        if (selectedNameOrigin === 'Custom') {
            nameOriginCustom.classList.remove('hidden');
        } else {
            nameOriginCustom.classList.add('hidden');
            nameOriginCustom.value = ''; // Clear custom input
        }
    });

    // Style Selection
    nameStyleSelect.addEventListener('change', () => {
        selectedNameStyle = nameStyleSelect.value;
        if (selectedNameStyle === 'Custom') {
            nameStyleCustom.classList.remove('hidden');
        } else {
            nameStyleCustom.classList.add('hidden');
            nameStyleCustom.value = ''; // Clear custom input
        }
    });

    // Syllable Selection
    nameSyllableSelector.addEventListener('change', (e) => {
        if (e.target.type === 'radio' && e.target.checked) {
            selectedNameSyllables = e.target.value;
        }
    });

    // Generate Button
    nameGenerateBtn.addEventListener('click', () => generateNames(false));

    // Randomize Button
    nameRandomBtn.addEventListener('click', () => generateNames(true));

    // Generate Again Button
    nameGenerateAgainBtn.addEventListener('click', () => generateNames(false));

    // Favorites Toggle
    nameFavoritesToggleBtn.addEventListener('click', () => {
        nameFavoritesContainer.classList.toggle('hidden');
    });

    // Delegated listener for favorite/unfavorite buttons in results
    nameResultsContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('.toggle-favorite-name-btn');
        if (button) {
            const name = button.dataset.name;
            const meaning = button.dataset.meaning;
            const origin = button.dataset.origin;
            await toggleFavoriteName({ name, meaning, origin });
        }
    });

    // Delegated listener for removing favorites from the list
    nameFavoritesList.addEventListener('click', async (e) => {
        const button = e.target.closest('.remove-favorite-name-btn');
        if (button) {
            const docId = button.dataset.id;
            if (docId && favoriteNamesRef) {
                const nameDocRef = doc(db, `users/${getCurrentUserId()}/favoriteNames`, docId);
                await deleteDoc(nameDocRef);
            }
        }
    });
}


// === Helper & Action Functions (Original + Name Gen) ===

// ... (Keep existing openEditTodoModal, closeEditTodoModal, handleSaveTodo, deleteReflection, openReflectionModal, closeReflectionModal, openEditWishModal, closeEditWishModal, handleSaveWish, updateColorTags)

function openEditTodoModal(todo) {
    activeTodoId = todo.id;
    editTodoInput.value = todo.text;
    editTodoDate.value = todo.date || '';
    editTodoTime.value = todo.time || '';

   // NEW: Added 'Recipes'
   const standardCategories = ['Health', 'Baby', 'Home', 'Reminder', 'Appointment', 'Recipes'];
    if (standardCategories.includes(todo.category)) {
        editTodoCategory.value = todo.category;
        editCustomTodoCategoryInput.classList.add('hidden');
        editCustomTodoCategoryInput.value = '';
    } else {
        editTodoCategory.value = 'Custom';
        editCustomTodoCategoryInput.classList.remove('hidden');
        editCustomTodoCategoryInput.value = todo.category;
    }

    // NEW: Handle Appointment Fields
    if (todo.category === 'Appointment') {
        elements.editAppointmentFields.classList.remove('hidden');
        const appt = todo.appointment || {};
        elements.editAppointmentFname.value = appt.fname || '';
        elements.editAppointmentLname.value = appt.lname || '';
        elements.editAppointmentAddress.value = appt.address || '';
        elements.editAppointmentContact.value = appt.contact || '';
        elements.editAppointmentEmail.value = appt.email || '';

        // Handle custom type dropdown
        const standardTypes = ['OB/GYN', 'Ultrasound', 'Pediatrician'];
        if (standardTypes.includes(appt.type)) {
            elements.editAppointmentType.value = appt.type;
            elements.editAppointmentCustomType.classList.add('hidden');
            elements.editAppointmentCustomType.value = '';
        } else {
            elements.editAppointmentType.value = 'Custom';
            elements.editAppointmentCustomType.classList.remove('hidden');
            elements.editAppointmentCustomType.value = appt.customType || '';
        }

    } else {
        elements.editAppointmentFields.classList.add('hidden');
    }

    editTodoModal.classList.remove('hidden');
    setTimeout(() => editTodoModal.classList.add('active'), 10);
}

function closeEditTodoModal() {
    editTodoModal.classList.remove('active');
    setTimeout(() => editTodoModal.classList.add('hidden'), 300);
}

async function handleSaveTodo() {
    if (!activeTodoId) return;

    const text = editTodoInput.value.trim();
    let category = editTodoCategory.value;
    if (category === 'Custom') {
        category = editCustomTodoCategoryInput.value.trim();
    }

    if (!text || !category) {
        console.error('Task and category cannot be empty.');
        return;
    }

    const todoDocRef = doc(db, `users/${getCurrentUserId()}/todos`, activeTodoId);

    // NEW: Create data payload
    const todoData = {
        text: text,
        category: category,
        date: editTodoDate.value,
        time: editTodoTime.value,
        appointment: null // Default to null
    };

    // NEW: Add appointment data if category is correct
    if (category === 'Appointment') {
        let apptType = elements.editAppointmentType.value;
        let customApptType = '';
        if (apptType === 'Custom') {
            customApptType = elements.editAppointmentCustomType.value.trim();
        }

        todoData.appointment = {
            fname: elements.editAppointmentFname.value.trim(),
            lname: elements.editAppointmentLname.value.trim(),
            address: elements.editAppointmentAddress.value.trim(),
            contact: elements.editAppointmentContact.value.trim(),
            email: elements.editAppointmentEmail.value.trim(),
            type: apptType === 'Custom' ? '' : apptType,
            customType: customApptType
        };
    }

    await updateDoc(todoDocRef, todoData);
    closeEditTodoModal();
}

async function deleteReflection(noteId) {
    if (!reflectionsRef) return;
    const noteDocRef = doc(db, `users/${getCurrentUserId()}/reflections`, noteId);
    await deleteDoc(noteDocRef);
}

function openReflectionModal(note = null) {
    if (note) {
        activeReflectionId = note.id;
        reflectionModalTitle.textContent = "Edit Reflection";
        reflectionTitleInput.value = note.title;
        reflectionContentInput.value = note.content;
        activeColor = note.color;
        // Handle image
        if (note.imageUrl) {
            activeReflectionImageUrl = note.imageUrl;
            reflectionImagePreview.src = note.imageUrl;
            reflectionImagePreviewContainer.classList.remove('hidden');
            imageLinkInput.value = note.imageUrl;
        } else {
            activeReflectionImageUrl = null;
            reflectionImagePreviewContainer.classList.add('hidden');
            reflectionImagePreview.src = '';
            imageLinkInput.value = '';
        }
    } else {
        activeReflectionId = null;
        reflectionModalTitle.textContent = "New Reflection";
        reflectionTitleInput.value = '';
        reflectionContentInput.value = '';
        activeColor = 'pink';
        // Reset image for new note
        activeReflectionImageUrl = null;
        reflectionImagePreviewContainer.classList.add('hidden');
        reflectionImagePreview.src = '';
        imageLinkInput.value = ''; // Also clear the input for next time
    }
    updateColorTags();
    reflectionModal.classList.remove('hidden');
    setTimeout(() => reflectionModal.classList.add('active'), 10);
}

function closeReflectionModal() {
    reflectionModal.classList.remove('active');
    setTimeout(() => {
        reflectionModal.classList.add('hidden');
        // Also reset image state when modal is fully closed
        activeReflectionImageUrl = null;
        reflectionImagePreviewContainer.classList.add('hidden');
        reflectionImagePreview.src = '';
        imageLinkInput.value = '';
    }, 300);
}

// --- NEW Edit Wish Functions ---

function openEditWishModal(wish) {
    activeWishId = wish.id;
    elements.editWishItem.value = wish.item;
    elements.editWishPrice.value = wish.price || '';
    elements.editWishLink.value = wish.link || '';

    // Set category and handle custom/food fields
    const standardCategories = ['Baby Care', 'Nursery', 'Hospital Bag', 'Health', 'Postpartum', 'Food'];
    if (standardCategories.includes(wish.category)) {
        elements.editWishCategory.value = wish.category;
        elements.editCustomCategoryInput.classList.add('hidden');
        elements.editCustomCategoryInput.value = '';
        if (wish.category === 'Food') {
            elements.editWishFoodFields.classList.remove('hidden');
            const foodDetails = wish.foodDetails || {};
            elements.editWishFoodType.value = foodDetails.type || '';
            elements.editWishFoodExpiry.value = foodDetails.expiry || '';
        } else {
            elements.editWishFoodFields.classList.add('hidden');
        }
    } else {
        elements.editWishCategory.value = 'Custom';
        elements.editCustomCategoryInput.classList.remove('hidden');
        elements.editCustomCategoryInput.value = wish.category;
        elements.editWishFoodFields.classList.add('hidden');
    }

    elements.editWishModal.classList.remove('hidden');
    setTimeout(() => elements.editWishModal.classList.add('active'), 10);
}

function closeEditWishModal() {
    elements.editWishModal.classList.remove('active');
    setTimeout(() => {
        elements.editWishModal.classList.add('hidden');
        activeWishId = null; // Reset active ID
    }, 300);
}

async function handleSaveWish() {
    if (!activeWishId || !wishesRef) return;

    const item = elements.editWishItem.value.trim();
    let category = elements.editWishCategory.value;
    if (category === 'Custom') {
        category = elements.editCustomCategoryInput.value.trim();
    }

    if (!item || !category) {
        console.error('Item name and category cannot be empty.');
        return; // Add some user feedback here later if needed
    }

    const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, activeWishId);

    const wishData = {
        item,
        category,
        price: elements.editWishPrice.value.trim(),
        link: elements.editWishLink.value.trim(),
        foodDetails: null // Default to null
    };

    // Add food details if category is Food
    if (category === 'Food') {
        wishData.foodDetails = {
            type: elements.editWishFoodType.value,
            expiry: elements.editWishFoodExpiry.value
        };
    }

    try {
        await updateDoc(wishDocRef, wishData);
        closeEditWishModal();
    } catch (error) {
        console.error("Error updating wish:", error);
        // Add user feedback for error here if needed
    }
}

function updateColorTags() {
    reflectionColorTags.querySelectorAll('button').forEach(btn => {
        if (btn.dataset.color === activeColor) {
            btn.classList.add('border-white');
        } else {
            btn.classList.remove('border-white');
        }
    });
}

// === NEW AI Baby Name Generator Functions ===

/**
 * Calls the Gemini API to generate baby names based on current filters.
 * @param {boolean} isRandom - If true, ignores most filters for randomization.
 */
async function generateNames(isRandom = false) {
    if (!favoriteNamesRef) return; // Ensure Firebase is ready

    nameGenerateBtnText.textContent = 'Generating...';
    nameGenerateLoader.classList.remove('hidden');
    nameGenerateBtn.disabled = true;
    nameRandomBtn.disabled = true;
    nameGenerateAgainBtn.disabled = true;
    nameResultsContainer.innerHTML = `<div class="text-center p-4">
        <svg class="animate-spin mx-auto h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="mt-2 text-sm text-gray-300">Finding the perfect name...</p>
    </div>`;

    let userPromptParts = [];

    if (isRandom) {
        userPromptParts.push("Give me 10 random and interesting baby names.");
        // Optionally add a random gender if none is selected
        if (!selectedNameGender) {
            const genders = ['Boy', 'Girl', 'Neutral'];
            const randomGender = genders[Math.floor(Math.random() * genders.length)];
            userPromptParts.push(`Include a mix, or focus on ${randomGender} names.`);
        } else {
             userPromptParts.push(`Focus on ${selectedNameGender} names if applicable.`);
        }
    } else {
        userPromptParts.push("Suggest 10 baby names.");
        if (selectedNameGender) {
            userPromptParts.push(`Suitable for a ${selectedNameGender}.`);
        }
        let origin = selectedNameOrigin === 'Custom' ? nameOriginCustom.value.trim() : selectedNameOrigin;
        if (origin) {
            userPromptParts.push(`With ${origin} origin/language.`);
        }
        let style = selectedNameStyle === 'Custom' ? nameStyleCustom.value.trim() : selectedNameStyle;
        if (style) {
            userPromptParts.push(`The style should be ${style}.`);
        }
        let meaning = nameMeaningInput.value.trim();
        if (meaning) {
            userPromptParts.push(`Reflecting the meaning or vibe of '${meaning}'.`);
        }
        if (selectedNameSyllables) {
            userPromptParts.push(`Should have ${selectedNameSyllables} syllables.`);
        }
    }

    const userQuery = userPromptParts.join(' ');
    const systemPrompt = `You are a creative and knowledgeable baby name assistant. Provide baby name suggestions based on the user's criteria. Include the name, its origin, and its meaning. Respond ONLY with a valid JSON array of objects. Each object must have "name" (string), "meaning" (string), and "origin" (string) keys.`;
    const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; // API Key will be injected
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "name": { "type": "STRING" },
                        "meaning": { "type": "STRING" },
                        "origin": { "type": "STRING" }
                    },
                    required: ["name", "meaning", "origin"]
                }
            }
        }
    };

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) {
             const errorBody = await response.text();
             console.error("API Error Response:", errorBody);
             throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();

        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0].text) {
             const namesData = JSON.parse(result.candidates[0].content.parts[0].text);
             currentNameSuggestions = namesData; // Store suggestions
             renderNameSuggestions(namesData);
        } else {
             throw new Error("Invalid response structure from API");
        }

    } catch (error) {
        console.error("AI Name generation failed:", error);
        nameResultsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate names right now. Error: ${error.message}</p>`;
        currentNameSuggestions = []; // Clear suggestions on error
    } finally {
        nameGenerateBtnText.textContent = 'Generate Names';
        nameGenerateLoader.classList.add('hidden');
        nameGenerateBtn.disabled = false;
        nameRandomBtn.disabled = false;
        nameGenerateAgainBtn.disabled = false;
    }
}

/**
 * Renders the generated name suggestions in the results container.
 * @param {Array} names - Array of name objects ({name, meaning, origin}).
 */
function renderNameSuggestions(names) {
    nameResultsContainer.innerHTML = ''; // Clear previous results or loader

    if (!names || names.length === 0) {
        nameResultsContainer.innerHTML = `<p class="text-center text-gray-400 p-2">No names found matching your criteria.</p>`;
        nameGenerateAgainBtn.classList.add('hidden');
        return;
    }

    const favoriteNameSet = new Set(currentFavoriteNames.map(fav => fav.name.toLowerCase()));

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3'; // Responsive grid

    names.forEach(nameData => {
        const isFavorite = favoriteNameSet.has(nameData.name.toLowerCase());
        const card = document.createElement('div');
        card.className = 'p-3 bg-white/5 rounded-lg flex justify-between items-start name-suggestion-card';
        card.innerHTML = `
            <div class="flex-1 mr-2">
                <p class="font-bold text-lg">${nameData.name}</p>
                <p class="text-sm text-indigo-300">${nameData.origin || 'Unknown Origin'}</p>
                <p class="text-xs text-gray-300 mt-1">${nameData.meaning || 'No meaning provided'}</p>
            </div>
            <button
                class="icon-btn toggle-favorite-name-btn p-1 rounded-full ${isFavorite ? 'is-favorite' : ''}"
                data-name="${nameData.name}"
                data-meaning="${nameData.meaning || ''}"
                data-origin="${nameData.origin || ''}"
                title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                <svg class="w-6 h-6" fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path>
                </svg>
            </button>
        `;
        grid.appendChild(card);
    });

    nameResultsContainer.appendChild(grid);
    nameGenerateAgainBtn.classList.remove('hidden'); // Show the 'Generate Again' button
}


/**
 * Adds or removes a name from the user's favorites in Firestore.
 * Uses the name itself (lowercase) as the document ID for easy checking.
 * @param {object} nameData - Object containing {name, meaning, origin}.
 */
async function toggleFavoriteName(nameData) {
    if (!favoriteNamesRef || !nameData || !nameData.name) return;

    const lowerCaseName = nameData.name.toLowerCase();
    const nameDocRef = doc(favoriteNamesRef, lowerCaseName); // Use lowercase name as ID

    try {
        const isCurrentlyFavorite = currentFavoriteNames.some(fav => fav.id === lowerCaseName);

        if (isCurrentlyFavorite) {
            // Remove from favorites
            await deleteDoc(nameDocRef);
        } else {
            // Add to favorites
            // Use setDoc with the custom ID to ensure no duplicates based on name
            await setDoc(nameDocRef, {
                name: nameData.name, // Store original casing
                meaning: nameData.meaning || '',
                origin: nameData.origin || '',
                addedAt: serverTimestamp()
            });
        }
        // The onSnapshot listener will automatically update the UI (renderFavoriteNames)
    } catch (error) {
        console.error("Error toggling favorite name:", error);
    }
}


// === NEW NOTIFICATION FUNCTIONS ===

/**
 * Gets the start of the current day (midnight) in the user's local timezone.
 * @returns {Date} A Date object set to today at 00:00:00.
 */
function getStartOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Checks all To-Dos for upcoming due dates and returns an array of notifications.
 * @param {Array} todos - The current list of todo items.
 * @returns {Array} An array of notification objects.
 */
function checkTodoNotifications(todos) {
    const notifications = [];
    const today = getStartOfToday().getTime();

    todos.forEach(todo => {
        // Skip completed tasks or tasks without a date
        if (todo.completed || !todo.date) {
            return;
        }

        try {
            // Parse date as local timezone (e.g., '2023-10-28' becomes Oct 28 at 00:00 local time)
            const dueDate = new Date(todo.date + 'T00:00:00').getTime();
            const diffTime = dueDate - today;
            const diffDays = Math.round(diffTime / DAY_IN_MS);

            let message = '';
            let type = '';

            // 7, 3, 1 day warnings
            if (diffDays <= 7 && diffDays > 3) {
                message = `This task is due in ${diffDays} days.`;
                type = 'todo-soon';
            } else if (diffDays <= 3 && diffDays > 0) {
                message = `This task is due in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}!`;
                type = 'todo-urgent';
            } else if (diffDays === 0) {
                message = 'This task is due TODAY!';
                type = 'todo-urgent';
            } else if (diffDays < 0) {
                message = `This task was due ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago.`;
                type = 'todo-urgent';
            }

            if (message) {
                // --- MODIFICATION START ---
                const notificationData = {
                    id: `todo-${todo.id}`,
                    title: todo.text, // The main title (e.g., "First Check-Up")
                    message: message,  // The urgency (e.g., "This task is due TODAY!")
                    type: type,
                    daysLeft: diffDays,
                    details: {} // Create an empty details object
                };

                // If it's an appointment, add all the appointment details
                if (todo.category === 'Appointment' && todo.appointment) {
                    notificationData.details.appointment = todo.appointment;
                    notificationData.details.time = todo.time;
                }
                
                notifications.push(notificationData);
                // --- MODIFICATION END ---
            }
        } catch (e) {
            console.error("Error parsing todo date:", e, todo);
        }
    });
    return notifications;
}

/**
 * Checks all "Food" wishes for upcoming expiration dates.
 * @param {Array} wishes - The current list of wish items.
 * @returns {Array} An array of notification objects.
 */
function checkWishNotifications(wishes) {
    const notifications = [];
    const today = getStartOfToday().getTime();

    wishes.forEach(wish => {
        // Skip purchased, non-food, or items without an expiry date
        if (wish.purchased || wish.category !== 'Food' || !wish.foodDetails || !wish.foodDetails.expiry) {
            return;
        }

        try {
            const expiryDate = new Date(wish.foodDetails.expiry + 'T00:00:00').getTime();
            const diffTime = expiryDate - today;
            const diffDays = Math.round(diffTime / DAY_IN_MS);

            let message = '';
            let type = '';

            // 1 month (30 days), 7, 3, 1 day warnings
            if (diffDays <= 30 && diffDays > 7) {
                message = `This item expires in ${diffDays} days.`;
                type = 'wish-soon';
            } else if (diffDays <= 7 && diffDays > 3) {
                message = `This item expires in ${diffDays} days!`;
                type = 'wish-urgent';
            } else if (diffDays <= 3 && diffDays > 0) {
                message = `Expires in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}!`;
                type = 'wish-urgent';
            } else if (diffDays === 0) {
                message = 'This item expires TODAY!';
                type = 'wish-urgent';
            } else if (diffDays < 0) {
                message = `This item expired ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago.`;
                type = 'wish-urgent';
            }

            if (message) {
                // --- MODIFICATION START ---
                notifications.push({
                    id: `wish-${wish.id}`,
                    title: wish.item,
                    message: message,
                    type: type,
                    daysLeft: diffDays,
                    details: {
                        food: wish.foodDetails // Add the food details object
                    }
                });
                // --- MODIFICATION END ---
            }
        } catch (e) {
            console.error("Error parsing wish date:", e, wish);
        }
    });
    return notifications;
}

/**
 * Main function to check all notifications, sort them, and update the UI.
 */
function checkNotifications() {
    const todoNotifications = checkTodoNotifications(currentTodos);
    const wishNotifications = checkWishNotifications(currentWishes);

    // Combine and sort notifications by urgency (daysLeft ascending)
    allNotifications = [...todoNotifications, ...wishNotifications];
    allNotifications.sort((a, b) => a.daysLeft - b.daysLeft);

    updateNotificationUI(allNotifications);
}

/**
 * Clears all current notifications from the UI.
 */
function clearAllNotifications() {
    allNotifications = [];
    updateNotificationUI(allNotifications);
    // The modal will now show the "no notifications" message.
    // The user can close it manually.
}


// === Unloading ===

export function unloadJourney() {
    if (unsubscribeTodos) unsubscribeTodos();
    if (unsubscribeWishes) unsubscribeWishes();
    if (unsubscribeReflections) unsubscribeReflections();
    if (unsubscribeFavoriteNames) unsubscribeFavoriteNames(); // NEW
    // Remove specific event listeners if necessary, though often covered by page unload/auth change
}

// === Utility Functions ===
export function updateWellnessDataForJourney(newData) {
    wellnessDataForJourney = newData;
    // Potentially trigger updates within Journey tab if needed based on wellness data
}
