
import { GoogleGenAI, Type } from "@google/genai";
import { BirthdayWish, WishFormData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Clean JSON string from potential markdown wrappers
 */
const extractJson = (text: string) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
};

export const generateBirthdayWish = async (data: WishFormData): Promise<BirthdayWish> => {
  const prompt = `Generate a creative and personalized birthday wish for a person with the following details:
  Name: ${data.name}
  Age: ${data.age || 'Not specified'}
  Relation: ${data.relation}
  Tone: ${data.tone}
  Language: ${data.language}
  
  Please provide:
  1. A catchy title.
  2. A heartfelt main message.
  3. A short, beautiful 4-line poem.
  4. A short quote for a card.
  5. A fun hypothetical fact about the person (e.g., "Legend says you are the reason cake was invented").
  
  IMPORTANT: Return ONLY valid JSON. No conversational text before or after.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            message: { type: Type.STRING },
            poem: { type: Type.STRING },
            shortQuote: { type: Type.STRING },
            funFact: { type: Type.STRING }
          },
          required: ["title", "message", "poem", "shortQuote", "funFact"]
        }
      }
    });

    const cleanedText = extractJson(response.text || "");
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Gemini Wish Generation Error:", error);
    throw new Error("Dost, wish generate karne mein takleef hui. Ek baar phir try karein?");
  }
};

export const generateBirthdayImage = async (name: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `A vibrant, high-quality festive birthday celebration background. Colorful balloons, artistic confetti, and elegant birthday aesthetics. Minimalist but joyful. No text, just festive atmosphere for ${name}.` }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return '';
  } catch (error) {
    console.error("Gemini Image Generation Error (Handled):", error);
    return ''; // Return empty string so UI can show fallback
  }
};
