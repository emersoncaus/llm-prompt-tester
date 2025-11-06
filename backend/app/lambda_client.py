import json
import boto3

class LambdaClient:
    """Client for invoking AWS Lambda functions"""
    
    def __init__(self):
        # Hardcoded configuration for simplicity
        # In Lambda, boto3 automatically uses the execution role
        self.lambda_client = boto3.client('lambda', region_name="us-east-1")
        self.function_name = "sumun-preprocess-columns"
    
    def invoke_processing(self, csv_key: str, target: str, columns: list) -> dict:
        """
        Invoke Lambda function to process CSV file
        
        Args:
            csv_key: S3 key of the CSV file
            target: Target type ('alumno' or 'professor')
            columns: List of column names to process
            
        Returns:
            dict: Lambda function response
        """
        payload = {
            'body': {
                'csv_key': csv_key,
                'target': target,
                'columns': columns
            }
        }
        
        try:
            response = self.lambda_client.invoke(
                FunctionName=self.function_name,
                InvocationType='RequestResponse',  # Synchronous invocation
                Payload=json.dumps(payload)
            )
            
            # Parse response
            response_payload = json.loads(response['Payload'].read())
            
            # Check for Lambda errors
            if 'FunctionError' in response:
                raise Exception(f"Lambda error: {response_payload}")
            
            # Extract only the 'data' field if it exists
            if isinstance(response_payload, dict) and 'data' in response_payload:
                return response_payload['data']
            
            return response_payload
            
        except Exception as e:
            raise Exception(f"Failed to invoke Lambda: {str(e)}")
