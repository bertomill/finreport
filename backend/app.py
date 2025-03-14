"""
FastAPI server for the financial report analyzer.
"""

import os
import tempfile
import uuid
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# Import our processing scripts
from scripts.pdf_processor import process_file
from scripts.qa_engine import answer_question

# Load environment variables
load_dotenv()

app = FastAPI(title="Financial Report Analyzer API")

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request and response models
class QuestionRequest(BaseModel):
    question: str
    user_id: str
    document_id: Optional[str] = None
    file_id: Optional[str] = None  # Alternative name to match frontend

class QuestionResponse(BaseModel):
    success: bool
    answer: str
    sources: List[Dict[str, str]]
    message: str

class ProcessResponse(BaseModel):
    success: bool
    document_id: Optional[str] = None
    message: str

# API routes
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "API is running"}

@app.post("/api/upload", response_model=ProcessResponse)
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    Upload and process a financial report.
    
    Args:
        file: The PDF file to upload
        user_id: The ID of the user uploading the file
    
    Returns:
        ProcessResponse: The result of processing the file
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    # Save the file temporarily
    try:
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
        
        with open(temp_file_path, "wb") as f:
            f.write(await file.read())
        
        # Process the file
        result = process_file(temp_file_path, user_id, file.filename)
        
        # Clean up the temporary file
        os.remove(temp_file_path)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        
        return result
    except Exception as e:
        # Make sure to clean up in case of error
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/api/question", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest):
    """
    Answer a question about financial reports.
    
    Args:
        request: QuestionRequest with the question and user info
    
    Returns:
        QuestionResponse: The answer to the question
    """
    try:
        # Use file_id as document_id if provided
        doc_id = request.document_id or request.file_id
        
        result = answer_question(
            question=request.question,
            user_id=request.user_id,
            document_id=doc_id
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering question: {str(e)}")

# Add an alias endpoint for /api/query to match frontend expectations
@app.post("/api/query", response_model=QuestionResponse)
async def query_document(request: QuestionRequest):
    """Alias for the ask_question endpoint to match frontend calls."""
    return await ask_question(request)

@app.get("/api/documents/{user_id}")
async def get_user_documents(user_id: str):
    """
    Get a list of documents uploaded by a user.
    
    Args:
        user_id: The ID of the user
    
    Returns:
        List of document metadata
    """
    # TODO: Implement this by querying Pinecone for unique document IDs
    # This is a placeholder implementation
    return {
        "success": True,
        "documents": [],
        "message": "This endpoint is not yet fully implemented"
    }

# Run the server if executed as a script
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    host = os.getenv("HOST", "0.0.0.0")
    
    if os.getenv("ENVIRONMENT") == "production":
        # Let gunicorn handle this
        pass
    else:
        # Development mode
        uvicorn.run(
            "app:app",
            host=host,
            port=port,
            reload=True
        ) 