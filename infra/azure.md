# Deploy no Azure Container Apps

1. Crie o registro e o ambiente:
   `az group create -n tem-direito -l brazilsouth`
   `az acr create -g tem-direito -n temdireitoacr --sku Basic`
   `az containerapp env create -g tem-direito -n tem-direito-env -l brazilsouth`
2. Publique as imagens: `az acr build -r temdireitoacr -t backend:1 backend/` (repita para `ia-service` e `frontend`).
3. Crie os apps (backend e ia-service com ingress interno; frontend com ingress externo na porta 8080).
   Segredos como *secrets* do Container App: `JWT_SEGREDO`, `CRIPTO_CHAVE`, `HASH_SAL`, `DB_PASSWORD`,
   `ANTHROPIC_API_KEY`, credenciais do Twilio (`APP_SMS_PROVIDER=twilio`).
4. Banco: Oracle Autonomous Database ou Oracle em VM; backend com `SPRING_PROFILES_ACTIVE=oracle` e `DB_URL`.
5. Em produção, `APP_DEMO=false` e `APP_EXPOR_CODIGO_TESTE=false` (o código de verificação nunca aparece na tela).
