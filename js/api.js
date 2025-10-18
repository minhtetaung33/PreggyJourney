import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- AI Configuration ---
// IMPORTANT: Replace with your actual API key or use environment variables.
const API_KEY = "YOUR_API_KEY";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

/**
 * A generic function to call the AI model with a given prompt.
 * This is an internal helper function and is not exported.
 * @param {string} prompt - The prompt to send to the AI.
 * @returns {Promise<string>} The generated text.
 */
async function generateText(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error generating text with AI:", error);
        throw new Error("Failed to communicate with the AI service.");
    }
}


// --- EXPORTED API Functions ---
// These functions are made available to other parts of the application.

/**
 * Generates a 7-day meal plan using the AI.
 * @param {object} userPreferences - User's dietary preferences.
 * @returns {Promise<string>} The AI-generated meal plan text.
 */
export async function generateAiMealPlan(userPreferences) {
    const prompt = `Create a 7-day healthy meal plan for a pregnant person.
    Preferences:
    - Due Date: ${userPreferences.dueDate || 'Not specified'}
    - Dietary Restrictions: ${userPreferences.restrictions || 'None'}
    - Cravings: ${userPreferences.cravings || 'None'}
    Format the response as a clear, day-by-day list. For each day, list Breakfast, Lunch, Dinner, and one Snack.`;
    return await generateText(prompt);
}

/**
 * Gets AI-powered suggestions for a pregnancy-related symptom.
 * @param {string} symptom - The symptom described by the user.
 * @returns {Promise<string>} The AI-generated suggestions.
 */
export async function getSymptomSuggestions(symptom) {
    const prompt = `I am pregnant and experiencing "${symptom}". What are some common, safe, non-medical remedies or comfort measures I can try? Provide a few bullet points.`;
    return await generateText(prompt);
}

/**
 * Generates an AI summary of the user's weekly wellness logs.
 * @param {object} wellnessData - The user's logged wellness data.
 * @returns {Promise<string>} The AI-generated summary.
 */
export async function generateAiSummary(wellnessData) {
    const prompt = `Based on the following weekly wellness log for a pregnant person, provide a brief, encouraging summary and identify any patterns.
    Data: ${JSON.stringify(wellnessData)}
    Focus on positive reinforcement.`;
    return await generateText(prompt);
}

/**
 * Fetches information about a specific week of pregnancy.
 * @param {number} week - The week of pregnancy.
 * @returns {Promise<string>} The AI-generated information.
 */
export async function getJourneyInfoForWeek(week) {
    const prompt = `Provide helpful and comforting information for week ${week} of pregnancy. Include baby's development, common symptoms for the mother, and a helpful tip. Format it nicely.`;
    return await generateText(prompt);
}
