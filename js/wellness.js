import { doc, onSnapshot, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp, arrayUnion, arrayRemove, deleteField } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './firebase.js';
import { getCurrentMealPlan, getMealNutrients } from './meal-planner.js';
import { getCurrentUserId } from "./auth.js";

// DOM Elements
const symptomInput = document.getElementById('symptom-input');
const symptomCheckBtn = document.getElementById('symptom-check-btn');
const symptomBtnText = document.getElementById('symptom-btn-text');
const symptomLoader = document.getElementById('symptom-loader');
const symptomResponseEl = document.getElementById('symptom-response');
const hydrationProgress = document.getElementById('hydration-progress');
const hydrationText = document.getElementById('hydration-text');
const hydrationPlusBtn = document.getElementById('hydration-plus');
const hydrationMinusBtn = document.getElementById('hydration-minus');
const babyGrowthSnapshotEl = document.getElementById('baby-growth-snapshot');
const moodLogButtons = document.getElementById('mood-log-buttons');
const energyLogButtons = document.getElementById('energy-log-buttons');
const babyGrowthCard = document.getElementById('baby-growth-card');
const startDateModal = document.getElementById('start-date-modal');
const startDateInput = document.getElementById('start-date-input');
const endDateInput = document.getElementById('end-date-input');
const startDateModalCancelBtn = document.getElementById('start-date-modal-cancel-btn');
const startDateModalSaveBtn = document.getElementById('start-date-modal-save-btn');
const sleepMonitorCard = document.getElementById('sleep-monitor-card');
const sleepModal = document.getElementById('sleep-modal');
const sleepScheduleContainer = document.getElementById('sleep-schedule-container');
const sleepModalCancelBtn = document.getElementById('sleep-modal-cancel-btn');
const sleepModalSaveBtn = document.getElementById('sleep-modal-save-btn');
const manageSupplementsBtnHeader = document.getElementById('manage-supplements-btn-header');
const nutritionHistoryBtn = document.getElementById('nutrition-history-btn');
const nutritionHistoryModal = document.getElementById('nutrition-history-modal');
const nutritionHistoryContainer = document.getElementById('nutrition-history-container');
const nutritionHistoryCloseBtn = document.getElementById('nutrition-history-close-btn');
const nutritionHistoryWeekDisplay = document.getElementById('nutrition-history-week-display');
const nutritionHistoryPrevBtn = document.getElementById('nutrition-history-prev-week-btn');
const nutritionHistoryNextBtn = document.getElementById('nutrition-history-next-week-btn');
const manageSupplementsModal = document.getElementById('manage-supplements-modal');
const supplementListContainer = document.getElementById('supplement-list-container');
const newSupplementInput = document.getElementById('new-supplement-input');
const addSupplementBtn = document.getElementById('add-supplement-btn');
const addSupplementText = document.getElementById('add-supplement-text');
const supplementApiLoader = document.getElementById('supplement-api-loader');
const supplementApiFeedback = document.getElementById('supplement-api-feedback');
const manageSupplementsCloseBtn = document.getElementById('manage-supplements-close-btn');
const dailySupplementsList = document.getElementById('daily-supplements-list');

// Wellness History Navigation
const wellnessPrevWeekBtn = document.getElementById('wellness-prev-week-btn');
const wellnessNextWeekBtn = document.getElementById('wellness-next-week-btn');
const wellnessWeekDisplay = document.getElementById('wellness-week-display');

// Sleep Modal Navigation
const sleepPrevWeekBtn = document.getElementById('sleep-prev-week-btn');
const sleepNextWeekBtn = document.getElementById('sleep-next-week-btn');
const sleepWeekDisplay = document.getElementById('sleep-week-display');

// Edit Day Modal Elements
const editDayModal = document.getElementById('edit-day-modal');
const editDayModalTitle = document.getElementById('edit-day-modal-title');
const editMoodLogButtons = document.getElementById('edit-mood-log-buttons');
const editEnergyLogButtons = document.getElementById('edit-energy-log-buttons');
const editHydrationMinus = document.getElementById('edit-hydration-minus');
const editHydrationPlus = document.getElementById('edit-hydration-plus');
const editHydrationText = document.getElementById('edit-hydration-text');
const editDayModalCancelBtn = document.getElementById('edit-day-modal-cancel-btn');
const editDayModalSaveBtn = document.getElementById('edit-day-modal-save-btn');

// --- NEW DOM ELEMENTS FOR SNAPSHOT CARD ---
const snapshotContentEl = document.getElementById('snapshot-content');
const nextSnapshotBtn = document.getElementById('next-snapshot-btn');
// --- END NEW DOM ELEMENTS ---


let wellnessDataRef, symptomTrackerCollectionRef, userSupplementsRef, supplementNutrientsRef;
let unsubscribeWellnessData, unsubscribeUserSupplements, unsubscribeSupplementNutrients, unsubscribeSupplementLog, unsubscribeDailyWellness;
let wellnessData = {};
let dailyWellnessData = {}; // To store data from the 'daily' doc (e.g., pregnancy start date)
export let wellnessChart = null; // Export the chart instance
let userSupplements = [];
let supplementNutrients = {};
let nutritionHistoryCurrentDate = new Date();
let supplementLogDate = new Date();
let sleepModalCurrentDate = new Date();


// New state for wellness history
let wellnessHistoryCurrentDate = new Date();
let isHistoryView = false;
let selectedDayKey = 'monday'; // The day being shown in the dashboard (e.g., 'monday')
let editDayData = {}; // Temp storage for editing a day's data

// --- NEW STATE FOR SNAPSHOT CARD ---
let currentSnapshotWeek = -1;
let currentSnapshotIndex = 0;
const snapshotDisplayOrder = ['baby', 'tip', 'fact', 'partner']; // The 4 types of content to cycle through
// --- END NEW STATE ---


const defaultWellnessData = {
    pregnancyStartDate: '2025-08-01',
    pregnancyEndDate: '',
    dailyTip: "Stretch your legs for 5 minutes every hour to reduce swelling.",
    dailyNutrition: {},
    dailySupplements: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] },
    sleep: {
        monday: { sleep: '22:00', wake: '06:30' },
        tuesday: { sleep: '22:00', wake: '06:30' },
        wednesday: { sleep: '22:00', wake: '06:30' },
        thursday: { sleep: '22:00', wake: '06:30' },
        friday: { sleep: '22:30', wake: '07:00' },
        saturday: { sleep: '23:00', wake: '07:30' },
        sunday: { sleep: '22:30', wake: '07:30' }
    },
    weeklyLog: {
        monday: { mood: '🙂', energy: 3, waterIntake: 6 },
        tuesday: { mood: '😐', energy: 2, waterIntake: 5 },
        wednesday: { mood: '😐', energy: 2, waterIntake: 7 },
        thursday: { mood: '🙂', energy: 3, waterIntake: 8 },
        friday: { mood: '😊', energy: 4, waterIntake: 9 },
        saturday: { mood: '🥰', energy: 5, waterIntake: 10 },
        sunday: { mood: '😊', energy: 4, waterIntake: 8 }
    },
    waterGoal: 10,
};

const defaultMealPlan = {
    breakfast: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    lunch: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    snackAM: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    snackPM: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" },
    dinner: { monday: "", tuesday: "", wednesday: "", thursday: "", friday: "", saturday: "", sunday: "" }
};

// --- NEW EXPANDED 40-WEEK CONTENT ---

// 1. Baby Sizes (Weeks 1-40)
const babySizes = {
    1: "You're officially in week 1! It's the start of your cycle, so no baby yet, just hopeful planning!  planner 📅",
    2: "This is likely when conception happens! The journey is just beginning. ✨",
    3: "Your baby is a tiny ball of cells, called a blastocyst, smaller than a poppy seed. 🌱",
    4: "Your baby is the size of a **poppy seed**! They're now an embryo settling in for the long haul. 🌱",
    5: "Baby is the size of a **peppercorn**! They look more like a tiny tadpole than a person. 🌶️",
    6: "About the size of a **sweet pea**! A heartbeat might be detectable on ultrasound now. 💖",
    7: "Your little one is the size of a **blueberry**! They're busy growing tiny arm and leg buds. 🫐",
    8: "Baby is the size of a **raspberry**! They're constantly moving, though you can't feel it yet. 🍓",
    9: "The size of a **cherry**! Baby has tiny, distinct fingers and toes now. 🍒",
    10: "Your baby is a **strawberry**! They've graduated from embryo to fetus. 🎉",
    11: "Baby is the size of a **lime**! They're practicing swallowing and kicking. 🍈",
    12: "The size of a **plum**! Baby's reflexes are developing, and they can make a tiny fist. ✊",
    13: "Your baby is a **peach**! Welcome to the 2nd trimester! 🍑",
    14: "Baby is the size of a **lemon**! They can squint, frown, and even suck their thumb. 🍋",
    15: "About the size of an **apple**! Baby's skeleton is hardening, changing from soft cartilage to bone. 🍎",
    16: "Your baby is an **avocado**! You might start to feel those first magical flutters soon. 🥑",
    17: "The size of a **pear**! Baby's own fingerprints are forming. 🍐",
    18: "Baby is a **bell pepper**! They're getting good at yawning and hiccuping. 🫑",
    19: "About the size of a **mango**! A protective waxy coating (vernix) is forming on their skin. 🥭",
    20: "Your baby is a **banana**! You're halfway there! 🍌",
    21: "The size of a **large carrot**! You can *really* feel those kicks and jabs now. 🥕",
    22: "Baby is the size of a **papaya**! They can hear your voice and other sounds now.  papaya 🧡",
    23: "Your little one is a **grapefruit**! Their skin is still translucent, but that's changing fast.  grapefruit 🍊",
    24: "Baby is the size of an **ear of corn**! Their lungs are developing branches of the respiratory 'tree.' 🌽",
    25: "The size of an **acorn squash**! Baby's hair (if they have it) is growing and getting color. 🎃",
    26: "Your baby is a **zucchini**! They are practicing 'breathing' by inhaling and exhaling amniotic fluid. 🥒",
    27: "Baby is the size of a **head of cauliflower**! This marks the end of the 2nd trimester. 🥦",
    28: "The size of a **large eggplant**! Welcome to the 3rd trimester! Baby can blink their eyes. 🍆",
    29: "Your baby is a **butternut squash**! They are getting plumper and plumper every day. 💛",
    30: "About the size of a **cabbage**! Baby is gaining about half a pound per week from here on out. 🥬",
    31: "Baby is the size of a **coconut**! They're sleeping in cycles (just like a newborn). 🥥",
    32: "The size of a **bunch of kale**! Baby's fingernails are fully formed. 🥬",
    33: "Your baby is a **pineapple**! The bones in their skull aren't fused, which helps them fit through the birth canal. 🍍",
    34: "Baby is the size of a **cantaloupe**! Their little systems are almost all good to go. 🍈",
    35: "The size of a **honeydew melon**! Less room in there means you'll feel more wiggles and less 'kicks.' 🍈",
    36: "Your baby is a **head of romaine lettuce**! They're in the home stretch! 🥬",
    37: "Baby is the size of a **bunch of Swiss chard**! They are now considered 'early term.' 🌿",
    38: "The size of a **pumpkin**! Baby is shedding the lanugo (fine body hair) that kept them warm. 🎃",
    39: "Your baby is a **watermelon**! They're fully developed and just packing on the pounds. 🍉",
    40: "The size of a **small watermelon**! Baby is officially 'full term' and ready to meet you! 🍉🎉"
};

