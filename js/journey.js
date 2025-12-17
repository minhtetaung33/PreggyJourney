// Firebase Imports
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, where, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentUserId } from "./auth.js";
// IMPORT THE NEW NOTIFICATION UI FUNCTION and ELEMENTS
import { elements, updateNotificationUI } from './ui.js'; 

// === State Variables ===
let todosRef, wishesRef, reflectionsRef, favoriteNamesRef;
let unsubscribeTodos, unsubscribeWishes, unsubscribeReflections, unsubscribeFavoriteNames;
// === MODIFICATION START: Task 2 - Separate Recipes State ===
let currentTodos = [], currentWishes = [], currentReflections = [], currentFavoriteNames = [];
let currentRecipeTodos = []; // New state for Recipes tasks
// === MODIFICATION END: Task 2 - Separate Recipes State ===
let wellnessDataForJourney = {};
let activeReflectionId = null;
let activeColor = 'pink';
let activeTodoId = null;
let activeWishId = null; 
let showAllReflections = false;
let activeReflectionImageUrl = null;

// === NEW Wishlist State ===
let currentWishlistSearchTerm = '';
let currentWishlistSortBy = 'default';

// === NEW Notification State ===
let allNotifications = [];
const DAY_IN_MS = 1000 * 60 * 60 * 24;

// === NEW Baby Name Generator State ===
let selectedNameGender = null;
let selectedNameOrigin = '';
let selectedNameStyle = '';
let selectedNameMeaning = '';
let selectedNameSyllables = '';
let currentNameSuggestions = []; 

// === NEW CALENDAR STATE ===
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let currentCalendarDate = new Date(); 

// === Helper function to get the start of a given date in the user's local timezone ===
function getStartOfDayInLocalTZ(date) {
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return localDate;
}

// === Initialization ===
export function initializeJourney(userId, initialWellnessData) {
    wellnessDataForJourney = initialWellnessData;
    // Firebase collection references
    todosRef = collection(db, `users/${userId}/todos`);
    wishesRef = collection(db, `users/${userId}/wishes`);
    reflectionsRef = collection(db, `users/${userId}/reflections`);
    favoriteNamesRef = collection(db, `users/${userId}/favoriteNames`); 

    // Load data
    loadTodos();
    loadWishes();
    loadReflections();
    loadFavoriteNames(); 

    // Setup listeners
    setupEventListeners();
    setupNameGeneratorListeners(); 

    // NEW: Render initial calendar
    renderCalendar();
}

// === Data Loading & Rendering (Original + Name Gen Favorites) ===

function loadTodos() {
    if (!todosRef) return;
    if(unsubscribeTodos) unsubscribeTodos();
    const q = query(todosRef, orderBy("createdAt", "desc"));
    unsubscribeTodos = onSnapshot(q, (snapshot) => {
        // === MODIFICATION START: Task 2 - Separate Recipes Logic ===
        const allTasks = [];
        snapshot.forEach(doc => allTasks.push({ id: doc.id, ...doc.data() }));

        // Separate tasks into To-Dos and Recipes
        currentTodos = allTasks.filter(todo => todo.category !== 'Recipes');
        currentRecipeTodos = allTasks.filter(todo => todo.category === 'Recipes');

        // Sort To-Dos based on due date (Task 1)
        currentTodos.sort(sortTodosByDueDate);

        renderTodos(currentTodos);
        renderRecipeTodos(currentRecipeTodos); // Render the new Recipes list
        // === MODIFICATION END: Task 2 - Separate Recipes Logic ===
        
        renderCalendar(); 
        checkNotifications(); 
    });
}

// === MODIFICATION START: Task 1 - Todo Sorting Helper Function ===
/**
 * Custom sorting function for To-Dos. Prioritizes:
 * 1. Uncompleted tasks over completed tasks.
 * 2. Tasks with a due date over tasks without.
 * 3. Nearest due date first.
 * 4. Most recently created for tie-breaking.
 * @param {Object} a 
 * @param {Object} b 
 * @returns {number}
 */
function sortTodosByDueDate(a, b) {
    // 1. Uncompleted tasks first
    if (a.completed !== b.completed) {
        return a.completed - b.completed; 
    }

    const dateA = a.date ? new Date(a.date + 'T00:00:00').getTime() : Infinity;
    const dateB = b.date ? new Date(b.date + 'T00:00:00').getTime() : Infinity;

    // 2. Tasks with dates first (if both are uncompleted or both completed)
    const hasDateA = dateA !== Infinity;
    const hasDateB = dateB !== Infinity;
    
    if (hasDateA && !hasDateB) return -1;
    if (!hasDateA && hasDateB) return 1;

    // 3. Sort by date (nearest first, i.e., smaller number first)
    if (dateA !== dateB) {
        return dateA - dateB;
    }

    // 4. Fallback: Sort by creation date (newest first)
    const createdAtA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const createdAtB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return createdAtB - createdAtA; 
}
// === MODIFICATION END: Task 1 - Todo Sorting Helper Function ===


