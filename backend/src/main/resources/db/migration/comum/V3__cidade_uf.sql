-- O app passou a valer para o Brasil todo: a triagem guarda cidade e UF.
-- Continua sem CEP, rua ou coordenada (LGPD: só o necessário para a busca ativa).
ALTER TABLE triagem ADD (cidade VARCHAR2(80), uf VARCHAR2(2));
CREATE INDEX ix_triagem_uf_cidade ON triagem (uf, cidade);
