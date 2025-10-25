 import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
 import { db } from './firebase.js';
 import { getCurrentUserId } from "./auth.js";
 import { elements } from './ui.js'; // Import elements from ui.js
 
 // DOM Elements (using elements object from ui.js)
 const todoListContainer = elements.todoListContainer; // Example, ensure all relevant elements are cached in ui.js
 const newTodoInput = elements.newTodoInput;
 const newTodoCategory = elements.newTodoCategory;
 const addTodoBtn = elements.addTodoBtn;
 const aiGenerateTodosBtn = elements.aiGenerateTodosBtn;
 const wishlistContainer = elements.wishlistContainer;
 const wishlistProgressText = elements.wishlistProgressText;
 const wishlistProgressBar = elements.wishlistProgressBar;
 const newWishItem = elements.newWishItem;
 const newWishCategory = elements.newWishCategory;
 const newWishPrice = elements.newWishPrice;
 const newWishLink = elements.newWishLink;
 const addWishBtn = elements.addWishBtn;
 const aiWishForm = elements.aiWishForm;
 const aiWishPrompt = elements.aiWishPrompt;
 const reflectionsContainer = elements.reflectionsContainer;
 const addReflectionBtn = elements.addReflectionBtn;
 const reflectionModal = elements.reflectionModal;
 const reflectionModalTitle = elements.reflectionModalTitle;
 const reflectionTitleInput = elements.reflectionTitleInput;
 const reflectionContentInput = elements.reflectionContentInput;
 const reflectionColorTags = elements.reflectionColorTags;
 const reflectionModalCancelBtn = elements.reflectionModalCancelBtn;
 const reflectionModalSaveBtn = elements.reflectionModalSaveBtn;
 const aiSummarizeReflectionsBtn = elements.aiSummarizeReflectionsBtn;
 const aiSummaryModal = elements.aiSummaryModal;
 const aiSummaryContent = elements.aiSummaryContent;
 const aiSummaryCloseBtn = elements.aiSummaryCloseBtn;
 const customCategoryInput = elements.customCategoryInput; // Wish custom category
 const todoHeader = elements.todoHeader;
 const collapsibleTodoContent = elements.collapsibleTodoContent;
 const todoToggleIcon = elements.todoToggleIcon;
 const wishlistHeader = elements.wishlistHeader;
 const collapsibleWishlistContent = elements.collapsibleWishlistContent;
 const wishlistToggleIcon = elements.wishlistToggleIcon;
 const newTodoDate = elements.newTodoDate;
 const newTodoTime = elements.newTodoTime;
 const customTodoCategoryInput = elements.customTodoCategoryInput; // Todo custom category
 const editTodoModal = elements.editTodoModal;
 const editTodoInput = elements.editTodoInput;
 const editTodoDate = elements.editTodoDate;
 const editTodoTime = elements.editTodoTime;
 const editTodoCategory = elements.editTodoCategory;
 const editCustomTodoCategoryInput = elements.editCustomTodoCategoryInput;
 const editTodoModalCancelBtn = elements.editTodoModalCancelBtn;
 const editTodoModalSaveBtn = elements.editTodoModalSaveBtn;
 const reflectionHeader = elements.reflectionHeader;
 const collapsibleReflectionContent = elements.collapsibleReflectionContent;
 const reflectionToggleIcon = elements.reflectionToggleIcon;
 const toggleReflectionsContainer = elements.toggleReflectionsContainer;
 const toggleReflectionsBtn = elements.toggleReflectionsBtn;
 
 // New DOM Elements for Reflection Image Feature
 const addReflectionImageBtn = elements.addReflectionImageBtn;
 const imageLinkModal = elements.imageLinkModal;
 const imageLinkInput = elements.imageLinkInput;
 const imageLinkCancelBtn = elements.imageLinkCancelBtn;
 const imageLinkSaveBtn = elements.imageLinkSaveBtn;
 const reflectionImagePreviewContainer = elements.reflectionImagePreviewContainer;
 const reflectionImagePreview = elements.reflectionImagePreview;
 
 // --- NEW: Notification Elements (from ui.js) ---
 const notificationPermissionArea = elements.notificationPermissionArea;
 const enableNotificationsBtn = elements.enableNotificationsBtn;
 const notificationStatusText = elements.notificationStatusText;
 // --- End NEW ---
 
 
 let todosRef, wishesRef, reflectionsRef;
 let unsubscribeTodos, unsubscribeWishes, unsubscribeReflections;
 let currentTodos = [], currentWishes = [], currentReflections = [];
 let wellnessDataForJourney = {};
 let activeReflectionId = null;
 let activeColor = 'pink';
 let activeTodoId = null;
 let showAllReflections = false;
 let activeReflectionImageUrl = null; // Variable to hold the image URL for the current reflection
 
 // --- NEW: Notification State ---
 let notificationPermissionGranted = Notification.permission === 'granted';
 const scheduledNotifications = {}; // Object to store timeout IDs: { todoId: timeoutId }
 // --- End NEW ---
 
 // --- NEW: Update Notification Button UI ---
 function updateNotificationButtonUI() {
     if (!notificationPermissionArea || !enableNotificationsBtn || !notificationStatusText) return;
 
     // Check if Notifications are supported first
     if (!('Notification' in window)) {
         notificationPermissionArea.innerHTML = '<p class="text-xs text-yellow-400">Browser notifications not supported.</p>';
         return;
     }
 
     if (Notification.permission === 'granted') {
         enableNotificationsBtn.classList.add('hidden');
         notificationStatusText.textContent = 'Reminders Enabled';
         notificationStatusText.classList.remove('hidden', 'text-red-400');
         notificationStatusText.classList.add('text-green-400');
         notificationPermissionGranted = true;
     } else if (Notification.permission === 'denied') {
         enableNotificationsBtn.classList.add('hidden');
         notificationStatusText.textContent = 'Reminders Blocked (Check Browser Settings)';
         notificationStatusText.classList.remove('hidden', 'text-green-400');
         notificationStatusText.classList.add('text-red-400');
         notificationPermissionGranted = false;
     } else { // 'default' state (permission not yet asked or dismissed)
         enableNotificationsBtn.classList.remove('hidden');
         notificationStatusText.classList.add('hidden');
         notificationPermissionGranted = false;
     }
 }
 // --- End NEW ---
 
 // --- NEW: Request Notification Permission ---
 async function requestNotificationPermission() {
     if ('Notification' in window) {
         if (Notification.permission === 'granted') {
             notificationPermissionGranted = true;
             updateNotificationButtonUI(); // Ensure UI is correct
             return true;
         } else if (Notification.permission !== 'denied') {
             // Prompt the user for permission 
             const permission = await Notification.requestPermission();
             notificationPermissionGranted = permission === 'granted';
             updateNotificationButtonUI(); // Update UI after permission request
             return notificationPermissionGranted;
         }
     }
     // If denied or not supported, update UI accordingly
     notificationPermissionGranted = false;
     updateNotificationButtonUI();
     return false;
 }
 // --- End NEW ---
 
 export function initializeJourney(userId, initialWellnessData) {
     wellnessDataForJourney = initialWellnessData;
     todosRef = collection(db, `users/${userId}/todos`);
     wishesRef = collection(db, `users/${userId}/wishes`);
     reflectionsRef = collection(db, `users/${userId}/reflections`);
 
     loadTodos();
     loadWishes();
     loadReflections();
     setupEventListeners();
     updateNotificationButtonUI(); // Check initial state on load
 }
 
 export function updateWellnessDataForJourney(newData) {
     wellnessDataForJourney = newData;
 }
 
 const formatDate = (dateString) => {
     if (!dateString) return '';
     // Use UTC date to avoid timezone shifts affecting the displayed date
     const dateParts = dateString.split('-');
     const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
     return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
 };
 
 const formatTime = (timeString) => {
     if (!timeString) return '';
     // Create a dummy date and set time based on input
     const [hours, minutes] = timeString.split(':');
     const date = new Date();
     date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
     return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
 };
 
 // --- NEW: Schedule Notification Function ---
 function scheduleNotification(todo) {
     // Check if permission is granted first
     if (!notificationPermissionGranted) {
         // console.log("Notification permission not granted for todo:", todo.id);
         return;
     }
 
     // Ensure todo has both date and time and is not completed
     if (!todo.date || !todo.time || todo.completed) {
         clearScheduledNotification(todo.id); // Ensure no old notification persists if data is removed/completed
         return;
     }
 
     try {
         // Combine date and time into a string recognized by Date constructor
         const reminderDateTimeStr = `${todo.date}T${todo.time}`;
         const reminderTime = new Date(reminderDateTimeStr).getTime();
         const now = Date.now();
         const delay = reminderTime - now;
 
         // Check if the reminder time is in the future (add a small buffer like 1 sec to avoid immediate triggers)
         if (delay > 1000) {
             // Clear any existing notification for this todo before scheduling a new one
             clearScheduledNotification(todo.id);
 
             console.log(`Scheduling notification for todo "${todo.text}" in ${Math.round(delay / 1000)} seconds.`);
             const timeoutId = setTimeout(() => {
                 console.log("Showing notification for:", todo.text);
                 // Check permission again right before showing, in case it changed in browser settings
                 if (Notification.permission === 'granted') {
                     // Show the notification
                     new Notification('Pregnancy Planner Reminder:', {
                         body: todo.text,
                         icon: './assets/icons/icon-192x192.png' // Optional: Add an icon URL if you have one
                     });
                 }
                 // Remove from scheduled list after it fires (or attempts to fire)
                 delete scheduledNotifications[todo.id];
             }, delay);
 
             // Store the timeout ID so we can cancel it later if needed
             scheduledNotifications[todo.id] = timeoutId;
         } else {
              // If the calculated time is in the past or too close, clear any old notification ID
              clearScheduledNotification(todo.id);
         }
     } catch (error) {
         console.error("Error parsing date/time or scheduling notification for todo:", todo.id, error);
          // Clear any potentially invalid notification ID in case of error
          clearScheduledNotification(todo.id);
     }
 }
 // --- End NEW ---
 
 // --- NEW: Clear Scheduled Notification Function ---
 function clearScheduledNotification(todoId) {
     if (scheduledNotifications[todoId]) {
         console.log("Clearing scheduled notification for todo:", todoId);
         clearTimeout(scheduledNotifications[todoId]);
         delete scheduledNotifications[todoId]; // Remove from tracking object
     }
 }
 // --- End NEW ---
 
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
              const isNowCompleted = !todo.completed; // Calculate the target state
 
              // Optimistically update UI first
              const checkLabel = item.querySelector('.check-label');
              const parentDiv = item;
              if (isNowCompleted) {
                  checkLabel.innerHTML = '<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>';
                  parentDiv.classList.add('completed');
              } else {
                  checkLabel.innerHTML = '';
                  parentDiv.classList.remove('completed');
              }
 
              // Update Firestore
              await updateDoc(todoDocRef, { completed: isNowCompleted });
 
              // --- NEW: Update notification based on the *new* completion state ---
              if (isNowCompleted) {
                 clearScheduledNotification(todo.id);
              } else {
                  // Reschedule only if it's now marked as incomplete
                  // Create a temporary object with the updated state for scheduling
                  const updatedTodoForScheduling = { ...todo, completed: false };
                  scheduleNotification(updatedTodoForScheduling);
              }
              // --- End NEW ---
         };
 
         item.querySelector('label').addEventListener('click', (e) => {
             e.preventDefault(); // Prevent default label behavior that might interfere
             toggleTodo();
         });
 
         item.querySelector('.edit-todo-btn').addEventListener('click', () => openEditTodoModal(todo));
 
         item.querySelector('.delete-todo-btn').addEventListener('click', async () => {
             if (!todosRef) return;
             const todoDocRef = doc(db, `users/${getCurrentUserId()}/todos`, todo.id);
             // --- NEW: Clear notification *before* deleting ---
             clearScheduledNotification(todo.id);
             // --- End NEW ---
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
 
     const sortedWishes = [...wishes].sort((a, b) => {
         if (a.purchased !== b.purchased) {
             return a.purchased - b.purchased;
         }
         const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
         const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
         return dateB - dateA;
     });
 
     if (sortedWishes.length === 0) {
         wishlistContainer.innerHTML = `<p class="text-center text-gray-400">No wishes yet. Add one below!</p>`;
         wishlistProgressText.textContent = `0/0 Items`;
         wishlistProgressBar.style.width = '0%';
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
         wishlistContainer.appendChild(item);
     });
 
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
             newWishItem.value = suggestion.productName;
             newWishPrice.value = suggestion.price || '';
             newWishLink.value = suggestion.productUrl || '';
 
             const categoryOption = Array.from(newWishCategory.options).find(opt => opt.value === suggestion.category);
             if (categoryOption) {
                 newWishCategory.value = suggestion.category;
                 customCategoryInput.classList.add('hidden'); // Wish custom input
             } else {
                 newWishCategory.value = 'Custom';
                 customCategoryInput.classList.remove('hidden'); // Wish custom input
                 customCategoryInput.value = suggestion.category; // Wish custom input
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
         // --- Schedule notifications for loaded todos ---
         currentTodos.forEach(todo => {
             scheduleNotification(todo); // Handles completed/past checks internally
         });
         // --- End scheduling ---
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
             category = customTodoCategoryInput.value.trim(); // Todo custom input
         }
 
         if (!text || !category || !todosRef) return;
 
         // --- Request permission before adding if needed ---
         let hasPermission = notificationPermissionGranted; // Use current state
         // Only ask if date/time are set AND permission is 'default' (not yet granted/denied)
         if (newTodoDate.value && newTodoTime.value && Notification.permission === 'default') {
              hasPermission = await requestNotificationPermission();
         }
         // --- End permission request ---
 
         const newTodoData = {
             text,
             category,
             date: newTodoDate.value,
             time: newTodoTime.value,
             completed: false,
             createdAt: serverTimestamp()
         };
 
         const docRef = await addDoc(todosRef, newTodoData);
 
         // --- Schedule notification after adding ---
         // Use the *potentially updated* permission status
         if (notificationPermissionGranted) {
            scheduleNotification({ id: docRef.id, ...newTodoData });
         }
         // --- End scheduling ---
 
         newTodoInput.value = '';
         newTodoDate.value = '';
         newTodoTime.value = '';
         newTodoCategory.value = 'Health';
         customTodoCategoryInput.value = ''; // Todo custom input
         customTodoCategoryInput.classList.add('hidden'); // Todo custom input
     });
 
     aiGenerateTodosBtn.addEventListener('click', async () => {
         const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(wellnessDataForJourney.pregnancyStartDate)) / (1000 * 60 * 60 * 24 * 7)) || 1; // Default to 1
         const systemPrompt = `You are a helpful assistant. Generate a to-do list of 4-5 tasks for week ${pregnancyWeek} of pregnancy. Categorize each task as 'Health', 'Baby', 'Home', or 'Reminder'. Your response MUST be ONLY a valid JSON array of objects, where each object has "task" (string) and "category" (string) keys.`;
         const userQuery = `Generate a weekly to-do list for week ${pregnancyWeek}.`;
         const apiKey = ""; // Leave empty
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
 
     addWishBtn.addEventListener('click', async () => {
         const item = newWishItem.value.trim();
         let category = newWishCategory.value;
         if (category === 'Custom') {
             category = customCategoryInput.value.trim(); // Wish custom input
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
         customCategoryInput.value = ''; // Wish custom input
         newWishCategory.value = 'Baby Care';
         customCategoryInput.classList.add('hidden'); // Wish custom input
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
 
         const pregnancyWeek = Math.floor(Math.abs(new Date() - new Date(wellnessDataForJourney.pregnancyStartDate)) / (1000 * 60 * 60 * 24 * 7)) || 1;
         const systemPrompt = `You are a helpful shopping assistant for a pregnant woman. Based on the user's request and their pregnancy week (${pregnancyWeek}), use the Google Search tool to find 3-4 real, relevant products. For each item, you MUST extract the actual product name, a relevant category (from "Baby Care", "Nursery", "Hospital Bag", "Health", "Postpartum"), price (as a number or string, just the value), and a working URL to the product page. Your response MUST be ONLY a valid JSON array of objects, with no other text or formatting. Each object must have these keys: "productName", "category", "price", "productUrl".`;
         const userQuery = `My request: "${prompt}". I am in week ${pregnancyWeek} of pregnancy.`;
         const apiKey = "";
         const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
         const payload = {
             contents: [{ parts: [{ text: userQuery }] }],
             tools: [{ "google_search": {} }],
             systemInstruction: { parts: [{ text: systemPrompt }] },
             generationConfig: { responseMimeType: "application/json" }
         };
         try {
             const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
             if (!response.ok) throw new Error(`API error: ${response.statusText}`);
             const result = await response.json();
             let jsonString = result.candidates[0].content.parts[0].text;
             jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
             const data = JSON.parse(jsonString);
             renderAiWishSuggestions(data);
         } catch (error) {
             console.error("AI Wishlist generation failed:", error);
             suggestionsContainer.innerHTML = `<p class="text-center text-red-300 p-4">Sorry, couldn't generate suggestions right now.</p>`;
         }
     });
 
     newWishCategory.addEventListener('change', () => {
         // Wish custom input
         if (newWishCategory.value === 'Custom') {
             customCategoryInput.classList.remove('hidden');
         } else {
             customCategoryInput.classList.add('hidden');
         }
     });
 
     newTodoCategory.addEventListener('change', () => {
         // Todo custom input
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
         const apiKey = "";
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
 
     // --- Event Listeners for Image Link Modal ---
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
         // Basic URL validation (optional, but good practice)
         if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
             activeReflectionImageUrl = url;
             reflectionImagePreview.src = url;
             reflectionImagePreviewContainer.classList.remove('hidden');
         } else {
             // Handle invalid URL - maybe clear the image or show feedback
             console.warn("Invalid image URL provided");
             activeReflectionImageUrl = null;
             reflectionImagePreview.src = '';
             reflectionImagePreviewContainer.classList.add('hidden');
         }
         closeImageLinkModal();
     });
 
     // --- NEW: Event listener for Enable Notifications Button ---
     if (enableNotificationsBtn) {
         enableNotificationsBtn.addEventListener('click', async () => {
             const granted = await requestNotificationPermission();
             if (granted) {
                 console.log("Notification permission granted by user action.");
                 // Re-schedule notifications for existing todos now that permission is granted
                  currentTodos.forEach(todo => {
                     if (!todo.completed) { // Only schedule for incomplete tasks
                         scheduleNotification(todo);
                     }
                 });
             } else {
                  console.log("Notification permission denied or dismissed by user action.");
             }
         });
     }
     // --- End NEW ---
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
     const updatedData = {
         text: text,
         category: category,
         date: editTodoDate.value,
         time: editTodoTime.value
         // NOTE: We don't update 'completed' status here, toggleTodo handles that
     };
     await updateDoc(todoDocRef, updatedData);
 
     // --- Reschedule notification on edit ---
     // Fetch the *full* updated todo data (including completion status) to ensure accuracy
     const updatedTodoSnap = await getDoc(todoDocRef);
     if (updatedTodoSnap.exists()) {
         const updatedTodoFullData = { id: activeTodoId, ...updatedTodoSnap.data() };
          // Request permission again ONLY if date/time added AND permission is 'default'
          if (updatedTodoFullData.date && updatedTodoFullData.time && !updatedTodoFullData.completed && Notification.permission === 'default') {
             await requestNotificationPermission(); // Ask only if needed and not already denied
          }
         // Schedule (or clear if needed) based on the full, updated data
         scheduleNotification(updatedTodoFullData);
     }
     // --- End rescheduling ---
 
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
     // Clear any remaining scheduled notifications when unloading
     Object.keys(scheduledNotifications).forEach(todoId => {
         clearTimeout(scheduledNotifications[todoId]);
         delete scheduledNotifications[todoId];
     });
 }