function loadWishes() {
    if (!wishesRef) return;
    if(unsubscribeWishes) unsubscribeWishes();
    const q = query(wishesRef);
    unsubscribeWishes = onSnapshot(q, (snapshot) => {
        currentWishes = [];
        snapshot.forEach(doc => currentWishes.push({ id: doc.id, ...doc.data() }));
        renderWishes(currentWishes, currentWishlistSearchTerm, currentWishlistSortBy);
        checkNotifications(); 
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

function loadFavoriteNames() {
    if (!favoriteNamesRef) return;
    if (unsubscribeFavoriteNames) unsubscribeFavoriteNames();
    const q = query(favoriteNamesRef, orderBy("name"));
    unsubscribeFavoriteNames = onSnapshot(q, (snapshot) => {
        currentFavoriteNames = [];
        snapshot.forEach(doc => currentFavoriteNames.push({ id: doc.id, ...doc.data() }));
        renderFavoriteNames(currentFavoriteNames);
        if (currentNameSuggestions.length > 0) {
            renderNameSuggestions(currentNameSuggestions);
        }
    });
}

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00'); 
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
};

function renderTodos(todos) {
    if (!elements.todoListContainer) return;
    elements.todoListContainer.innerHTML = '';
    // === MODIFICATION START: Task 2 - Empty state check (only non-recipes) ===
    if (todos.length === 0) {
        elements.todoListContainer.innerHTML = `<p class="text-center text-gray-400">No tasks yet. Add one below!</p>`;
        return;
    }
    // === MODIFICATION END: Task 2 - Empty state check ===

    const categoryIcons = { Health: '🧘‍♀️', Baby: '🍼', Home: '🏡', Reminder: '💬', Appointment: '🗓️', Recipes: '🍳' };

    todos.forEach(todo => {
        const item = document.createElement('div');
        item.id = `todo-item-${todo.id}`; 
        item.className = `todo-item flex items-start justify-between p-3 bg-white/5 rounded-lg ${todo.completed ? 'completed' : ''}`;

        const displayDate = formatDate(todo.date);
        const displayTime = formatTime(todo.time);

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

        elements.todoListContainer.appendChild(item);
    });
}

// === MODIFICATION START: Task 2 - New function to render Recipes Todos ===
/**
 * Renders the Recipes To-Do list.
 * @param {Array} todos - The array of todo items where category is 'Recipes'.
 */
function renderRecipeTodos(todos) {
    if (!elements.recipeListContainer) return;
    elements.recipeListContainer.innerHTML = '';

    // Sort Recipes: Uncompleted first, then newest first (using standard creation date sort)
    todos.sort((a, b) => {
        if (a.completed !== b.completed) {
            return a.completed - b.completed; 
        }
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA; 
    });

    if (todos.length === 0) {
        elements.recipeListContainer.innerHTML = `<p class="text-center text-gray-400 p-3">No recipes saved yet.</p>`;
        return;
    }

    const categoryIcon = '🍳';

    todos.forEach(todo => {
        const item = document.createElement('div');
        item.id = `todo-item-${todo.id}`; 
        item.className = `todo-item flex items-start justify-between p-3 bg-white/5 rounded-lg ${todo.completed ? 'completed' : ''}`;

        const displayDate = formatDate(todo.date);
        const displayTime = formatTime(todo.time);

        item.innerHTML = `
            <div class="flex items-start flex-1 min-w-0">
                <label for="recipe-todo-${todo.id}" class="flex items-center cursor-pointer pt-1">
                    <input type="checkbox" id="recipe-todo-${todo.id}" class="hidden todo-checkbox">
                    <div class="w-6 h-6 border-2 border-purple-400 rounded-md mr-3 flex-shrink-0 flex items-center justify-center check-label">
                        ${todo.completed ? '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
                    </div>
                </label>
                <div class="flex-1">
                    <p class="font-semibold break-words whitespace-pre-wrap">${todo.text}</p>
                    <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                        <span>${categoryIcon} Recipes</span>
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

        elements.recipeListContainer.appendChild(item);
    });
}
// === MODIFICATION END: Task 2 - New function to render Recipes Todos ===


function renderWishes(wishes, searchTerm = '', sortBy = 'default') {
    elements.wishlistContainer.innerHTML = ''; 

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filteredWishes = wishes.filter(wish => 
        wish.item.toLowerCase().includes(lowerSearchTerm)
    );

    const sortedWishes = filteredWishes.sort((a, b) => {
        const aNeeded = (a.purchasedCount || 0) === 0;
        const bNeeded = (b.purchasedCount || 0) === 0;

        if (aNeeded !== bNeeded) {
            return bNeeded - aNeeded; 
        }

        if (sortBy === 'category') {
            const categoryCompare = (a.category || '').localeCompare(b.category || '');
            if (categoryCompare !== 0) return categoryCompare;
        } else if (sortBy === 'foodType') {
            const aFoodType = a.foodDetails?.type || '';
            const bFoodType = b.foodDetails?.type || '';
            const foodTypeCompare = aFoodType.localeCompare(bFoodType);
            if (foodTypeCompare !== 0) return foodTypeCompare;
            const categoryCompare = (a.category || '').localeCompare(b.category || '');
            if (categoryCompare !== 0) return categoryCompare;
        }

        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
    });

    if (sortedWishes.length === 0) {
        elements.wishlistContainer.innerHTML = `<p class="text-center text-gray-400 md:col-span-2">No wishes found ${searchTerm ? 'matching your search' : 'yet. Add one below!'}</p>`;
        updateWishlistProgress(wishes);
        return; 
    }

    const foodIcons = {
        'Meat': '🥩', 'Fruit': '🍎', 'Vege': '🥦', 'Snack': '🥨', 'Diary': '🧀',
        'Grain': '🍚', 'Soup': '🍲', 'Dog': '🐶', 'Drinks': '🥤', '': '🥕'
    };
    const categoryDisplayEmojis = {
        'Baby Care': '🍼', 'Nursery': '🧸', 'Hospital Bag': '👜', 'Health': '🧘‍♀️',
        'Postpartum': '💖', 'Food': '🥕', 'Custom': '✨'
    };

    sortedWishes.forEach(wish => {
        const card = document.createElement('div');
        const quantity = wish.quantity || 1;
        const purchasedCount = wish.purchasedCount || 0;
        const isComplete = purchasedCount >= quantity;
        const isNeeded = purchasedCount === 0; 

        card.className = `wish-item-card ${isNeeded ? '' : 'purchased'}`;

        let foodDetailsHtml = '';
        if (wish.category === 'Food' && wish.foodDetails) {
            const icon = foodIcons[wish.foodDetails.type] || '🥕';
            const expiryHtml = wish.foodDetails.expiry ? ` | <span class="text-yellow-400">Expires: ${formatDate(wish.foodDetails.expiry)}</span>` : '';
            foodDetailsHtml = `<p class="item-food-details mt-1">${icon} ${wish.foodDetails.type || 'Food'}${expiryHtml}</p>`;
        }

        const displayCategory = `${categoryDisplayEmojis[wish.category] || '✨'} ${wish.category}`;
        
        let sizeClass = 'h-auto'; 
        if (wish.item.length > 30) {
            sizeClass = 'min-h-[160px]'; 
        }
        card.classList.add(sizeClass);

        card.innerHTML = `
            <div class="item-details">
                <p class="item-name">${wish.item}</p>
                <p class="item-category">${displayCategory}</p>
                ${foodDetailsHtml}
            </div>
            
            <div class="item-actions">
                <div class="item-quantity-controls">
                    <button class="quantity-btn wish-quantity-minus" ${purchasedCount <= 0 ? 'disabled' : ''}>-</button>
                    <span class="quantity-display">
                        <span class="${isComplete ? 'text-teal-300' : 'text-white'}">${purchasedCount}</span><span class="text-gray-400 text-sm">/${quantity}</span>
                    </span>
                    <button class="quantity-btn wish-quantity-plus" ${isComplete ? 'disabled' : ''}>+</button>
                </div>
                <div class="item-buttons">
                    <button class="icon-btn edit-wish-btn"><svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z"></path></svg></button>
                    <button class="icon-btn delete-wish-btn"><svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
            </div>

            <div class="item-meta">
                <span class="item-price">${wish.price ? `$${wish.price}` : ''}</span>
                ${wish.link ? `<a href="${wish.link}" target="_blank" class="item-link">Store Link</a>` : ''}
            </div>
        `;

        // Add event listeners
        card.querySelector('.wish-quantity-plus').addEventListener('click', () => {
            handleUpdateWishPurchasedCount(wish, purchasedCount + 1);
        });
        card.querySelector('.wish-quantity-minus').addEventListener('click', () => {
            handleUpdateWishPurchasedCount(wish, purchasedCount - 1);
        });
        card.querySelector('.delete-wish-btn').addEventListener('click', async () => {
            const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, wish.id);
            await deleteDoc(wishDocRef);
        });
        card.querySelector('.edit-wish-btn').addEventListener('click', () => openEditWishModal(wish));

        elements.wishlistContainer.appendChild(card);
    });

    updateWishlistProgress(wishes);
}

function updateWishlistProgress(allWishes) {
    let totalTarget = 0;
    let totalPurchased = 0;

    allWishes.forEach(wish => {
        totalTarget += wish.quantity || 1;
        totalPurchased += wish.purchasedCount || 0;
    });

    elements.wishlistProgressText.textContent = `${totalPurchased}/${totalTarget} Items`;
    elements.wishlistProgressBar.style.width = totalTarget > 0 ? `${(totalPurchased / totalTarget) * 100}%` : '0%';
}


function renderReflections(reflections) {
    elements.reflectionsContainer.innerHTML = '';
    const notesToRender = showAllReflections ? reflections : reflections.slice(0, 3);

    if (reflections.length === 0) {
        elements.reflectionsContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full">No reflections yet. Add a new note to begin!</p>`;
        elements.toggleReflectionsContainer.classList.add('hidden');
        return;
    }

    if (notesToRender.length === 0 && reflections.length > 0) {
        elements.reflectionsContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full">All notes are hidden. Click "Show All" to see them.</p>`;
    }

    notesToRender.forEach(note => {
        const item = document.createElement('div');
        item.className = `reflection-note relative p-4 rounded-lg border-l-4 note-color-${note.color} cursor-pointer flex flex-col`;

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

        elements.reflectionsContainer.appendChild(item);
    });

    if (reflections.length > 3) {
        elements.toggleReflectionsContainer.classList.remove('hidden');
        elements.toggleReflectionsBtn.textContent = showAllReflections ? 'Show Less' : `Show All (${reflections.length})`;
    } else {
        elements.toggleReflectionsContainer.classList.add('hidden');
    }
}

function renderAiWishSuggestions(suggestions) {
    const container = document.getElementById('ai-wish-suggestions-container');
    container.innerHTML = ''; 

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
            elements.newWishItem.value = suggestion.productName;
            elements.newWishPrice.value = suggestion.price;
            elements.newWishLink.value = suggestion.productUrl;

            const categoryOption = Array.from(elements.newWishCategory.options).find(opt => opt.value === suggestion.category);
            if (categoryOption) {
                elements.newWishCategory.value = suggestion.category;
                elements.customCategoryInput.classList.add('hidden');
                if (suggestion.category === 'Food') {
                    elements.newWishFoodFields.classList.remove('hidden');
                } else {
                    elements.newWishFoodFields.classList.add('hidden');
                }
            } else {
                elements.newWishCategory.value = 'Custom';
                elements.customCategoryInput.classList.remove('hidden');
                elements.customCategoryInput.value = suggestion.category;
                elements.newWishFoodFields.classList.add('hidden'); 
            }
            elements.newWishQuantityInput.value = 1; 
            elements.newWishItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            elements.newWishItem.focus();
        });
        container.appendChild(card);
    });
}

