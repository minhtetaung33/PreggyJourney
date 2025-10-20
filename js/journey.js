import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentUserId } from "./auth.js";

// DOM Elements
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


let todosRef, wishesRef, reflectionsRef;
let unsubscribeTodos, unsubscribeWishes, unsubscribeReflections;
let currentTodos = [], currentWishes = [], currentReflections = [];
let wellnessDataForJourney = {};
let activeReflectionId = null;
let activeColor = 'pink';
let activeTodoId = null;


export function initializeJourney(userId, initialWellnessData) {
    wellnessDataForJourney = initialWellnessData;
    todosRef = collection(db, `users/${userId}/todos`);
    wishesRef = collection(db, `users/${userId}/wishes`);
    reflectionsRef = collection(db, `users/${userId}/reflections`);

    loadTodos();
    loadWishes();
    loadReflections();
    setupEventListeners();
}

export function updateWellnessDataForJourney(newData) {
    wellnessDataForJourney = newData;
}

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
    const categoryIcons = { Health: '🧘‍♀️', Baby: '🍼', Home: '🏡', Reminder: '💬' };
    todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = `todo-item flex items-start justify-between p-3 bg-white/5 rounded-lg ${todo.completed ? 'completed' : ''}`;
        
        const displayDate = formatDate(todo.date);
        const displayTime = formatTime(todo.time);

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

