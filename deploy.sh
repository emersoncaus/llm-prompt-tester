#!/bin/bash

# Deploy script for LLM Prompt Tester - AWS Serverless

echo "=========================================="
echo "  LLM Prompt Tester - Deploy AWS SAM"
echo "=========================================="
echo ""

# Configurações
REGION="us-east-1"  # Altere para sua região
S3_BUCKET="llm-prompt-tester-uploads"  # Altere para seu bucket
LAMBDA_FUNCTION="sua-funcao-lambda-aqui"  # Altere para sua função Lambda
STACK_NAME="llm-prompt-tester-stack"
ECR_REPO_NAME="llm-prompt-tester"

# Obter Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✓ AWS Account ID: $ACCOUNT_ID"
echo ""

# Step 1: Criar repositório ECR se não existir
echo "Step 1: Verificando repositório ECR..."
aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $REGION 2>/dev/null
if [ $? -ne 0 ]; then
    echo "  → Criando repositório ECR..."
    aws ecr create-repository --repository-name $ECR_REPO_NAME --region $REGION
    echo "  ✓ Repositório ECR criado"
else
    echo "  ✓ Repositório ECR já existe"
fi
echo ""

# Step 2: Build da imagem Docker
echo "Step 2: Build da imagem Docker..."
cd backend
docker build --platform linux/amd64 -t $ECR_REPO_NAME:latest .
if [ $? -ne 0 ]; then
    echo "  ✗ Erro ao fazer build da imagem"
    exit 1
fi
echo "  ✓ Build concluído"
cd ..
echo ""

# Step 3: Login no ECR
echo "Step 3: Login no Amazon ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
echo "  ✓ Login concluído"
echo ""

# Step 4: Tag e Push da imagem
echo "Step 4: Push da imagem para ECR..."
docker tag $ECR_REPO_NAME:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME:latest
echo "  ✓ Imagem enviada para ECR"
echo ""

# Step 5: Deploy do SAM
echo "Step 5: Deploy da stack SAM..."
sam deploy \
  --template-file template.yaml \
  --stack-name $STACK_NAME \
  --capabilities CAPABILITY_IAM \
  --region $REGION \
  --parameter-overrides \
    S3BucketName=$S3_BUCKET \
    LambdaProcessingFunctionName=$LAMBDA_FUNCTION \
  --no-confirm-changeset \
  --resolve-image-repos

if [ $? -ne 0 ]; then
    echo "  ✗ Erro ao fazer deploy da stack"
    exit 1
fi
echo "  ✓ Stack deployed"
echo ""

# Step 6: Build do Frontend
echo "Step 6: Build do Frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "  ✗ Erro ao fazer build do frontend"
    exit 1
fi
echo "  ✓ Build do frontend concluído"
cd ..
echo ""

# Step 7: Obter nome do bucket do frontend
echo "Step 7: Obtendo configurações da stack..."
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

API_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

FRONTEND_URL=$(aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" \
  --output text)

echo "  ✓ Configurações obtidas"
echo ""

# Step 8: Upload do Frontend para S3
echo "Step 8: Upload do frontend para S3..."
aws s3 sync frontend/dist s3://$FRONTEND_BUCKET --delete
echo "  ✓ Frontend enviado para S3"
echo ""

# Step 9: Invalidar cache do CloudFront
echo "Step 9: Invalidando cache do CloudFront..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[0].DomainName=='$FRONTEND_BUCKET.s3.$REGION.amazonaws.com'].Id" \
  --output text)

if [ ! -z "$DISTRIBUTION_ID" ]; then
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    echo "  ✓ Cache invalidado"
else
    echo "  ⚠ Distribuição CloudFront não encontrada"
fi
echo ""

echo "=========================================="
echo "  ✓ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=========================================="
echo ""
echo "URLs da sua aplicação:"
echo "  Frontend: https://$FRONTEND_URL"
echo "  API:      $API_URL"
echo ""
echo "Próximos passos:"
echo "  1. Acesse o frontend no navegador"
echo "  2. Configure as variáveis de ambiente se necessário"
echo "  3. Teste a aplicação"
echo ""
