import { GoogleGenAI } from "@google/genai";

export const extractTextFromFile = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  // We cannot track exact server-side progress, so we simulate a smooth loader
  let currentProgress = 0;
  const progressInterval = setInterval(() => {
    currentProgress += (90 - currentProgress) * 0.1;
    onProgress(Math.floor(currentProgress));
  }, 300);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data url prefix (e.g. "data:image/png;base64," or "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: "Transcribe the text from this document verbatim. Return ONLY the raw text found in the document. Do not summarize, explain, or add markdown formatting unless it exists in the original text."
          }
        ]
      }
    });

    clearInterval(progressInterval);
    onProgress(100);

    if (response.text) {
        return response.text;
    }
    
    throw new Error("No text identified in the document.");

  } catch (error) {
    clearInterval(progressInterval);
    console.error("AI OCR Error:", error);
    throw new Error("Failed to extract text. Please ensure the file is a clear image or PDF.");
  }
};