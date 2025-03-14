"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/app/lib/firebase';

export default function QAPage() {
  const searchParams = useSearchParams();
  const documentId = searchParams.get('document');
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [documentInfo, setDocumentInfo] = useState<{ filename: string } | null>(null);

  // Get document information on load
  useEffect(() => {
    if (documentId) {
      // For now, just use a placeholder. In a real app, we would fetch document info
      setDocumentInfo({ filename: 'Your uploaded financial report' });
    }
  }, [documentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    if (!documentId) {
      setError('No document selected');
      return;
    }
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      setError('You must be logged in to ask questions');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          fileId: documentId,
          userId: user.uid
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Provide more descriptive error messages
        if (response.status === 404) {
          throw new Error('Document not found. The document may have been deleted or not properly processed.');
        } else {
          throw new Error(data.error || 'Failed to get an answer');
        }
      }
      
      setAnswer(data.answer);
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err.message || 'Error processing your question');
      console.error('Question error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Ask Questions</h1>
        <a
          href="/dashboard/upload"
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Upload
        </a>
      </div>
      
      {/* Document Info - Pinecone inspired */}
      {documentInfo && (
        <div className="bg-white rounded-md border border-gray-200 px-4 py-3 flex items-center">
          <div className="flex-shrink-0 mr-3">
            <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-700">
              Asking questions about: <span className="font-medium text-gray-900">{documentInfo.filename}</span>
            </p>
          </div>
        </div>
      )}
      
      {/* Ask Question Form - Pinecone inspired */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Ask a Question</h2>
          <p className="mt-1 text-sm text-gray-500">
            Ask any question about your financial report. Our AI will provide answers based on the content of your document.
          </p>
        </div>
        
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700">
                Your Question
              </label>
              <div className="mt-1">
                <textarea
                  id="question"
                  name="question"
                  rows={3}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full text-base text-gray-900 border border-gray-300 bg-gray-50 hover:bg-white focus:bg-white rounded-md placeholder-gray-500 p-3"
                  placeholder="E.g., What was the revenue in Q3? What are the main growth factors?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                    {error.includes('not found') && (
                      <p className="mt-1 text-sm">
                        Try returning to the upload page and processing your document again.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Getting Answer...
                  </>
                ) : 'Ask Question'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Answer Section - Pinecone inspired */}
      {answer && (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Answer</h2>
          </div>
          
          <div className="px-6 py-4">
            <div className="bg-gray-50 rounded-md p-4 mb-4 border border-gray-200">
              <p className="whitespace-pre-line text-gray-900 text-base leading-relaxed">{answer}</p>
            </div>
            
            {sources.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Sources:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {sources.map((source, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span>{source.filename || source.document_id}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Tips Section - Pinecone inspired */}
      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Tips for Effective Questions</h2>
        </div>
        
        <div className="px-6 py-4">
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Ask specific questions about financial data, metrics, or statements in the report</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Be clear and concise in your questions</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Specify time periods if applicable (e.g., "Q3 2022" or "fiscal year 2023")</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Ask about trends, comparisons, or analyses present in the document</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>The AI can only answer based on information present in your document</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 