function renderAITodoSuggestions(tasks, container) {
    container.innerHTML = ''; 

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

function renderAIRecipes(recipes) {
    const container = elements.aiRecipeResultsContainer;
    container.innerHTML = ''; 

    if (!recipes || recipes.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 p-2">Sorry, I couldn't find any recipes for that.</p>`;
        return;
    }

    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'glass-card p-4 bg-white/5'; 

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

        const button = card.querySelector('.add-recipe-btn');
        button.dataset.recipeName = recipe.recipeName;
        button.dataset.recipeSteps = stepsForTodo;

        container.appendChild(card);
    });
}

function renderFavoriteNames(favNames) {
    elements.nameFavoritesList.innerHTML = '';
    if (favNames.length === 0) {
        elements.nameFavoritesList.innerHTML = `<p class="text-gray-400 text-sm text-center">Your favorite names will appear here.</p>`;
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
            elements.nameFavoritesList.appendChild(item);
        });
    }
    elements.nameFavoritesToggleBtn.textContent = `❤️ (${favNames.length})`;
}


// === NEW CALENDAR RENDERING LOGIC ===

function isSameDay(d1, d2) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function changeMonth(offset) {
    currentCalendarDate.setDate(1); 
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + offset);
    renderCalendar();
}

function renderCalendar() {
    if (!elements.calendarGrid || !elements.calendarMonthYear) return; 

    elements.calendarGrid.classList.remove('calendar-grid-anim'); 
    void elements.calendarGrid.offsetWidth; 
    elements.calendarGrid.classList.add('calendar-grid-anim'); 

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); 
    
    elements.calendarMonthYear.textContent = new Date(year, month).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
        timeZone: userTimeZone 
    });

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); 
    
    const today = getStartOfDayInLocalTZ(new Date());

    elements.calendarGrid.innerHTML = ''; 

    for (let i = 0; i < firstDayOfWeek; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        elements.calendarGrid.appendChild(day);
    }

    for (let dayNum = 1; dayNum <= lastDayOfMonth.getDate(); dayNum++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';

        const date = new Date(year, month, dayNum);
        
        if (isSameDay(date, today)) {
            day.classList.add('is-today');
        }

        const isoDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        
        let markersHtml = '';
        const allTasks = [...currentTodos, ...currentRecipeTodos]; 
        const tasksForDay = allTasks.filter(todo => todo.date === isoDate);

        if (tasksForDay.length > 0) {
            markersHtml = '<div class="task-markers">';
            tasksForDay.slice(0, 6).forEach(task => {
                const categoryClass = (task.category || 'Default').replace(/[^a-zA-Z0-9]/g, '');
                markersHtml += `<div class="task-marker task-marker-${categoryClass}" title="${task.text}"></div>`;
            });
            markersHtml += '</div>';
        }
        
        day.innerHTML = `
            <div class="day-content">
                <span class="day-number">${dayNum}</span>
                ${markersHtml}
            </div>
        `;
        
        if (tasksForDay.length > 0) {
            day.classList.add('cursor-pointer');
            day.addEventListener('click', () => handleCalendarDayClick(isoDate));
        }

        elements.calendarGrid.appendChild(day);
    }

    const remainingDays = 42 - (firstDayOfWeek + lastDayOfMonth.getDate()); 
     for (let i = 0; i < remainingDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        elements.calendarGrid.appendChild(day);
    }
}


