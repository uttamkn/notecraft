import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, Check, FileText, Youtube, ExternalLink, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface StudyGuideProps {
  markdown: string;
}

const StudyGuide: React.FC<StudyGuideProps> = ({ markdown }) => {
  const [copied, setCopied] = React.useState(false);

  // Extract video info (Title + ID) to provide a fallback search if the direct link fails
  const videoInfo = useMemo(() => {
    // 1. Try to match the structured format requested in the prompt: **[Video] Title** - [Link](url)
    // We try to capture the Title (Group 1) and the URL (Group 2)
    const structuredRegex = /\*\s*\*\*\[?Video\]?\s*(.*?)\*\*\s*-\s*\[.*?\]\((.*?)\)/i;
    const match = markdown.match(structuredRegex);

    if (match) {
      const title = match[1].trim();
      const url = match[2].trim();
      const idMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      
      if (idMatch) {
        return { title, id: idMatch[1], url };
      }
    }

    // 2. Fallback: Just find the first raw YouTube ID if the structured format fails
    const simpleRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const simpleMatch = markdown.match(simpleRegex);
    
    if (simpleMatch) {
      return { 
        title: "Recommended Tutorial", 
        id: simpleMatch[1], 
        url: `https://www.youtube.com/watch?v=${simpleMatch[1]}` 
      };
    }

    return null;
  }, [markdown]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    // Clean markdown syntax for PDF (simple strip)
    const cleanText = markdown.replace(/[*#]/g, '');
    const splitText = doc.splitTextToSize(cleanText, maxLineWidth);
    
    let y = 15;
    
    splitText.forEach((line: string) => {
        if (y > 280) {
            doc.addPage();
            y = 15;
        }
        doc.text(line, margin, y);
        y += 7;
    });

    doc.save("study-guide.pdf");
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
        <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
          <FileText size={20} />
          <h2 className="font-semibold text-lg hidden sm:block">Study Guide</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6 md:p-8 markdown-body">
        
        {/* Video Spotlight */}
        {videoInfo && (
          <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <Youtube size={20} />
                <h3 className="text-sm font-bold uppercase tracking-wider line-clamp-1">
                  {videoInfo.title}
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(videoInfo.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 transition-colors hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  title="Search for this topic if the video is unavailable"
                >
                  <Search size={12} />
                  <span>Search Alternatives</span>
                </a>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <a
                  href={videoInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs font-medium text-gray-500 transition-colors hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
            <div className="relative w-full bg-black" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute left-0 top-0 h-full w-full"
                src={`https://www.youtube.com/embed/${videoInfo.id}?origin=${window.location.origin}&modestbranding=1&rel=0`}
                title={videoInfo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-8 mb-4 flex items-center" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-2 mb-4" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              a: ({node, ...props}) => (
                <a 
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 inline-flex items-center space-x-1" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  {...props}
                >
                  <span>{props.children}</span>
                  <ExternalLink size={12} />
                </a>
              ),
              strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-300 dark:border-primary-700 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />,
              code: ({node, ...props}) => <code className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5 text-sm font-mono text-pink-600 dark:text-pink-400" {...props} />,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default StudyGuide;