// 2. Wellness Tips (Weeks 1-40)
const wellnessTipsByWeek = {
    1: "You're in the planning phase! Focus on your health, eat well, and consider starting a prenatal vitamin. 💊",
    2: "It's all about timing! Listen to your body and try to de-stress. A relaxing bath or a good book can work wonders. 🛁",
    3: "Many don't even know they're pregnant yet! Keep taking that prenatal vitamin with folic acid. It's super important. 🧠",
    4: "You might be feeling... different. Tender breasts and fatigue are common. Listen to your body and rest! 😴",
    5: "Morning sickness alert! 🤢 Try keeping plain crackers by your bed and eating a few *before* you get up.",
    6: "Feeling exhausted? That's your body working overtime! Naps are your new best friend. 😴",
    7: "Stay hydrated! 💧 It's key for you and baby. If water is boring, try adding a slice of lemon or cucumber.",
    8: "Food aversions are real! 🤢 If you can't stand veggies, try a fruit smoothie. Find what works!",
    9: "Your sense of smell might be a superpower now. 👃 Avoid strong odors that trigger nausea. Fresh air is your friend!",
    10: "Feeling a bit better? Light exercise, like walking, is great for circulation and your mood. 🚶‍♀️",
    11: "Cravings kicking in? 🥒 pickles & 🍦 ice cream? Balance them with healthy options, but it's okay to indulge a little!",
    12: "You're nearing the end of the 1st trimester! Many early symptoms may start to ease up soon. You've got this! 💪",
    13: "Hello, 2nd trimester! Your energy might be returning. 🎉 Enjoy this 'honeymoon' phase!",
    14: "As your belly grows, comfy clothes are a must. Think stretchy waistbands and soft fabrics. ☁️",
    15: "Start sleeping on your side. 😴 A pillow between your knees or a full body pillow can be a lifesaver!",
    16: "Was that a gas bubble... or the baby?! 🤔 Those first 'flutters' are gentle. Pay close attention!",
    17: "Feeling a bit 'stuck'? Constipation is common. Up your fiber (fruits, veggies, whole grains) and water! 🍎💧",
    18: "Your appetite might be increasing. Focus on nutrient-dense snacks like yogurt, nuts, or hard-boiled eggs. 🥚",
    19: "Got backaches? 😫 Gentle stretches, a warm (not hot!) bath, and good posture can provide relief.",
    20: "You're halfway there! 🥳 Celebrate this milestone. Maybe a nice dinner or a relaxing pedicure?",
    21: "Those kicks are getting stronger! 💥 This is a great time to start 'kick counts' if your doctor recommends it.",
    22: "Baby can hear you! 🎶 Talk, sing, or read to your little one. It's a great way to bond.",
    23: "Feeling clumsy? Your center of gravity is shifting. Ditch the high heels for comfy, stable shoes. 👟",
    24: "Get tested for gestational diabetes. It's a routine test around this time and it's super important! 🥤",
    25: "Your hair might be looking amazing! 💇‍♀️ Pregnancy hormones can make it thicker and shinier.",
    26: "Brain fog is real! 🤯 Keep lists, set reminders, and don't be hard on yourself for forgetting your keys.",
    27: "You made it to the 3rd trimester (almost)! 🎊 Time to start thinking about your birth plan, if you want one.",
    28: "Welcome to the 3rd trimester! 💖 Baby's kicks might start to feel powerful. What a little acrobat!",
    29: "Heartburn patrol! 🔥 Try eating smaller, more frequent meals and avoid lying down right after eating.",
    30: "Nesting instinct kicking in? 🧹 Go for it! Organize those baby clothes, but don't overdo it. Ask for help!",
    31: "Feeling breathless? 😮 Your lungs are a bit crowded. Take it slow and practice good posture.",
    32: "Think about perineal massage. It can help reduce the risk of tearing during birth. Ask your doc about it! 🧘‍♀️",
    33: "Pack that hospital bag! 👜 Even if it feels early, it's great to have it ready. Don't forget snacks!",
    34: "Swollen feet? 🦶 Put them up! Elevating your legs can really help. And keep drinking that water.",
    35: "You might be feeling ALL the emotions. 😭🥰 It's okay! Your hormones are wild. Talk about it.",
    36: "Feeling 'lightning crotch'? ⚡️ That's just baby settling lower. It's a weird, but normal, part of the process.",
    37: "You are 'early term'! 🥳 Baby is almost ready. Do a final check of your car seat installation. 🚗",
    38: "Rest, rest, rest! 😴 Bank as much sleep as you can. You'll be glad you did. Binge-watch that show!",
    39: "Go for a walk! 🚶‍♀️ Gentle movement can help baby get into position (and help your sanity!).",
    40: "It's your due date! ⏰ Or maybe it passed. Don't stress! Most babies don't read the calendar. They'll come when they're ready."
};

// 3. Fun Facts (Weeks 1-40)
const funFactsByWeek = {
    1: "Did you know... 'Week 1' is retrospective? It's counted from the first day of your last period. 🤯",
    2: "Did you know... you're not *technically* pregnant yet? This is the week conception usually happens. 🤫",
    3: "Did you know... your baby's sex is determined at the moment of fertilization? 🧬",
    4: "Did you know... the amniotic sac, which will be baby's home for 9 months, is already forming? 🏠",
    5: "Did you know... baby's heart is starting to form and beat? It's just a tiny tube-like structure for now. ❤️",
    6: "Did you know... baby's circulatory system is the first one to be functional? They're building their own plumbing! 💧",
    7: "Did you know... baby is generating about 100 new brain cells every single minute? What a brainiac! 🧠",
    8: "Did you know... baby's taste buds are starting to form this week? They'll soon be tasting what you eat! 😋",
    9: "Did you know... those tiny webbed fingers and toes are now separating into individual digits? 🖐️",
    10: "Did you know... if you could poke your baby (don't!), they would squirm? They're developing reflexes! 🤸",
    11: "Did you know... baby is already practicing for their big debut? They're swallowing and kicking in there. 🦵",
    12: "Did you know... your baby is already making tiny (un-pee-like) pee? It's a sign their kidneys are working! 💦",
    13: "Did you know... your baby's unique fingerprints are starting to form on their tiny fingertips? 👆",
    14: "Did you know... baby can make facial expressions now, like frowning and squinting? 😠😑",
    15: "Did you know... baby's eyes can sense light? If you shine a flashlight on your belly, they might move away! 💡",
    16: "Did you know... your baby's nervous system is starting to function? They're making connections! ⚡",
    17: "Did you know... baby is growing a layer of 'brown fat'? This special fat will help keep them warm after birth. 🔥",
    18: "Did you know... your baby might be able to hear now? Their tiny inner ear bones are hardening. 🎧",
    19: "Did you know... baby girls are already developing all the eggs they'll ever have? That's millions! 🤯",
    20: "Did you know... you can likely find out the sex this week via ultrasound? (If you want to!) 💙💖",
    21: "Did you know... your baby's kicks are now coordinated? They're not just random twitches anymore! 🕺",
    22: "Did you know... baby's skin is covered in a fine, downy hair called lanugo? It's like a tiny peach fuzz. 🍑",
    23: "Did you know... baby's hearing is getting better? They can hear your heartbeat, your stomach gurgling, and your voice! 📣",
    24: "Did you know... baby's lungs are developing 'surfactant'? This substance helps them breathe air after birth. 🫁",
    25: "Did you know... your baby's nostrils are starting to open? They're getting ready to smell! 👃",
    26: "Did you know... baby's eyes are starting to open and blink? They're seeing... well, the inside of you! 👀",
    27: "Did you know... your baby might recognize your voice and your partner's? Talk to that belly! 🗣️",
    28: "Did you know... your baby can dream? Their brain activity shows cycles of REM sleep! 😴",
    29: "Did you know... baby is now smart enough to regulate their own body temperature? (With a lot of help from you!) 🌡️",
    30: "Did you know... your baby's bone marrow has taken over creating red blood cells? Such a big-kid move. 🩸",
    31: "Did you know... your baby can 'taste' strong flavors from your diet, like garlic or spice, in the amniotic fluid? 🌶️",
    32: "Did you know... baby is practicing for life on the outside? They're swallowing, 'breathing,' and sucking. 👶",
    33: "Did you know... baby's bones are hardening, but their skull bones remain soft and flexible for birth? Smart! 🧠",
    34: "Did you know... your baby's protective waxy coating (vernix) is getting thicker? It's nature's best moisturizer! 🧴",
    35: "Did you know... your baby's kidneys are fully developed and their liver is processing waste? ⚙️",
    36: "Did you know... baby is likely 'dropping' or 'engaging' into your pelvis now, getting ready for the big day? 👇",
    37: "Did you know... your baby is now considered 'early term'? They're just practicing their breathing and packing on fat. 🏋️",
    38: "Did you know... your baby's brain is still growing at an amazing rate? All those wrinkles (gyri) are forming! 🧠",
    39: "Did you know... your baby's immune system is getting a huge boost from you? They're stocking up on your antibodies! 🛡️",
    40: "Did you know... only about 5% of babies are born on their actual due date? Your baby is fashionably late (or early)! ⏰"
};

