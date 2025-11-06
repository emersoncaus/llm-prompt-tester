# Instalação de Ferramentas Necessárias

## 1. AWS CLI

### Windows (via MSI Installer - Recomendado)
1. Baixe o instalador: https://awscli.amazonaws.com/AWSCLIV2.msi
2. Execute o instalador e siga as instruções
3. Abra um novo PowerShell e verifique:
```powershell
aws --version
```

### Configurar credenciais AWS
```powershell
aws configure
```
Você precisará:
- AWS Access Key ID (obtenha no console AWS → IAM → Users → Security credentials)
- AWS Secret Access Key (mesma página)
- Default region: `us-east-1` (ou sua preferida)
- Default output format: `json`

---

## 2. AWS SAM CLI

### Windows
1. Baixe o instalador: https://github.com/aws/aws-sam-cli/releases/latest/download/AWS_SAM_CLI_64_PY3.msi
2. Execute o instalador
3. Abra um novo PowerShell e verifique:
```powershell
sam --version
```

---

## 3. Docker Desktop

### Windows
1. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop
2. Execute o instalador
3. Reinicie o computador se solicitado
4. Abra o Docker Desktop (deixe ele rodando em background)
5. Verifique:
```powershell
docker --version
docker ps
```

**Importante:** O Docker Desktop deve estar rodando sempre que for fazer deploy!

---

## 4. Node.js (você já tem!)

Apenas para confirmar que está funcionando:
```powershell
node --version
npm --version
```

---

## Verificação Final

Execute todos os comandos abaixo para confirmar que tudo está instalado:

```powershell
# AWS CLI
aws --version

# SAM CLI
sam --version

# Docker
docker --version

# Node.js
node --version
npm --version
```

Se todos mostrarem versões, você está pronto para fazer deploy! 🚀

---

## Próximo Passo

Depois de instalar tudo, volte para o arquivo `DEPLOY.md` e siga o guia de deploy!
