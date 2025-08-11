/**
 * Utility function to generate a chat title using Google's Gemini API
 * @param {string} firstMessage - The first user message in the chat
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} Generated title for the chat
 */
export async function generateChatTitle(firstMessage, apiKey) {
  try {
    const prompt = `Generate a very short (3-4 words max) title for a chat that starts with this message: "${firstMessage}". The title should capture the main topic or intent. Only return the title text, nothing else.`;
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "New Chat";
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    console.warn('Failed to generate chat title:', error);
    return "New Chat";
  }
}
