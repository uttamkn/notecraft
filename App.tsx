import React, { useState, useEffect } from 'react';
import { extractTextFromFile } from './services/ocr';
import { generateStudyMaterial } from './services/gemini';
import ImageUpload from './components/ImageUpload';
import StudyGuide from './components/StudyGuide';
import { ProcessingState, AppStatus } from './types';
import { Loader2, Moon, Sun, BookOpen, BrainCircuit, ScanLine, FileText } from 'lucide-react';

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
      setState({ status: AppStatus.PROCESSING_OCR, progress: 0, message: "Extracting text from document..." });
      
      const rawText = await extractTextFromFile(file, (progress) => {
        setState(prev => ({ ...prev, progress: Math.floor(progress) }));
      });

      if (!rawText || rawText.trim().length < 5) {
        throw new Error("Could not detect enough text. Please try a clearer image or document.");
      }

      // 2. Gemini Step
      setState({ status: AppStatus.PROCESSING_GEMINI, message: "Structuring content with AI..." });
      
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer group" onClick={handleReset}>
            <div className="bg-primary-600 p-1.5 rounded-lg text-white transform group-hover:scale-110 transition-transform">
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
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        
        {state.status === AppStatus.IDLE && (
          <div className="max-w-3xl mx-auto text-center space-y-12 animate-fade-in-up mt-8">
             <div className="space-y-6">
               <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                 Turn notes into <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-blue-600">intelligence.</span>
               </h2>
               <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                 Upload handwritten notes or PDFs. Let Gemini AI organize them into structured study guides, summaries, and flashcards instantly.
               </p>
             </div>
             
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl ring-1 ring-gray-900/5 dark:ring-white/10 transform transition-all hover:shadow-2xl">
               <ImageUpload onImageSelected={handleImageSelected} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { icon: FileText, title: "Any Format", desc: "Supports Images (JPG, PNG) and PDF documents." },
                  { icon: BrainCircuit, title: "Deep Understanding", desc: "Identify prerequisites, key terms, and summaries." },
                  { icon: Loader2, title: "Lightning Fast", desc: "Powered by Gemini 2.5 Flash for instant results." }
                ].map((feature, idx) => (
                  <div key={idx} className="flex flex-col p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Improved Loading State */}
        {(state.status === AppStatus.PROCESSING_OCR || state.status === AppStatus.PROCESSING_GEMINI) && (
          <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh]">
            <div className="relative w-64 h-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
              {/* Document Lines Simulation */}
              <div className="p-6 space-y-4 opacity-50">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded w-full mt-4"></div>
              </div>

              {/* Scanning Beam */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_15px_rgba(14,165,233,0.8)] animate-scan"></div>
              
              {/* Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-white/90 dark:bg-gray-900/90 p-4 rounded-full backdrop-blur-sm shadow-lg">
                    {state.status === AppStatus.PROCESSING_OCR ? (
                      <ScanLine size={32} className="text-primary-600 animate-pulse" />
                    ) : (
                      <BrainCircuit size={32} className="text-purple-600 animate-pulse" />
                    )}
                 </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white animate-pulse">
                {state.message}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {state.status === AppStatus.PROCESSING_OCR 
                  ? `Reading document... ${state.progress}%` 
                  : "Consulting expert sources..."}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {state.status === AppStatus.ERROR && (
          <div className="flex-1 flex items-center justify-center">
            <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-l-4 border-red-500">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600">
                  <span className="text-xl">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Processing Failed</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{state.error}</p>
              <button
                onClick={handleReset}
                className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Results State - Full width, natural scroll */}
        {state.status === AppStatus.COMPLETE && (
          <div className="w-full animate-fade-in-up pb-12">
            <StudyGuide markdown={markdown} />
          </div>
        )}
      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}