// 4. Partner Tips (Weeks 1-40)
const partnerTipsByWeek = {
    1: "This is a great week to talk about your shared goals and dreams. You're in this together from day one! 🤝",
    2: "This is a 'just be supportive' week. Keep stress low, maybe offer a nice foot rub. No pressure! 😊",
    3: "She might not know yet, but she's pregnant! A good time to be extra kind and helpful around the house. 🏡",
    4: "She might be taking a test this week! 🤞 Be there with her. Your reaction and support mean the world.",
    5: "She's probably feeling TIRED. 😴 Take on an extra chore or two without being asked. It's a huge help.",
    6: "Is she feeling nauseous? 🤢 Offer to make her toast or crackers. And maybe take over cooking dinner for a bit!",
    7: "Her new superpower: smell! 👃 Be mindful of strong scents like cologne, coffee, or certain foods.",
    8: "She might hate her favorite food and crave weird stuff. Don't judge! Just roll with it. 'Pickles and peanut butter? Got it!' 👍",
    9: "She's exhausted and hormonal. Reassure her that she's doing an amazing job. A simple 'You're incredible' goes a long way. ❤️",
    10: "Her body is changing. Tell her she's beautiful. Often. 🥰",
    11: "Offer to go for a light walk with her. It's good for her, and a great way for you two to connect. 🚶‍♂️🚶‍♀️",
    12: "Celebrate the end of the 1st trimester! 🎉 Maybe you can plan a small, relaxing 'babymoon'?",
    13: "Her energy might be back! This is a great time to tackle some 'pre-baby' projects together. 🎨",
    14: "Time to get comfy! ☁️ A comfy body pillow can be a total game-changer for her sleep. Best gift ever.",
    15: "She might be feeling a bit more like her old self. Plan a date night! (Even if it's just takeout and a movie). 🍿",
    16: "Ask her, 'Did you feel the baby today?' 😯 Show your excitement about those first flutters!",
    17: "Offer her water. All the time. 'Have you had water lately?' is a great love language right now. 💧",
    18: "Her back might be starting to ache. A gentle back rub = instant hero status. 🦸‍♂️",
    19: "She's halfway! 🥳 Tell her how proud you are of her. Acknowledge the hard work she's been doing.",
    20: "The anatomy scan! 📷 It's a big, emotional appointment. Be there to hold her hand and see your baby!",
    21: "Feel those kicks! 💥 Put your hand on her belly and be patient. It's one of the coolest ways to bond.",
    22: "Talk to the belly! 🗣️ Baby can hear you now. It might feel silly, but it's a real connection.",
    23: "Her feet might be sore. A foot rub is amazing. (Just be gentle and avoid pressure points near the ankle!) 🦶",
    24: "She's got her glucose test soon. 🥤 Be her support person. It's not a fun test, so be extra sweet.",
    25: "Research time! 🤓 Start looking into baby gear with her, like car seats and strollers. Show you're a team.",
    26: "She might be feeling anxious. 😟 Ask her what's on her mind. Just listening is the most important part.",
    27: "Tell her she's glowing. ✨ (Even if she says she feels like a whale. Especially then.)",
    28: "Hello, 3rd trimester! Help her get comfortable. More pillows! All the pillows! ☁️",
    29: "She might have 'nesting' energy. 🧹 Help her organize, but also remind her to rest. You do the heavy lifting!",
    30: "Start thinking about your route to the hospital. 🚗 Do a practice drive. It'll make you both feel more prepared.",
    31: "Reassure her. 💖 Fears about labor and delivery are normal. Let her know you'll be her rock.",
    32: "Pack your own hospital bag! 🎒 You'll need snacks, a phone charger, and a change of clothes, too.",
    33: "Talk about your birth plan. What are her wishes? How can you be her #1 advocate in the delivery room? 📣",
    34: "Help her with her shoes. 👟 Bending over is a major project now. Be her official shoe-putter-on-er.",
    35: "Just listen. 👂 She might need to vent about being tired, sore, and just... 'over it.' That's okay!",
    36: "The home stretch! 🏁 Install the car seat. Seriously, do it now. You'll thank yourselves later.",
    37: "Keep her comfortable. 😌 More back rubs. More foot rubs. All the rubs. And snacks. Always snacks.",
    38: "Rest with her. 😴 Binge that show, take a nap together. You're 'banking sleep' as a team.",
    39: "Keep your phone charged and on! 📱 Be ready for the call. This is not a 'silent mode' week!",
    40: "It's go time (or close)! ⏰ Stay calm, be encouraging, and tell her 'you can do this'—because she can."
};

// --- END NEW CONTENT ---

const sleepDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayTitles = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };
const moodToValue = {'😣': 1, '😐': 2, '🙂': 3, '😊': 4, '🥰': 5};

// --- HELPER FUNCTIONS ---
function formatList(items) {
    if (!items || items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(' and ');
    return items.slice(0, -1).join(', ') + ', and ' + items.slice(-1);
}

// --- DATE HELPER FUNCTIONS ---
function getWeekId(d) {
    d = new Date(d);
    d.setHours(0, 0, 0, 0); // Normalize time
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function formatWeekDisplay(d) {
    const monday = new Date(getWeekId(d) + 'T00:00:00Z');
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options = { month: 'short', day: 'numeric', timeZone: 'UTC' };
    const mondayStr = monday.toLocaleDateString('en-US', options);
    const sundayStr = sunday.toLocaleDateString('en-US', options);

    return `${mondayStr} - ${sundayStr}`;
}

export async function initializeWellness(userId, onWellnessDataUpdate) {
    symptomTrackerCollectionRef = collection(db, `users/${userId}/symptomLogs`);
    userSupplementsRef = doc(db, `users/${userId}/supplements`, 'list-v1');
    supplementNutrientsRef = doc(db, `users/${userId}/supplements`, 'nutrients-v1');
    const dailyWellnessRef = doc(db, `users/${userId}/wellness`, 'daily');

    // Listener for daily data like start date. Triggers a full reload on change.
    if (unsubscribeDailyWellness) unsubscribeDailyWellness();
    unsubscribeDailyWellness = onSnapshot(dailyWellnessRef, (docSnap) => {
        if (docSnap.exists()) {
            dailyWellnessData = docSnap.data();
            // Reload weekly data to merge the new daily data (like a changed start date).
            // This triggers the main onSnapshot and the full update chain.
            loadWellnessForDate(wellnessHistoryCurrentDate, onWellnessDataUpdate);
        } else {
            // If it doesn't exist, create it with the start date from the default object
            setDoc(dailyWellnessRef, { 
                pregnancyStartDate: defaultWellnessData.pregnancyStartDate, 
                pregnancyEndDate: defaultWellnessData.pregnancyEndDate 
            });
        }
    });

    await loadWellnessForDate(new Date(), onWellnessDataUpdate);
    await initializeSupplements();
    loadSupplements();
    setupEventListeners();
}

async function initializeWellnessData(docRef, onWellnessDataUpdate) {
    if (!docRef) return;
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, defaultWellnessData);
    }
}


async function initializeSupplements() {
    if (userSupplementsRef && supplementNutrientsRef) {
        const listSnap = await getDoc(userSupplementsRef);
        if (!listSnap.exists()) await setDoc(userSupplementsRef, { list: [] });
        const nutrientsSnap = await getDoc(supplementNutrientsRef);
        if (!nutrientsSnap.exists()) await setDoc(supplementNutrientsRef, {});
    }
}

async function loadWellnessForDate(date, onWellnessDataUpdate) {
    if (unsubscribeWellnessData) unsubscribeWellnessData();

    wellnessHistoryCurrentDate = date;
    const weekId = getWeekId(date);
    const currentWeekId = getWeekId(new Date());
    isHistoryView = (weekId !== currentWeekId);
    
    wellnessWeekDisplay.textContent = formatWeekDisplay(date);

    const userId = getCurrentUserId();
    wellnessDataRef = doc(db, `users/${userId}/wellness`, weekId);
    
    await initializeWellnessData(wellnessDataRef); // Ensure doc exists before listening

    unsubscribeWellnessData = onSnapshot(wellnessDataRef, (docSnap) => {
        const firestoreData = docSnap.exists() ? docSnap.data() : defaultWellnessData;
        
        // Merge daily data (like start date) with the weekly log data.
        wellnessData = { ...defaultWellnessData, ...dailyWellnessData, ...firestoreData };

        if (!isHistoryView) {
            const todayIndex = new Date().getDay();
            selectedDayKey = days[todayIndex === 0 ? 6 : todayIndex - 1];
        } else {
            selectedDayKey = 'monday'; // Default to Monday for past weeks
        }

        updateDashboardUI();
        if (wellnessChart) {
            updateWellnessChartData();
        }
        onWellnessDataUpdate(wellnessData);
    });
}

function loadSupplements() {
    if (userSupplementsRef) {
        if (unsubscribeUserSupplements) unsubscribeUserSupplements();
        unsubscribeUserSupplements = onSnapshot(userSupplementsRef, (docSnap) => {
            userSupplements = docSnap.exists() ? docSnap.data().list || [] : [];
            if (manageSupplementsModal.classList.contains('active')) populateSupplementList();
        });
    }
    if (supplementNutrientsRef) {
        if (unsubscribeSupplementNutrients) unsubscribeSupplementNutrients();
        unsubscribeSupplementNutrients = onSnapshot(supplementNutrientsRef, (docSnap) => {
            supplementNutrients = docSnap.exists() ? docSnap.data() : {};
             if (manageSupplementsModal.classList.contains('active')) populateSupplementList();
        });
    }
}

