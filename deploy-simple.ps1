# Deploy script for LLM Prompt Tester - AWS Serverless (Windows PowerShell)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  LLM Prompt Tester - Deploy AWS SAM" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações
$REGION = "us-east-1"
$S3_BUCKET = "sant-sumun-dev"
$LAMBDA_FUNCTION = "sumun-preprocess-columns"
$STACK_NAME = "sumun-prompt-tester-stack"
$ECR_REPO_NAME = "sumun-llm-tester-backend"

# Obter Account ID
Write-Host "Obtendo AWS Account ID..." -ForegroundColor Yellow
$ACCOUNT_ID = (aws sts get-caller-identity --query Account --output text)
Write-Host "✓ AWS Account ID: $ACCOUNT_ID" -ForegroundColor Green
Write-Host ""

# Step 1: Criar repositório ECR se não existir
Write-Host "Step 1: Verificando repositório ECR..." -ForegroundColor Yellow
$ecrCheck = aws ecr describe-repositories --repository-names $ECR_REPO_NAME --region $REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  → Criando repositório ECR..." -ForegroundColor Gray
    aws ecr create-repository --repository-name $ECR_REPO_NAME --region $REGION | Out-Null
    Write-Host "  ✓ Repositório ECR criado" -ForegroundColor Green
} else {
    Write-Host "  ✓ Repositório ECR já existe" -ForegroundColor Green
}
Write-Host ""

# Step 2: Build da imagem Docker
Write-Host "Step 2: Build da imagem Docker..." -ForegroundColor Yellow
Set-Location backend
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Erro ao fazer build da imagem" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  ✓ Build concluído" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Step 3: Login no ECR
Write-Host "Step 3: Login no Amazon ECR..." -ForegroundColor Yellow
$loginCmd = "aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
Invoke-Expression $loginCmd | Out-Null
Write-Host "  ✓ Login concluído" -ForegroundColor Green
Write-Host ""

# Step 4: Tag e Push da imagem
Write-Host "Step 4: Push da imagem para ECR..." -ForegroundColor Yellow
docker tag ${ECR_REPO_NAME}:latest "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${ECR_REPO_NAME}:latest"
docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/${ECR_REPO_NAME}:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Erro ao enviar imagem" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Imagem enviada para ECR" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy do SAM
Write-Host "Step 5: Deploy da stack SAM..." -ForegroundColor Yellow
sam deploy --template-file template.yaml --stack-name $STACK_NAME --capabilities CAPABILITY_IAM --region $REGION --parameter-overrides "S3BucketName=$S3_BUCKET" "LambdaProcessingFunctionName=$LAMBDA_FUNCTION" --no-confirm-changeset --resolve-image-repos

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Erro ao fazer deploy da stack" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Stack deployed" -ForegroundColor Green
Write-Host ""

# Step 6: Obter outputs da stack
Write-Host "Step 6: Obtendo URL da API..." -ForegroundColor Yellow
$outputs = aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --output json | ConvertFrom-Json
$stackOutputs = $outputs.Stacks[0].Outputs

$API_URL = ($stackOutputs | Where-Object { $_.OutputKey -eq "ApiUrl" }).OutputValue
$FRONTEND_BUCKET = ($stackOutputs | Where-Object { $_.OutputKey -eq "FrontendBucketName" }).OutputValue
$FRONTEND_URL = ($stackOutputs | Where-Object { $_.OutputKey -eq "FrontendUrl" }).OutputValue

Write-Host "  ✓ API URL: $API_URL" -ForegroundColor Green
Write-Host ""

# Step 7: Atualizar configuração do frontend
Write-Host "Step 7: Atualizando configuração do frontend..." -ForegroundColor Yellow
$envContent = "VITE_API_URL=$API_URL"
Set-Content -Path "frontend\.env.production" -Value $envContent
Write-Host "  ✓ Configuração atualizada" -ForegroundColor Green
Write-Host ""

# Step 8: Build do Frontend
Write-Host "Step 8: Build do Frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Erro ao fazer build do frontend" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "  ✓ Build do frontend concluído" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Step 9: Upload do Frontend para S3
Write-Host "Step 9: Upload do frontend para S3..." -ForegroundColor Yellow
aws s3 sync frontend/dist "s3://$FRONTEND_BUCKET" --delete
Write-Host "  ✓ Frontend enviado para S3" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  ✓ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs da sua aplicação:" -ForegroundColor White
Write-Host "  Frontend: https://$FRONTEND_URL" -ForegroundColor Cyan
Write-Host "  API:      $API_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor White
Write-Host "  1. Acesse o frontend no navegador" -ForegroundColor Gray
Write-Host "  2. Aguarde alguns minutos para o CloudFront propagar" -ForegroundColor Gray
Write-Host "  3. Teste a aplicação" -ForegroundColor Gray
Write-Host ""
