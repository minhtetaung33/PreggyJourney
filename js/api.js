// This is your API key for the Gemini AI
const API_KEY = "YOUR_API_KEY_HERE"; // IMPORTANT: Replace with your actual API key
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

/**
 * A robust function to call the Gemini API with error handling and retries.
 * @param {object} payload - The data to send to the API.
 * @param {number} retries - The number of times to retry on failure.
 * @param {number} delay - The initial delay between retries in ms.
 * @returns {Promise<string>} - The text content from the AI's response.
 */
async function callGeminiAPI(payload, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                 // Handle cases where the response structure is unexpected or content is missing
                console.error("Invalid response structure from API:", result);
                throw new Error("Invalid response structure from API.");
            }

        } catch (error) {
            console.error(`API call attempt ${i + 1} failed:`, error);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
            } else {
                throw error; // Rethrow the error after the last retry
            }
        }
    }
    // This part should ideally not be reached, but it's a fallback.
    throw new Error("API call failed after all retries.");
}


/**
 * Generates a structured meal plan using the AI.
 * @param {string} userPrompt - The user's preferences for the meal plan.
 * @returns {Promise<string>} - A JSON string of the meal plan.
 */
export async function generateAiMealPlan(userPrompt) {
    const systemPrompt = `You are a pregnancy nutrition expert. Generate a 7-day meal plan based on the user's request. 
    The output MUST be a valid JSON object. Do not include any text before or after the JSON.
    The JSON object should have keys "monday", "tuesday", ..., "sunday". 
    Each day should be an object with keys "breakfast", "lunch", "dinner", and "snacks". 
    The value for each meal should be a short, healthy, and appealing meal description string.
    Example: { "monday": { "breakfast": "Oatmeal with berries", "lunch": "Grilled chicken salad", "dinner": "Salmon with quinoa", "snacks": "Apple slices with almond butter" } ... }`;
    
    const payload = {
        contents: [{ parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
         generationConfig: {
            responseMimeType: "application/json",
        }
    };
    return callGeminiAPI(payload);
}

/**
 * Gets wellness suggestions for a given pregnancy symptom.
 * @param {string} symptom - The symptom the user is experiencing.
 * @returns {Promise<string>} - AI-generated suggestions as a string.
 */
export async function getSymptomSuggestions(symptom) {
    const prompt = `I'm pregnant and experiencing "${symptom}". Give me 3-4 concise, safe, and practical wellness tips to help manage this. Focus on natural remedies, comfort measures, and when to consult a doctor. Format as a simple list.`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    return callGeminiAPI(payload);
}

/**
 * Generates a weekly wellness summary and outlook.
 * @param {object} weekData - An object containing the user's logged data for the week.
 * @returns {Promise<string>} - A summary and encouraging message from the AI.
 */
export async function generateAiSummary(weekData) {
    const prompt = `Based on my pregnancy wellness data this week, provide a short, encouraging summary and one positive tip for the week ahead.
    My data: ${JSON.stringify(weekData)}.
    Keep the tone gentle, positive, and supportive. Address me directly as "you".`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    return callGeminiAPI(payload);
}

/**
 * Generates baby wishlist/registry suggestions.
 * @param {string} trimester - The current trimester (e.g., "first", "second", "third").
 * @returns {Promise<string>} - A JSON string of wishlist items.
 */
export async function getWishlistSuggestions(trimester) {
    const systemPrompt = `You are a helpful assistant creating a baby registry list. Generate 5 creative and useful baby wishlist items suitable for the ${trimester} trimester of pregnancy.
    The output MUST be a valid JSON array of objects. Do not include any text before or after the JSON.
    Each object should have three keys: "name" (string), "reason" (string, a brief explanation of why it's useful), and "category" (string, e.g., "Nursery", "Feeding", "Travel", "Clothing").
    Example: [{"name": "Baby Carrier/Sling", "reason": "For hands-free bonding and carrying the baby.", "category": "Travel"}]`;

    const payload = {
        contents: [{ parts: [{ text: `Generate items for the ${trimester} trimester.` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
         generationConfig: {
            responseMimeType: "application/json",
        }
    };
    return callGeminiAPI(payload);
}


/**
 * Generates a thoughtful reflection prompt for the user's journal.
 * @returns {Promise<string>} - A single, engaging question.
 */
export async function generateReflectionPrompt() {
    const prompt = "Generate one single, thoughtful, and positive journal prompt for an expecting mother. Frame it as a gentle question.";
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    return callGeminiAPI(payload);
}