# Colocar o Tem Direito no ar (Render, plano gratuito)

O arquivo `render.yaml` na raiz descreve os três serviços. O Render lê esse arquivo e cria tudo.

## Passo a passo

1. Entre em https://render.com e crie a conta com **Sign in with GitHub** (use a conta dona do repositório).
2. No painel do Render: **New → Blueprint**.
3. Autorize o acesso ao repositório `mduartte/tem_direito_GS` e selecione-o.
4. O Render mostra os três serviços (`tem-direito-ia`, `tem-direito-api`, `tem-direito-app`).
   Em `ANTHROPIC_API_KEY`, cole a chave se quiser o chatbot com IA; deixe vazio para o modo local.
5. Clique em **Apply** (ou **Deploy Blueprint**). O primeiro build leva de 5 a 10 minutos
   (o backend baixa as dependências do Maven).
6. Abra o serviço **tem-direito-app** e use o endereço `https://tem-direito-app.onrender.com`
   (o nome pode ganhar um sufixo se já existir).

Painel: `ana.ribeiro@prefeitura.sp.gov.br` / `demo2026`; o código da segunda etapa aparece na tela.

## O que saber do plano gratuito

- Cada serviço **dorme depois de 15 minutos sem uso**. O primeiro acesso depois disso demora
  cerca de 1 minuto (o backend Java é o mais lento para acordar). Antes de apresentar, abra o app
  e o painel uma vez para acordar tudo.
- O banco é H2 em memória: quando o backend reinicia ou dorme, as triagens reais somem e os dados
  de demonstração são gerados de novo. Para guardar dados de verdade, use Oracle
  (`SPRING_PROFILES_ACTIVE=oracle` e `DB_URL`, `DB_USER`, `DB_PASSWORD`) e um plano pago.
- As automações agendadas só rodam com o serviço acordado; para a demonstração, use o botão
  **Executar agora** em Painel → Automações.
- Cada push na `main` faz um novo deploy automático.

## Se algo der errado

- **App abre mas não carrega dados:** abra `https://tem-direito-api.onrender.com/actuator/health`.
  Se demorar, o backend está acordando; espere e recarregue.
- **Chatbot diz "fora do ar":** abra `https://tem-direito-ia.onrender.com/saude`.
- **Erro de CORS no console:** confira se o endereço do app termina em `.onrender.com`
  (variável `CORS_ORIGENS` do backend).