// === Event Listener Setup ===

function setupEventListeners() {
    elements.addTodoBtn.addEventListener('click', async () => {
        const text = elements.newTodoInput.value.trim();
        let category = elements.newTodoCategory.value;
        if (category === 'Custom') {
            category = elements.customTodoCategoryInput.value.trim();
        }

        if (!text || !category || !todosRef) return;

        const todoData = {
            text,
            category,
            date: elements.newTodoDate.value,
            time: elements.newTodoTime.value,
            completed: false,
            createdAt: serverTimestamp()
        };

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

        elements.newTodoInput.value = '';
        elements.newTodoDate.value = '';
        elements.newTodoTime.value = '';
        elements.newTodoCategory.value = 'Health';
        elements.customTodoCategoryInput.value = '';
        elements.customTodoCategoryInput.classList.add('hidden');

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

    elements.aiGenerateTodosBtn.addEventListener('click', async () => {
        let aiTodoSuggestionsContainer = document.getElementById('ai-todo-suggestions-container');
        if (!aiTodoSuggestionsContainer) {
            aiTodoSuggestionsContainer = document.createElement('div');
            aiTodoSuggestionsContainer.id = 'ai-todo-suggestions-container';
            aiTodoSuggestionsContainer.className = 'mt-4 space-y-3';
            elements.aiGenerateTodosBtn.parentElement.insertAdjacentElement('afterend', aiTodoSuggestionsContainer);

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
        const apiKey = "AIzaSyAsi_DMNTRm648ZO_5iqMbr27XS-MYJjlU"; 
        // Updated model
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json(); 
            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0].text) {
                throw new Error("Invalid API response structure");
            }
            const data = JSON.parse(result.candidates[0].content.parts[0].text);

            renderAITodoSuggestions(data, aiTodoSuggestionsContainer);

        } catch (error) {
            console.error("AI To-do generation failed:", error);
            aiTodoSuggestionsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate suggestions right now.</p>`;
        }
    });

    elements.addWishBtn.addEventListener('click', async () => {
        const item = elements.newWishItem.value.trim();
        let category = elements.newWishCategory.value;
        if (category === 'Custom') {
            category = elements.customCategoryInput.value.trim();
        }
        const quantityVal = parseInt(elements.newWishQuantityInput.value, 10) || 1; 
        if (!item || !wishesRef || !category) return;

        const wishData = {
            item,
            category: category,
            price: elements.newWishPrice.value.trim(),
            link: elements.newWishLink.value.trim(),
            quantity: quantityVal, 
            purchasedCount: 0, 
            createdAt: serverTimestamp()
        };

        if (category === 'Food') {
            wishData.foodDetails = {
                type: elements.newWishFoodType.value,
                expiry: elements.newWishFoodExpiry.value
            };
        }

        await addDoc(wishesRef, wishData); 

        elements.newWishItem.value = elements.newWishPrice.value = elements.newWishLink.value = '';
        elements.newWishQuantityInput.value = 1; 
        elements.customCategoryInput.value = '';
        elements.newWishCategory.value = 'Baby Care';
        elements.customCategoryInput.classList.add('hidden');

        elements.newWishFoodFields.classList.add('hidden');
        elements.newWishFoodType.value = '';
        elements.newWishFoodExpiry.value = '';
    });

    elements.aiWishForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prompt = elements.aiWishPrompt.value.trim();
        if(!prompt) return;

        const suggestionsContainer = document.getElementById('ai-wish-suggestions-container');
        suggestionsContainer.innerHTML = `<div class="text-center p-4">
            <svg class="animate-spin mx-auto h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="mt-2 text-sm text-gray-300">Finding suggestions...</p>
        </div>`;

        const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(wellnessDataForJourney.pregnancyStartDate)) / (1000 * 60 * 60 * 24 * 7));
        const systemPrompt = `You are a helpful shopping assistant for a pregnant woman. Based on the user's request and their pregnancy week (${pregnancyWeek}), use the Google Search tool to find 3-4 real, relevant products. For each item, you MUST extract the actual product name, a relevant category (from "Baby Care", "Nursery", "Hospital Bag", "Health", "Postpartum", "Food"), price, and a working URL to the product page. Your response MUST be ONLY a valid JSON array of objects, with no other text or formatting. Each object must have these keys: "productName", "category", "price", "productUrl".`;
        const userQuery = `My request: "${prompt}". I am in week ${pregnancyWeek} of pregnancy.`;
        const apiKey = "AIzaSyAsi_DMNTRm648ZO_5iqMbr27XS-MYJjlU"; 
        // Updated model
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            tools: [{ "google_search": {} }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json();
            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0].text) {
                throw new Error("Invalid API response structure");
            }
            let jsonString = result.candidates[0].content.parts[0].text;
            jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
            const data = JSON.parse(jsonString);
            renderAiWishSuggestions(data);
        } catch (error) {
            console.error("AI Wishlist generation failed:", error);
            suggestionsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate suggestions right now.</p>`;
        }
    });

    elements.newWishCategory.addEventListener('change', () => {
        if (elements.newWishCategory.value === 'Custom') {
            elements.customCategoryInput.classList.remove('hidden');
            elements.newWishFoodFields.classList.add('hidden'); 
        } else if (elements.newWishCategory.value === 'Food') {
            elements.newWishFoodFields.classList.remove('hidden');
            elements.customCategoryInput.classList.add('hidden'); 
        } else {
            elements.customCategoryInput.classList.add('hidden');
            elements.newWishFoodFields.classList.add('hidden');
        }
    });

    setupQuantityButtons(elements.newWishQuantityInput, elements.newWishQuantityMinusBtn, elements.newWishQuantityPlusBtn);

    elements.newTodoCategory.addEventListener('change', () => {
        if (elements.newTodoCategory.value === 'Custom') {
            elements.customTodoCategoryInput.classList.remove('hidden');
        } else {
            elements.customTodoCategoryInput.classList.add('hidden');
        }
        // === MODIFICATION START: Task 2 - Appointment & Recipe logic for form ===
        if (elements.newTodoCategory.value === 'Appointment') {
            elements.newAppointmentFields.classList.remove('hidden');
        } else {
            elements.newAppointmentFields.classList.add('hidden');
        }
        // === MODIFICATION END: Task 2 - Appointment & Recipe logic for form ===
    });

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


    elements.editTodoCategory.addEventListener('change', () => {
        if (elements.editTodoCategory.value === 'Custom') {
            elements.editCustomTodoCategoryInput.classList.remove('hidden');
        } else {
            elements.editCustomTodoCategoryInput.classList.add('hidden');
        }
        if (elements.editTodoCategory.value === 'Appointment') {
            elements.editAppointmentFields.classList.remove('hidden');
        } else {
            elements.editAppointmentFields.classList.add('hidden');
        }
    });

    elements.wishlistHeader.addEventListener('click', () => {
        elements.collapsibleWishlistContent.classList.toggle('hidden');
        elements.wishlistToggleIcon.classList.toggle('rotate-180');
    });

    elements.todoListHeader.addEventListener('click', () => {
        elements.collapsibleTodoContent.classList.toggle('hidden');
        elements.todoListToggleIcon.classList.toggle('rotate-180');
    });

    // === MODIFICATION START: Task 2 - Recipes Collapse Listener ===
    if (elements.recipeListHeader) {
        elements.recipeListHeader.addEventListener('click', () => {
            elements.collapsibleRecipeContent.classList.toggle('hidden');
            elements.recipeListToggleIcon.classList.toggle('rotate-180');
        });
    }
    // === MODIFICATION END: Task 2 - Recipes Collapse Listener ===

    elements.reflectionHeader.addEventListener('click', () => {
        elements.collapsibleReflectionContent.classList.toggle('hidden');
        elements.reflectionToggleIcon.classList.toggle('rotate-180');
    });

    elements.toggleReflectionsBtn.addEventListener('click', () => {
        showAllReflections = !showAllReflections;
        renderReflections(currentReflections);
    });

    elements.addReflectionBtn.addEventListener('click', () => openReflectionModal());
    elements.reflectionModalCancelBtn.addEventListener('click', closeReflectionModal);
    elements.reflectionModal.addEventListener('click', e => e.target === elements.reflectionModal && closeReflectionModal());

    elements.reflectionColorTags.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            activeColor = e.target.dataset.color;
            updateColorTags();
        }
    });

    elements.reflectionModalSaveBtn.addEventListener('click', async () => {
        const title = elements.reflectionTitleInput.value.trim();
        const content = elements.reflectionContentInput.value.trim();
        if (!title || !content) return;

        const reflectionData = {
            title,
            content,
            color: activeColor,
            imageUrl: activeReflectionImageUrl 
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

    elements.aiSummarizeReflectionsBtn.addEventListener('click', async () => {
        if (currentReflections.length < 2) {
            elements.aiSummaryContent.textContent = "You need at least two notes for a summary.";
            elements.aiSummaryModal.classList.remove('hidden');
            setTimeout(() => elements.aiSummaryModal.classList.add('active'), 10);
            return;
        }
        const notesToSummarize = currentReflections.slice(0, 3).map(n => `Title: ${n.title}\nContent: ${n.content}`).join('\n\n---\n\n');
        const systemPrompt = "You are an empathetic assistant. Summarize the user's reflection notes into one short, insightful, and emotional paragraph. Focus on the underlying feelings and themes.";
        const userQuery = `Here are my last few notes:\n${notesToSummarize}`;
        const apiKey = "AIzaSyAsi_DMNTRm648ZO_5iqMbr27XS-MYJjlU"; 
        // Updated model
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }};

        elements.aiSummaryContent.textContent = "Summarizing your thoughts...";
        elements.aiSummaryModal.classList.remove('hidden');
        setTimeout(() => elements.aiSummaryModal.classList.add('active'), 10);

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json();
            if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0].text) {
                throw new Error("Invalid API response structure");
            }
            elements.aiSummaryContent.textContent = result.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error("AI Summary failed:", error);
            elements.aiSummaryContent.textContent = "Sorry, I couldn't generate a summary right now.";
        }
    });

    elements.aiSummaryCloseBtn.addEventListener('click', () => {
        elements.aiSummaryModal.classList.remove('active');
        setTimeout(() => elements.aiSummaryModal.classList.add('hidden'), 300);
    });

    elements.editTodoModalSaveBtn.addEventListener('click', handleSaveTodo);
    elements.editTodoModalCancelBtn.addEventListener('click', closeEditTodoModal);
    elements.editTodoModal.addEventListener('click', e => e.target === elements.editTodoModal && closeEditTodoModal());

    const openImageLinkModal = () => {
        elements.imageLinkModal.classList.remove('hidden');
        setTimeout(() => elements.imageLinkModal.classList.add('active'), 10);
    };
    const closeImageLinkModal = () => {
        elements.imageLinkModal.classList.remove('active');
        setTimeout(() => elements.imageLinkModal.classList.add('hidden'), 300);
    };

    elements.addReflectionImageBtn.addEventListener('click', openImageLinkModal);
    elements.imageLinkCancelBtn.addEventListener('click', closeImageLinkModal);
    elements.imageLinkModal.addEventListener('click', e => e.target === elements.imageLinkModal && closeImageLinkModal());

    elements.imageLinkSaveBtn.addEventListener('click', () => {
        const url = elements.imageLinkInput.value.trim();
        if (url) {
            activeReflectionImageUrl = url;
            elements.reflectionImagePreview.src = url;
            elements.reflectionImagePreviewContainer.classList.remove('hidden');
        }
        closeImageLinkModal();
    });

    elements.aiGenerateRecipeBtn.addEventListener('click', async () => {
        const prompt = elements.aiRecipePrompt.value.trim();
        if (!prompt) return;

        elements.aiRecipeBtnText.textContent = 'Finding Recipes...';
        elements.aiRecipeLoader.classList.remove('hidden');
        elements.aiGenerateRecipeBtn.disabled = true;

        const systemPrompt = `You are a world-class, professional chef, like Gordon Ramsay, but you are also encouraging and helpful, not rude. A pregnant user is asking for recipe ideas. Provide three (3) distinct, healthy, and pregnancy-safe recipes based on their craving. For each recipe, provide a 'recipeName', a 'chefPersona' (e.g., 'Gordon Ramsay', 'Massimo Bottura', 'Clare Smyth'), and 'steps' as an array of strings. Your response MUST be ONLY a valid JSON object with a single key 'recipes' which is an array of these three recipe objects. Example: { "recipes": [ { "recipeName": "...", "chefPersona": "...", "steps": ["Step 1...", "Step 2..."] } ] }`;
        const userQuery = `My craving: "${prompt}"`;
        const apiKey = "AIzaSyAsi_DMNTRm648ZO_5iqMbr27XS-MYJjlU"; 
        // Updated model
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
        };

        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json();
             if (!result.candidates || !result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || !result.candidates[0].content.parts[0].text) {
                throw new Error("Invalid API response structure");
            }
            const data = JSON.parse(result.candidates[0].content.parts[0].text);
            renderAIRecipes(data.recipes);
        } catch (error) {
            console.error("AI Recipe generation failed:", error);
            elements.aiRecipeResultsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, I couldn't find recipes for that right now.</p>`;
        } finally {
            elements.aiRecipeBtnText.textContent = 'Find Recipes';
            elements.aiRecipeLoader.classList.add('hidden');
            elements.aiGenerateRecipeBtn.disabled = false;
        }
    });

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

    elements.editWishModalSaveBtn.addEventListener('click', handleSaveWish);
    elements.editWishModalCancelBtn.addEventListener('click', closeEditWishModal);
    elements.editWishModal.addEventListener('click', e => e.target === elements.editWishModal && closeEditWishModal());
    setupQuantityButtons(elements.editWishQuantityInput, elements.editWishQuantityMinusBtn, elements.editWishQuantityPlusBtn);
    elements.editWishCategory.addEventListener('change', () => { 
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

    elements.wishlistSearchInput.addEventListener('input', (e) => {
        currentWishlistSearchTerm = e.target.value;
        renderWishes(currentWishes, currentWishlistSearchTerm, currentWishlistSortBy);
    });

    elements.wishlistSortSelect.addEventListener('change', (e) => {
        currentWishlistSortBy = e.target.value;
        renderWishes(currentWishes, currentWishlistSearchTerm, currentWishlistSortBy);
    });

    if (elements.notificationClearAllBtn) {
        elements.notificationClearAllBtn.addEventListener('click', clearAllNotifications);
    }

    elements.calendarPrevBtn.addEventListener('click', () => changeMonth(-1));
    elements.calendarNextBtn.addEventListener('click', () => changeMonth(1));
}

/**
 * Handles clicks on a calendar day, finds the first to-do for that day,
 * opens the list, and scrolls to the item.
 * @param {string} isoDate - The date string (YYYY-MM-DD) of the clicked day.
 */
function handleCalendarDayClick(isoDate) {
    const allTasks = [...currentTodos, ...currentRecipeTodos];
    
    const firstTodo = allTasks.find(todo => todo.date === isoDate);
    if (!firstTodo) return;

    let collapsibleContent, toggleIcon;
    if (firstTodo.category === 'Recipes') {
        collapsibleContent = elements.collapsibleRecipeContent;
        toggleIcon = elements.recipeListToggleIcon;
    } else {
        collapsibleContent = elements.collapsibleTodoContent;
        toggleIcon = elements.todoListToggleIcon;
    }

    const todoElement = document.getElementById(`todo-item-${firstTodo.id}`);
    if (!todoElement || !collapsibleContent || !toggleIcon) return;

    if (collapsibleContent.classList.contains('hidden')) {
        collapsibleContent.classList.remove('hidden');
        toggleIcon.classList.add('rotate-180');
    }

    todoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    todoElement.classList.remove('todo-item-highlight');
    void todoElement.offsetWidth;
    todoElement.classList.add('todo-item-highlight');

    setTimeout(() => {
        todoElement.classList.remove('todo-item-highlight');
    }, 1500);
}


// === Helper & Action Functions (Original + Name Gen) ===

/**
 * Sets up listeners for a quantity input block (+ and - buttons).
 * @param {HTMLInputElement} inputElement - The number input element.
 * @param {HTMLButtonElement} minusBtn - The minus button.
 * @param {HTMLButtonElement} plusBtn - The plus button.
 */
function setupQuantityButtons(inputElement, minusBtn, plusBtn) {
    minusBtn.addEventListener('click', () => {
        let currentValue = parseInt(inputElement.value, 10);
        if (isNaN(currentValue)) currentValue = 1;
        if (currentValue > 1) {
            inputElement.value = currentValue - 1;
        }
    });

    plusBtn.addEventListener('click', () => {
        let currentValue = parseInt(inputElement.value, 10);
        if (isNaN(currentValue)) currentValue = 1;
        inputElement.value = currentValue + 1;
    });

    inputElement.addEventListener('change', () => {
        let currentValue = parseInt(inputElement.value, 10);
        if (isNaN(currentValue) || currentValue < 1) {
            inputElement.value = 1;
        }
    });
}

/**
 * Updates the 'purchasedCount' for a wish in Firestore.
 * @param {object} wish - The wish object.
 * @param {number} newCount - The new purchasedCount to set.
 */
async function handleUpdateWishPurchasedCount(wish, newCount) {
    if (!wishesRef) return;

    const quantity = wish.quantity || 1;
    const clampedCount = Math.max(0, Math.min(newCount, quantity));

    if (clampedCount === (wish.purchasedCount || 0)) return; 

    const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, wish.id);
    try {
        await updateDoc(wishDocRef, { purchasedCount: clampedCount });
    } catch (error) {
        console.error("Error updating purchased count:", error);
    }
}


