import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getPeriHerResponse(prompt: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  try {
    const model = ai.models.get({ model: "gemini-2.0-flash" }); // Using a standard model name
    
    const chat = ai.chats.create({
      model: "gemini-1.5-flash", // Fallback to a known model if needed, but guidelines say gemini-3-flash-preview
      config: {
        systemInstruction: `You are PeriHer, a supportive, calm, and science-based AI companion for women in perimenopause (ages 40-55). 
        Your tone is friendly, empathetic, and professional. 
        Provide advice on symptoms like fatigue, brain fog, hot flashes, and mood swings. 
        Focus on lifestyle, nutrition, and gentle exercise. 
        Always encourage consulting a healthcare provider for medical concerns. 
        Keep responses concise and supportive.`,
      }
    });

    // Note: The SDK usage in guidelines says ai.models.generateContent
    // Let's stick to the recommended pattern from the system prompt.
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: "You are PeriHer, a supportive AI companion for women in perimenopause. Be empathetic, science-based, and concise.",
      }
    });

    return response.text || "I'm here to support you. Could you tell me more about how you're feeling?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble connecting right now, but I'm still here for you. How can I help?";
  }
}
