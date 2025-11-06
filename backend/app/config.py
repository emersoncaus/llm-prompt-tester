from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""
    
    # AWS Configuration
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_profile: str = ""
    
    # S3 Configuration
    s3_bucket_name: str = ""  # Nome do bucket S3
    s3_upload_folder: str = "uploads"  # Pasta dentro do bucket
    
    # Lambda Configuration
    lambda_function_name: str = ""  # Nome da função Lambda
    
    # Application
    app_name: str = "LLM Prompt Tester"
    debug: bool = True
    
    class Config:
        env_file = str(Path(__file__).parent.parent / ".env")
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