function setupEventListeners() {
    hydrationPlusBtn.addEventListener('click', async () => {
        if (hydrationPlusBtn.disabled) return;
        const dayData = wellnessData.weeklyLog[selectedDayKey] || {};
        const newIntake = (dayData.waterIntake || 0) + 1;
        if(newIntake <= wellnessData.waterGoal) {
            await updateDoc(wellnessDataRef, { [`weeklyLog.${selectedDayKey}.waterIntake`]: newIntake });
        }
    });

    hydrationMinusBtn.addEventListener('click', async () => {
        if (hydrationMinusBtn.disabled) return;
        const dayData = wellnessData.weeklyLog[selectedDayKey] || {};
        const newIntake = (dayData.waterIntake || 0) - 1;
        if(newIntake >= 0) {
            await updateDoc(wellnessDataRef, { [`weeklyLog.${selectedDayKey}.waterIntake`]: newIntake });
        }
    });
    
    // --- NEW EVENT LISTENER FOR SNAPSHOT CARD ---
    nextSnapshotBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop it from opening the "edit start date" modal
        
        // Cycle to the next tip
        currentSnapshotIndex = (currentSnapshotIndex + 1) % snapshotDisplayOrder.length;
        
        // Display the new tip
        displayCurrentSnapshot();
    });

    moodLogButtons.addEventListener('click', async (e) => {
        const button = e.target.closest('.mood-btn');
        if(!button || button.disabled) return;
        const newMoodEmoji = button.dataset.mood;
        await updateDoc(wellnessDataRef, { [`weeklyLog.${selectedDayKey}.mood`]: newMoodEmoji });
    });

    energyLogButtons.addEventListener('click', async (e) => {
        const button = e.target.closest('.energy-btn');
        if(!button || button.disabled) return;
        const newEnergyLevel = parseInt(button.dataset.energy);
        await updateDoc(wellnessDataRef, { [`weeklyLog.${selectedDayKey}.energy`]: newEnergyLevel });
    });

    symptomCheckBtn.addEventListener('click', handleSymptomCheck);
    babyGrowthCard.addEventListener('click', () => {
        startDateInput.value = wellnessData.pregnancyStartDate; endDateInput.value = wellnessData.pregnancyEndDate || '';
        startDateModal.classList.remove('hidden'); setTimeout(() => startDateModal.classList.add('active'), 10);
    });
    startDateModalCancelBtn.addEventListener('click', closeStartDateModal);
    startDateModal.addEventListener('click', (e) => e.target === startDateModal && closeStartDateModal());
    startDateModalSaveBtn.addEventListener('click', async () => {
        const newStartDate = startDateInput.value; let newEndDate = endDateInput.value;
        if (newStartDate) {
            if (!newEndDate) { const startDate = new Date(newStartDate); startDate.setDate(startDate.getDate() + (40 * 7)); newEndDate = startDate.toISOString().split('T')[0]; }
            
            // Save to the 'daily' document. The onSnapshot listener will handle the UI updates.
            const userDocRef = doc(db, `users/${getCurrentUserId()}/wellness`, 'daily'); 
            await setDoc(userDocRef, { pregnancyStartDate: newStartDate, pregnancyEndDate: newEndDate }, { merge: true });
        }
        closeStartDateModal();
    });
    sleepMonitorCard.addEventListener('click', () => {
        openSleepModal(wellnessHistoryCurrentDate);
    });
    sleepModalCancelBtn.addEventListener('click', closeSleepModal);
    sleepModal.addEventListener('click', (e) => e.target === sleepModal && closeSleepModal());
    sleepModalSaveBtn.addEventListener('click', async () => {
        const newSleepData = {};
        sleepDays.forEach(day => {
            const sleepInput = document.getElementById(`sleep-time-${day}`);
            const wakeInput = document.getElementById(`wake-time-${day}`);
            newSleepData[day] = { sleep: sleepInput.value, wake: wakeInput.value };
        });

        const weekId = getWeekId(sleepModalCurrentDate);
        const sleepDocRef = doc(db, `users/${getCurrentUserId()}/wellness`, weekId);
        await setDoc(sleepDocRef, { sleep: newSleepData }, { merge: true });
        
        closeSleepModal();
    });
    
    manageSupplementsBtnHeader.addEventListener('click', () => openSupplementModal(new Date()));
    nutritionHistoryBtn.addEventListener('click', openNutritionHistoryModal);
    nutritionHistoryCloseBtn.addEventListener('click', closeNutritionHistoryModal);
    nutritionHistoryModal.addEventListener('click', e => e.target === nutritionHistoryModal && closeNutritionHistoryModal());
    manageSupplementsCloseBtn.addEventListener('click', closeSupplementModal);
    manageSupplementsModal.addEventListener('click', e => e.target === manageSupplementsModal && closeSupplementModal());
    addSupplementBtn.addEventListener('click', handleAddSupplement);
    newSupplementInput.addEventListener('keyup', e => e.key === 'Enter' && handleAddSupplement());
    
    nutritionHistoryPrevBtn.addEventListener('click', () => {
        nutritionHistoryCurrentDate.setDate(nutritionHistoryCurrentDate.getDate() - 7);
        populateNutritionHistory(nutritionHistoryCurrentDate);
    });

    nutritionHistoryNextBtn.addEventListener('click', () => {
        nutritionHistoryCurrentDate.setDate(nutritionHistoryCurrentDate.getDate() + 7);
        populateNutritionHistory(nutritionHistoryCurrentDate);
    });
    
    wellnessPrevWeekBtn.addEventListener('click', () => {
        const newDate = new Date(wellnessHistoryCurrentDate);
        newDate.setDate(newDate.getDate() - 7);
        loadWellnessForDate(newDate, () => {});
    });

    wellnessNextWeekBtn.addEventListener('click', () => {
        const newDate = new Date(wellnessHistoryCurrentDate);
        newDate.setDate(newDate.getDate() + 7);
        loadWellnessForDate(newDate, () => {});
    });
    
    sleepPrevWeekBtn.addEventListener('click', () => {
        sleepModalCurrentDate.setDate(sleepModalCurrentDate.getDate() - 7);
        populateSleepModal(sleepModalCurrentDate);
    });

    sleepNextWeekBtn.addEventListener('click', () => {
        sleepModalCurrentDate.setDate(sleepModalCurrentDate.getDate() + 7);
        populateSleepModal(sleepModalCurrentDate);
    });

    // START: Fix for Edit Day Modal
    editDayModalCancelBtn.addEventListener('click', closeEditDayModal);
    editDayModal.addEventListener('click', e => e.target === editDayModal && closeEditDayModal());
    editDayModalSaveBtn.addEventListener('click', handleSaveEditDay);

    editMoodLogButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.mood-btn');
        if (button && editDayData) {
            editDayData.mood = button.dataset.mood;
            editMoodLogButtons.querySelectorAll('button').forEach(btn => btn.classList.toggle('selected', btn === button));
        }
    });

    editEnergyLogButtons.addEventListener('click', (e) => {
        const button = e.target.closest('.energy-btn');
        if (button && editDayData) {
            editDayData.energy = parseInt(button.dataset.energy, 10);
            editEnergyLogButtons.querySelectorAll('button').forEach(btn => btn.classList.toggle('selected', btn === button));
        }
    });

    editHydrationPlus.addEventListener('click', () => {
        if (editDayData && editDayData.waterIntake < wellnessData.waterGoal) {
            editDayData.waterIntake++;
            editHydrationText.textContent = editDayData.waterIntake;
        }
    });

    editHydrationMinus.addEventListener('click', () => {
        if (editDayData && editDayData.waterIntake > 0) {
            editDayData.waterIntake--;
            editHydrationText.textContent = editDayData.waterIntake;
        }
    });
    // END: Fix for Edit Day Modal
}

// --- NEW FUNCTION TO DISPLAY SNAPSHOT CONTENT ---
function displayCurrentSnapshot() {
    if (!snapshotContentEl) return;

    const today = new Date();
    const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
    if (isNaN(pregnancyStartDate.getTime())) {
        snapshotContentEl.textContent = "Set your pregnancy start date to see weekly tips!";
        return;
    }
    
    const diffTime = Math.abs(today - pregnancyStartDate);
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1; // +1 to make it 1-based

    // If the week has changed, reset the index to show baby size first
    if (diffWeeks !== currentSnapshotWeek) {
        currentSnapshotWeek = diffWeeks;
        currentSnapshotIndex = 0;
    }

    const key = snapshotDisplayOrder[currentSnapshotIndex];
    let content = "";
    let week = currentSnapshotWeek;

    // Handle being outside the 1-40 week range
    if (week < 1) week = 1;
    if (week > 40) week = 40;

    // Get the correct content from the right object
    switch (key) {
        case 'baby':
            content = babySizes[week] || babySizes[40];
            break;
        case 'tip':
            content = wellnessTipsByWeek[week] || wellnessTipsByWeek[40];
            break;
        case 'fact':
            content = funFactsByWeek[week] || funFactsByWeek[40];
            break;
        case 'partner':
            content = partnerTipsByWeek[week] || partnerTipsByWeek[40];
            break;
        default:
            content = babySizes[week] || babySizes[40];
    }
    
    // Fade out
    snapshotContentEl.style.opacity = 0;
    
    // Wait for fade out, then change content and fade in
    setTimeout(() => {
        snapshotContentEl.innerHTML = `<strong>Week ${currentSnapshotWeek}:</strong> ${content}`;
        snapshotContentEl.style.opacity = 1;
    }, 200); // 200ms matches the transition duration
}

export function updateDashboardUI() {
    if (!wellnessData || Object.keys(wellnessData).length === 0) return;
    
    const dayData = wellnessData.weeklyLog[selectedDayKey] || {};
    const mood = dayData.mood || '😐';
    const energy = dayData.energy || 3;
    const waterIntake = dayData.waterIntake || 0;

    updateDailySummary(mood, energy, waterIntake);
    updateHydrationCircle(waterIntake);
    updateNutritionTracker(); 
    updateSleepMonitor();
    updateMoodLog(mood);
    updateEnergyLog(energy);
    updateMoodAndEnergyInsight();
    updateDynamicContent(); // This function will now call displayCurrentSnapshot()
    
    // --- NEW LOGIC FOR DISABLING CONTROLS ---

    // 1. Get today's details
    const todayDate = new Date();
    const todayDayIndex = (todayDate.getDay() + 6) % 7; // Today's index (Mon=0...Sun=6)
    const todayKey = days[todayDayIndex];
    
    // 2. Check if we are viewing the current week
    const currentWeekId = getWeekId(todayDate);
    const chartWeekId = getWeekId(wellnessHistoryCurrentDate);
    const isCurrentWeek = currentWeekId === chartWeekId;

    // 3. We are allowed to edit the main controls ONLY if it's the current week AND the selected day is today.
    //    (selectedDayKey is set to today if isCurrentWeek is true)
    const canEditMainControls = isCurrentWeek && selectedDayKey === todayKey;

    // 4. Set the disabled status
    hydrationPlusBtn.disabled = !canEditMainControls;
    hydrationMinusBtn.disabled = !canEditMainControls;
    moodLogButtons.querySelectorAll('button').forEach(b => b.disabled = !canEditMainControls);
    energyLogButtons.querySelectorAll('button').forEach(b => b.disabled = !canEditMainControls);
}

