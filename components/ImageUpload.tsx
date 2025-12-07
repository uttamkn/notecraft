import React, { useCallback, useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

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
    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file.");
      return;
    }
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
    // We don't reset parent state here to keep it simple, 
    // but in a full app we might want a 'onClear' prop.
  };

  return (
    <div className="w-full">
      <div
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out
          ${dragActive 
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" 
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
          accept="image/*"
          onChange={handleChange}
          disabled={disabled}
        />

        {preview ? (
          <div className="relative w-full h-full p-2">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-contain rounded-md" 
            />
            <button
              onClick={clearImage}
              className="absolute top-4 right-4 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/50 text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, JPEG (Handwritten notes)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
