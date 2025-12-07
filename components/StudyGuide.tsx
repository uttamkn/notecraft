import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Download, Check, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface StudyGuideProps {
  markdown: string;
}

const StudyGuide: React.FC<StudyGuideProps> = ({ markdown }) => {
  const [copied, setCopied] = React.useState(false);

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
    
    // Simple PDF generation logic
    // For robust markdown-to-pdf, we'd use html2canvas + jspdf, 
    // but here we will split lines and print text to keep it lightweight and native.
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - (margin * 2);
    
    const splitText = doc.splitTextToSize(markdown, maxLineWidth);
    
    let y = 15;
    
    splitText.forEach((line: string) => {
        if (y > 280) { // Check for page break
            doc.addPage();
            y = 15;
        }
        doc.text(line, margin, y);
        y += 7;
    });

    doc.save("study-guide.pdf");
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
          <FileText size={20} />
          <h2 className="font-semibold text-lg">Study Guide</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded shadow-sm transition-colors"
          >
            <Download size={16} />
            <span>PDF</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-6 md:p-8 markdown-body">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-8 mb-4 flex items-center" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 space-y-2 mb-4" {...props} />,
              li: ({node, ...props}) => <li className="pl-1" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-gray-100" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-300 dark:border-primary-700 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />,
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