function openEditTodoModal(todo) {
    activeTodoId = todo.id;
    elements.editTodoInput.value = todo.text;
    elements.editTodoDate.value = todo.date || '';
    elements.editTodoTime.value = todo.time || '';

   // === MODIFICATION START: Task 2 - Standard categories updated ===
   const standardCategories = ['Health', 'Baby', 'Home', 'Reminder', 'Appointment', 'Recipes'];
   // === MODIFICATION END: Task 2 - Standard categories updated ===
    if (standardCategories.includes(todo.category)) {
        elements.editTodoCategory.value = todo.category;
        elements.editCustomTodoCategoryInput.classList.add('hidden');
        elements.editCustomTodoCategoryInput.value = '';
    } else {
        elements.editTodoCategory.value = 'Custom';
        elements.editCustomTodoCategoryInput.classList.remove('hidden');
        elements.editCustomTodoCategoryInput.value = todo.category;
    }

    if (todo.category === 'Appointment') {
        elements.editAppointmentFields.classList.remove('hidden');
        const appt = todo.appointment || {};
        elements.editAppointmentFname.value = appt.fname || '';
        elements.editAppointmentLname.value = appt.lname || '';
        elements.editAppointmentAddress.value = appt.address || '';
        elements.editAppointmentContact.value = appt.contact || '';
        elements.editAppointmentEmail.value = appt.email || '';

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

    elements.editTodoModal.classList.remove('hidden');
    setTimeout(() => elements.editTodoModal.classList.add('active'), 10);
}

function closeEditTodoModal() {
    elements.editTodoModal.classList.remove('active');
    setTimeout(() => elements.editTodoModal.classList.add('hidden'), 300);
}

async function handleSaveTodo() {
    if (!activeTodoId) return;

    const text = elements.editTodoInput.value.trim();
    let category = elements.editTodoCategory.value;
    if (category === 'Custom') {
        category = elements.editCustomTodoCategoryInput.value.trim();
    }

    if (!text || !category) {
        console.error('Task and category cannot be empty.');
        return;
    }

    const todoDocRef = doc(db, `users/${getCurrentUserId()}/todos`, activeTodoId);

    const todoData = {
        text: text,
        category: category,
        date: elements.editTodoDate.value,
        time: elements.editTodoTime.value,
        appointment: null 
    };

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
        elements.reflectionModalTitle.textContent = "Edit Reflection";
        elements.reflectionTitleInput.value = note.title;
        elements.reflectionContentInput.value = note.content;
        activeColor = note.color;
        if (note.imageUrl) {
            activeReflectionImageUrl = note.imageUrl;
            elements.reflectionImagePreview.src = note.imageUrl;
            elements.reflectionImagePreviewContainer.classList.remove('hidden');
            elements.imageLinkInput.value = note.imageUrl;
        } else {
            activeReflectionImageUrl = null;
            elements.reflectionImagePreviewContainer.classList.add('hidden');
            elements.reflectionImagePreview.src = '';
            elements.imageLinkInput.value = '';
        }
    } else {
        activeReflectionId = null;
        elements.reflectionModalTitle.textContent = "New Reflection";
        elements.reflectionTitleInput.value = '';
        elements.reflectionContentInput.value = '';
        activeColor = 'pink';
        activeReflectionImageUrl = null;
        elements.reflectionImagePreviewContainer.classList.add('hidden');
        elements.reflectionImagePreview.src = '';
        elements.imageLinkInput.value = ''; 
    }
    updateColorTags();
    elements.reflectionModal.classList.remove('hidden');
    setTimeout(() => elements.reflectionModal.classList.add('active'), 10);
}

