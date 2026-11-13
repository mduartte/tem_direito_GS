# CLAUDE.md — guia do projeto Tem Direito

Este arquivo orienta qualquer pessoa (ou agente de IA) que for trabalhar neste
repositório. Leia antes de mudar código. Ele descreve o que o sistema faz, como
as partes se conversam, como rodar e testar, e as regras que não podem ser
quebradas.

## 1. O que é o Tem Direito

Um app e site (PWA) que ajuda famílias de baixa renda a descobrir a quais
benefícios sociais provavelmente têm direito, o que levar e aonde ir, e um
painel web para o CRAS planejar a busca ativa.

- Projeto da Global Solution 2026.2 (FIAP · Sistemas de Informação · CitizenTech).
- Integrantes: Mateus Duarte (RM 563662), Guilherme Sasso (RM 563519),
  Daniel Sanchez (RM 561948).
- O motor de regras avalia **29 benefícios**: 20 federais, 4 do Estado de São
  Paulo e 5 da cidade de São Paulo.
- O app **orienta, não concede**: quem decide é o INSS, o CRAS, a prefeitura ou
  a distribuidora.

## 2. Arquitetura

```
frontend/      React 18 + Vite + PWA     App do cidadão, painel do CRAS, gestão de regras
backend/       Java 21 + Spring Boot 3   API REST, motor de regras, automações, segurança
ia-service/    Python 3.12 + FastAPI     Assistente de dúvidas (RAG + LLM) e transcrição de voz
database/      Oracle (DDL, PL/SQL)      Scripts Oracle, procedures, triggers, carga inicial
infra/         Docker, Nginx, Azure      Imagens, compose, deploy em Azure Container Apps
docs/          Documentação              Arquitetura, API, decisões e roteiro de testes
postman/       Coleção Postman           Testes manuais e automatizados da API
.github/       GitHub Actions            CI: build, testes e smoke test de ponta a ponta
```

Fluxo principal:

1. O cidadão responde a triagem no **frontend**. As respostas ficam **só no
   aparelho** (localStorage).
2. O frontend chama `POST /api/triagens/avaliar` no **backend**, que roda o
   **motor de regras** (pacote `br.com.temdireito.regras`) com a versão
   publicada das regras e devolve benefícios, condições, base legal e o Kit do
   Direito.
3. O frontend registra uma **triagem anônima** (`POST /api/triagens`): código
   `T-xxxx`, bairro, número de pessoas, renda por pessoa e benefícios. Nunca
   nome, CPF ou telefone.
4. Lembretes, retornos de 7 e 30 dias e avisos do CRAS viram **notificações**
   geradas por tarefas agendadas (`br.com.temdireito.automacao`).
5. O **painel** lê só dados agregados e anônimos.
6. O **assistente** (`POST /api/assistente/perguntar`) monta a base de
   conhecimento a partir do motor de regras e chama o **ia-service**, que faz a
   recuperação (RAG) e usa um LLM se houver chave configurada. Sem chave, o
   ia-service responde em **modo local**, sem IA, a partir da mesma base.

## 3. Como rodar

### Tudo com Docker

```bash
docker compose -f infra/docker-compose.yml up --build
# app:        http://localhost:8080
# api:        http://localhost:8081/api  (Swagger em /swagger-ui.html)
# ia-service: http://localhost:8000/docs
```

Para usar Oracle em vez de H2: `docker compose -f infra/docker-compose.yml --profile oracle up --build`.

### No ar (Render, gratuito)

`render.yaml` cria os três serviços num clique (Dashboard → New → Blueprint). Passo a passo e
limitações do plano gratuito em `docs/deploy-render.md`. Azure: `infra/azure.md`.

### Cada parte separada

```bash
# backend (H2 em memória, dados de demonstração)
cd backend && mvn spring-boot:run

# serviço de IA (modo local sem chave; com chave: export ANTHROPIC_API_KEY=...)
cd ia-service && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000

# frontend (proxy de /api para localhost:8081)
cd frontend && npm install && npm run dev
```

### Acessos de demonstração

- Painel: `ana.ribeiro@prefeitura.sp.gov.br` / `demo2026` (coordenação),
  `marcos.lima@prefeitura.sp.gov.br` / `demo2026` (atendente),
  `mateus.duarte@temdireito.org` / `demo2026` (gestor de regras).
- Em ambiente de desenvolvimento, o código de verificação em duas etapas e o
  código por SMS aparecem na resposta da API (`codigoTeste`) e na tela, porque
  não há SMS real. Em produção (`app.sms.provider=twilio`) eles não aparecem.

## 4. Testes

```bash
cd backend && mvn verify            # JUnit: motor de regras, kit, API, segurança
cd ia-service && pytest             # RAG, modo local, regras de segurança
cd frontend && npm test && npm run build
node scripts/paridade-motor.mjs     # compara o motor Java com o motor do protótipo
node scripts/smoke-e2e.mjs http://localhost:8080   # ponta a ponta da API (serviços no ar)
cd frontend && node e2e/smoke-ui.mjs http://localhost:4173   # interface (Playwright)
```

Coleção Postman com os mesmos fluxos: `postman/tem-direito.postman_collection.json`.

O CI (`.github/workflows/ci.yml`) roda tudo isso e um smoke test de ponta a
ponta com Playwright contra os três serviços no ar.

## 5. Regras que não podem ser quebradas

