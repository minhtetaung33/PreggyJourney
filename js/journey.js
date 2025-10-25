 import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
 import { db } from './firebase.js';
 import { getCurrentUserId } from "./auth.js";
 import { elements } from './ui.js'; // Import the elements object directly
 
 // --- REMOVED top-level const assignments for DOM elements ---
 // We will now use elements.elementName directly within functions.
 
 let todosRef, wishesRef, reflectionsRef;
 let unsubscribeTodos, unsubscribeWishes, unsubscribeReflections;
 let currentTodos = [], currentWishes = [], currentReflections = [];
 let wellnessDataForJourney = {};
 let activeReflectionId = null;
 let activeColor = 'pink';
 let activeTodoId = null;
 let showAllReflections = false;
 let activeReflectionImageUrl = null; // Variable to hold the image URL for the current reflection
 
 // --- Notification State ---
 let notificationPermissionGranted = Notification.permission === 'granted';
 const scheduledNotifications = {}; // Object to store timeout IDs: { todoId: timeoutId }
 
 // --- Update Notification Button UI ---
 function updateNotificationButtonUI() {
     // Use elements directly
     if (!elements.notificationPermissionArea || !elements.enableNotificationsBtn || !elements.notificationStatusText) return;
 
     if (!('Notification' in window)) {
         elements.notificationPermissionArea.innerHTML = '<p class="text-xs text-yellow-400">Browser notifications not supported.</p>';
         return;
     }
 
     if (Notification.permission === 'granted') {
         elements.enableNotificationsBtn.classList.add('hidden');
         elements.notificationStatusText.textContent = 'Reminders Enabled';
         elements.notificationStatusText.classList.remove('hidden', 'text-red-400');
         elements.notificationStatusText.classList.add('text-green-400');
         notificationPermissionGranted = true;
     } else if (Notification.permission === 'denied') {
         elements.enableNotificationsBtn.classList.add('hidden');
         elements.notificationStatusText.textContent = 'Reminders Blocked (Check Browser Settings)';
         elements.notificationStatusText.classList.remove('hidden', 'text-green-400');
         elements.notificationStatusText.classList.add('text-red-400');
         notificationPermissionGranted = false;
     } else {
         elements.enableNotificationsBtn.classList.remove('hidden');
         elements.notificationStatusText.classList.add('hidden');
         notificationPermissionGranted = false;
     }
 }
 
 // --- Request Notification Permission ---
 async function requestNotificationPermission() {
     if ('Notification' in window) {
         if (Notification.permission === 'granted') {
             notificationPermissionGranted = true;
             updateNotificationButtonUI();
             return true;
         } else if (Notification.permission !== 'denied') {
             const permission = await Notification.requestPermission();
             notificationPermissionGranted = permission === 'granted';
             updateNotificationButtonUI();
             return notificationPermissionGranted;
         }
     }
     notificationPermissionGranted = false;
     updateNotificationButtonUI();
     return false;
 }
 
 export function initializeJourney(userId, initialWellnessData) {
     wellnessDataForJourney = initialWellnessData;
     todosRef = collection(db, `users/${userId}/todos`);
     wishesRef = collection(db, `users/${userId}/wishes`);
     reflectionsRef = collection(db, `users/${userId}/reflections`);
 
     loadTodos();
     loadWishes();
     loadReflections();
     setupEventListeners();
     updateNotificationButtonUI();
 }
 
 export function updateWellnessDataForJourney(newData) {
     wellnessDataForJourney = newData;
 }
 
 const formatDate = (dateString) => {
     if (!dateString) return '';
     const dateParts = dateString.split('-');
     const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
     return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
 };
 
 const formatTime = (timeString) => {
     if (!timeString) return '';
     const [hours, minutes] = timeString.split(':');
     const date = new Date();
     date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
     return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
 };
 
 // --- Schedule Notification Function ---
 function scheduleNotification(todo) {
     if (!notificationPermissionGranted) {
         return;
     }
     if (!todo.date || !todo.time || todo.completed) {
         clearScheduledNotification(todo.id);
         return;
     }
     try {
         const reminderDateTimeStr = `${todo.date}T${todo.time}`;
         const reminderTime = new Date(reminderDateTimeStr).getTime();
         const now = Date.now();
         const delay = reminderTime - now;
 
         if (delay > 1000) {
             clearScheduledNotification(todo.id);
             console.log(`Scheduling notification for todo "${todo.text}" in ${Math.round(delay / 1000)} seconds.`);
             const timeoutId = setTimeout(() => {
                 console.log("Showing notification for:", todo.text);
                 if (Notification.permission === 'granted') {
                     new Notification('Pregnancy Planner Reminder:', {
                         body: todo.text,
                         icon: './assets/icons/icon-192x192.png'
                     });
                 }
                 delete scheduledNotifications[todo.id];
             }, delay);
             scheduledNotifications[todo.id] = timeoutId;
         } else {
              clearScheduledNotification(todo.id);
         }
     } catch (error) {
         console.error("Error scheduling notification for todo:", todo.id, error);
          clearScheduledNotification(todo.id);
     }
 }
 
 // --- Clear Scheduled Notification Function ---
 function clearScheduledNotification(todoId) {
     if (scheduledNotifications[todoId]) {
         console.log("Clearing scheduled notification for todo:", todoId);
         clearTimeout(scheduledNotifications[todoId]);
         delete scheduledNotifications[todoId];
     }
 }
 
 function renderTodos(todos) {
     // Use elements directly
     if (!elements.todoListContainer) {
         console.error("todoListContainer not found!"); // Add check
         return;
     }
     elements.todoListContainer.innerHTML = '';
     if (todos.length === 0) {
         elements.todoListContainer.innerHTML = `<p class="text-center text-gray-400">No tasks yet. Add one below!</p>`;
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
              const isNowCompleted = !todo.completed;
 
              const checkLabel = item.querySelector('.check-label');
              const parentDiv = item;
              if (isNowCompleted) {
                  checkLabel.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
                  parentDiv.classList.add('completed');
              } else {
                  checkLabel.innerHTML = '';
                  parentDiv.classList.remove('completed');
              }
 
              await updateDoc(todoDocRef, { completed: isNowCompleted });
 
              if (isNowCompleted) {
                 clearScheduledNotification(todo.id);
              } else {
                  const updatedTodoForScheduling = { ...todo, completed: false };
                  scheduleNotification(updatedTodoForScheduling);
              }
         };
 
         item.querySelector('label').addEventListener('click', (e) => {
             e.preventDefault();
             toggleTodo();
         });
 
         item.querySelector('.edit-todo-btn').addEventListener('click', () => openEditTodoModal(todo));
 
         item.querySelector('.delete-todo-btn').addEventListener('click', async () => {
             if (!todosRef) return;
             const todoDocRef = doc(db, `users/${getCurrentUserId()}/todos`, todo.id);
             clearScheduledNotification(todo.id);
             await deleteDoc(todoDocRef);
         });
 
         elements.todoListContainer.appendChild(item); // Use elements directly
     });
 }
 
 function renderWishes(wishes) {
     // Use elements directly
     if (!elements.wishlistContainer) {
         console.error("wishlistContainer not found!"); // Add check
         return;
     }
     elements.wishlistContainer.innerHTML = '';
 
     const sortedWishes = [...wishes].sort((a, b) => {
         if (a.purchased !== b.purchased) {
             return a.purchased - b.purchased;
         }
         const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
         const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
         return dateB - dateA;
     });
 
     if (sortedWishes.length === 0) {
         elements.wishlistContainer.innerHTML = `<p class="text-center text-gray-400">No wishes yet. Add one below!</p>`;
         elements.wishlistProgressText.textContent = `0/0 Items`;
         elements.wishlistProgressBar.style.width = '0%';
         return;
     }
 
     sortedWishes.forEach(wish => {
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
                 ${wish.link ? `<a href="${wish.link.startsWith('http') ? wish.link : 'https://'+wish.link}" target="_blank" class="text-blue-400 hover:underline">Store Link</a>` : ''}
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
         elements.wishlistContainer.appendChild(item); // Use elements directly
     });
 
     const purchasedCount = wishes.filter(w => w.purchased).length;
     elements.wishlistProgressText.textContent = `${purchasedCount}/${wishes.length} Items`; // Use elements directly
     elements.wishlistProgressBar.style.width = wishes.length > 0 ? `${(purchasedCount / wishes.length) * 100}%` : '0%'; // Use elements directly
 }
 
 
 function renderReflections(reflections) {
     // Use elements directly
     if (!elements.reflectionsContainer) {
         console.error("reflectionsContainer not found!"); // Add check
         return;
     }
     elements.reflectionsContainer.innerHTML = '';
     const notesToRender = showAllReflections ? reflections : reflections.slice(0, 3);
 
     if (reflections.length === 0) {
         elements.reflectionsContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full">No reflections yet. Add a new note to begin!</p>`;
         if (elements.toggleReflectionsContainer) elements.toggleReflectionsContainer.classList.add('hidden');
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
             <p class="text-xs text-gray-500 mt-3">${note.createdAt?.toDate ? new Date(note.createdAt.toDate()).toLocaleDateString() : 'Date unavailable'}</p>
             <button class="delete-reflection-btn icon-btn absolute top-1 right-1 opacity-50 hover:opacity-100 focus:opacity-100 transition-opacity">
                 <svg class="w-4 h-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
         `;
         item.addEventListener('click', () => openReflectionModal(note));
 
         item.querySelector('.delete-reflection-btn').addEventListener('click', (e) => {
             e.stopPropagation();
             deleteReflection(note.id);
         });
 
         elements.reflectionsContainer.appendChild(item); // Use elements directly
     });
 
     if (reflections.length > 3 && elements.toggleReflectionsContainer) {
         elements.toggleReflectionsContainer.classList.remove('hidden');
         elements.toggleReflectionsBtn.textContent = showAllReflections ? 'Show Less' : `Show All (${reflections.length})`;
     } else if (elements.toggleReflectionsContainer) {
         elements.toggleReflectionsContainer.classList.add('hidden');
     }
 }
 
 
 function renderAiWishSuggestions(suggestions) {
     const container = document.getElementById('ai-wish-suggestions-container'); // Keep getElementById here as it's specific to this function's context
     if (!container) return;
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
                 <p class="text-xs text-gray-400 mt-1">${suggestion.category} - ${suggestion.price ? `~\$${suggestion.price}` : 'Price not found'}</p>
                 ${suggestion.productUrl ? `<a href="${suggestion.productUrl.startsWith('http') ? suggestion.productUrl : 'https://'+suggestion.productUrl}" target="_blank" class="text-xs text-blue-400 hover:underline mt-1 inline-block">View Store Link</a>` : ''}
             </div>
             <button class="btn-secondary text-xs font-semibold py-1.5 px-3 rounded-md add-suggestion-btn flex-shrink-0 self-center">Add</button>
         `;
         card.querySelector('.add-suggestion-btn').addEventListener('click', () => {
             // Use elements directly
             elements.newWishItem.value = suggestion.productName;
             elements.newWishPrice.value = suggestion.price || '';
             elements.newWishLink.value = suggestion.productUrl || '';
 
             const categoryOption = Array.from(elements.newWishCategory.options).find(opt => opt.value === suggestion.category);
             if (categoryOption) {
                 elements.newWishCategory.value = suggestion.category;
                 elements.customCategoryInput.classList.add('hidden');
             } else {
                 elements.newWishCategory.value = 'Custom';
                 elements.customCategoryInput.classList.remove('hidden');
                 elements.customCategoryInput.value = suggestion.category;
             }
             elements.newWishItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
             elements.newWishItem.focus();
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
         currentTodos.forEach(todo => {
             scheduleNotification(todo);
         });
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
     // Check if elements exist before adding listeners
     if (elements.addTodoBtn) {
         elements.addTodoBtn.addEventListener('click', async () => {
             const text = elements.newTodoInput.value.trim();
             let category = elements.newTodoCategory.value;
             if (category === 'Custom') {
                 category = elements.customTodoCategoryInput.value.trim();
             }
 
             if (!text || !category || !todosRef) return;
 
             let hasPermission = notificationPermissionGranted;
             if (elements.newTodoDate.value && elements.newTodoTime.value && Notification.permission === 'default') {
                  hasPermission = await requestNotificationPermission();
             }
 
             const newTodoData = {
                 text,
                 category,
                 date: elements.newTodoDate.value,
                 time: elements.newTodoTime.value,
                 completed: false,
                 createdAt: serverTimestamp()
             };
 
             const docRef = await addDoc(todosRef, newTodoData);
 
             if (notificationPermissionGranted) { // Check updated status
                scheduleNotification({ id: docRef.id, ...newTodoData });
             }
 
             elements.newTodoInput.value = '';
             elements.newTodoDate.value = '';
             elements.newTodoTime.value = '';
             elements.newTodoCategory.value = 'Health';
             elements.customTodoCategoryInput.value = '';
             elements.customTodoCategoryInput.classList.add('hidden');
         });
     }
 
     if (elements.aiGenerateTodosBtn) {
         elements.aiGenerateTodosBtn.addEventListener('click', async () => {
             const startDate = wellnessDataForJourney?.pregnancyStartDate;
             if (!startDate) {
                 console.error("Pregnancy start date not available for AI generation.");
                 return; // Exit if start date isn't set
             }
             const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7)) || 1;
             const systemPrompt = `You are a helpful assistant. Generate a to-do list of 4-5 tasks for week ${pregnancyWeek} of pregnancy. Categorize each task as 'Health', 'Baby', 'Home', or 'Reminder'. Your response MUST be ONLY a valid JSON array of objects, where each object has "task" (string) and "category" (string) keys.`;
             const userQuery = `Generate a weekly to-do list for week ${pregnancyWeek}.`;
             const apiKey = "";
             const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
             const payload = { contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] }, generationConfig: { responseMimeType: "application/json" } };
             try {
                 const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                 if (!response.ok) throw new Error(`API error: ${response.statusText}`);
                 const result = await response.json();
                 const jsonString = result.candidates[0].content.parts[0].text;
                 const data = JSON.parse(jsonString);
                 for (const item of data) {
                     if (item.task && item.category && todosRef) {
                         await addDoc(todosRef, { text: item.task, category: item.category, completed: false, createdAt: serverTimestamp() });
                     }
                 }
             } catch (error) { console.error("AI To-do generation failed:", error); }
         });
     }
 
     if (elements.addWishBtn) {
         elements.addWishBtn.addEventListener('click', async () => {
             const item = elements.newWishItem.value.trim();
             let category = elements.newWishCategory.value;
             if (category === 'Custom') {
                 category = elements.customCategoryInput.value.trim();
             }
             if (!item || !wishesRef || !category) return;
 
             await addDoc(wishesRef, {
                 item,
                 category: category,
                 price: elements.newWishPrice.value.trim(),
                 link: elements.newWishLink.value.trim(),
                 purchased: false,
                 createdAt: serverTimestamp()
             });
             elements.newWishItem.value = elements.newWishPrice.value = elements.newWishLink.value = '';
             elements.customCategoryInput.value = '';
             elements.newWishCategory.value = 'Baby Care';
             elements.customCategoryInput.classList.add('hidden');
         });
     }
 
     if (elements.aiWishForm) {
         elements.aiWishForm.addEventListener('submit', async (e) => {
             e.preventDefault();
             const prompt = elements.aiWishPrompt.value.trim();
             if(!prompt) return;
 
             const suggestionsContainer = document.getElementById('ai-wish-suggestions-container'); // Keep local getElementById
             if (!suggestionsContainer) return;
             suggestionsContainer.innerHTML = `<div class="text-center p-4">...loading...</div>`; // Simplified loader
 
             const startDate = wellnessDataForJourney?.pregnancyStartDate;
              if (!startDate) {
                 console.error("Pregnancy start date not available for AI generation.");
                 suggestionsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Set pregnancy start date first.</p>`;
                 return;
             }
             const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7)) || 1;
             const systemPrompt = `You are a helpful shopping assistant...`; // Keep prompt brief for example
             const userQuery = `My request: "${prompt}". I am in week ${pregnancyWeek}...`;
             const apiKey = "";
             const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
             const payload = { /* ... payload ... */ };
             try {
                // ... fetch logic ...
                 renderAiWishSuggestions(data);
             } catch (error) {
                 console.error("AI Wishlist generation failed:", error);
                 suggestionsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate suggestions.</p>`;
             }
         });
     }
 
     if (elements.newWishCategory) {
         elements.newWishCategory.addEventListener('change', () => {
             if (elements.newWishCategory.value === 'Custom') {
                 elements.customCategoryInput.classList.remove('hidden');
             } else {
                 elements.customCategoryInput.classList.add('hidden');
             }
         });
     }
 
     if (elements.newTodoCategory) {
         elements.newTodoCategory.addEventListener('change', () => {
             if (elements.newTodoCategory.value === 'Custom') {
                 elements.customTodoCategoryInput.classList.remove('hidden');
             } else {
                 elements.customTodoCategoryInput.classList.add('hidden');
             }
         });
     }
 
     if (elements.editTodoCategory) {
         elements.editTodoCategory.addEventListener('change', () => {
             if (elements.editTodoCategory.value === 'Custom') {
                 elements.editCustomTodoCategoryInput.classList.remove('hidden');
             } else {
                 elements.editCustomTodoCategoryInput.classList.add('hidden');
             }
         });
     }
 
     // Add checks for collapsible elements and icons
     if (elements.wishlistHeader && elements.collapsibleWishlistContent && elements.wishlistToggleIcon) {
         elements.wishlistHeader.addEventListener('click', () => {
             elements.collapsibleWishlistContent.classList.toggle('hidden');
             elements.wishlistToggleIcon.classList.toggle('rotate-180');
         });
     }
 
     if (elements.todoHeader && elements.collapsibleTodoContent && elements.todoToggleIcon) {
         elements.todoHeader.addEventListener('click', () => {
             elements.collapsibleTodoContent.classList.toggle('hidden');
             elements.todoToggleIcon.classList.toggle('rotate-180');
         });
     }
 
     if (elements.reflectionHeader && elements.collapsibleReflectionContent && elements.reflectionToggleIcon) {
         elements.reflectionHeader.addEventListener('click', () => {
             elements.collapsibleReflectionContent.classList.toggle('hidden');
             elements.reflectionToggleIcon.classList.toggle('rotate-180');
         });
     }
 
     if (elements.toggleReflectionsBtn) {
         elements.toggleReflectionsBtn.addEventListener('click', () => {
             showAllReflections = !showAllReflections;
             renderReflections(currentReflections);
         });
     }
 
     // Reflection Modal Buttons (Add checks)
     if (elements.addReflectionBtn) elements.addReflectionBtn.addEventListener('click', () => openReflectionModal());
     if (elements.reflectionModalCancelBtn) elements.reflectionModalCancelBtn.addEventListener('click', closeReflectionModal);
     if (elements.reflectionModal) elements.reflectionModal.addEventListener('click', e => e.target === elements.reflectionModal && closeReflectionModal());
     if (elements.reflectionColorTags) {
         elements.reflectionColorTags.addEventListener('click', (e) => {
             if (e.target.tagName === 'BUTTON') {
                 activeColor = e.target.dataset.color;
                 updateColorTags();
             }
         });
     }
     if (elements.reflectionModalSaveBtn) {
         elements.reflectionModalSaveBtn.addEventListener('click', async () => {
             const title = elements.reflectionTitleInput.value.trim();
             const content = elements.reflectionContentInput.value.trim();
             if (!title || !content) return;
             const reflectionData = { title, content, color: activeColor, imageUrl: activeReflectionImageUrl };
             if (activeReflectionId) {
                 const noteDocRef = doc(db, `users/${getCurrentUserId()}/reflections`, activeReflectionId);
                 await updateDoc(noteDocRef, reflectionData);
             } else {
                 reflectionData.createdAt = serverTimestamp();
                 await addDoc(reflectionsRef, reflectionData);
             }
             closeReflectionModal();
         });
     }
 
     // AI Summary Modal Buttons (Add checks)
     if (elements.aiSummarizeReflectionsBtn) {
         elements.aiSummarizeReflectionsBtn.addEventListener('click', async () => {
            // ... AI Summary logic ...
         });
     }
     if (elements.aiSummaryCloseBtn) {
         elements.aiSummaryCloseBtn.addEventListener('click', () => {
             if(elements.aiSummaryModal) {
                 elements.aiSummaryModal.classList.remove('active');
                 setTimeout(() => elements.aiSummaryModal.classList.add('hidden'), 300);
             }
         });
     }
 
     // Edit Todo Modal Buttons (Add checks)
     if (elements.editTodoModalSaveBtn) elements.editTodoModalSaveBtn.addEventListener('click', handleSaveTodo);
     if (elements.editTodoModalCancelBtn) elements.editTodoModalCancelBtn.addEventListener('click', closeEditTodoModal);
     if (elements.editTodoModal) elements.editTodoModal.addEventListener('click', e => e.target === elements.editTodoModal && closeEditTodoModal());
 
     // Image Link Modal Buttons (Add checks)
     const openImageLinkModal = () => {
         if (elements.imageLinkModal) {
             elements.imageLinkModal.classList.remove('hidden');
             setTimeout(() => elements.imageLinkModal.classList.add('active'), 10);
         }
     };
     const closeImageLinkModal = () => {
         if (elements.imageLinkModal) {
             elements.imageLinkModal.classList.remove('active');
             setTimeout(() => elements.imageLinkModal.classList.add('hidden'), 300);
         }
     };
 
     if (elements.addReflectionImageBtn) elements.addReflectionImageBtn.addEventListener('click', openImageLinkModal);
     if (elements.imageLinkCancelBtn) elements.imageLinkCancelBtn.addEventListener('click', closeImageLinkModal);
     if (elements.imageLinkModal) elements.imageLinkModal.addEventListener('click', e => e.target === elements.imageLinkModal && closeImageLinkModal());
     if (elements.imageLinkSaveBtn) {
         elements.imageLinkSaveBtn.addEventListener('click', () => {
             const url = elements.imageLinkInput.value.trim();
             if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                 activeReflectionImageUrl = url;
                 elements.reflectionImagePreview.src = url;
                 elements.reflectionImagePreviewContainer.classList.remove('hidden');
             } else {
                 console.warn("Invalid image URL");
                 activeReflectionImageUrl = null;
                 elements.reflectionImagePreview.src = '';
                 elements.reflectionImagePreviewContainer.classList.add('hidden');
             }
             closeImageLinkModal();
         });
     }
 
     // --- Enable Notifications Button Listener ---
     if (elements.enableNotificationsBtn) {
         elements.enableNotificationsBtn.addEventListener('click', async () => {
             const granted = await requestNotificationPermission();
             if (granted) {
                 console.log("Notification permission granted by user action.");
                 currentTodos.forEach(todo => {
                     if (!todo.completed) {
                         scheduleNotification(todo);
                     }
                 });
             } else {
                  console.log("Notification permission denied or dismissed by user action.");
             }
         });
     }
 }
 
 function openEditTodoModal(todo) {
     activeTodoId = todo.id;
     // Use elements directly
     elements.editTodoInput.value = todo.text;
     elements.editTodoDate.value = todo.date || '';
     elements.editTodoTime.value = todo.time || '';
 
     const standardCategories = ['Health', 'Baby', 'Home', 'Reminder'];
     if (standardCategories.includes(todo.category)) {
         elements.editTodoCategory.value = todo.category;
         elements.editCustomTodoCategoryInput.classList.add('hidden');
         elements.editCustomTodoCategoryInput.value = '';
     } else {
         elements.editTodoCategory.value = 'Custom';
         elements.editCustomTodoCategoryInput.classList.remove('hidden');
         elements.editCustomTodoCategoryInput.value = todo.category;
     }
 
     elements.editTodoModal.classList.remove('hidden');
     setTimeout(() => elements.editTodoModal.classList.add('active'), 10);
 }
 
 function closeEditTodoModal() {
     // Use elements directly
     if (elements.editTodoModal) {
         elements.editTodoModal.classList.remove('active');
         setTimeout(() => elements.editTodoModal.classList.add('hidden'), 300);
     }
 }
 
 async function handleSaveTodo() {
     if (!activeTodoId) return;
 
     // Use elements directly
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
     const updatedData = {
         text: text,
         category: category,
         date: elements.editTodoDate.value,
         time: elements.editTodoTime.value
     };
     await updateDoc(todoDocRef, updatedData);
 
     const updatedTodoSnap = await getDoc(todoDocRef);
     if (updatedTodoSnap.exists()) {
         const updatedTodoFullData = { id: activeTodoId, ...updatedTodoSnap.data() };
          if (updatedTodoFullData.date && updatedTodoFullData.time && !updatedTodoFullData.completed && Notification.permission === 'default') {
             await requestNotificationPermission();
          }
         scheduleNotification(updatedTodoFullData);
     }
 
     closeEditTodoModal();
 }
 
 async function deleteReflection(noteId) {
     if (!reflectionsRef) return;
     const noteDocRef = doc(db, `users/${getCurrentUserId()}/reflections`, noteId);
     await deleteDoc(noteDocRef);
 }
 
 function openReflectionModal(note = null) {
     // Use elements directly
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
     // Use elements directly
     if (elements.reflectionModal) {
         elements.reflectionModal.classList.remove('active');
         setTimeout(() => {
             elements.reflectionModal.classList.add('hidden');
             activeReflectionImageUrl = null;
             elements.reflectionImagePreviewContainer.classList.add('hidden');
             elements.reflectionImagePreview.src = '';
             elements.imageLinkInput.value = '';
         }, 300);
     }
 }
 
 function updateColorTags() {
     // Use elements directly
     if (elements.reflectionColorTags) {
         elements.reflectionColorTags.querySelectorAll('button').forEach(btn => {
             if (btn.dataset.color === activeColor) {
                 btn.classList.add('border-white');
             } else {
                 btn.classList.remove('border-white');
             }
         });
     }
 }
 
 export function unloadJourney() {
     if (unsubscribeTodos) unsubscribeTodos();
     if (unsubscribeWishes) unsubscribeWishes();
     if (unsubscribeReflections) unsubscribeReflections();
     Object.keys(scheduledNotifications).forEach(todoId => {
         clearTimeout(scheduledNotifications[todoId]);
         delete scheduledNotifications[todoId];
     });
 }