function closeReflectionModal() {
    elements.reflectionModal.classList.remove('active');
    setTimeout(() => {
        elements.reflectionModal.classList.add('hidden');
        activeReflectionImageUrl = null;
        elements.reflectionImagePreviewContainer.classList.add('hidden');
        elements.reflectionImagePreview.src = '';
        elements.imageLinkInput.value = '';
    }, 300);
}

function openEditWishModal(wish) {
    activeWishId = wish.id;
    elements.editWishItem.value = wish.item;
    elements.editWishPrice.value = wish.price || '';
    elements.editWishLink.value = wish.link || '';
    elements.editWishQuantityInput.value = wish.quantity || 1; 

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
        activeWishId = null; 
    }, 300);
}

async function handleSaveWish() {
    if (!activeWishId || !wishesRef) return;

    const item = elements.editWishItem.value.trim();
    let category = elements.editWishCategory.value;
    if (category === 'Custom') {
        category = elements.editCustomCategoryInput.value.trim();
    }
    const newQuantity = parseInt(elements.editWishQuantityInput.value, 10) || 1; 

    if (!item || !category) {
        console.error('Item name and category cannot be empty.');
        return; 
    }

    const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, activeWishId);
    
    const currentWish = currentWishes.find(w => w.id === activeWishId);
    let currentPurchasedCount = currentWish.purchasedCount || 0;
    if (newQuantity < currentPurchasedCount) {
        currentPurchasedCount = newQuantity; 
    }

    const wishData = {
        item,
        category,
        price: elements.editWishPrice.value.trim(),
        link: elements.editWishLink.value.trim(),
        quantity: newQuantity, 
        purchasedCount: currentPurchasedCount, 
        foodDetails: null 
    };

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
    }
}

