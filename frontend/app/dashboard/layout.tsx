"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Sidebar from '../components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in with Firebase
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          email: firebaseUser.email || 'Anonymous User',
        });
      } else {
        // User is signed out
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect happens automatically through the onAuthStateChanged listener
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar - Pinecone inspired */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex-shrink-0">
        <div className="p-6 flex items-center space-x-4">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-lg">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
        </div>
        
        <nav className="mt-4">
          <div className="px-4 pb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Main</p>
          </div>
          
          <a href="/dashboard" className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Dashboard
          </a>
          
          <a href="/dashboard/upload" className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload
          </a>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header - Pinecone inspired */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800">Financial Reporter</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 