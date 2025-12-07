import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert educational content creator and tutor. Your goal is to transform raw, potentially messy handwritten notes into structured, high-quality study materials.

Output Format:
Return ONLY clean, valid Markdown. Use the following structure strictly:

# [Title of Topic Detected]

## 📋 Prerequisites
*List 3-5 key concepts needed to understand this topic.*

## 📝 Structured Notes
*Organize the content logically. Use bolding for key terms, bullet points for lists, and code blocks if applicable.*

## 💡 Key Examples
*Provide 1-2 concrete examples or scenarios illustrating the main concepts.*

## 🎯 Summary
*A concise 2-3 sentence summary of the entire note.*

## 🚀 Next Steps
*Actionable items for the student (e.g., "Practice X", "Review Y").*

## 📚 Recommended Resources
*   **YouTube:** [Suggest a specific search query for a video]
*   **Reading:** [Suggest a type of article or documentation to look for]

Ensure the tone is encouraging and academic. If the input text is gibberish or too short to analyze, politely ask the user to upload a clearer image.
`;

export const generateStudyMaterial = async (rawText: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We use the flash model for speed and efficiency with text transformation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Transform the following handwritten note text into a study guide:\n\n${rawText}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Lower temperature for more structured/consistent output
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("Empty response from Gemini.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate study material.");
  }
};
