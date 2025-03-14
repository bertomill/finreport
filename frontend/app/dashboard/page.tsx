"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Get user info from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Extract name from email (before @)
        const name = userData.email.split('@')[0];
        // Capitalize first letter of each word
        setUserName(name.split('.').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '));
      } catch (error) {
        console.error('Failed to parse user data', error);
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Upload Report Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome, {userName || 'User'}</h2>
        <p className="text-gray-600 mb-6">
          Upload a financial report to get started. Our AI will analyze it and provide useful insights.
        </p>
        <Link 
          href="/dashboard/upload"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload a Report
        </Link>
      </section>
    </div>
  );
} 