function updateDailySummary(mood, energy, waterIntake) {
    const lastNightSleep = calculateLastNightSleep(); 
    const energyMap = { 1: { level: 'Very Low', color: 'text-red-400' }, 2: { level: 'Low', color: 'text-yellow-400' }, 3: { level: 'Moderate', color: 'text-green-400' }, 4: { level: 'Good', color: 'text-teal-400' }, 5: { level: 'High', color: 'text-purple-400' } };

    document.getElementById('summary-mood').textContent = mood;
    document.getElementById('summary-sleep').textContent = `${lastNightSleep.hours} hours`;
    document.getElementById('summary-water').textContent = `${waterIntake} / ${wellnessData.waterGoal} glasses`;
    const energySpan = document.getElementById('summary-energy');
    energySpan.textContent = energyMap[energy].level;
    energySpan.className = `font-semibold ${energyMap[energy].color}`;

    const summaryInsightEl = document.getElementById('summary-ai-insight');
    let summaryInsight = '';
    if (energy <= 2 && lastNightSleep.hours < 7) {
        summaryInsight = "It looks like a tough night's sleep is affecting your energy. Try to find a moment for a short rest today.";
    } else if (moodToValue[mood] >= 4 && energy >= 4) {
        summaryInsight = "Feeling good and energetic is a wonderful sign! Keep up the great self-care.";
    } else if (waterIntake < wellnessData.waterGoal / 2) {
        summaryInsight = "You're a bit behind on water. Keeping a water bottle nearby can be a good reminder to sip frequently.";
    } else {
        summaryInsight = "You're doing a great job balancing your wellness today. Keep listening to your body.";
    }
    if (summaryInsightEl) summaryInsightEl.textContent = summaryInsight;
}

function updateHydrationCircle(waterIntake) {
    const goal = wellnessData.waterGoal || 10;
    const circle = hydrationProgress;
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (waterIntake / goal) * circumference;
    circle.style.strokeDasharray = circumference; circle.style.strokeDashoffset = offset;
    hydrationText.innerHTML = `${waterIntake}<span class="text-sm">/${goal}</span>`;

    const hydrationInsightEl = document.getElementById('hydration-ai-insight');
    let hydrationInsight = '';
    const percentage = (waterIntake / goal) * 100;
    if (percentage >= 100) {
        hydrationInsight = "Excellent work! You've met your hydration goal for the day.";
    } else if (percentage >= 75) {
        hydrationInsight = "You're so close! Just a few more glasses to go.";
    } else if (percentage >= 50) {
        hydrationInsight = "You're halfway there. Keep sipping throughout the afternoon!";
    } else {
        hydrationInsight = "Don't forget to drink up! Consistent hydration is key.";
    }
    if(hydrationInsightEl) hydrationInsightEl.textContent = hydrationInsight;
}

function updateNutritionTracker() {
    updateDailySupplementsUI(selectedDayKey);

    const allMealNutrients = getMealNutrients();
    const currentMealPlanData = getCurrentMealPlan();
    
    const dailyGoals = { iron: 8, calcium: 10, folate: 10, fiber: 8 };
    const totals = { iron: 0, calcium: 0, folate: 0, fiber: 0 };
    
    if (currentMealPlanData) {
        for (const mealKey in currentMealPlanData) {
            if (currentMealPlanData[mealKey] && typeof currentMealPlanData[mealKey] === 'object') {
                const mealName = currentMealPlanData[mealKey][selectedDayKey];
                if (mealName && allMealNutrients[mealName]) {
                    const nutrients = allMealNutrients[mealName];
                    totals.iron += nutrients.iron || 0; totals.calcium += nutrients.calcium || 0; totals.folate += nutrients.folate || 0; totals.fiber += nutrients.fiber || 0;
                }
            }
        }
    }

    const daySupplements = wellnessData.dailySupplements[selectedDayKey] || [];
    daySupplements.forEach(suppName => {
        if (supplementNutrients[suppName]) {
            const nutrients = supplementNutrients[suppName];
            totals.iron += nutrients.iron || 0; totals.calcium += nutrients.calcium || 0; totals.folate += nutrients.folate || 0; totals.fiber += nutrients.fiber || 0;
        }
    });

    const nutritionData = { iron: calculateNutrientStatus(totals.iron, dailyGoals.iron), calcium: calculateNutrientStatus(totals.calcium, dailyGoals.calcium), folate: calculateNutrientStatus(totals.folate, dailyGoals.folate), fiber: calculateNutrientStatus(totals.fiber, dailyGoals.fiber) };
    updateNutritionUI(nutritionData);
}

function getStatusFromAI(statusString) {
    statusString = (statusString || 'low').toLowerCase();
     let status, color, bgColor, percentage;
    if (statusString === 'good') { status = 'Good'; color = 'text-green-400'; bgColor = 'bg-green-500'; percentage = 90; } 
    else if (statusString === 'okay') { status = 'Okay'; color = 'text-yellow-400'; bgColor = 'bg-yellow-500'; percentage = 60; } 
    else { status = 'Low'; color = 'text-red-400'; bgColor = 'bg-red-500'; percentage = 25; }
    return { status, percentage, color, bgColor };
}

function calculateNutrientStatus(total, goal) {
    const percentage = goal > 0 ? Math.min(Math.round((total / goal) * 100), 100) : 0;
    let status, color, bgColor;
    if (percentage >= 80) { status = 'Good'; color = 'text-green-400'; bgColor = 'bg-green-500'; } 
    else if (percentage >= 40) { status = 'Okay'; color = 'text-yellow-400'; bgColor = 'bg-yellow-500'; } 
    else { status = 'Low'; color = 'text-red-400'; bgColor = 'bg-red-500'; }
    return { status, percentage, color, bgColor };
}

function updateNutritionUI(nutrition) {
    Object.keys(nutrition).forEach(key => {
        const nutrient = nutrition[key];
        const container = document.getElementById(`nutrition-${key}`);
        if(container) {
            const statusEl = container.querySelector('.status-text');
            const progressEl = container.querySelector('.progress-bar');
            statusEl.textContent = nutrient.status;
            statusEl.className = `status-text font-semibold ${nutrient.color}`;
            progressEl.style.width = `${nutrient.percentage}%`;
            progressEl.className = `progress-bar h-1.5 rounded-full ${nutrient.bgColor}`;
        }
    });
    const lowNutrients = Object.keys(nutrition).filter(k => nutrition[k].status === 'Low');
    let insight = "Your nutrition looks balanced for today's plan.";
     if (lowNutrients.length > 0) {
        insight = `Today's plan seems a bit low in ${formatList(lowNutrients)}. Consider adding a snack rich in these nutrients.`
    } else {
        const goodNutrients = Object.keys(nutrition).filter(k => nutrition[k].status === 'Good');
        if (goodNutrients.length >= 3) {
            insight = `Great job with today's meal plan! It looks well-balanced in ${formatList(goodNutrients)}.`
        }
    }
    const insightEl = document.getElementById('nutrition-ai-insight');
    if(insightEl) insightEl.textContent = insight;
}

function calculateSleepDuration(sleepTimeStr, wakeTimeStr) {
    if (!sleepTimeStr || !wakeTimeStr) return 0;
    const [sleepH, sleepM] = sleepTimeStr.split(':').map(Number);
    const [wakeH, wakeM] = wakeTimeStr.split(':').map(Number);
    let sleepDate = new Date(); sleepDate.setHours(sleepH, sleepM, 0, 0);
    let wakeDate = new Date(); wakeDate.setHours(wakeH, wakeM, 0, 0);
    if (wakeDate < sleepDate) wakeDate.setDate(wakeDate.getDate() + 1);
    const durationMillis = wakeDate - sleepDate;
    const durationHours = durationMillis / (1000 * 60 * 60);
    return Math.round(durationHours * 10) / 10;
}

function calculateLastNightSleep() {
    const dayIndex = days.indexOf(selectedDayKey);
    const sleepDayIndex = dayIndex === 0 ? 6 : dayIndex - 1; 
    const sleepDayKey = days[sleepDayIndex];
    const { sleep, wake } = wellnessData.sleep[sleepDayKey] || { sleep: '', wake: '' };
    const hours = calculateSleepDuration(sleep, wake);
    return { hours };
}

function updateSleepMonitor() {
    const { hours } = calculateLastNightSleep();
    document.getElementById('sleep-hours').textContent = hours;
    let insight = "A consistent sleep schedule does wonders. Keep it up!";
    if (hours < 7) insight = `You slept less than 7 hours. Try relaxing tea or a warm bath before bed.`;
    else if (hours > 9) insight = `You got plenty of rest! Great job prioritizing sleep.`;
    document.getElementById('sleep-ai-insight').textContent = insight;
}

