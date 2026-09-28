'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });

  const handleProcess = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Send the image to our Next.js API route
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process image');
      }

      // Convert the response into a downloadable zip blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary hidden link to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'framed-screenshots.zip';
      document.body.appendChild(link);
      link.click();
      
      // Clean up the DOM
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Game Framer</h1>
          <p className="text-zinc-400">Upload your raw gameplay screenshot to generate device frames.</p>
        </div>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/50'}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
          {isDragActive ? (
            <p className="text-blue-400 font-medium">Drop your screenshot here...</p>
          ) : (
            <div className="space-y-1">
              <p className="font-medium">Click or drag screenshot to upload</p>
              <p className="text-sm text-zinc-500">Supports PNG, JPG, JPEG</p>
            </div>
          )}
        </div>

        {file && (
          <div className="bg-zinc-900 rounded-xl p-4 flex items-center justify-between border border-zinc-800">
            <div className="flex items-center space-x-3 overflow-hidden">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="truncate text-sm font-medium">{file.name}</span>
            </div>
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="ml-4 flex items-center px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : (
                'Generate Frames'
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center text-sm">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
    </main>
  );
}