# 🤖 LLM Prompt Tester - AWS Bedrock

Aplicação web para testar prompts com Claude 3.5 Sonnet v2 do AWS Bedrock - Deployed via GitHub Actions.

## 🎯 Funcionalidades

- ✅ Interface intuitiva para testar prompts
- ✅ Claude 3.5 Sonnet v2 (modelo mais inteligente)
- ✅ Ajuste de parâmetros (temperatura, max tokens, top-p)
- ✅ Upload de arquivos CSV para S3
- ✅ Processamento de CSV via AWS Lambda
- ✅ Seleção de colunas e tipo de usuário (Aluno/Professor)
- ✅ Visualização de resultados de processamento
- ✅ Backend e Frontend separados (fácil desenvolvimento)

## 🏗️ Arquitetura

**Stack:**
- Backend: Python FastAPI (API REST)
- Frontend: React + Vite + Tailwind CSS
- LLM: AWS Bedrock (Claude 3.5 Sonnet v2)
- Storage: AWS S3 (CSV files)
- Processing: AWS Lambda (CSV processing)

## 📋 Pré-requisitos

- Python 3.9+
- Node.js 18+
- Conta AWS com acesso ao Bedrock
- Credenciais AWS configuradas

## 🚀 Instalação e Execução

### 1. Configurar variáveis de ambiente

```bash
cd backend
copy .env.example .env
# Edite .env com suas credenciais AWS
```

### 2. Executar Backend

```bash
cd backend
py -m pip install -r requirements.txt
cd ..
py -m uvicorn backend.app.main:app --reload --port 8000
```

Backend estará rodando em: http://localhost:8000

### 3. Executar Frontend (em outro terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend estará rodando em: http://localhost:5173 ou http://localhost:3000

## 📦 Acessar a Aplicação

- **Frontend**: http://localhost:5173 (ou porta que o Vite mostrar)
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Health**: http://localhost:8000/api/health

## 🔧 Configuração AWS Bedrock

1. Acesse o console AWS Bedrock
2. Habilite o modelo Claude 3.5 Sonnet v2
3. Configure IAM com permissão: `bedrock:InvokeModel`
4. Use a região us-east-1

## 📄 Endpoints da API

- `GET /api/health` - Verificar status
- `GET /api/models` - Listar modelos disponíveis
- `POST /api/prompt` - Enviar prompt e receber resposta
- `POST /api/upload` - Upload de arquivo CSV para S3
- `POST /api/process` - Processar CSV via Lambda
- `GET /api/files` - Listar arquivos no S3

## 📝 Configuração Adicional

Para usar a funcionalidade de processamento de CSV, configure:

1. Nome do bucket S3 no arquivo `backend/.env`:
   ```
   S3_BUCKET_NAME=seu-bucket-s3-aqui
   ```

2. Nome da função Lambda no arquivo `backend/.env`:
   ```
   LAMBDA_FUNCTION_NAME=sua-funcao-lambda-aqui
   ```

Veja [CONFIGURACAO_AWS.md](./CONFIGURACAO_AWS.md) para detalhes completos sobre permissões e fluxo de processamento.

## 📄 Licença

MIT
