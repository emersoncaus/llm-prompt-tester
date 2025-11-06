# Guia de Deploy - LLM Prompt Tester (AWS Serverless)

## Pré-requisitos

Antes de fazer o deploy, você precisa instalar e configurar:

### 1. AWS CLI
```powershell
# Baixe e instale de: https://aws.amazon.com/cli/

# Configure suas credenciais
aws configure
# AWS Access Key ID: [sua chave]
# AWS Secret Access Key: [sua chave secreta]
# Default region name: us-east-1
# Default output format: json
```

### 2. AWS SAM CLI
```powershell
# Baixe e instale de: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Verifique a instalação
sam --version
```

### 3. Docker Desktop
```powershell
# Baixe e instale de: https://www.docker.com/products/docker-desktop

# Verifique a instalação
docker --version
```

### 4. Node.js (já tem instalado)
```powershell
node --version
npm --version
```

---

## Configuração antes do Deploy

### 1. Edite o arquivo `deploy.ps1`:

Abra `deploy.ps1` e altere as seguintes variáveis no início do arquivo:

```powershell
$REGION = "us-east-1"  # Região AWS (mantenha ou altere)
$S3_BUCKET = "seu-bucket-s3-uploads"  # Nome do bucket S3 para CSV
$LAMBDA_FUNCTION = "sua-funcao-lambda-processamento"  # Nome da Lambda de processamento
```

### 2. Certifique-se que o Docker está rodando

Abra o Docker Desktop antes de executar o deploy.

---

## Deploy Passo a Passo

### Opção 1: Deploy Automático (Recomendado)

Execute o script PowerShell:

```powershell
# No terminal PowerShell, na pasta do projeto
.\deploy.ps1
```

O script vai:
1. ✓ Criar repositório ECR (Docker)
2. ✓ Build da imagem Docker do backend
3. ✓ Fazer push da imagem para ECR
4. ✓ Deploy da infraestrutura (API Gateway, Lambda, S3, CloudFront)
5. ✓ Build do frontend
6. ✓ Upload do frontend para S3
7. ✓ Configurar CloudFront

**Tempo estimado: 10-15 minutos**

---

### Opção 2: Deploy Manual (se tiver problemas)

#### Passo 1: Criar repositório ECR
```powershell
aws ecr create-repository --repository-name llm-prompt-tester --region us-east-1
```

#### Passo 2: Build e Push da imagem Docker
```powershell
# Obter Account ID
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text

# Build
cd backend
docker build --platform linux/amd64 -t llm-prompt-tester:latest .

# Login no ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"

# Tag e Push
docker tag llm-prompt-tester:latest "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/llm-prompt-tester:latest"
docker push "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/llm-prompt-tester:latest"

cd ..
```

#### Passo 3: Deploy SAM
```powershell
sam deploy `
  --template-file template.yaml `
  --stack-name llm-prompt-tester-stack `
  --capabilities CAPABILITY_IAM `
  --region us-east-1 `
  --parameter-overrides S3BucketName=seu-bucket LambdaProcessingFunctionName=sua-lambda `
  --resolve-image-repos
```

#### Passo 4: Obter URL da API
```powershell
$API_URL = aws cloudformation describe-stacks `
  --stack-name llm-prompt-tester-stack `
  --region us-east-1 `
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" `
  --output text

Write-Host "API URL: $API_URL"
```

#### Passo 5: Configurar e Build Frontend
```powershell
# Criar arquivo .env.production
"VITE_API_URL=$API_URL" | Out-File -FilePath frontend\.env.production

# Build
cd frontend
npm run build
cd ..
```

#### Passo 6: Upload Frontend para S3
```powershell
$FRONTEND_BUCKET = aws cloudformation describe-stacks `
  --stack-name llm-prompt-tester-stack `
  --region us-east-1 `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
  --output text

aws s3 sync frontend/dist s3://$FRONTEND_BUCKET --delete
```

#### Passo 7: Obter URL do CloudFront
```powershell
$FRONTEND_URL = aws cloudformation describe-stacks `
  --stack-name llm-prompt-tester-stack `
  --region us-east-1 `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendUrl'].OutputValue" `
  --output text

Write-Host "Frontend URL: https://$FRONTEND_URL"
```

---

## Atualizar a Aplicação

Quando fizer mudanças no código:

### Atualizar Backend:
```powershell
# Build nova imagem
cd backend
docker build --platform linux/amd64 -t llm-prompt-tester:latest .

# Push para ECR
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
docker tag llm-prompt-tester:latest "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/llm-prompt-tester:latest"
docker push "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/llm-prompt-tester:latest"

# Atualizar Lambda
aws lambda update-function-code `
  --function-name llm-prompt-tester-stack-BackendFunction-XXXXX `
  --image-uri "$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/llm-prompt-tester:latest"
```

### Atualizar Frontend:
```powershell
# Build
cd frontend
npm run build

# Upload para S3
$FRONTEND_BUCKET = aws cloudformation describe-stacks `
  --stack-name llm-prompt-tester-stack `
  --region us-east-1 `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
  --output text

aws s3 sync dist s3://$FRONTEND_BUCKET --delete

# Invalidar cache CloudFront (opcional, mas recomendado)
# Obter Distribution ID no console AWS CloudFront
aws cloudfront create-invalidation --distribution-id SEU_DISTRIBUTION_ID --paths "/*"
```

---

## Deletar Tudo (Remover da AWS)

Se quiser remover completamente:

```powershell
# 1. Esvaziar bucket do frontend
$FRONTEND_BUCKET = aws cloudformation describe-stacks `
  --stack-name llm-prompt-tester-stack `
  --region us-east-1 `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
  --output text

aws s3 rm s3://$FRONTEND_BUCKET --recursive

# 2. Deletar stack CloudFormation
aws cloudformation delete-stack --stack-name llm-prompt-tester-stack --region us-east-1

# 3. Deletar repositório ECR
aws ecr delete-repository --repository-name llm-prompt-tester --force --region us-east-1
```

---

## Custos Estimados

Para uma aplicação de **teste/uso esporádico**:

- **Lambda**: ~$0-5/mês (apenas quando usar)
- **API Gateway**: ~$0-3/mês (apenas quando usar)
- **S3**: ~$0.50/mês (armazenamento mínimo)
- **CloudFront**: ~$0-2/mês (tráfego baixo)

**Total: ~$0-10/mês** (provavelmente menos de $5)

Se não usar, pode chegar a **$0-2/mês** apenas pelo armazenamento.

---

## Troubleshooting

### Erro: "Docker daemon is not running"
- Abra o Docker Desktop e aguarde iniciar

### Erro: "Unable to locate credentials"
- Execute `aws configure` novamente

### Erro: "Access Denied"
- Verifique se suas credenciais AWS têm as permissões necessárias:
  - ECR (criar repositório, push images)
  - Lambda (criar funções)
  - API Gateway (criar APIs)
  - S3 (criar buckets)
  - CloudFront (criar distribuições)
  - CloudFormation (criar stacks)

### Frontend não carrega
- Aguarde 5-10 minutos para o CloudFront propagar
- Verifique se o build foi feito corretamente

### API não responde
- Verifique os logs no CloudWatch
- Confirme que a imagem Docker foi enviada corretamente

---

## Próximos Passos

Após o deploy:

1. ✓ Acesse a URL do CloudFront
2. ✓ Teste o upload de CSV
3. ✓ Teste o envio de prompts
4. ✓ Configure domínio personalizado (opcional)
5. ✓ Configure HTTPS personalizado (opcional)

Divirta-se! 🚀
