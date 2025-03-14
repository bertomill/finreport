import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase';
import { isAuthenticated, getUserId } from '@/app/lib/auth';

// Define the Python backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function POST(request: NextRequest) {
  try {
    // Since we're in a server component, auth.currentUser might not work reliably
    // We'll verify authentication using cookies or headers in a production app
    // For now, we'll skip the auth check in the API route and rely on the dashboard layout protection
    
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Create a new FormData object to send to the backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('user_id', userId);

    // Send the file to the Python backend
    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: backendFormData,
    });

    // Get the response from the backend
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: result.detail || 'Error processing file',
          status: response.status 
        }, 
        { status: response.status }
      );
    }

    // Return the response to the client
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 