function renderWishes(wishes) {
    wishlistContainer.innerHTML = '';
    if (wishes.length === 0) {
        wishlistContainer.innerHTML = `<p class="text-center text-gray-400">No wishes yet. Add one below!</p>`;
    }
    wishes.forEach(wish => {
        const item = document.createElement('div');
        item.className = `wish-item-card p-3 bg-white/5 rounded-lg border border-transparent ${wish.purchased ? 'purchased opacity-60' : ''}`;
        item.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <p class="font-bold break-words">${wish.item}</p>
                    <p class="text-xs text-indigo-300">${wish.category}</p>
                </div>
                <div class="flex items-center ml-2">
                    <input type="checkbox" class="h-5 w-5 rounded bg-white/20 text-teal-400 focus:ring-teal-500 border-gray-500 cursor-pointer" ${wish.purchased ? 'checked' : ''}>
                    <button class="icon-btn delete-wish-btn ml-1"><svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
            </div>
            <div class="flex justify-between items-center mt-2 text-sm">
                <span class="font-semibold text-teal-300">${wish.price ? `$${wish.price}`: ''}</span>
                ${wish.link ? `<a href="${wish.link}" target="_blank" class="text-blue-400 hover:underline">Store Link</a>` : ''}
            </div>
        `;
        item.querySelector('input[type="checkbox"]').addEventListener('change', async (e) => {
            const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, wish.id);
            await updateDoc(wishDocRef, { purchased: e.target.checked });
        });
        item.querySelector('.delete-wish-btn').addEventListener('click', async () => {
            const wishDocRef = doc(db, `users/${getCurrentUserId()}/wishes`, wish.id);
            await deleteDoc(wishDocRef);
        });
        wishlistContainer.appendChild(item);
    });
    
    const purchasedCount = wishes.filter(w => w.purchased).length;
    wishlistProgressText.textContent = `${purchasedCount}/${wishes.length} Items`;
    wishlistProgressBar.style.width = wishes.length > 0 ? `${(purchasedCount / wishes.length) * 100}%` : '0%';
}

function renderReflections(reflections) {
    reflectionsContainer.innerHTML = '';
     if (reflections.length === 0) {
        reflectionsContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full">No reflections yet. Add a new note to begin!</p>`;
        return;
    }
    reflections.forEach(note => {
        const item = document.createElement('div');
        item.className = `reflection-note relative p-4 rounded-lg border-l-4 note-color-${note.color} cursor-pointer`;
        item.innerHTML = `
            <h4 class="font-bold break-words pr-6">${note.title}</h4>
            <p class="text-xs text-gray-500 mt-3">${new Date(note.createdAt?.toDate()).toLocaleDateString()}</p>
            <button class="delete-reflection-btn icon-btn absolute top-1 right-1 opacity-50 hover:opacity-100 focus:opacity-100 transition-opacity">
                <svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;
        item.addEventListener('click', () => openReflectionModal(note));
        
        item.querySelector('.delete-reflection-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents the edit modal from opening when deleting
            deleteReflection(note.id);
        });

        reflectionsContainer.appendChild(item);
    });
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
            } else {
                newWishCategory.value = 'Custom';
                customCategoryInput.classList.remove('hidden');
                customCategoryInput.value = suggestion.category;
            }
            newWishItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newWishItem.focus();
        });
        container.appendChild(card);
    });
}

function loadTodos() {
    if (!todosRef) return;
    if(unsubscribeTodos) unsubscribeTodos();
    const q = query(todosRef, orderBy("createdAt", "desc"));
    unsubscribeTodos = onSnapshot(q, (snapshot) => {
        currentTodos = [];
        snapshot.forEach(doc => currentTodos.push({ id: doc.id, ...doc.data() }));
        renderTodos(currentTodos);
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

function setupEventListeners() {
    addTodoBtn.addEventListener('click', async () => {
        const text = newTodoInput.value.trim();
        let category = newTodoCategory.value;
        if (category === 'Custom') {
            category = customTodoCategoryInput.value.trim();
        }

        if (!text || !category || !todosRef) return;

        await addDoc(todosRef, {
            text,
            category,
            date: newTodoDate.value,
            time: newTodoTime.value,
            completed: false,
            createdAt: serverTimestamp()
        });
        newTodoInput.value = '';
        newTodoDate.value = '';
        newTodoTime.value = '';
        newTodoCategory.value = 'Health';
        customTodoCategoryInput.value = '';
        customTodoCategoryInput.classList.add('hidden');
    });

    aiGenerateTodosBtn.addEventListener('click', async () => {
        const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(wellnessDataForJourney.pregnancyStartDate)) / (1000 * 60 * 60 * 24 * 7));
        const systemPrompt = `You are a helpful assistant. Generate a to-do list of 4-5 tasks for week ${pregnancyWeek} of pregnancy. Categorize each task as 'Health', 'Baby', 'Home', or 'Reminder'. Your response MUST be ONLY a valid JSON array of objects, where each object has "task" (string) and "category" (string) keys.`;
        const userQuery = `Generate a weekly to-do list for week ${pregnancyWeek}.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
        try {
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) throw new Error(`API error: ${response.statusText}`);
            const result = await response.json(); const data = JSON.parse(result.candidates[0].content.parts[0].text);
            for (const item of data) {
                if (item.task && item.category && todosRef) {
                    await addDoc(todosRef, { text: item.task, category: item.category, completed: false, createdAt: serverTimestamp() });
                }
            }
        } catch (error) { console.error("AI To-do generation failed:", error); }
    });

    addWishBtn.addEventListener('click', async () => {
        const item = newWishItem.value.trim();
        let category = newWishCategory.value;
        if (category === 'Custom') {
            category = customCategoryInput.value.trim();
        }
        if (!item || !wishesRef || !category) return;
        
        await addDoc(wishesRef, {
            item,
            category: category,
            price: newWishPrice.value.trim(),
            link: newWishLink.value.trim(),
            purchased: false,
            createdAt: serverTimestamp()
        });
        newWishItem.value = newWishPrice.value = newWishLink.value = '';
        customCategoryInput.value = '';
        newWishCategory.value = 'Baby Care';
        customCategoryInput.classList.add('hidden');
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
        const systemPrompt = `You are a helpful shopping assistant for a pregnant woman. Based on the user's request and their pregnancy week (${pregnancyWeek}), use the Google Search tool to find 3-4 real, relevant products. For each item, you MUST extract the actual product name, a relevant category (from "Baby Care", "Nursery", "Hospital Bag", "Health", "Postpartum"), price, and a working URL to the product page. Your response MUST be ONLY a valid JSON array of objects, with no other text or formatting. Each object must have these keys: "productName", "category", "price", "productUrl".`;
        const userQuery = `My request: "${prompt}". I am in week ${pregnancyWeek} of pregnancy.`;
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
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
            jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
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
        } else {
            customCategoryInput.classList.add('hidden');
        }
    });

    newTodoCategory.addEventListener('change', () => {
        if (newTodoCategory.value === 'Custom') {
            customTodoCategoryInput.classList.remove('hidden');
        } else {
            customTodoCategoryInput.classList.add('hidden');
        }
    });

    editTodoCategory.addEventListener('change', () => {
        if (editTodoCategory.value === 'Custom') {
            editCustomTodoCategoryInput.classList.remove('hidden');
        } else {
            editCustomTodoCategoryInput.classList.add('hidden');
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

        if (activeReflectionId) {
            const noteDocRef = doc(db, `users/${getCurrentUserId()}/reflections`, activeReflectionId);
            await updateDoc(noteDocRef, { title, content, color: activeColor });
        } else {
            await addDoc(reflectionsRef, { title, content, color: activeColor, createdAt: serverTimestamp() });
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
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
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
}

function openEditTodoModal(todo) {
    activeTodoId = todo.id;
    editTodoInput.value = todo.text;
    editTodoDate.value = todo.date || '';
    editTodoTime.value = todo.time || '';

    const standardCategories = ['Health', 'Baby', 'Home', 'Reminder'];
    if (standardCategories.includes(todo.category)) {
        editTodoCategory.value = todo.category;
        editCustomTodoCategoryInput.classList.add('hidden');
        editCustomTodoCategoryInput.value = '';
    } else {
        editTodoCategory.value = 'Custom';
        editCustomTodoCategoryInput.classList.remove('hidden');
        editCustomTodoCategoryInput.value = todo.category;
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
    await updateDoc(todoDocRef, {
        text: text,
        category: category,
        date: editTodoDate.value,
        time: editTodoTime.value
    });
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
    } else {
        activeReflectionId = null;
        reflectionModalTitle.textContent = "New Reflection";
        reflectionTitleInput.value = '';
        reflectionContentInput.value = '';
        activeColor = 'pink';
    }
    updateColorTags();
    reflectionModal.classList.remove('hidden');
    setTimeout(() => reflectionModal.classList.add('active'), 10);
}

function closeReflectionModal() {
    reflectionModal.classList.remove('active');
    setTimeout(() => reflectionModal.classList.add('hidden'), 300);
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

export function unloadJourney() {
    if (unsubscribeTodos) unsubscribeTodos();
    if (unsubscribeWishes) unsubscribeWishes();
    if (unsubscribeReflections) unsubscribeReflections();
}
