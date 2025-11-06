# Configuração AWS

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no arquivo `backend/.env`:

### 1. S3 Bucket
```env
S3_BUCKET_NAME=seu-bucket-s3-aqui
```
- Nome do bucket S3 onde os arquivos CSV serão armazenados
- O bucket deve existir e ter as permissões adequadas

### 2. Função Lambda
```env
LAMBDA_FUNCTION_NAME=sua-funcao-lambda-aqui
```
- Nome da função Lambda que processará os arquivos CSV
- A função Lambda deve ter acesso ao bucket S3 configurado

## Fluxo de Processamento

1. **Upload do CSV**: O arquivo é enviado para o S3
2. **Chamada ao Lambda**: O backend invoca a função Lambda com o seguinte payload:

```json
{
  "body": {
    "csv_key": "nome_do_arquivo.csv",
    "target": "alumno",  // ou "professor"
    "columns": [
      "ÁREA",
      "GRADO",
      "PERÍODO"
    ]
  }
}
```

3. **Resposta do Lambda**: O resultado do processamento é exibido no frontend

## Permissões Necessárias

### IAM Policy para o Backend
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::seu-bucket-s3-aqui/*",
        "arn:aws:s3:::seu-bucket-s3-aqui"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:us-east-1:*:function:sua-funcao-lambda-aqui"
    }
  ]
}
```

### IAM Role para o Lambda
A função Lambda precisa ter:
- Permissão para ler do bucket S3
- Permissão para escrever logs no CloudWatch

## Testando a Configuração

Após configurar, teste o fluxo:
1. Faça upload de um arquivo CSV
2. Selecione "Aluno" ou "Professor"
3. Selecione as colunas desejadas
4. Clique em "Enviar arquivo e processar"
5. O resultado do Lambda aparecerá no campo "Retorno do Processamento"
