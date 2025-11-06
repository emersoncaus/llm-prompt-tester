import json
import boto3
from typing import Dict, Any, List
from botocore.exceptions import ClientError
from .config import get_settings
from .models import ModelInfo


class BedrockClient:
    """AWS Bedrock client wrapper"""
    
    # Available models in Bedrock
    AVAILABLE_MODELS = [
        ModelInfo(
            model_id="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
            provider="Anthropic",
            name="Claude 3.5 Sonnet v2",
            description="Most intelligent model, best for complex tasks"
        ),
    ]
    
    def __init__(self):
        settings = get_settings()
        
        # Initialize boto3 client
        # When running in Lambda, boto3 automatically uses the execution role
        # When running locally, it will use profile or credentials if specified
        session_kwargs = {"region_name": settings.aws_region}
        
        # Only use profile/keys if explicitly configured (for local development)
        if settings.aws_profile:
            session_kwargs["profile_name"] = settings.aws_profile
        elif settings.aws_access_key_id and settings.aws_secret_access_key:
            session_kwargs["aws_access_key_id"] = settings.aws_access_key_id
            session_kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
        
        # Create session - if no credentials specified, boto3 will use default credential chain
        # In Lambda, this automatically uses the execution role
        if len(session_kwargs) == 1:  # Only region specified
            # Use default credential chain (execution role in Lambda)
            self.client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        else:
            session = boto3.Session(**session_kwargs)
            self.client = session.client("bedrock-runtime")
    
    def get_available_models(self) -> List[ModelInfo]:
        """Get list of available models"""
        return self.AVAILABLE_MODELS
    
    def invoke_model(
        self,
        prompt: str,
        model_id: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        top_p: float = 0.9
    ) -> Dict[str, Any]:
        """
        Invoke a Bedrock model with the given prompt
        
        Args:
            prompt: The input prompt
            model_id: Bedrock model ID
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate
            top_p: Top-p sampling parameter
            
        Returns:
            Dict with response text and metadata
        """
        try:
            # Build request body based on provider
            if "anthropic" in model_id:
                body = self._build_anthropic_request(prompt, temperature, max_tokens, top_p)
            elif "meta.llama" in model_id:
                body = self._build_llama_request(prompt, temperature, max_tokens, top_p)
            elif "amazon.titan" in model_id:
                body = self._build_titan_request(prompt, temperature, max_tokens, top_p)
            else:
                raise ValueError(f"Unsupported model: {model_id}")
            
            # Invoke model
            response = self.client.invoke_model(
                modelId=model_id,
                body=json.dumps(body)
            )
            
            # Parse response
            response_body = json.loads(response["body"].read())
            
            # Extract text based on provider
            if "anthropic" in model_id:
                response_text = response_body["content"][0]["text"]
                tokens_used = response_body.get("usage", {}).get("output_tokens")
            elif "meta.llama" in model_id:
                response_text = response_body["generation"]
                tokens_used = response_body.get("generation_token_count")
            elif "amazon.titan" in model_id:
                response_text = response_body["results"][0]["outputText"]
                tokens_used = response_body.get("inputTextTokenCount", 0) + \
                             response_body["results"][0].get("tokenCount", 0)
            else:
                response_text = str(response_body)
                tokens_used = None
            
            return {
                "response_text": response_text,
                "tokens_used": tokens_used,
                "model_id": model_id
            }
            
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]
            raise Exception(f"Bedrock error ({error_code}): {error_message}")
        except Exception as e:
            raise Exception(f"Error invoking model: {str(e)}")
    
    def _build_anthropic_request(
        self, prompt: str, temperature: float, max_tokens: int, top_p: float
    ) -> Dict[str, Any]:
        """Build request body for Anthropic models"""
        return {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
    
    def _build_llama_request(
        self, prompt: str, temperature: float, max_tokens: int, top_p: float
    ) -> Dict[str, Any]:
        """Build request body for Llama models"""
        return {
            "prompt": prompt,
            "temperature": temperature,
            "top_p": top_p,
            "max_gen_len": max_tokens
        }
    
    def _build_titan_request(
        self, prompt: str, temperature: float, max_tokens: int, top_p: float
    ) -> Dict[str, Any]:
        """Build request body for Amazon Titan models"""
        return {
            "inputText": prompt,
            "textGenerationConfig": {
                "temperature": temperature,
                "topP": top_p,
                "maxTokenCount": max_tokens
            }
        }
