# Arquitetura do Tem Direito

## Visão geral

```
Navegador / celular (PWA React)
   │  /api (Nginx em produção, proxy do Vite em dev)
   ▼
Backend Java 21 · Spring Boot 3  ──►  ia-service Python · FastAPI ──► LLM (opcional)
   │  JPA + Flyway                     RAG lexical sobre a base do motor
   ▼
Oracle (produção) · H2 modo Oracle (dev e testes)
```

| Parte | Papel | Por que assim |
|---|---|---|
| `frontend/` | App do cidadão, painel do CRAS, gestão e unidade | PWA abre sem instalar e funciona com rede fraca; as respostas ficam só no aparelho. |
| `backend/regras` | Motor de regras em Java puro | Sem dependência do Spring, para testar isolado e comparar com o protótipo (paridade). |
| `backend/*` | API REST, segurança, automações | Camadas `controller → service → repository`, erros em `ProblemDetail`. |
| `ia-service/` | Assistente (RAG + LLM) e transcrição | Separado para escalar e trocar de provedor sem mexer no backend. |
| `database/oracle` | DDL, PL/SQL, carga | Mesmo esquema das migrações Flyway; pacote `PKG_TEM_DIREITO` e triggers de auditoria. |

## Fluxos

1. **Triagem.** O app manda as respostas para `POST /api/triagens/avaliar`. O backend roda o motor com a versão
   publicada das regras e devolve os 29 benefícios e o Kit do Direito. Com consentimento, `POST /api/triagens`
   grava a triagem anônima (código `T-xxxx`, bairro, pessoas, renda por pessoa arredondada, benefícios, versões
   das regras). O app recebe uma chave; no banco fica só o hash dela.
2. **Acompanhamento.** O app consulta `GET /api/triagens/{codigo}` com a chave e mostra avisos, lembretes e
   retornos. A família responde ("deu certo", "faltou documento") com `PATCH`.
3. **Automações** (`automacao/AutomacaoService`): lembrete na véspera às 19h, retornos de 7 e 30 dias às 10h,
   expurgo LGPD às 3h (vira número por bairro em `agregado_diario`) e resumo semanal na segunda às 8h.
   Toda execução fica em `execucao_tarefa` e pode ser disparada pelo painel.
4. **Painel.** Login com senha + código de 6 dígitos (lembra o computador por 30 dias). Lê só dados anônimos.
   O aviso à família só sai se ela autorizou.
5. **Regras versionadas.** Rascunho → simulador com os 10 casos → revisão de assistente social → publicação.
   A versão anterior é arquivada e a mudança vai para `historico_regra` (no Oracle, o trigger garante o registro).
6. **Assistente.** O backend monta a base a partir do próprio motor e chama o ia-service. Golpe, dados pessoais,
   crise e pedido negado têm resposta fixa. O LLM recebe só os documentos recuperados e precisa citar as fontes.
   Sem chave, o modo local responde a partir da mesma base.

## Segurança e LGPD

- Triagem sem nome, CPF, NIS ou telefone. Renda guardada só por pessoa e arredondada.
- Conta do cidadão: telefone em hash SHA-256 com sal (login), AES-GCM (só para SMS) e máscara (exibição).
- Códigos de verificação guardados só como hash, 10 minutos de validade, 5 tentativas.
- JWT sem estado com perfis `ATENDENTE`, `COORDENACAO`, `GESTOR` e `CIDADAO`.
- Exportar e apagar dados de verdade (`/api/contas/eu/dados`, `DELETE /api/triagens/{codigo}`).
