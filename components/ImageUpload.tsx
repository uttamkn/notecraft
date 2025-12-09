import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, File as FileIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (disabled) return;
    
    // Accept images and PDFs
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert("Please upload an image or PDF file.");
      return;
    }

    setFileType(file.type);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onImageSelected(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileType('');
    setFileName('');
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ease-in-out
          ${dragActive 
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]" 
            : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload')?.click()}
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={handleChange}
          disabled={disabled}
        />

        {preview ? (
          <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
            {fileType === 'application/pdf' ? (
              <div className="flex flex-col items-center text-red-500 animate-fade-in">
                 <FileText size={64} />
                 <p className="mt-4 font-medium text-gray-700 dark:text-gray-200">{fileName}</p>
                 <p className="text-sm text-gray-500">PDF Document</p>
              </div>
            ) : (
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-full max-w-full object-contain rounded-md shadow-sm" 
              />
            )}
            
            <button
              onClick={clearImage}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors z-10"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className={`p-4 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-4 transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
               <Upload className="w-8 h-8 text-primary-500" />
            </div>
            <p className="mb-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
              <span className="text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF or Images (JPG, PNG)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;