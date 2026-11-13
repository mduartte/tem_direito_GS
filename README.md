# Tem Direito

Seus direitos, em 5 minutos, no celular.

O Tem Direito é um app e site (PWA) que ajuda famílias de baixa renda a
descobrir a quais benefícios sociais provavelmente têm direito, o que levar e
aonde ir, e um painel para o CRAS (Centro de Referência de Assistência Social)
planejar a busca ativa com dados anônimos.

Projeto da Global Solution 2026.2 · FIAP · Sistemas de Informação · CitizenTech.

| Integrante | RM |
|---|---|
| Mateus Duarte | 563662 |
| Guilherme Sasso | 563519 |
| Daniel Sanchez | 561948 |

## O que tem aqui

- **App do cidadão (PWA):** triagem de 10 perguntas com voz, resultado dos 29 benefícios
  (20 federais, 4 do Estado de São Paulo, 5 da cidade de São Paulo), Kit do Direito, mapa de
  atendimento, lembrete da véspera, acompanhamento e assistente de dúvidas.
- **Painel do CRAS:** visão geral, mapa de demanda, encaminhamentos, relatórios e automações,
  com login em duas etapas e só dados anônimos.
- **Gestão de regras:** editor versionado, simulador com 10 casos de teste, publicação com
  revisão de assistente social e histórico de auditoria.
- **Assistente:** RAG sobre as regras do próprio motor; com chave de LLM responde com IA, sem
  chave responde em modo local. Golpe, dados pessoais e crise têm resposta fixa.

O app **orienta, não concede**: quem decide é o INSS, o CRAS, a prefeitura ou a distribuidora.

## Rodar

```bash
docker compose -f infra/docker-compose.yml up --build
# app http://localhost:8080 · api http://localhost:8081/swagger-ui.html · ia http://localhost:8000/docs
```

Painel: `ana.ribeiro@prefeitura.sp.gov.br` / `demo2026` (o código da segunda etapa aparece na
tela em desenvolvimento). Detalhes de execução, testes, arquitetura e convenções:
[CLAUDE.md](CLAUDE.md) · [docs/arquitetura.md](docs/arquitetura.md) ·
[docs/roteiro-testes.md](docs/roteiro-testes.md).
