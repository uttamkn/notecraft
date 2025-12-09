import { GoogleGenAI } from "@google/genai";

// NOTE: You can set this via process.env.SERPER_API_KEY or replace the string below.
const SERPER_API_KEY = process.env.SERPER_API_KEY || '';

const SYSTEM_INSTRUCTION = `
You are an expert educational content creator and tutor. Your goal is to transform raw, potentially messy handwritten notes into structured, high-quality study materials.

**OUTPUT RULES:**
1.  **NO INTERNAL THOUGHTS:** Do NOT output "thought" or reasoning steps.
2.  **MARKDOWN ONLY:** Start directly with the Markdown content.
3.  **NO RESOURCES YET:** Do NOT generate the "Recommended Resources" section yet. I will add that later programmatically.
4.  **SEARCH QUERY:** At the very end of your response, on a new line, strictly output: "SEARCH_QUERY: <Best search query for this topic>"

Output Structure:
# [Title of Topic Detected]

## 📋 Prerequisites
*List 3-5 key concepts needed.*

## 📝 Structured Notes
*Organize the content logically with bolding and bullet points.*

## 💡 Key Examples
*Provide 1-2 concrete examples.*

## 🎯 Summary
*Concise summary.*

## 🚀 Next Steps
*Actionable items.*

SEARCH_QUERY: [Insert Topic Here]
`;

async function fetchSerperResources(query: string): Promise<string> {
  if (!SERPER_API_KEY) {
    return `\n\n## 📚 Recommended Resources\n*   **Configuration Missing** - Please set \`SERPER_API_KEY\` to enable resource search.\n`;
  }

  try {
    const headers = {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json'
    };

    // Parallel fetch for videos and articles
    const [videoRes, articleRes] = await Promise.all([
      fetch('https://google.serper.dev/videos', {
        method: 'POST',
        headers,
        body: JSON.stringify({ q: query, num: 3 })
      }),
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({ q: query, num: 3 })
      })
    ]);

    const videoData = await videoRes.json();
    const articleData = await articleRes.json();

    let markdown = `\n\n## 📚 Recommended Resources\n`;

    // Format Videos
    if (videoData.videos && videoData.videos.length > 0) {
      videoData.videos.slice(0, 3).forEach((v: any) => {
        markdown += `*   **[Video] ${v.title}** - [Link](${v.link})\n`;
      });
    } else {
      markdown += `*   *No specific videos found for this topic.*\n`;
    }

    // Format Articles
    if (articleData.organic && articleData.organic.length > 0) {
      articleData.organic.slice(0, 3).forEach((a: any) => {
        markdown += `*   **[Article] ${a.title}** - [Link](${a.link})\n`;
      });
    } else {
      markdown += `*   *No specific articles found for this topic.*\n`;
    }

    return markdown;

  } catch (error) {
    console.error("Serper API Error:", error);
    return `\n\n## 📚 Recommended Resources\n*   *Failed to load resources. Please try again later.*\n`;
  }
}

export const generateStudyMaterial = async (rawText: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 1. Generate Content with Gemini (Text Only)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Transform these handwritten notes into a study guide:\n\n${rawText}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        // Disable tools to prevent empty responses / internal errors
      }
    });

    let text = response.text || "";

    if (!text) {
        if (response.candidates && response.candidates.length > 0) {
             const reason = response.candidates[0].finishReason;
             if (reason !== 'STOP') throw new Error(`Generation stopped: ${reason}`);
        }
        throw new Error("Empty response from Gemini.");
    }

    // 2. Extract Search Query
    const queryMatch = text.match(/SEARCH_QUERY:\s*(.*)/);
    let searchQuery = "Educational topic from notes";
    
    if (queryMatch) {
      searchQuery = queryMatch[1].trim();
      // Remove the SEARCH_QUERY line from the display text
      text = text.replace(/SEARCH_QUERY:.*$/, '').trim();
    } else {
        // Fallback: try to grab the Title
        const titleMatch = text.match(/^#\s+(.*)/m);
        if (titleMatch) {
            searchQuery = titleMatch[1].trim();
        }
    }

    // 3. Cleanup any lingering "thought" artifacts (just in case)
    text = text.replace(/^(?:tool_code|thought|print\()[\s\S]*?\n\n/i, '').trim();

    // 4. Fetch Resources from Serper
    const resourcesMarkdown = await fetchSerperResources(searchQuery);

    // 5. Combine
    return text + resourcesMarkdown;

  } catch (error) {
    console.error("Gemini/Serper Error:", error);
    throw new Error("Failed to generate study material. Please try again.");
  }
};