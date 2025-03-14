# Financial Reports Analyzer

An AI-powered application that allows users to upload financial reports (PDFs) and ask questions about their content. The application extracts information from financial documents and provides accurate answers using AI.

## Features

- PDF document upload and processing
- AI-powered question-answering about financial reports
- Clean, modern Pinecone-inspired UI
- User authentication
- Responsive design

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- Firebase Authentication

### Backend
- FastAPI (Python)
- OpenAI API
- Pinecone Vector Database
- PDF processing tools

## Deployment

### Frontend (Vercel)
The frontend is deployed on Vercel:
1. Connect your GitHub repository to Vercel
2. Set the following environment variables:
   - `NEXT_PUBLIC_BACKEND_URL`: URL of your backend API
   - Firebase configuration variables

### Backend (Render)
The backend is deployed on Render:
1. Connect your GitHub repository to Render
2. Set the following environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PINECONE_API_KEY`: Your Pinecone API key
   - `PINECONE_ENVIRONMENT`: Your Pinecone environment
   - `PINECONE_INDEX_NAME`: Your Pinecone index name

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Make sure to set up appropriate environment variables in your local environment or in `.env` files.

## License
[MIT](https://choosealicense.com/licenses/mit/) 