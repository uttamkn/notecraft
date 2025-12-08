import React, { useState, useEffect } from 'react';
import { extractTextFromImage } from './services/ocr';
import { generateStudyMaterial } from './services/gemini';
import ImageUpload from './components/ImageUpload';
import StudyGuide from './components/StudyGuide';
import { ProcessingState, AppStatus } from './types';
import { Loader2, Moon, Sun, BookOpen, BrainCircuit } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [state, setState] = useState<ProcessingState>({ status: AppStatus.IDLE });
  const [markdown, setMarkdown] = useState<string>("");

  // Theme handling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleImageSelected = async (file: File) => {
    try {
      // 1. OCR Step
      setState({ status: AppStatus.PROCESSING_OCR, progress: 0, message: "Extracting text from notes..." });
      
      const rawText = await extractTextFromImage(file, (progress) => {
        setState(prev => ({ ...prev, progress: Math.floor(progress) }));
      });

      if (!rawText || rawText.trim().length < 5) {
        throw new Error("Could not detect enough text. Please try a clearer image.");
      }

      // 2. Gemini Step
      setState({ status: AppStatus.PROCESSING_GEMINI, message: "AI analyzing & structuring content..." });
      
      const generatedMarkdown = await generateStudyMaterial(rawText);
      setMarkdown(generatedMarkdown);
      
      setState({ status: AppStatus.COMPLETE });

    } catch (error: any) {
      setState({ 
        status: AppStatus.ERROR, 
        error: error.message || "An unexpected error occurred." 
      });
    }
  };

  const handleReset = () => {
    setState({ status: AppStatus.IDLE });
    setMarkdown("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-primary-600 p-1.5 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">
              NoteCraft
            </h1>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {state.status === AppStatus.IDLE && (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in-up">
             <div className="space-y-4">
               <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                 Turn notes into <span className="text-primary-600 dark:text-primary-400">knowledge</span>.
               </h2>
               <p className="text-lg text-gray-600 dark:text-gray-300">
                 Upload your handwritten notes and let Gemini AI organize them into summaries, prerequisites, and structured study guides instantly.
               </p>
             </div>
             
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10">
               <ImageUpload onImageSelected={handleImageSelected} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { icon: BookOpen, title: "Structured", desc: "Get clean, organized formatting automatically." },
                  { icon: BrainCircuit, title: "Smart", desc: "Identify prerequisites and key examples." },
                  { icon: Loader2, title: "Fast", desc: "Powered by Gemini 2.5 Flash for speed." }
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                    <feature.icon className="w-6 h-6 text-primary-500 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Loading State */}
        {(state.status === AppStatus.PROCESSING_OCR || state.status === AppStatus.PROCESSING_GEMINI) && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {state.status === AppStatus.PROCESSING_OCR ? <BookOpen size={24} className="text-primary-600"/> : <BrainCircuit size={24} className="text-primary-600"/>}
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {state.message}
              </h3>
              {state.status === AppStatus.PROCESSING_OCR && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Recognition Progress: {state.progress}%
                </p>
              )}
              {state.status === AppStatus.PROCESSING_GEMINI && (
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                  Reasoning about your notes...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === AppStatus.ERROR && (
          <div className="max-w-xl mx-auto mt-12 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Processing Failed</h3>
            <p className="text-red-600 dark:text-red-300 mb-6">{state.error}</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Results State */}
        {state.status === AppStatus.COMPLETE && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
            <div className="lg:col-span-12 h-full">
              <StudyGuide markdown={markdown} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}