function updateMoodLog(mood) {
    const buttons = moodLogButtons.querySelectorAll('.mood-btn');
    buttons.forEach(btn => {
        if (btn.dataset.mood === mood) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
}

function updateEnergyLog(energy) {
    const buttons = energyLogButtons.querySelectorAll('.energy-btn');
    buttons.forEach(btn => {
        if (parseInt(btn.dataset.energy) === energy) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
}

function updateMoodAndEnergyInsight() {
    const dayData = wellnessData.weeklyLog[selectedDayKey] || {};
    const mood = dayData.mood || '😐';
    const energy = dayData.energy || 3;
    const moodValue = moodToValue[mood] || 3;

    const insightEl = document.getElementById('mood-ai-insight');
    let insight = '';

    if (energy <= 2 && moodValue <= 2) {
        insight = "Feeling low on energy and mood can be tough. Be extra gentle with yourself today.";
    } else if (energy >= 4 && moodValue >= 4) {
        insight = "It's a high-energy, positive day! Great to see you're feeling so well.";
    } else if (energy <= 2) {
        insight = "Energy levels seem low. Make sure you're eating enough and resting when needed.";
    } else if (moodValue <= 2) {
        insight = "If you're feeling down, a short walk or talking to someone you trust might help lift your spirits.";
    } else {
        insight = "A steady mood and energy level is a great sign of balance. Keep it up!";
    }
    
    if (insightEl) insightEl.textContent = insight;
}

async function handleSymptomCheck() {
    const symptomText = symptomInput.value.trim();
    if (!symptomText) return;
    symptomLoader.classList.remove('hidden'); symptomBtnText.textContent = 'Analyzing...'; symptomCheckBtn.disabled = true; symptomResponseEl.innerHTML = '';
    const systemPrompt = `You are a caring wellness assistant for pregnant women. Analyze the symptom, provide potential non-medical causes and gentle remedies. Crucially, always include a disclaimer to consult a doctor. Your response must be ONLY a valid JSON object matching this structure: { "possibleCauses": string[], "gentleRemedies": string[], "disclaimer": string }.`;
    const userQuery = `My symptom today: "${symptomText}"`;
    const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
    };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json(); const text = result.candidates[0].content.parts[0].text; const data = JSON.parse(text);
        displaySymptomResponse(data);
        if (symptomTrackerCollectionRef) await addDoc(symptomTrackerCollectionRef, { symptom: symptomText, aiResponse: data, createdAt: serverTimestamp() });
    } catch (error) {
        console.error("Symptom check API call failed:", error);
        symptomResponseEl.innerHTML = `<div class="p-3 rounded-md bg-red-500 bg-opacity-30 text-red-200">Sorry, something went wrong. Please try again.</div>`;
    } finally {
        symptomLoader.classList.add('hidden'); symptomBtnText.textContent = 'Get Suggestions'; symptomCheckBtn.disabled = false;
    }
}

function displaySymptomResponse(data) {
    let html = '<div class="space-y-4">';
    if (data.possibleCauses && data.possibleCauses.length > 0) {
        html += `<div><h4 class="font-semibold text-purple-300">Possible Causes:</h4><ul class="list-disc list-inside text-gray-300">`;
        data.possibleCauses.forEach(cause => { html += `<li>${cause}</li>`; });
        html += `</ul></div>`;
    }
    if (data.gentleRemedies && data.gentleRemedies.length > 0) {
        html += `<div><h4 class="font-semibold text-green-300">Gentle Suggestions:</h4><ul class="list-disc list-inside text-gray-300">`;
        data.gentleRemedies.forEach(remedy => { html += `<li>${remedy}</li>`; });
        html += `</ul></div>`;
    }
    if (data.disclaimer) {
        html += `<div class="p-3 mt-4 text-sm rounded-md bg-yellow-500 bg-opacity-20 text-yellow-200"><strong>Important:</strong> ${data.disclaimer}</div>`;
    }
    html += '</div>';
    symptomResponseEl.innerHTML = html;
}

export function updateWellnessChartData() {
    if (!wellnessChart || !wellnessData.weeklyLog) return;
    
    const energyData = days.map(day => (wellnessData.weeklyLog[day] || {}).energy || 0);
    const moodData = days.map(day => moodToValue[(wellnessData.weeklyLog[day] || {}).mood] || 0);
    const sleepData = days.map(day => {
        const dayIndex = days.indexOf(day);
        const sleepDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const sleepDayKey = days[sleepDayIndex];
        const { sleep, wake } = wellnessData.sleep[sleepDayKey] || {};
        return calculateSleepDuration(sleep, wake);
    });
    
    wellnessChart.data.datasets[0].data = energyData;
    wellnessChart.data.datasets[1].data = moodData;
    wellnessChart.data.datasets[2].data = sleepData;
    wellnessChart.update();

    updateWeeklyWellnessInsight(energyData, moodData, sleepData);
}

function updateWeeklyWellnessInsight(energyData, moodData, sleepData) {
    const insightEl = document.getElementById('chart-ai-insight');
    if (!insightEl) return;

    const validEnergy = energyData.filter(e => e > 0);
    const validMood = moodData.filter(m => m > 0);
    const validSleep = sleepData.filter(s => s > 0);

    if (validEnergy.length < 3 || validMood.length < 3) {
        insightEl.textContent = "Keep logging your mood and energy daily to see your weekly trends emerge!";
        return;
    }

    const avgEnergy = validEnergy.reduce((a, b) => a + b, 0) / validEnergy.length;
    const avgMood = validMood.reduce((a, b) => a + b, 0) / validMood.length;
    const avgSleep = validSleep.length > 0 ? validSleep.reduce((a, b) => a + b, 0) / validSleep.length : 0;

    let insight = '';

    const energyDipIndex = energyData.findIndex((e, i) => i > 0 && e < energyData[i-1] - 1);
    const moodDipIndex = moodData.findIndex((m, i) => i > 0 && m < moodData[i-1] - 1);

    if (avgEnergy < 2.5 && avgSleep > 0 && avgSleep < 7) {
        insight = "There seems to be a connection between lower sleep hours and your energy levels this week. Prioritizing rest might help.";
    } else if (energyDipIndex !== -1) {
        insight = `Your energy saw a dip around ${dayTitles[days[energyDipIndex]]}. Reflect on what might have happened that day.`;
    } else if (moodDipIndex !== -1) {
        insight = `It looks like you had a tougher day around ${dayTitles[days[moodDipIndex]]}. Remember that it's okay to have ups and downs.`;
    } else if (avgMood >= 4) {
        insight = "It's been a week of great moods! Whatever you're doing, it's working wonders.";
    } else if (avgEnergy > 3.5) {
        insight = "You've had a high-energy week. Fantastic job fueling your body and resting well!";
    } else {
        insight = "You've been consistent with your tracking. This weekly view is great for spotting patterns over time.";
    }
    
    insightEl.textContent = insight;
}


export function renderWellnessChart() {
    if (wellnessChart) {
        wellnessChart.destroy();
    }
    const canvas = document.getElementById('wellnessChart');
    const ctx = canvas.getContext('2d');
    
    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            { label: 'Energy (1-5)', data: [], borderColor: '#facc15', backgroundColor: '#facc1533', type: 'line', tension: 0.4, yAxisID: 'y' },
            { label: 'Mood (1-5)', data: [], borderColor: '#a78bfa', backgroundColor: '#a78bfa33', type: 'line', tension: 0.4, yAxisID: 'y' },
            { label: 'Sleep (hours)', data: [], borderColor: '#60a5fa', backgroundColor: '#60a5fa', type: 'bar', yAxisID: 'y1' }
        ]
    };
     wellnessChart = new Chart(ctx, {
        type: 'bar', data: data,
        options: {
            responsive: true, interaction: { mode: 'index', intersect: false },
            onClick: (e) => {
                // --- NEW onClick LOGIC ---
                const activePoints = wellnessChart.getElementsAtEventForMode(e, 'index', { intersect: true }, true);
                if (activePoints.length === 0) return;

                const dataIndex = activePoints[0].index; // Clicked day's index (Mon=0...Sun=6)
                
                // 1. Get today's details
                const todayDate = new Date();
                const todayDayIndex = (todayDate.getDay() + 6) % 7; // Today's index (Mon=0...Sun=6)
                
                // 2. Check if we are viewing the current week or a past week
                const currentWeekId = getWeekId(todayDate);
                const chartWeekId = getWeekId(wellnessHistoryCurrentDate);
                const isCurrentWeek = currentWeekId === chartWeekId;
                
                // 3. Determine if editing is allowed
                // Allow if:
                //    a) We are on a past week (!isCurrentWeek)
                //    b) We are on the current week AND the clicked day is *before* today
                const canEdit = !isCurrentWeek || (isCurrentWeek && dataIndex < todayDayIndex);
                
                if (canEdit) {
                    const dayKey = days[dataIndex];
                    openEditDayModal(dayKey);
                }
            },
            onHover: (event, chartElement) => {
                // --- NEW onHover LOGIC ---
                const canvas = wellnessChart.canvas;
                if (chartElement[0]) {
                    const dataIndex = chartElement[0].index; // Hovered day's index (Mon=0...Sun=6)
                    
                    const todayDate = new Date();
                    const todayDayIndex = (todayDate.getDay() + 6) % 7; // Today's index (Mon=0...Sun=6)
                    
                    const currentWeekId = getWeekId(todayDate);
                    const chartWeekId = getWeekId(wellnessHistoryCurrentDate);
                    const isCurrentWeek = currentWeekId === chartWeekId;
                    
                    // Allow pointer if:
                    //    a) We are on a past week (!isCurrentWeek)
                    //    b) We are on the current week AND the hovered day is *before* today
                    const canEdit = !isCurrentWeek || (isCurrentWeek && dataIndex < todayDayIndex);
                    
                    canvas.style.cursor = canEdit ? 'pointer' : 'default';
                } else {
                    canvas.style.cursor = 'default';
                }
            },
            scales: {
                x: { ticks: { color: '#9ca3af' }, grid: { color: '#ffffff1a'} },
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Energy / Mood', color: '#d1d5db' }, ticks: { color: '#d1d5db' }, grid: { color: '#ffffff1a' }, max: 5, min: 0 },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Sleep Hours', color: '#60a5fa' }, ticks: { color: '#60a5fa' }, grid: { drawOnChartArea: false } }
            },
            plugins: { legend: { labels: { color: '#d1d5db' } } }
        }
    });
    updateWellnessChartData();
}

function updateDynamicContent() {
    // This function is now simpler.
    // It just needs to trigger the display of the new snapshot card.
    // The date logic is now inside displayCurrentSnapshot().
    displayCurrentSnapshot();
    
    // --- OLD CODE TO REMOVE ---
    // if(!wellnessData.pregnancyStartDate) return;
    // const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
    // const today = new Date();
    // const diffTime = Math.abs(today - pregnancyStartDate);
    // const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    // const babySizes = { ... }; // This is now a global object
    // const size = babySizes[diffWeeks] || {fruit: 'a little miracle', emoji: '✨'};
    // babyGrowthSnapshotEl.innerHTML = `Week ${diffWeeks} — baby is the size of a ${size.fruit} ${size.emoji}`;
    // const wellnessTipEl = document.getElementById('wellness-tip');
    // const tip = wellnessTipsByWeek[diffWeeks] || "Stay hydrated and listen to your body's needs today.";
    // wellnessTipEl.textContent = tip;
}

function openSupplementModal(date = new Date()) {
    supplementLogDate = date;
    const dateString = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    manageSupplementsModal.querySelector('h3').textContent = `Log Supplements for ${dateString}`;

    populateSupplementList();
    manageSupplementsModal.classList.remove('hidden');
    setTimeout(() => manageSupplementsModal.classList.add('active'), 10);
}
function closeSupplementModal() {
    if (unsubscribeSupplementLog) unsubscribeSupplementLog();
    manageSupplementsModal.classList.remove('active');
    setTimeout(() => manageSupplementsModal.classList.add('hidden'), 300);
}

