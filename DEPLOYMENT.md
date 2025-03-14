# Deployment Guide for Financial Reports Analyzer

This guide will walk you through deploying both the frontend and backend components of the Financial Reports Analyzer application.

## Prerequisites

Before deploying, you'll need:

1. A [Firebase](https://firebase.google.com/) project for authentication
2. An [OpenAI](https://openai.com/) API key
3. A [Pinecone](https://www.pinecone.io/) account and API key
4. Accounts on [Vercel](https://vercel.com/) and [Render](https://render.com/)

## 1. Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable Authentication and add Email/Password as a sign-in method
4. Go to Project Settings → General and scroll down to "Your apps"
5. Click the web icon (`</>`) to add a web app
6. Register your app with a nickname (e.g., "FinReports")
7. Copy the Firebase configuration object (you'll need this for deployment)

## 2. Pinecone Setup

1. Sign up/Login to [Pinecone](https://www.pinecone.io/)
2. Create a new index with the following settings:
   - Name: `finreports` (or your preferred name)
   - Dimensions: 1536 (for OpenAI embeddings)
   - Metric: cosine
3. Copy your API key, environment, and index name

## 3. Frontend Deployment (Vercel)

1. Go to [Vercel](https://vercel.com/) and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `bertomill/finreport`
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: (leave as default)
   - Output Directory: (leave as default)
5. Add the following environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`: The URL of your backend after deployment (you can add this later)
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID
6. Click "Deploy"

## 4. Backend Deployment (Render)

1. Go to [Render](https://render.com/) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository: `bertomill/finreport`
4. Configure the service:
   - Name: `finreports-backend`
   - Root Directory: `.`
   - Environment: Python
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && gunicorn -c gunicorn_config.py app:app`
5. Add the following environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PINECONE_API_KEY`: Your Pinecone API key
   - `PINECONE_ENVIRONMENT`: Your Pinecone environment (e.g., `us-east-1-gcp`)
   - `PINECONE_INDEX_NAME`: Your Pinecone index name (e.g., `finreports`)
   - `PORT`: `10000`
   - `ENVIRONMENT`: `production`
6. In the "Advanced" settings:
   - Set Auto-Deploy to "Yes"
7. Click "Create Web Service"

## 5. Connect Frontend to Backend

1. Once your backend is deployed, copy the URL (e.g., `https://finreports-backend.onrender.com`)
2. Go to your Vercel project for the frontend
3. Navigate to Settings → Environment Variables
4. Update `NEXT_PUBLIC_BACKEND_URL` with the backend URL
5. Click "Save" and redeploy if necessary

## 6. CORS Configuration (if needed)

If you experience CORS issues:

1. Navigate to your backend code (`backend/app.py`)
2. Update the CORS configuration to include your frontend domain:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

3. Commit and push these changes
4. Your backend will automatically redeploy on Render

## Troubleshooting

### Backend Issues
- Check Render logs for Python errors
- Verify environment variables are set correctly
- Ensure Pinecone index is properly configured

### Frontend Issues
- Check Vercel build logs for errors
- Verify all Firebase configuration values are correct
- Ensure the backend URL is correct and the backend is running

## Maintenance

- Both Vercel and Render will automatically deploy when you push changes to the main branch
- Monitor your OpenAI and Pinecone usage to avoid unexpected charges
- Regularly update dependencies to ensure security and functionality 