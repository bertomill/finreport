import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/firebase';

// Define the Python backend URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the documents from the Python backend
    const response = await fetch(`${BACKEND_URL}/api/documents/${currentUser.uid}`, {
      method: 'GET',
    });

    // Get the response from the backend
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          error: result.detail || 'Error fetching documents',
          status: response.status 
        }, 
        { status: response.status }
      );
    }

    // Return the response to the client
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 