function updateColorTags() {
    elements.reflectionColorTags.querySelectorAll('button').forEach(btn => {
        if (btn.dataset.color === activeColor) {
            btn.classList.add('border-white');
        } else {
            btn.classList.remove('border-white');
        }
    });
}

function setupNameGeneratorListeners() {
    elements.nameGenderSelector.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            elements.nameGenderSelector.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            selectedNameGender = e.target.dataset.gender;
        }
    });

    elements.nameOriginSelect.addEventListener('change', () => {
        selectedNameOrigin = elements.nameOriginSelect.value;
        if (selectedNameOrigin === 'Custom') {
            elements.nameOriginCustom.classList.remove('hidden');
        } else {
            elements.nameOriginCustom.classList.add('hidden');
            elements.nameOriginCustom.value = ''; 
        }
    });

    elements.nameStyleSelect.addEventListener('change', () => {
        selectedNameStyle = elements.nameStyleSelect.value;
        if (selectedNameStyle === 'Custom') {
            elements.nameStyleCustom.classList.remove('hidden');
        } else {
            elements.nameStyleCustom.classList.add('hidden');
            elements.nameStyleCustom.value = ''; 
        }
    });

    elements.nameSyllableSelector.addEventListener('change', (e) => {
        if (e.target.type === 'radio' && e.target.checked) {
            selectedNameSyllables = e.target.value;
        }
    });

    elements.nameGenerateBtn.addEventListener('click', () => generateNames(false));

    elements.nameRandomBtn.addEventListener('click', () => generateNames(true));

    elements.nameGenerateAgainBtn.addEventListener('click', () => generateNames(false));

    elements.nameFavoritesToggleBtn.addEventListener('click', () => {
        elements.nameFavoritesContainer.classList.toggle('hidden');
    });

    elements.nameResultsContainer.addEventListener('click', async (e) => {
        const button = e.target.closest('.toggle-favorite-name-btn');
        if (button) {
            const name = button.dataset.name;
            const meaning = button.dataset.meaning;
            const origin = button.dataset.origin;
            await toggleFavoriteName({ name, meaning, origin });
        }
    });

    elements.nameFavoritesList.addEventListener('click', async (e) => {
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


/**
 * Calls the Gemini API to generate baby names based on current filters.
 * @param {boolean} isRandom - If true, ignores most filters for randomization.
 */
async function generateNames(isRandom = false) {
    if (!favoriteNamesRef) return; 

    elements.nameGenerateBtnText.textContent = 'Generating...';
    elements.nameGenerateLoader.classList.remove('hidden');
    elements.nameGenerateBtn.disabled = true;
    elements.nameRandomBtn.disabled = true;
    elements.nameGenerateAgainBtn.disabled = true;
    elements.nameResultsContainer.innerHTML = `<div class="text-center p-4">
        <svg class="animate-spin mx-auto h-6 w-6 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p class="mt-2 text-sm text-gray-300">Finding the perfect name...</p>
    </div>`;

    let userPromptParts = [];

    if (isRandom) {
        userPromptParts.push("Give me 10 random and interesting baby names.");
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
        let origin = selectedNameOrigin === 'Custom' ? elements.nameOriginCustom.value.trim() : selectedNameOrigin;
        if (origin) {
            userPromptParts.push(`With ${origin} origin/language.`);
        }
        let style = selectedNameStyle === 'Custom' ? elements.nameStyleCustom.value.trim() : selectedNameStyle;
        if (style) {
            userPromptParts.push(`The style should be ${style}.`);
        }
        let meaning = elements.nameMeaningInput.value.trim();
        if (meaning) {
            userPromptParts.push(`Reflecting the meaning or vibe of '${meaning}'.`);
        }
        if (selectedNameSyllables) {
            userPromptParts.push(`Should have ${selectedNameSyllables} syllables.`);
        }
    }

    const userQuery = userPromptParts.join(' ');
    const systemPrompt = `You are a creative and knowledgeable baby name assistant. Provide baby name suggestions based on the user's criteria. Include the name, its origin, and its meaning. Respond ONLY with a valid JSON array of objects. Each object must have "name" (string), "meaning" (string), and "origin" (string) keys.`;
    const apiKey = "AIzaSyAsi_DMNTRm648ZO_5iqMbr27XS-MYJjlU"; 
    // Updated model
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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
             currentNameSuggestions = namesData; 
             renderNameSuggestions(namesData);
        } else {
             throw new Error("Invalid response structure from API");
        }

    } catch (error) {
        console.error("AI Name generation failed:", error);
        elements.nameResultsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate names right now. Error: ${error.message}</p>`;
        currentNameSuggestions = []; 
    } finally {
        elements.nameGenerateBtnText.textContent = 'Generate Names';
        elements.nameGenerateLoader.classList.add('hidden');
        elements.nameGenerateBtn.disabled = false;
        elements.nameRandomBtn.disabled = false;
        elements.nameGenerateAgainBtn.disabled = false;
    }
}

/**
 * Renders the generated name suggestions in the results container.
 * @param {Array} names - Array of name objects ({name, meaning, origin}).
 */
function renderNameSuggestions(names) {
    elements.nameResultsContainer.innerHTML = ''; 

    if (!names || names.length === 0) {
        elements.nameResultsContainer.innerHTML = `<p class="text-center text-gray-400 p-2">No names found matching your criteria.</p>`;
        elements.nameGenerateAgainBtn.classList.add('hidden');
        return;
    }

    const favoriteNameSet = new Set(currentFavoriteNames.map(fav => fav.name.toLowerCase()));

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3'; 

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

    elements.nameResultsContainer.appendChild(grid);
    elements.nameGenerateAgainBtn.classList.remove('hidden'); 
}


/**
 * Adds or removes a name from the user's favorites in Firestore.
 * @param {object} nameData - Object containing {name, meaning, origin}.
 */
async function toggleFavoriteName(nameData) {
    if (!favoriteNamesRef || !nameData || !nameData.name) return;

    const lowerCaseName = nameData.name.toLowerCase();
    const nameDocRef = doc(favoriteNamesRef, lowerCaseName); 

    try {
        const isCurrentlyFavorite = currentFavoriteNames.some(fav => fav.id === lowerCaseName);

        if (isCurrentlyFavorite) {
            await deleteDoc(nameDocRef);
        } else {
            await setDoc(nameDocRef, {
                name: nameData.name, 
                meaning: nameData.meaning || '',
                origin: nameData.origin || '',
                addedAt: serverTimestamp()
            });
        }
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

    const allTodos = [...currentTodos, ...currentRecipeTodos];

    allTodos.forEach(todo => {
        if (todo.completed || !todo.date) {
            return;
        }

        try {
            const dueDate = new Date(todo.date + 'T00:00:00').getTime();
            const diffTime = dueDate - today;
            const diffDays = Math.round(diffTime / DAY_IN_MS);

            let message = '';
            let type = '';

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
                const notificationData = {
                    id: `todo-${todo.id}`,
                    title: todo.text.split('\n')[0], 
                    message: message,  
                    type: type,
                    daysLeft: diffDays,
                    details: {} 
                };

                if (todo.category === 'Appointment' && todo.appointment) {
                    notificationData.details.appointment = todo.appointment;
                    notificationData.details.time = todo.time;
                }
                
                notifications.push(notificationData);
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
        const quantity = wish.quantity || 1;
        const purchasedCount = wish.purchasedCount || 0;
        const isFullyPurchased = purchasedCount >= quantity;

        if (isFullyPurchased || wish.category !== 'Food' || !wish.foodDetails || !wish.foodDetails.expiry) {
            return;
        }

        try {
            const expiryDate = new Date(wish.foodDetails.expiry + 'T00:00:00').getTime();
            const diffTime = expiryDate - today;
            const diffDays = Math.round(diffTime / DAY_IN_MS);

            let message = '';
            let type = '';

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
                notifications.push({
                    id: `wish-${wish.id}`,
                    title: wish.item,
                    message: message,
                    type: type,
                    daysLeft: diffDays,
                    details: {
                        food: wish.foodDetails 
                    }
                });
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
}


// === Unloading ===

export function unloadJourney() {
    if (unsubscribeTodos) unsubscribeTodos();
    if (unsubscribeWishes) unsubscribeWishes();
    if (unsubscribeReflections) unsubscribeReflections();
    if (unsubscribeFavoriteNames) unsubscribeFavoriteNames(); 
}

// === Utility Functions ===
export function updateWellnessDataForJourney(newData) {
    wellnessDataForJourney = newData;
}

