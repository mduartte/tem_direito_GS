-- Views do painel no H2 (desenvolvimento). No Oracle, as mesmas views ficam em
-- db/migration/oracle/V2__plsql_views_triggers.sql, junto com o pacote PL/SQL.

-- Funil "caminho do direito" por bairro: da triagem ao benefício conseguido.
CREATE VIEW vw_funil_bairro AS
SELECT bairro,
       COUNT(*)                                                             AS triagens,
       SUM(CASE WHEN etapa <> 'triagem' THEN 1 ELSE 0 END)                  AS receberam_kit,
       SUM(CASE WHEN etapa IN ('agendado','atendido','conseguiu','travado') THEN 1 ELSE 0 END) AS encaminhados,
       SUM(CASE WHEN etapa IN ('atendido','conseguiu') THEN 1 ELSE 0 END)   AS atendidos,
       SUM(CASE WHEN etapa = 'conseguiu' THEN 1 ELSE 0 END)                 AS conseguiram,
       SUM(CASE WHEN etapa = 'travado' THEN 1 ELSE 0 END)                   AS travados
  FROM triagem
 GROUP BY bairro;

-- Documentos que mais travam os pedidos.
CREATE VIEW vw_documentos_faltantes AS
SELECT falta AS documento, COUNT(*) AS quantidade
  FROM triagem
 WHERE etapa = 'travado' AND falta IS NOT NULL
 GROUP BY falta;