1. **LGPD.** Triagem não guarda nome, CPF, NIS nem telefone. Conta do cidadão
   guarda o telefone só como hash (SHA-256 com sal) e uma máscara. Dados de
   saúde e renda só com consentimento destacado (art. 11). Apagar tem que
   apagar de verdade.
2. **Regras versionadas.** Toda mudança de regra cria uma nova versão, passa
   pelos casos de teste e pela revisão de uma assistente social, e fica no
   histórico com autor, revisor e motivo. Cada triagem guarda a versão usada.
3. **O app não decide direitos.** Textos dizem "provável", "pode usar" ou
   "vale verificar". Nunca "você tem direito".
4. **O assistente não inventa.** Responde só com a base recuperada. Se não
   souber, indica CRAS, Disque Social 121 ou INSS 135. Cobrança para liberar
   benefício é sempre golpe.
5. **Linguagem simples.** Textos para o cidadão: frases curtas, nível de
   leitura de 5º ano, sem siglas sem explicação.
6. **Paridade do motor.** O motor Java tem que dar o mesmo resultado do motor
   do protótipo. Mudou regra? Rode `node scripts/paridade-motor.mjs` e os
   casos de teste.

## 6. Convenções de código

- Domínio em **português** (classes, métodos e campos: `Triagem`, `avaliar`,
  `rendaPorPessoa`). Termos técnicos em inglês quando forem padrão
  (`Controller`, `Repository`, `DTO`).
- **Comentários explicam o porquê**, não o óbvio. Toda classe pública tem um
  Javadoc curto dizendo o papel dela no sistema.
- Backend em camadas: `controller` → `service` → `repository`, DTOs em
  `record`, validação com Bean Validation, erros com `ProblemDetail`.
- Frontend: componentes por tela em `src/telas`, peças reutilizáveis em
  `src/componentes`, chamadas HTTP só em `src/api`, estado do cidadão em
  `src/estado`.
- Valores de dinheiro: `BigDecimal` nas entidades e no banco (`NUMBER(12,2)`).
  **Exceção:** o motor de regras usa `double`, como o JavaScript do protótipo,
  para que os dois deem exatamente o mesmo resultado (inclusive arredondamento
  nos textos). A formatação em reais fica em `Formatacao.brl()`, igual ao
  `Intl` pt-BR do navegador.

## 7. Commits

Mensagens em português, no imperativo, com um resumo curto e um corpo que
explica **o que** mudou e **por quê**, em tópicos. Exemplo:

```
feat(backend): motor de regras com os 29 benefícios

- Porta o avaliar() do protótipo para Java puro, sem dependências,
  para poder ser testado isoladamente.
- Cada benefício devolve status, condições, valor e base legal.
- Casos de teste do simulador viram testes JUnit.
```

Prefixos: `feat`, `fix`, `docs`, `test`, `ci`, `build`, `refactor`, `chore`.
Cada commit deve deixar o projeto compilando e com os testes passando.

## 8. Onde mexer para cada tarefa

| Tarefa | Arquivos |
|---|---|
| Mudar um limite de renda ou valor | Painel → Gestão → Editor de regras (não no código). Valor padrão: `RegrasPadrao.java` e `database/oracle/03_carga_inicial.sql` |
| Novo benefício | `MotorDeRegras.java`, `RegrasPadrao.java`, `KitService.java`, `CatalogoBeneficios.java`, casos de teste, `ia-service/app/aliases.py` |
| Nova pergunta da triagem | `frontend/src/estado/perguntas.js` e `Respostas.java` |
| Nova tela | `frontend/src/telas/`, rota em `frontend/src/App.jsx` |
| Nova automação | `backend/src/main/java/br/com/temdireito/automacao/` |
| Comportamento do assistente | `ia-service/app/prompt.py` (regras) e `ia-service/app/rag.py` (busca) |
| Telas do cidadão | `frontend/src/telas/cidadao/` (A1–A18, D1–D11) |
| Telas do painel, gestão e unidade | `frontend/src/telas/painel/` (B1–B6, E1, E5), `telas/gestao/` (C1–C6), `telas/config/` (E2–E4) |
| Horário das automações | `@Scheduled` em `AutomacaoService.java` (fuso America/Sao_Paulo) |
| Dados de demonstração | `demo/DemoSeeder.java` (port do `gerarDemo()` do protótipo, mesma semente) |

## 9. Mapa de telas e rotas

| Tela | Rota | Wireframe |
|---|---|---|
| Início, para quem, perguntas, consentimento | `/`, `/modo`, `/triagem`, `/consentimento` | A1–A12, D1, D9 |
| Resultado, benefício, kit, onde ir, lembrete | `/resultado`, `/beneficio/:id`, `/kit`, `/onde-ir`, `/lembrete` | A13–A16 |
| Meus direitos, negado, minhas respostas | `/meus-direitos`, `/negado/:id`, `/perfil` | A17, A18, D5–D8 |
| Conta, código, privacidade, apagar | `/conta`, `/entrar`, `/codigo`, `/privacidade`, `/apagar` | D2–D4, D11 |
| Tire dúvidas (assistente) | `/duvidas` | A11 |
| Painel: entrar, código, visão, mapa, encaminhamentos, detalhe, relatórios, automações | `/painel/...` | B1–B6, E5 |
| Gestão: benefícios, regras, simulador, documentos, histórico, pontos | `/gestao/...` | C1–C6 |
| Unidade: dados, equipe, preferências; pedido de acesso | `/config/...`, `/acesso` | E1–E4 |
