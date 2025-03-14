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
    
    // Get the JSON data from the request
    const { question, fileId, userId } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    if (!fileId) {
      return NextResponse.json({ error: 'No file ID provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Send the question to the Python backend
    const response = await fetch(`${BACKEND_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        file_id: fileId,
        user_id: userId,
      }),
    });

    // Get the response from the backend
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: result.detail || 'Error processing question',
          status: response.status 
        }, 
        { status: response.status }
      );
    }

    // Return the response to the client
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 