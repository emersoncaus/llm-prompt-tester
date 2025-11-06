from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import time
from datetime import datetime
from typing import List

from .config import get_settings
from .models import (
    PromptRequest, PromptResponse, ModelInfo, ErrorResponse, 
    FileUploadResponse, S3FileInfo, ProcessRequest, ProcessResponse
)
from .bedrock_client import BedrockClient
from .s3_client import S3Client
from .lambda_client import LambdaClient

# Initialize FastAPI app
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    description="Test LLM prompts with AWS Bedrock models",
    version="1.0.0"
)

# Configure CORS - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Bedrock client
bedrock_client = BedrockClient()

# Initialize S3 client
s3_client = S3Client()

# Initialize Lambda client
lambda_client = LambdaClient()

# API Routes
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/models", response_model=List[ModelInfo])
async def get_models():
    """Get list of available Bedrock models"""
    try:
        models = bedrock_client.get_available_models()
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/prompt", response_model=PromptResponse)
async def invoke_prompt(request: PromptRequest):
    """
    Invoke a Bedrock model with the provided prompt
    """
    try:
        start_time = time.time()
        
        # Invoke Bedrock model
        result = bedrock_client.invoke_model(
            prompt=request.prompt,
            model_id=request.model_id,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            top_p=request.top_p
        )
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Build response
        response = PromptResponse(
            response_text=result["response_text"],
            model_id=result["model_id"],
            tokens_used=result.get("tokens_used"),
            response_time_ms=response_time_ms,
            timestamp=datetime.utcnow().isoformat()
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing prompt: {str(e)}"
        )


@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload a CSV file to S3
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=400,
                detail="Only CSV files are allowed"
            )
        
        # Read file content
        content = await file.read()
        
        # Upload to S3
        result = s3_client.upload_file(
            file_content=content,
            filename=file.filename,
            content_type="text/csv"
        )
        
        return FileUploadResponse(
            success=True,
            bucket=result["bucket"],
            key=result["key"],
            url=result["url"],
            filename=result["filename"],
            uploaded_at=result["uploaded_at"],
            message="File uploaded successfully to S3"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )


@app.get("/api/files", response_model=List[S3FileInfo])
async def list_uploaded_files():
    """
    List all uploaded CSV files from S3
    """
    try:
        files = s3_client.list_files()
        return files
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing files: {str(e)}"
        )


@app.post("/api/process", response_model=ProcessResponse)
async def process_csv(request: ProcessRequest):
    """
    Process CSV file using AWS Lambda
    """
    try:
        body = request.body
        
        # Validate required fields
        if 'csv_key' not in body:
            raise HTTPException(
                status_code=400,
                detail="csv_key is required in body"
            )
        if 'target' not in body:
            raise HTTPException(
                status_code=400,
                detail="target is required in body"
            )
        if 'columns' not in body or not isinstance(body['columns'], list):
            raise HTTPException(
                status_code=400,
                detail="columns must be a list"
            )
        
        # Invoke Lambda function
        result = lambda_client.invoke_processing(
            csv_key=body['csv_key'],
            target=body['target'],
            columns=body['columns']
        )
        
        return ProcessResponse(
            success=True,
            data=result,
            message="CSV file processed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing CSV: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "message": "LLM Prompt Tester API - Backend is running!",
        "version": "1.0.0",
        "api_docs": "/docs",
        "endpoints": {
            "health": "/api/health",
            "models": "/api/models",
            "prompt": "/api/prompt"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
