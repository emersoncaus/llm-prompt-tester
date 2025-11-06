from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


class PromptRequest(BaseModel):
    """Request model for prompt invocation"""
    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "prompt": "Explique o que é inteligência artificial em termos simples",
                "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
                "temperature": 0.7,
                "max_tokens": 2048,
                "top_p": 0.9
            }
        }
    )
    
    prompt: str = Field(..., min_length=1, description="The prompt text")
    model_id: str = Field(..., description="Bedrock model ID")
    temperature: float = Field(default=0.7, ge=0.0, le=1.0, description="Sampling temperature")
    max_tokens: int = Field(default=2048, ge=1, le=4096, description="Maximum tokens to generate")
    top_p: float = Field(default=0.9, ge=0.0, le=1.0, description="Top-p sampling")


class PromptResponse(BaseModel):
    """Response model for prompt invocation"""
    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "response_text": "Inteligência artificial é...",
                "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
                "tokens_used": 150,
                "response_time_ms": 1234,
                "timestamp": "2024-11-03T10:30:00"
            }
        }
    )
    
    response_text: str
    model_id: str
    tokens_used: Optional[int] = None
    response_time_ms: int
    timestamp: str


class ModelInfo(BaseModel):
    """Model information"""
    model_config = ConfigDict(
        protected_namespaces=(),
        json_schema_extra={
            "example": {
                "model_id": "anthropic.claude-3-sonnet-20240229-v1:0",
                "provider": "Anthropic",
                "name": "Claude 3 Sonnet",
                "description": "Balanced model for most tasks",
                "supported": True
            }
        }
    )
    
    model_id: str
    provider: str
    name: str
    description: str
    supported: bool = True


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None
    timestamp: str


class FileUploadResponse(BaseModel):
    """File upload response model"""
    success: bool
    bucket: str
    key: str
    url: str
    filename: str
    uploaded_at: str
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "bucket": "my-bucket",
                "key": "uploads/20241105_120000_data.csv",
                "url": "https://my-bucket.s3.us-east-1.amazonaws.com/uploads/20241105_120000_data.csv",
                "filename": "data.csv",
                "uploaded_at": "20241105_120000",
                "message": "File uploaded successfully"
            }
        }


class S3FileInfo(BaseModel):
    """S3 file information"""
    key: str
    size: int
    last_modified: str
    filename: str


class ProcessRequest(BaseModel):
    """Request model for Lambda processing"""
    body: Dict[str, Any] = Field(
        ...,
        description="Lambda payload body",
        json_schema_extra={
            "example": {
                "csv_key": "dados_mockados_todos_alunos.csv",
                "target": "alumno",
                "columns": ["ÁREA", "GRADO", "PERÍODO"]
            }
        }
    )


class ProcessResponse(BaseModel):
    """Response model for Lambda processing"""
    success: bool
    data: Any  # Pode ser string ou dict
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"processed_rows": 100},
                "message": "File processed successfully"
            }
        }

