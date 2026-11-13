-- Tem Direito · 02 · Views, pacote PKG_TEM_DIREITO e triggers (Oracle). Mesmo conteúdo da migração Flyway V2 (pasta oracle).
-- =====================================================================
-- Tem Direito · objetos exclusivos do Oracle (PL/SQL)
-- Views do painel, pacote PKG_TEM_DIREITO e triggers de auditoria.
-- O Flyway executa cada bloco PL/SQL separado pela linha com "/".
-- =====================================================================

CREATE OR REPLACE VIEW vw_funil_bairro AS
SELECT bairro,
       COUNT(*)                                                             AS triagens,
       SUM(CASE WHEN etapa <> 'triagem' THEN 1 ELSE 0 END)                  AS receberam_kit,
       SUM(CASE WHEN etapa IN ('agendado','atendido','conseguiu','travado') THEN 1 ELSE 0 END) AS encaminhados,
       SUM(CASE WHEN etapa IN ('atendido','conseguiu') THEN 1 ELSE 0 END)   AS atendidos,
       SUM(CASE WHEN etapa = 'conseguiu' THEN 1 ELSE 0 END)                 AS conseguiram,
       SUM(CASE WHEN etapa = 'travado' THEN 1 ELSE 0 END)                   AS travados
  FROM triagem
 GROUP BY bairro;

CREATE OR REPLACE VIEW vw_documentos_faltantes AS
SELECT falta AS documento, COUNT(*) AS quantidade
  FROM triagem
 WHERE etapa = 'travado' AND falta IS NOT NULL
 GROUP BY falta;

-- Pacote com as regras de negócio que fazem sentido perto dos dados.
CREATE OR REPLACE PACKAGE pkg_tem_direito AS
    -- Renda por pessoa, do mesmo jeito do motor de regras (renda vazia ou negativa vira 0).
    FUNCTION fn_renda_por_pessoa(p_renda NUMBER, p_pessoas NUMBER) RETURN NUMBER;

    -- Registra um evento na linha do tempo de uma triagem e atualiza a data de modificação.
    PROCEDURE prc_registrar_evento(p_codigo VARCHAR2, p_texto VARCHAR2, p_alerta NUMBER DEFAULT 0);

    -- Retenção LGPD: soma as triagens antigas em AGREGADO_DIARIO e apaga as linhas individuais.
    -- Devolve quantas triagens foram apagadas.
    PROCEDURE prc_expurgar_triagens(p_dias NUMBER, p_apagadas OUT NUMBER);
END pkg_tem_direito;
/

CREATE OR REPLACE PACKAGE BODY pkg_tem_direito AS

    FUNCTION fn_renda_por_pessoa(p_renda NUMBER, p_pessoas NUMBER) RETURN NUMBER IS
    BEGIN
        RETURN GREATEST(NVL(p_renda, 0), 0) / GREATEST(NVL(p_pessoas, 1), 1);
    END fn_renda_por_pessoa;

    PROCEDURE prc_registrar_evento(p_codigo VARCHAR2, p_texto VARCHAR2, p_alerta NUMBER DEFAULT 0) IS
    BEGIN
        INSERT INTO triagem_evento (triagem_codigo, texto, alerta, data_hora)
        VALUES (p_codigo, SUBSTR(p_texto, 1, 300), NVL(p_alerta, 0), SYSTIMESTAMP);
        UPDATE triagem SET atualizada_em = SYSTIMESTAMP WHERE codigo = p_codigo;
    END prc_registrar_evento;

    PROCEDURE prc_expurgar_triagens(p_dias NUMBER, p_apagadas OUT NUMBER) IS
        v_limite TIMESTAMP := SYSTIMESTAMP - NUMTODSINTERVAL(p_dias, 'DAY');
    BEGIN
        -- 1) guarda os números por bairro e dia antes de apagar
        MERGE INTO agregado_diario a
        USING (
            SELECT TRUNC(criada_em) AS dia, bairro,
                   COUNT(*) AS triagens,
                   SUM(CASE WHEN etapa IN ('agendado','atendido','conseguiu','travado') THEN 1 ELSE 0 END) AS encaminhados,
                   SUM(CASE WHEN etapa = 'conseguiu' THEN 1 ELSE 0 END) AS conseguiram
              FROM triagem
             WHERE criada_em < v_limite
             GROUP BY TRUNC(criada_em), bairro
        ) t
        ON (a.dia = t.dia AND a.bairro = t.bairro)
        WHEN MATCHED THEN UPDATE SET a.triagens = a.triagens + t.triagens,
                                     a.encaminhados = a.encaminhados + t.encaminhados,
                                     a.conseguiram = a.conseguiram + t.conseguiram
        WHEN NOT MATCHED THEN INSERT (dia, bairro, triagens, encaminhados, conseguiram)
                              VALUES (t.dia, t.bairro, t.triagens, t.encaminhados, t.conseguiram);
        -- 2) apaga as triagens individuais (eventos, lembretes e avisos saem em cascata)
        DELETE FROM triagem WHERE criada_em < v_limite;
        p_apagadas := SQL%ROWCOUNT;
    END prc_expurgar_triagens;

END pkg_tem_direito;
/

-- Auditoria no banco: se alguém publicar uma regra direto por SQL, sem passar pela API,
-- o histórico registra mesmo assim (com revisor "não informado").
CREATE OR REPLACE TRIGGER trg_auditoria_regra
AFTER INSERT ON regra_versao
FOR EACH ROW
WHEN (NEW.situacao = 'PUBLICADA')
DECLARE
    v_existe NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_existe FROM historico_regra
     WHERE chave = :NEW.chave AND versao = :NEW.versao;
    IF v_existe = 0 THEN
        INSERT INTO historico_regra (titulo, chave, versao, autor, revisor, motivo, mudancas, data_hora)
        VALUES (:NEW.chave || ' v' || :NEW.versao, :NEW.chave, :NEW.versao,
                NVL(:NEW.autor, 'sistema'), NVL(:NEW.revisor, 'não informado'), :NEW.motivo, NULL, SYSTIMESTAMP);
    END IF;
END;
/

-- Mantém ATUALIZADA_EM coerente quando a etapa muda (inclusive por SQL direto).
CREATE OR REPLACE TRIGGER trg_triagem_atualizada
BEFORE UPDATE OF etapa, falta, obs_cras ON triagem
FOR EACH ROW
BEGIN
    :NEW.atualizada_em := SYSTIMESTAMP;
END;
/