async function populateSupplementList() {
    supplementListContainer.innerHTML = `<p class="text-center text-gray-400">Loading supplements...</p>`;
    
    const weekId = getWeekId(supplementLogDate);
    const dayIndex = (supplementLogDate.getDay() + 6) % 7; 
    const dayKey = days[dayIndex];
    const userId = getCurrentUserId();
    const wellnessDocRefForLog = doc(db, `users/${userId}/wellness`, weekId);

    if (unsubscribeSupplementLog) unsubscribeSupplementLog();

    unsubscribeSupplementLog = onSnapshot(wellnessDocRefForLog, (docSnap) => {
        const wellnessDataForLog = docSnap.exists() ? docSnap.data() : defaultWellnessData;
        const loggedSupplements = wellnessDataForLog.dailySupplements[dayKey] || [];
        
        supplementListContainer.innerHTML = '';
        if (userSupplements.length === 0) {
            supplementListContainer.innerHTML = `<p class="text-center text-gray-400">No supplements added yet.</p>`;
            return;
        }

        userSupplements.forEach(supp => {
            const item = document.createElement('div');
            const isLogged = loggedSupplements.includes(supp);
            item.className = `flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer`;
            if (isLogged) {
                item.classList.add('bg-purple-500/20');
            }
            const nutrients = supplementNutrients[supp] || { iron: '?', calcium: '?', folate: '?' };

            item.innerHTML = `
                <div class="flex-1 pr-2">
                    <span class="font-semibold text-white">${supp}</span>
                    <div class="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs mt-1.5 text-gray-300">
                        <span>Iron: ${nutrients.iron}</span>
                        <span>Ca: ${nutrients.calcium}</span>
                        <span>Folate: ${nutrients.folate}</span>
                    </div>
                </div>
                <div class="flex items-center">
                    ${isLogged ? '<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : '<svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'}
                </div>`;
            item.addEventListener('click', () => toggleSupplementForDay(supp));
            supplementListContainer.appendChild(item);
        });
    });
}

async function toggleSupplementForDay(suppName) {
    const dayIndex = (supplementLogDate.getDay() + 6) % 7; 
    const dayKey = days[dayIndex];
    const weekId = getWeekId(supplementLogDate);
    const userId = getCurrentUserId();
    const wellnessDocRefForLog = doc(db, `users/${userId}/wellness`, weekId);

    const docSnap = await getDoc(wellnessDocRefForLog);
    const wellnessDataForLog = docSnap.exists() ? docSnap.data() : defaultWellnessData;
    const loggedSupplements = wellnessDataForLog.dailySupplements[dayKey] || [];

    const isLogged = loggedSupplements.includes(suppName);
    const updateOperation = isLogged ? arrayRemove(suppName) : arrayUnion(suppName);

    await setDoc(wellnessDocRefForLog, {
        dailySupplements: {
            [dayKey]: updateOperation
        }
    }, { merge: true });
}

function updateDailySupplementsUI(dayKey) {
    dailySupplementsList.innerHTML = '';
    const todaysSupplements = wellnessData.dailySupplements[dayKey] || [];
    if (todaysSupplements.length === 0) {
        dailySupplementsList.innerHTML = `<p class="text-xs text-gray-400 italic">No supplements logged for today.</p>`;
        return;
    }
    todaysSupplements.forEach(suppName => {
        const pill = document.createElement('div');
        pill.className = 'flex items-center bg-purple-500 bg-opacity-20 text-purple-200 text-xs font-semibold px-2.5 py-1 rounded-full';
        pill.innerHTML = `<span>${suppName}</span>
        <button class="ml-2 remove-supp-btn" data-supp="${suppName}">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
        </button>`;
        pill.querySelector('.remove-supp-btn').addEventListener('click', () => removeSupplementFromDay(suppName));
        dailySupplementsList.appendChild(pill);
    });
}

async function removeSupplementFromDay(suppName) {
     const todayIndex = new Date().getDay(); const dayKey = days[(todayIndex === 0 ? 6 : todayIndex - 1)];
     await updateDoc(wellnessDataRef, { [`dailySupplements.${dayKey}`]: arrayRemove(suppName) });
}

async function deleteSupplement(suppToDelete) {
    await updateDoc(userSupplementsRef, { list: arrayRemove(suppToDelete) });
    await updateDoc(supplementNutrientsRef, { [suppToDelete]: deleteField() });
}

async function handleAddSupplement() {
    const userSupp = newSupplementInput.value.trim(); if (!userSupp) return;
    supplementApiLoader.classList.remove('hidden'); addSupplementText.textContent = 'Checking...'; addSupplementBtn.disabled = true; supplementApiFeedback.classList.add('hidden');
    const systemPrompt = "You are a prenatal nutritionist. Evaluate if a supplement is generally safe for pregnancy. Provide an estimated nutritional profile (integers 0-3) for iron, calcium, and folate. Your response MUST be ONLY a valid JSON object matching this structure: { \"isSuitable\": boolean, \"supplementName\": string, \"reasoning\": string, \"nutrients\": { \"iron\": number, \"calcium\": number, \"folate\": number } }.";
    const userQuery = `Evaluate this supplement for pregnancy: "${userSupp}"`; const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI"; const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }], systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
    };
     try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json(); const text = result.candidates[0].content.parts[0].text; const data = JSON.parse(text);
        if (data.isSuitable) {
            if (!userSupplements.includes(data.supplementName)) {
                await updateDoc(userSupplementsRef, { list: arrayUnion(data.supplementName) });
                if (supplementNutrientsRef && data.nutrients) {
                    await updateDoc(supplementNutrientsRef, { [data.supplementName]: {...data.nutrients, fiber: 0} });
                }
                newSupplementInput.value = ''; showApiFeedback(`Success! "${data.supplementName}" was added.`, 'success', supplementApiFeedback);
            } else { showApiFeedback(`"${data.supplementName}" is already on the list.`, 'warning', supplementApiFeedback); }
        } else {
            showApiFeedback(`<strong>Caution:</strong><br>${data.reasoning}`, 'error', supplementApiFeedback);
        }
    } catch (error) { console.error("Gemini API call failed for supplement:", error); showApiFeedback("Sorry, I couldn't verify that right now.", 'error', supplementApiFeedback); } 
    finally { supplementApiLoader.classList.add('hidden'); addSupplementText.textContent = 'Check & Add Supplement'; addSupplementBtn.disabled = false; }
}

function openNutritionHistoryModal() {
    nutritionHistoryCurrentDate = new Date(); // Reset to current week
    populateNutritionHistory(nutritionHistoryCurrentDate);
    nutritionHistoryModal.classList.remove('hidden');
    setTimeout(() => nutritionHistoryModal.classList.add('active'), 10);
}

function closeNutritionHistoryModal() {
    nutritionHistoryModal.classList.remove('active');
    setTimeout(() => nutritionHistoryModal.classList.add('hidden'), 300);
}

async function populateNutritionHistory(date) {
    nutritionHistoryContainer.innerHTML = '<p class="text-center text-gray-400">Loading history...</p>';
    nutritionHistoryWeekDisplay.textContent = formatWeekDisplay(date);

    const weekId = getWeekId(date);
    const userId = getCurrentUserId();
    if (!userId) {
        nutritionHistoryContainer.innerHTML = '<p class="text-center text-red-400">Could not load data. User not found.</p>';
        return;
    }

    const weekMealPlanRef = doc(db, `users/${userId}/mealPlans`, weekId);
    const weekMealPlanSnap = await getDoc(weekMealPlanRef);
    const mealPlanForWeek = weekMealPlanSnap.exists() ? weekMealPlanSnap.data() : defaultMealPlan;

    const weekWellnessRef = doc(db, `users/${userId}/wellness`, weekId);
    const weekWellnessSnap = await getDoc(weekWellnessRef);
    const wellnessForWeek = weekWellnessSnap.exists() ? weekWellnessSnap.data() : defaultWellnessData;


    nutritionHistoryContainer.innerHTML = '';
    const allMealNutrients = getMealNutrients();
    const dailyGoals = { iron: 8, calcium: 10, folate: 10, fiber: 8 };

    days.forEach((dayKey, index) => {
        const dayTitle = dayTitles[dayKey];
        const totals = { iron: 0, calcium: 0, folate: 0, fiber: 0 };
        for (const mealKey in mealPlanForWeek) {
            if (mealPlanForWeek[mealKey] && typeof mealPlanForWeek[mealKey] === 'object') {
                const mealName = mealPlanForWeek[mealKey][dayKey];
                if (mealName && allMealNutrients[mealName]) {
                    const nutrients = allMealNutrients[mealName];
                    totals.iron += nutrients.iron || 0;
                    totals.calcium += nutrients.calcium || 0;
                    totals.folate += nutrients.folate || 0;
                    totals.fiber += nutrients.fiber || 0;
                }
            }
        }
        
        const daySupplements = wellnessForWeek.dailySupplements[dayKey] || [];
        daySupplements.forEach(suppName => {
            if (supplementNutrients[suppName]) {
                const nutrients = supplementNutrients[suppName];
                totals.iron += nutrients.iron || 0;
                totals.calcium += nutrients.calcium || 0;
                totals.folate += nutrients.folate || 0;
            }
        });
        
        const nutritionData = {
            iron: calculateNutrientStatus(totals.iron, dailyGoals.iron),
            calcium: calculateNutrientStatus(totals.calcium, dailyGoals.calcium),
            folate: calculateNutrientStatus(totals.folate, dailyGoals.folate),
            fiber: calculateNutrientStatus(totals.fiber, dailyGoals.fiber)
        };

        const item = document.createElement('div');
        item.className = 'p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors';
        item.innerHTML = `
            <h4 class="font-bold text-lg text-purple-300 mb-2">${dayTitle}</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                <div>Iron: <span class="font-semibold ${nutritionData.iron.color}">${nutritionData.iron.status} (${nutritionData.iron.percentage}%)</span></div>
                <div>Calcium: <span class="font-semibold ${nutritionData.calcium.color}">${nutritionData.calcium.status} (${nutritionData.calcium.percentage}%)</span></div>
                <div>Folate: <span class="font-semibold ${nutritionData.folate.color}">${nutritionData.folate.status} (${nutritionData.folate.percentage}%)</span></div>
                <div>Fiber: <span class="font-semibold ${nutritionData.fiber.color}">${nutritionData.fiber.status} (${nutritionData.fiber.percentage}%)</span></div>
            </div>
        `;
        const mondayOfRelevantWeek = new Date(getWeekId(date) + 'T00:00:00Z');
        const dayDate = new Date(mondayOfRelevantWeek);
        dayDate.setDate(mondayOfRelevantWeek.getDate() + index);

        item.addEventListener('click', () => openSupplementModal(dayDate));
        nutritionHistoryContainer.appendChild(item);
    });
}


