import boto3
from typing import BinaryIO
from datetime import datetime
from botocore.exceptions import ClientError
from .config import get_settings


class S3Client:
    """AWS S3 client wrapper"""
    
    def __init__(self):
        settings = get_settings()
        
        # Initialize boto3 client
        session_kwargs = {"region_name": settings.aws_region}
        
        # Use profile if specified, otherwise use keys
        if settings.aws_profile:
            session_kwargs["profile_name"] = settings.aws_profile
        elif settings.aws_access_key_id and settings.aws_secret_access_key:
            session_kwargs["aws_access_key_id"] = settings.aws_access_key_id
            session_kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        
        session = boto3.Session(**session_kwargs)
        self.client = session.client("s3")
        self.settings = settings
    
    def upload_file(
        self,
        file_content: bytes,
        filename: str,
        content_type: str = "text/csv"
    ) -> dict:
        """
        Upload a file to S3
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            Dict with upload information (bucket, key, url)
        """
        if not self.settings.s3_bucket_name:
            raise ValueError("S3_BUCKET_NAME not configured in environment variables")
        
        try:
            # Generate unique filename with timestamp
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            s3_key = f"{self.settings.s3_upload_folder}/{timestamp}_{filename}"
            
            # Upload to S3
            self.client.put_object(
                Bucket=self.settings.s3_bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    "original_filename": filename,
                    "upload_timestamp": timestamp
                }
            )
            
            # Generate URL (note: this is a simple URL, for signed URLs use generate_presigned_url)
            url = f"https://{self.settings.s3_bucket_name}.s3.{self.settings.aws_region}.amazonaws.com/{s3_key}"
            
            return {
                "bucket": self.settings.s3_bucket_name,
                "key": s3_key,
                "url": url,
                "filename": filename,
                "uploaded_at": timestamp
            }
            
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            raise Exception(f"S3 upload error ({error_code}): {error_message}")
        except Exception as e:
            raise Exception(f"Error uploading file to S3: {str(e)}")
    
    def generate_presigned_url(self, s3_key: str, expiration: int = 3600) -> str:
        """
        Generate a presigned URL for temporary access to a file
        
        Args:
            s3_key: S3 object key
            expiration: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Presigned URL string
        """
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": self.settings.s3_bucket_name,
                    "Key": s3_key
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            raise Exception(f"Error generating presigned URL: {str(e)}")
    
    def list_files(self, prefix: str = None) -> list:
        """
        List files in the S3 bucket
        
        Args:
            prefix: Optional prefix to filter files
            
        Returns:
            List of file information dicts
        """
        try:
            list_params = {"Bucket": self.settings.s3_bucket_name}
            if prefix:
                list_params["Prefix"] = prefix
            else:
                list_params["Prefix"] = self.settings.s3_upload_folder
            
            response = self.client.list_objects_v2(**list_params)
            
            if "Contents" not in response:
                return []
            
            files = []
            for obj in response["Contents"]:
                files.append({
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"].isoformat(),
                    "filename": obj["Key"].split("/")[-1]
                })
            
            return files
            
        except ClientError as e:
            raise Exception(f"Error listing S3 files: {str(e)}")
