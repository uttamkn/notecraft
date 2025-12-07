import Tesseract from 'tesseract.js';

export const extractTextFromImage = async (
  imageFile: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            onProgress(m.progress * 100);
          }
        },
      }
    );
    return result.data.text;
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from the image.");
  }
};
