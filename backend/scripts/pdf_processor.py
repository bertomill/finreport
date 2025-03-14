"""
PDF Processor module for financial reports.
This script handles PDF text extraction, cleaning, chunking, and storing in Pinecone.
"""

import os
import tempfile
import time
from typing import List, Dict, Any
import PyPDF2
import tiktoken
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone

# Load environment variables
load_dotenv()

# Initialize embedding model
embeddings = OpenAIEmbeddings(
    model="text-embedding-ada-002",
    api_key=os.getenv("OPENAI_API_KEY")
)

# Initialize Pinecone
pc = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY"),
)

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "finreports")

# Ensure Pinecone index exists, create if it doesn't
def init_pinecone():
    """Initialize Pinecone index if it doesn't exist."""
    try:
        # Check if index exists
        indexes = pc.list_indexes()
        index_names = [index.name for index in indexes.indexes]
        
        if INDEX_NAME not in index_names:
            # Create index
            pc.create_index(
                name=INDEX_NAME,
                dimension=1536,  # dimensionality of text-embedding-ada-002
                metric="cosine",
                spec={
                    "serverless": {
                        "cloud": "aws",
                        "region": os.getenv("PINECONE_ENVIRONMENT", "us-east-1")
                    }
                }
            )
            print(f"Created new Pinecone index: {INDEX_NAME}")
        
        # Get the index
        index = pc.Index(INDEX_NAME)
        
        # Check if the index has the correct dimension
        index_description = pc.describe_index(INDEX_NAME)
        if hasattr(index_description, 'dimension') and index_description.dimension != 1536:
            print(f"WARNING: Pinecone index '{INDEX_NAME}' has dimension {index_description.dimension}, but embeddings use dimension 1536")
            print("Please delete and recreate the index with the correct dimension")
            raise ValueError(f"Pinecone index dimension mismatch: {index_description.dimension} vs 1536")
        
        return index
    except Exception as e:
        print(f"Error initializing Pinecone: {e}")
        raise

# Extract text from PDF
def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file."""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        raise

# Clean extracted text
def clean_text(text: str) -> str:
    """Clean the extracted text by removing extra whitespace and formatting."""
    # Remove multiple newlines
    cleaned = ' '.join(text.split())
    return cleaned

# Split text into chunks
def split_text(text: str) -> List[str]:
    """Split text into manageable chunks."""
    # Create a token splitter
    encoding = tiktoken.get_encoding("cl100k_base")  # OpenAI's encoding
    
    # Function to count tokens
    def tiktoken_len(text):
        tokens = encoding.encode(text)
        return len(tokens)
    
    # Create text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,  # Target chunk size in tokens
        chunk_overlap=50,  # Overlap between chunks
        length_function=tiktoken_len,
        separators=["\n\n", "\n", " ", ""]
    )
    
    # Split the text
    chunks = text_splitter.split_text(text)
    return chunks

# Create document embeddings and save to Pinecone
def process_and_store(file_path: str, metadata: Dict[str, Any]) -> str:
    """
    Process a PDF file and store its chunks in Pinecone.
    
    Args:
        file_path: Path to the PDF file
        metadata: Additional metadata about the document (user_id, filename, etc.)
    
    Returns:
        document_id: The ID of the document in Pinecone
    """
    start_time = time.time()
    print(f"Starting processing for file: {os.path.basename(file_path)}")
    
    # Extract text from PDF
    extract_start = time.time()
    raw_text = extract_text_from_pdf(file_path)
    extract_time = time.time() - extract_start
    print(f"Extracted {len(raw_text)} characters in {extract_time:.2f} seconds")
    
    # Clean the text
    clean_start = time.time()
    cleaned_text = clean_text(raw_text)
    clean_time = time.time() - clean_start
    print(f"Cleaned text in {clean_time:.2f} seconds")
    
    # Split into chunks
    split_start = time.time()
    chunks = split_text(cleaned_text)
    split_time = time.time() - split_start
    print(f"Split into {len(chunks)} chunks in {split_time:.2f} seconds")
    
    # Generate a document ID
    document_id = metadata.get("document_id", f"doc_{os.path.basename(file_path)}_{metadata.get('user_id', 'unknown')}")
    
    # Initialize Pinecone
    pinecone_start = time.time()
    index = init_pinecone()
    pinecone_init_time = time.time() - pinecone_start
    print(f"Initialized Pinecone in {pinecone_init_time:.2f} seconds")
    
    # Create vector records
    embedding_start = time.time()
    vectors = []
    for i, chunk in enumerate(chunks):
        if i % 10 == 0 and i > 0:
            elapsed = time.time() - embedding_start
            print(f"Generated embeddings for {i}/{len(chunks)} chunks in {elapsed:.2f} seconds")
        
        # Create embedding for the chunk
        embedding = embeddings.embed_query(chunk)
        
        # Create a unique ID for this chunk
        chunk_id = f"{document_id}_chunk_{i}"
        
        # Create metadata for this chunk
        chunk_metadata = {
            **metadata,
            "chunk_index": i,
            "text": chunk,
            "document_id": document_id,
            "total_chunks": len(chunks)
        }
        
        # Add to vectors list
        vectors.append({
            "id": chunk_id,
            "values": embedding,
            "metadata": chunk_metadata
        })
    
    embedding_time = time.time() - embedding_start
    print(f"Generated all embeddings in {embedding_time:.2f} seconds (avg: {embedding_time/max(1, len(chunks)):.2f} seconds per chunk)")
    
    # Upsert vectors in batches (Pinecone has limits on batch size)
    upsert_start = time.time()
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i+batch_size]
        batch_start = time.time()
        index.upsert(vectors=batch)
        batch_time = time.time() - batch_start
        print(f"Upserted batch {i//batch_size + 1}/{(len(vectors) + batch_size - 1)//batch_size} in {batch_time:.2f} seconds")
    
    upsert_time = time.time() - upsert_start
    print(f"Upserted all vectors in {upsert_time:.2f} seconds")
    
    total_time = time.time() - start_time
    print(f"Total processing time: {total_time:.2f} seconds for document: {document_id}")
    print(f"Breakdown: Extract: {extract_time:.1f}s, Split: {split_time:.1f}s, Embeddings: {embedding_time:.1f}s, Upsert: {upsert_time:.1f}s")
    
    return document_id

# Main process function to handle uploaded files
def process_file(file_path: str, user_id: str, filename: str) -> Dict[str, Any]:
    """
    Process an uploaded file.
    
    Args:
        file_path: Path to the uploaded file
        user_id: ID of the user who uploaded the file
        filename: Original filename
    
    Returns:
        Dict with processing results
    """
    try:
        # Create metadata
        metadata = {
            "user_id": user_id,
            "filename": filename,
            "source": "upload",
            "document_type": "financial_report"
        }
        
        # Process the file
        document_id = process_and_store(file_path, metadata)
        
        return {
            "success": True,
            "document_id": document_id,
            "message": "File processed successfully."
        }
    except Exception as e:
        print(f"Error processing file: {e}")
        return {
            "success": False,
            "message": f"Error processing file: {str(e)}"
        }

# If run directly, test with a sample file
if __name__ == "__main__":
    sample_path = input("Enter path to a sample PDF file: ")
    if os.path.exists(sample_path):
        result = process_file(sample_path, "test_user", os.path.basename(sample_path))
        print(result)
    else:
        print(f"File not found: {sample_path}") 