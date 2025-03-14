"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/app/lib/firebase';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const uploadedFile = e.dataTransfer.files[0];
      handleFile(uploadedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile: File) => {
    // Reset states
    setError('');
    setUploadSuccess(false);
    setDocumentId(null);
    
    // Check if file is PDF
    if (uploadedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    
    // Check file size (max 10MB)
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB.');
      return;
    }
    
    setFile(uploadedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setError('');
    setIsUploading(true);
    setUploadProgress(0);
    
    // Upload phases for clearer user feedback
    const phases = [
      { name: "Uploading file", percent: 30 },
      { name: "Extracting text", percent: 50 },
      { name: "Processing content", percent: 70 },
      { name: "Creating AI index", percent: 90 },
      { name: "Finalizing", percent: 95 }
    ];
    
    let currentPhase = 0;
    
    // Progress tracker with phases
    const progressInterval = setInterval(() => {
      if (currentPhase < phases.length) {
        const phase = phases[currentPhase];
        setUploadProgress((prev) => {
          if (prev >= phase.percent) {
            // Move to next phase
            currentPhase++;
            return prev;
          }
          return prev + 2;
        });
      }
    }, 800);
    
    try {
      // Get current user
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to upload files');
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.uid);
      
      // Start time measurement for better future estimates
      const startTime = Date.now();
      
      // Upload file
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Calculate processing time
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`Document processing took ${processingTime} seconds`);
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      // Get response data
      const data = await response.json();
      
      // Show 100% progress
      setUploadProgress(100);
      
      // Set processing state while backend processes the file
      setIsProcessing(false);
      
      if (data.success) {
        // Save document ID
        setDocumentId(data.document_id);
        setUploadSuccess(true);
        
        // Reset uploader but keep success message
        setFile(null);
        setIsUploading(false);
      } else {
        throw new Error(data.message || 'Processing failed');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const goToQA = () => {
    if (documentId) {
      router.push(`/dashboard/qa?document=${documentId}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800">Upload Report</h1>
      
      {/* Upload Form - Pinecone inspired */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Upload Financial Report</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload your annual report, financial statement, or other financial document in PDF format. 
            Our AI will analyze the document and extract key insights.
          </p>
        </div>
        
        <div className="px-6 py-4">
          {/* Success message */}
          {uploadSuccess && documentId && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Report processed successfully! Your document is ready for Q&A.</p>
                  <div className="mt-2">
                    <button 
                      type="button"
                      onClick={goToQA}
                      className="text-sm font-medium text-green-600 hover:text-green-500"
                    >
                      Ask questions about this report →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* File drop area */}
          <div
            className={`border-2 border-dashed rounded-md p-8 text-center ${
              isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : file 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
            
            {!file ? (
              <div>
                <svg className="h-12 w-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-700">
                  Drag and drop your PDF file here, or
                </p>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse files
                </button>
                <p className="mt-2 text-xs text-gray-500">
                  (Max size: 10MB)
                </p>
              </div>
            ) : (
              <div>
                <svg className="h-12 w-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-sm font-medium text-gray-700 break-all">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                >
                  Remove file
                </button>
              </div>
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Upload button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || isProcessing}
              className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                !file || isUploading || isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {`Uploading... ${uploadProgress}%`}
                </>
              ) : isProcessing 
                ? 'Processing document...' 
                : 'Upload and Analyze'}
            </button>
          </div>
          
          {/* Progress bar */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-gray-600">
                  {uploadProgress < 30 ? "Uploading file..." : 
                   uploadProgress < 50 ? "Extracting text from PDF..." :
                   uploadProgress < 70 ? "Processing content..." :
                   uploadProgress < 90 ? "Creating AI index..." :
                   uploadProgress < 100 ? "Finalizing..." : "Complete!"}
                </span>
                <span className="text-xs font-medium text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Processing large financial reports can take 2-3 minutes. Please be patient.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Tips section */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Tips for Best Results</h2>
        </div>
        
        <div className="px-6 py-4">
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Upload clear, searchable PDF documents</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Ensure financial data is clearly formatted</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>For best results, upload official annual reports or financial statements</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Make sure the document language is English</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Large reports may take longer to process</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 