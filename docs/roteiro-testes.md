# Roteiro de testes

## Automáticos

| Comando | O que cobre |
|---|---|
| `cd backend && mvn verify` | Motor (10 casos), kit, API: fluxo do cidadão, consentimento, chave, 2FA do painel, perfis, publicação de regra, automações, conta por SMS, CEP |
| `cd ia-service && pytest` | RAG por sinônimo, regras de segurança (golpe, CPF, 188, 190, negado), modo local, LLM simulado, falha do provedor |
| `cd frontend && npm test && npm run build` | CEP, formatação, perguntas, conversão de voz em número; build da PWA |
| `node scripts/paridade-motor.mjs` | 3.000 perfis comparados entre o motor Java e o do protótipo |
| `node scripts/smoke-e2e.mjs` | Ponta a ponta com os três serviços no ar |
| Postman: `postman/tem-direito.postman_collection.json` | Mesmo fluxo pela coleção (Runner) |

## Manual (demonstração)

1. Abra `http://localhost:8080`, toque em **Começar**, escolha **Para mim** e responda: 1 pessoa, 70 anos,
   sem deficiência, renda R$ 0, não aposentado, nenhuma destas, sem Cadastro Único, usa remédio, luz no nome,
   CEP 04938-000.
2. Ligue o registro anônimo e veja o resultado: BPC Idoso provável, Cadastro Único, Farmácia Popular.
3. Abra o Kit, marque documentos, veja **Onde ir** no mapa e marque um lembrete para amanhã.
4. Em **Tire dúvidas**, pergunte "Quem tem direito ao BPC?" e "Me cobraram um pix para liberar".
5. No painel (`/painel`), entre com `ana.ribeiro@prefeitura.sp.gov.br` / `demo2026` e o código mostrado.
6. Busque o código da triagem, mude para **Travado · comprovante de endereço** e envie aviso.
7. Em **Automações**, rode **Lembrete da véspera**. Volte ao app em **Meus direitos**: o aviso aparece.
8. Entre como gestor (`mateus.duarte@temdireito.org`), mude o limite da Tarifa Social, veja os casos de teste,
   informe a revisora e publique. Confira em **Histórico**.
