import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert educational content creator and tutor. Your goal is to transform raw, potentially messy handwritten notes into structured, high-quality study materials.

You have access to Google Search. You MUST use it to find REAL, WORKING links for the "Recommended Resources" section. 
**CRITICAL:** Do NOT hallucinate video links. If you find a video in the search results, use that exact URL. If you cannot find a specific video, find a general channel or playlist and use that link instead.

**OUTPUT RULES:**
1.  **NO INTERNAL THOUGHTS:** Do NOT output "tool_code", "print(...)", "thought", or any reasoning steps.
2.  **MARKDOWN ONLY:** Your output must start DIRECTLY with the Markdown title (e.g., "# Topic Name").
3.  **STRICT STRUCTURE:** Follow the structure below exactly.

Output Format:
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
*Use Google Search to find 3 high-quality YouTube tutorials and 3 authoritative articles.*
*Format them strictly as a bulleted list using this format:*
*   **[Video] Title of Video** - [Link](YouTube URL)
*   **[Article] Title of Article** - [Link](URL)

Ensure the tone is encouraging and academic.
`;

export const generateStudyMaterial = async (rawText: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Transform the following handwritten note text into a study guide. Identify the main topic, then search the web for the best current resources to help study this:\n\n${rawText}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        tools: [{googleSearch: {}}] // Enable Google Search Grounding
      }
    });

    let text = response.text;

    if (text) {
      // CLEANUP: Sometimes the model leaks tool usage logs or "thoughts" into the output.
      // We strip everything before the first Markdown header (#).
      const headerIndex = text.indexOf('# ');
      if (headerIndex > 0) {
        // If we see "tool_code" or "thought" before the header, we chop it off.
        const prefix = text.substring(0, headerIndex);
        if (prefix.includes('tool_code') || prefix.includes('thought') || prefix.includes('print(')) {
          text = text.substring(headerIndex);
        }
      } else if (text.trim().startsWith('tool_code') || text.trim().startsWith('thought')) {
        // Fallback: if no header is found but it starts with garbage, try to find the start of the content
        // This is a rough heuristic: assume real content starts after the last closing parenthesis of a print statement or "thought" block
        text = text.replace(/^(?:tool_code|thought|print\(|google_search)[\s\S]*?\n\n/i, '').trim();
      }

      return text;
    } else {
      // Check for candidates to provide better error info
      if (response.candidates && response.candidates.length > 0) {
        // If content was blocked or filtered
        if (response.candidates[0].finishReason !== 'STOP') {
             throw new Error(`Generation stopped due to: ${response.candidates[0].finishReason}`);
        }
      }
      throw new Error("Empty response from Gemini.");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate study material. Please try again.");
  }
};