"""
Q&A Engine for financial reports.
This script handles question answering based on the processed documents in Pinecone.
"""

import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from pinecone import Pinecone

# Load environment variables
load_dotenv()

# Initialize embedding model
embeddings = OpenAIEmbeddings(
    model="text-embedding-ada-002",
    api_key=os.getenv("OPENAI_API_KEY")
)

# Initialize OpenAI LLM
llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0,
    api_key=os.getenv("OPENAI_API_KEY")
)

# Initialize Pinecone
pc = Pinecone(
    api_key=os.getenv("PINECONE_API_KEY"),
)

INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "finreports")

def get_pinecone_index():
    """Get the Pinecone index."""
    try:
        return pc.Index(INDEX_NAME)
    except Exception as e:
        print(f"Error getting Pinecone index: {e}")
        raise

def retrieve_relevant_chunks(question: str, user_id: str, document_id: str = None, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve relevant chunks from Pinecone based on the question.
    
    Args:
        question: The user's question
        user_id: The user's ID
        document_id: Optional ID of a specific document to search within
        top_k: Number of top chunks to retrieve
        
    Returns:
        List of relevant text chunks with metadata
    """
    try:
        # Get question embedding
        question_embedding = embeddings.embed_query(question)
        
        # Prepare filter for query
        filter_params = {"user_id": user_id}
        if document_id:
            filter_params["document_id"] = document_id
            
        # Query Pinecone
        index = get_pinecone_index()
        query_response = index.query(
            vector=question_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter_params
        )
        
        # Extract and return relevant chunks
        results = []
        for match in query_response.matches:
            if match.score < 0.7:  # Threshold for relevance
                continue
                
            results.append({
                "text": match.metadata.get("text", ""),
                "score": match.score,
                "document_id": match.metadata.get("document_id", ""),
                "filename": match.metadata.get("filename", ""),
                "chunk_index": match.metadata.get("chunk_index", 0)
            })
            
        return results
    except Exception as e:
        print(f"Error retrieving chunks: {e}")
        return []

def generate_answer(question: str, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate an answer based on retrieved chunks.
    
    Args:
        question: The user's question
        chunks: Retrieved relevant chunks
        
    Returns:
        Dictionary with answer and sources
    """
    if not chunks:
        return {
            "answer": "I couldn't find relevant information to answer your question. Please try asking about something that's in your uploaded financial reports.",
            "sources": []
        }
    
    # Prepare context from chunks
    context = "\n\n".join([chunk["text"] for chunk in chunks])
    
    # Prepare the prompt
    prompt = f"""
    You are a financial analyst assistant. Use the following context information from financial reports to answer the question. 
    If you don't know the answer based on the context, say "I don't have enough information to answer this question."
    Don't make up information that's not in the context.

    CONTEXT:
    {context}
    
    QUESTION:
    {question}
    
    ANSWER:
    """
    
    try:
        # Generate answer
        response = llm.invoke(prompt)
        
        # Format and return answer with sources
        source_docs = []
        for chunk in chunks:
            if chunk["filename"] not in [doc["filename"] for doc in source_docs]:
                source_docs.append({
                    "filename": chunk["filename"],
                    "document_id": chunk["document_id"]
                })
        
        return {
            "answer": response.content,
            "sources": source_docs
        }
    except Exception as e:
        print(f"Error generating answer: {e}")
        return {
            "answer": "I encountered an error while trying to answer your question. Please try again later.",
            "sources": []
        }

def answer_question(question: str, user_id: str, document_id: str = None) -> Dict[str, Any]:
    """
    Main function to answer a question about financial reports.
    
    Args:
        question: The user's question
        user_id: The user's ID
        document_id: Optional ID of a specific document to search within
        
    Returns:
        Dictionary with answer and metadata
    """
    try:
        # Retrieve relevant chunks
        relevant_chunks = retrieve_relevant_chunks(question, user_id, document_id)
        
        # Generate answer
        result = generate_answer(question, relevant_chunks)
        
        return {
            "success": True,
            "answer": result["answer"],
            "sources": result["sources"],
            "message": "Question answered successfully."
        }
    except Exception as e:
        print(f"Error answering question: {e}")
        return {
            "success": False,
            "answer": "An error occurred while processing your question.",
            "sources": [],
            "message": f"Error: {str(e)}"
        }

# Example usage
if __name__ == "__main__":
    test_question = input("Enter a test question: ")
    test_user = "test_user"
    
    answer = answer_question(test_question, test_user)
    print("\nAnswer:")
    print(answer["answer"])
    
    if answer["sources"]:
        print("\nSources:")
        for source in answer["sources"]:
            print(f"- {source['filename']}") 