function closeStartDateModal() { startDateModal.classList.remove('active'); setTimeout(() => startDateModal.classList.add('hidden'), 300); }

async function openSleepModal(date) {
    sleepModalCurrentDate = new Date(date);
    await populateSleepModal(sleepModalCurrentDate);
    sleepModal.classList.remove('hidden');
    setTimeout(() => sleepModal.classList.add('active'), 10);
}

async function populateSleepModal(date) {
    sleepWeekDisplay.textContent = formatWeekDisplay(date);
    const weekId = getWeekId(date);
    const sleepDocRef = doc(db, `users/${getCurrentUserId()}/wellness`, weekId);
    const docSnap = await getDoc(sleepDocRef);
    const sleepDataForWeek = docSnap.exists() ? (docSnap.data().sleep || defaultWellnessData.sleep) : defaultWellnessData.sleep;

    sleepScheduleContainer.innerHTML = '';
    const nightLabels = ["Sun/Mon", "Mon/Tue", "Tue/Wed", "Wed/Thu", "Thu/Fri", "Fri/Sat", "Sat/Sun"];
    
    sleepDays.forEach((day, index) => {
        const dayData = sleepDataForWeek[day] || { sleep: '', wake: '' };
        const item = document.createElement('div');
        item.className = 'grid grid-cols-3 items-center gap-2';
        item.innerHTML = `<label class="font-semibold capitalize">${nightLabels[index]}</label>
                          <input type="time" id="sleep-time-${day}" class="date-input" value="${dayData.sleep}">
                          <input type="time" id="wake-time-${day}" class="date-input" value="${dayData.wake}">`;
        sleepScheduleContainer.appendChild(item);
    });
}

function closeSleepModal() { sleepModal.classList.remove('active'); setTimeout(() => sleepModal.classList.add('hidden'), 300); }


async function fetchWithBackoff(url, payload, maxRetries = 5) {
    let delay = 1000; 
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                console.warn(`Rate limited. Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; 
                continue;
            }
            
            return response;
        } catch (error) {
            console.error('Fetch failed:', error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
    throw new Error('API request failed after multiple retries.');
}


export async function generateAllWellnessTips() {
    // Get references to all containers and loaders
    const partnerTipsContainer = document.getElementById('partner-tips-container');
    const partnerTipsLoader = document.getElementById('partner-tips-loader');
    const hydrationSnacksContainer = document.getElementById('hydration-snacks-container');
    const hydrationSnacksLoader = document.getElementById('hydration-snacks-loader');
    const partnerAvoidContainer = document.getElementById('partner-avoid-container');
    const partnerAvoidLoader = document.getElementById('partner-avoid-loader');
    const hydrationAvoidContainer = document.getElementById('hydration-avoid-container');
    const hydrationAvoidLoader = document.getElementById('hydration-avoid-loader');

    // Show loaders and clear previous content
    const allContainers = [partnerTipsContainer, hydrationSnacksContainer, partnerAvoidContainer, hydrationAvoidContainer];
    const allLoaders = [partnerTipsLoader, hydrationSnacksLoader, partnerAvoidLoader, hydrationAvoidLoader];
    
    allLoaders.forEach(loader => loader.style.display = 'block');
    allContainers.forEach(container => {
        container.innerHTML = '';
        const loader = container.nextElementSibling; // Assumes loader is the next sibling
        if(loader && loader.tagName === 'P') container.appendChild(loader);
    });

    try {
        if (!wellnessData.pregnancyStartDate) {
            throw new Error("Pregnancy start date is not set.");
        }

        // --- 1. Gather all context ---
        const pregnancyStartDate = new Date(wellnessData.pregnancyStartDate);
        const today = new Date();
        const diffTime = Math.abs(today - pregnancyStartDate);
        const pregnancyWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) || 5; // Default to 5 if calculation is 0
        const todayIndex = today.getDay();
        const dayKey = days[todayIndex === 0 ? 6 : todayIndex - 1];
        const currentMealPlanData = getCurrentMealPlan();
        const todaysMeals = {
            breakfast: currentMealPlanData?.breakfast?.[dayKey],
            lunch: currentMealPlanData?.lunch?.[dayKey],
            snackAM: currentMealPlanData?.snackAM?.[dayKey],
            snackPM: currentMealPlanData?.snackPM?.[dayKey],
            dinner: currentMealPlanData?.dinner?.[dayKey]
        };
        const mealPlanString = Object.entries(todaysMeals).map(([key, value]) => `${key}: ${value || 'Not set'}`).join(', ');
        const dayData = wellnessData.weeklyLog?.[dayKey] || {};
        const mood = dayData.mood || '😐';
        const energy = dayData.energy || 3;

        // --- 2. Construct the single, combined prompt ---
        const systemPrompt = `You are an expert prenatal wellness assistant. Your task is to generate four distinct sets of tips based on the user's data.
        Your response MUST be ONLY a valid JSON object with the following four keys: "partnerTips", "hydrationSnacks", "partnerAvoid", "hydrationAvoid".
        Each key must contain an array of 2-3 short, actionable string tips.
        - partnerTips: Supportive tips for the partner.
        - hydrationSnacks: Hydration and snacking tips for the user.
        - partnerAvoid: Things the partner should avoid saying or doing.
        - hydrationAvoid: Foods or drinks the user should avoid.`;
        
        const userQuery = `Context for today:\n- Pregnancy Week: ${pregnancyWeek}\n- Today's Meal Plan: ${mealPlanString}\n- Her Mood: ${mood}\n- Her Energy Level (1-5): ${energy}\n\nGenerate all four sets of tips.`;
        
        const apiKey = "AIzaSyBCZtCD7xW4mxuYkJ4h0s8nJtZaqKZxvkI";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
        };

        // --- 3. Make the single API call ---
        const response = await fetchWithBackoff(apiUrl, payload);
        if (!response.ok) throw new Error('API response not OK');
        
        const result = await response.json();
        const allTips = JSON.parse(result.candidates[0].content.parts[0].text);

        // --- 4. Distribute the tips to the UI ---
        const renderTips = (container, tips) => {
            container.innerHTML = '';
            if (tips && tips.length > 0) {
                tips.forEach(tip => {
                    const li = document.createElement('li');
                    li.textContent = tip;
                    container.appendChild(li);
                });
            } else {
                container.innerHTML = `<p>Could not generate tips at the moment.</p>`;
            }
        };

        renderTips(partnerTipsContainer, allTips.partnerTips);
        renderTips(hydrationSnacksContainer, allTips.hydrationSnacks);
        renderTips(partnerAvoidContainer, allTips.partnerAvoid);
        renderTips(hydrationAvoidContainer, allTips.hydrationAvoid);

    } catch (error) {
        console.error("Failed to generate combined wellness tips:", error);
        // Set default tips on error
        partnerTipsContainer.innerHTML = `<li>Offer a gentle back rub tonight.</li><li>Make sure she has a full water bottle.</li>`;
        hydrationSnacksContainer.innerHTML = `<li>Keep a water bottle handy to sip throughout the day.</li><li>A handful of almonds can be a great energy-boosting snack.</li>`;
        partnerAvoidContainer.innerHTML = `<li>Avoid commenting on her changing body unless it's a compliment.</li>`;
        hydrationAvoidContainer.innerHTML = `<li>Avoid unpasteurized juices or milk.</li><li>Limit caffeine intake.</li>`;
    } finally {
        allLoaders.forEach(loader => loader.style.display = 'none');
    }
}


function openEditDayModal(dayKey) {
    editDayData = {}; // Clear previous data
    editDayData.dayKey = dayKey;
    const dayData = wellnessData.weeklyLog[dayKey] || {};
    
    // Set initial values for editing
    editDayData.mood = dayData.mood || '😐';
    editDayData.energy = dayData.energy || 3;
    editDayData.waterIntake = dayData.waterIntake || 0;

    const mondayOfRelevantWeek = new Date(getWeekId(wellnessHistoryCurrentDate) + 'T00:00:00Z');
    const dayDate = new Date(mondayOfRelevantWeek);
    dayDate.setDate(mondayOfRelevantWeek.getDate() + days.indexOf(dayKey));
    editDayModalTitle.textContent = `Edit Log for ${dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;

    // Update modal UI
    editMoodLogButtons.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.mood === editDayData.mood);
    });
    editEnergyLogButtons.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.energy) === editDayData.energy);
    });
    editHydrationText.textContent = editDayData.waterIntake;
    
    editDayModal.classList.remove('hidden');
    setTimeout(() => {
        const content = editDayModal.querySelector('#edit-day-modal-content');
        if (content) {
            content.parentElement.classList.add('active');
        } else {
            editDayModal.classList.add('active');
        }
    }, 10);
}

function closeEditDayModal() {
    const content = editDayModal.querySelector('#edit-day-modal-content');
    if (content) {
        content.parentElement.classList.remove('active');
    } else {
        editDayModal.classList.remove('active');
    }
    setTimeout(() => editDayModal.classList.add('hidden'), 300);
}

async function handleSaveEditDay() {
    if (!editDayData.dayKey) return;
    const { dayKey, mood, energy, waterIntake } = editDayData;
    const updates = {
        [`weeklyLog.${dayKey}.mood`]: mood,
        [`weeklyLog.${dayKey}.energy`]: energy,
        [`weeklyLog.${dayKey}.waterIntake`]: waterIntake
    };
    await updateDoc(wellnessDataRef, updates);
    closeEditDayModal();
}


export function unloadWellness() {
    if (unsubscribeWellnessData) unsubscribeWellnessData();
    if (unsubscribeDailyWellness) unsubscribeDailyWellness(); // Unsubscribe from the daily doc
    if (unsubscribeUserSupplements) unsubscribeUserSupplements();
    if (unsubscribeSupplementNutrients) unsubscribeSupplementNutrients();
    if (unsubscribeSupplementLog) unsubscribeSupplementLog();
    if (wellnessChart) {
        wellnessChart.destroy();
        wellnessChart = null;
    }
}
