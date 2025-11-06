# 🚀 Guia de Início Rápido

## Passo 1: Configurar AWS Credentials

Copie o arquivo de exemplo:
```bash
cd backend
copy .env.example .env
```

Edite `backend/.env` e adicione suas credenciais AWS:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
```

## Passo 2: Instalar Dependências

### Backend (Python):
```bash
cd backend
py -m pip install -r requirements.txt
cd ..
```

### Frontend (Node.js):
```bash
cd frontend
npm install
cd ..
```

## Passo 3: Executar em Desenvolvimento

### Terminal 1 - Backend:
```bash
py -m uvicorn backend.app.main:app --reload --port 8000
```

Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173 (ou porta que aparecer)

## ✅ Pronto!

- Acesse o frontend no navegador
- Teste seus prompts com Claude 3.5 Sonnet v2
- Ajuste os parâmetros conforme necessário

## 🔧 Troubleshooting

**Erro de credenciais AWS:**
- Verifique se o `.env` está configurado corretamente
- Teste com AWS CLI: `aws bedrock list-foundation-models --region us-east-1`

**Modelo não disponível:**
- Acesse o console AWS Bedrock
- Habilite o Claude 3.5 Sonnet v2 na sua região

**Erro de CORS:**
- Backend deve estar em http://localhost:8000
- Frontend em http://localhost:5173 ou :3000

**Backend não inicia:**
- Use `py` ao invés de `python` no Windows
- Verifique se todas as dependências foram instaladas
