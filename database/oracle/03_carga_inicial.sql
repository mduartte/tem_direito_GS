-- =====================================================================
-- Tem Direito · 03 · Carga inicial (Oracle)
-- Gera o mesmo estado que o DemoSeeder do backend cria no primeiro start:
-- regras padrão publicadas, catálogo dos 29 benefícios, bairros, pontos,
-- unidade e equipe de demonstração (senha demo2026, em BCrypt).
-- As triagens de demonstração NÃO estão aqui: o backend gera no start
-- (app.demo=true), com o mesmo gerador do protótipo.
-- Rodar depois de 01_ddl.sql e 02_plsql.sql, como o usuário da aplicação.
-- Valores padrão também em backend/.../regras/RegrasPadrao.java.
-- =====================================================================
SET DEFINE OFF;

-- Regras (versão publicada) -----------------------------------------
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('_geral', 1, '{"sm":1621}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('cad', 5, '{"frac":0.5,"totSM":3}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('bolsa', 5, '{"lim":218,"base":691,"pessoa":164,"crianca":173,"variavel":58,"protecao":706}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('bpcI', 3, '{"idade":65,"frac":0.25,"texto":"Voc? tem 65 anos ou mais e a renda da casa ? baixa. Ent?o pode ter direito ao BPC, um sal?rio m?nimo por m?s."}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('bpcP', 2, '{"frac":0.25}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('tar', 4, '{"frac":0.5,"kwh":80}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('farm', 3, '{}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('desc', 1, '{"ate":1,"kwh":120}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('gas', 1, '{"frac":0.5}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('agua', 1, '{"frac":0.5,"vuln":218}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('pdm', 1, '{"frac":0.5}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('dign', 1, '{"lim":218,"fracEst":0.5}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('idj', 1, '{"totSM":2}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('cpi', 1, '{"idade":60,"sm2":2}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('mcmv', 1, '{"lim":3200}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('abono', 1, '{"lim":2766}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('segd', 1, '{}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('incl', 1, '{}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('isen', 1, '{"frac":0.5}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('prouni', 1, '{"integral":1.5,"parcial":3}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('fies', 1, '{"frac":0.5}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('plpcd', 1, '{"frac":1}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('sup', 1, '{"frac":0.5,"lim":218,"valor":150.33}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('bom', 1, '{}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('ple', 1, '{"frac":1.5}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('tid', 1, '{"idade":60}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('bupcd', 1, '{}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('ctd', 1, '{}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('mae', 1, '{}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);
INSERT INTO regra_versao (chave, versao, parametros, situacao, autor, revisor, motivo, criada_em, publicada_em) VALUES ('pot', 1, '{"bolsa":1702.05}', 'PUBLICADA', 'Carga inicial', 'Equipe t?cnica', 'Valores vigentes em 2026', SYSTIMESTAMP, SYSTIMESTAMP);

-- Catálogo de benefícios --------------------------------------------
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('cad', 'cad', 'Cadastro ?nico', 'CRAS', 'Federal', 1, 0);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('bpci', 'bpcI', 'BPC Idoso', 'INSS', 'Federal', 1, 1);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('bpcp', 'bpcP', 'BPC Pessoa com Defici?ncia', 'INSS', 'Federal', 1, 2);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('bolsa', 'bolsa', 'Bolsa Fam?lia', 'CRAS / MDS', 'Federal', 1, 3);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('tar', 'tar', 'Tarifa Social de Energia (Luz do Povo)', 'Distribuidora de energia (Enel SP)', 'Federal', 1, 4);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('farm', 'farm', 'Farm?cia Popular', 'Minist?rio da Sa?de', 'Federal', 1, 5);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('desc', 'desc', 'Desconto Social de Energia', 'Distribuidora de energia (Enel SP)', 'Federal', 1, 6);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('gas', 'gas', 'G?s do Povo', 'MDS ? revendas credenciadas', 'Federal', 1, 7);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('agua', 'agua', 'Tarifa Social de ?gua (Sabesp)', 'Sabesp ? Arsesp', 'Estado de SP', 1, 8);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('sup', 'sup', 'SuperA??o SP', 'Governo do Estado de SP (SEDS)', 'Estado de SP', 1, 9);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('incl', 'incl', 'Aux?lio-Inclus?o', 'INSS', 'Federal', 1, 10);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('dign', 'dign', 'Dignidade Menstrual', 'Minist?rio da Sa?de', 'Federal', 1, 11);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('mae', 'mae', 'M?e Paulistana', 'Prefeitura de SP ? UBS', 'Cidade de SP', 1, 12);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('tid', 'tid', '?nibus, metr? e trem gr?tis 60+', 'SPTrans ? Metr? ? CPTM', 'Cidade de SP', 1, 13);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('bupcd', 'bupcd', 'Bilhete ?nico Especial PcD', 'SPTrans', 'Cidade de SP', 1, 14);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('plpcd', 'plpcd', 'Passe Livre Interestadual PcD', 'Minist?rio dos Transportes ? ANTT', 'Federal', 1, 15);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('ple', 'ple', 'Passe Livre Estudantil', 'SPTrans ? EMTU', 'Cidade de SP', 1, 16);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('ctd', 'ctd', 'Cart?o do Trabalhador Desempregado', 'Metr? ? CPTM (Governo de SP)', 'Estado de SP', 1, 17);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('pdm', 'pdm', 'P?-de-Meia', 'MEC ? Caixa', 'Federal', 1, 18);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('prouni', 'prouni', 'Prouni', 'MEC', 'Federal', 1, 19);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('fies', 'fies', 'Fies Social', 'MEC ? FNDE', 'Federal', 1, 20);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('isen', 'isen', 'Isen??o de taxa em concursos e no Enem', '?rg?o do concurso ? Inep', 'Federal', 1, 21);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('abono', 'abono', 'Abono salarial (PIS/Pasep)', 'Minist?rio do Trabalho ? Caixa e Banco do Brasil', 'Federal', 1, 22);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('segd', 'segd', 'Seguro-desemprego', 'Minist?rio do Trabalho', 'Federal', 1, 23);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('pot', 'pot', 'POT ? Programa Opera??o Trabalho', 'Prefeitura de SP (SMDET)', 'Cidade de SP', 1, 24);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('mcmv', 'mcmv', 'Minha Casa, Minha Vida (Faixa 1)', 'Prefeitura (SEHAB/COHAB) ? Caixa', 'Federal', 1, 25);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('bom', 'bom', 'Bom Prato', 'Governo do Estado de SP', 'Estado de SP', 1, 26);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('idj', 'idj', 'ID Jovem', 'Secretaria Nacional de Juventude', 'Federal', 1, 27);
INSERT INTO beneficio (id, chave_regra, nome, orgao, abrangencia, ativo_unidade, ordem) VALUES ('cpi', 'cpi', 'Carteira da Pessoa Idosa', 'MDS', 'Federal', 1, 28);

-- Histórico: registro da carga --------------------------------------
INSERT INTO historico_regra (titulo, chave, versao, autor, revisor, motivo, mudancas, data_hora)
VALUES ('Carga inicial das regras', '_geral', 1, 'Mateus Duarte', 'Ana Ribeiro', 'Valores vigentes em 2026 (salário mínimo de R$ 1.621)', '[]', SYSTIMESTAMP);

-- Bairros do território (centro aproximado; famílias no CadÚnico são estimativas de demonstração)
INSERT INTO bairro (nome, cep_faixas, lat, lng, familias_cad) VALUES ('Jardim Ângela', '04930-04949', -23.7120, -46.7680, 38200);
INSERT INTO bairro (nome, cep_faixas, lat, lng, familias_cad) VALUES ('Capão Redondo', '05860-05879', -23.6680, -46.7790, 31500);
INSERT INTO bairro (nome, cep_faixas, lat, lng, familias_cad) VALUES ('Grajaú', '04820-04859', -23.7630, -46.6950, 41700);
INSERT INTO bairro (nome, cep_faixas, lat, lng, familias_cad) VALUES ('Parelheiros', '04880-04899', -23.8270, -46.7290, 15300);
INSERT INTO bairro (nome, cep_faixas, lat, lng, familias_cad) VALUES ('Jardim São Luís', '05840-05859;04900-04929', -23.6650, -46.7330, 24800);
INSERT INTO bairro (nome, cep_faixas, lat, lng, familias_cad) VALUES ('Campo Limpo', '05760-05799', -23.6400, -46.7600, 22100);

-- Pontos de atendimento (os mesmos do protótipo) ----------------------
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('c1', 'CRAS', 'CRAS Vila Santa Lúcia', 'R. Luís Gomes Pinto, 318 · Jardim Ângela', 'Jardim Ângela', 'Seg. a sex., 8h às 17h', NULL, -23.720909, -46.779771, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('c2', 'CRAS', 'CRAS Capão Redondo', 'R. Cassiano dos Santos, 499 · Capão Redondo', 'Capão Redondo', 'Seg. a sex., 8h às 17h', NULL, -23.665152, -46.736571, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('c3', 'CRAS', 'CRAS Grajaú', 'R. Prof. Oscar Barreto Filho, 210 · Grajaú', 'Grajaú', 'Seg. a sex., 8h às 17h', NULL, -23.784545, -46.748571, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('c4', 'CRAS', 'CRAS Parelheiros', 'Estr. da Colônia, 1.020 · Parelheiros', 'Parelheiros', 'Seg. a sex., 8h às 17h', NULL, -23.805758, -46.697143, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('c5', 'CRAS', 'CRAS Jardim São Luís', 'Av. Maria Coelho Aguiar, 75 · Jardim São Luís', 'Jardim São Luís', 'Seg. a sex., 8h às 17h', NULL, -23.672424, -46.719429, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('c6', 'CRAS', 'CRAS Campo Limpo', 'R. Nossa Sra. do Bom Conselho, 59 · Campo Limpo', 'Campo Limpo', 'Seg. a sex., 8h às 17h', NULL, -23.720909, -46.690286, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('u1', 'UBS', 'UBS Jardim Ângela', 'Estr. da Baronesa, 1.120', 'Jardim Ângela', 'Seg. a sex., 7h às 19h', 'laudo médico', -23.736061, -46.764857, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('u2', 'UBS', 'UBS Grajaú', 'R. Domingos Tarroso, 101', 'Grajaú', 'Seg. a sex., 7h às 19h', 'laudo médico', -23.751212, -46.734857, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('u3', 'UBS', 'UBS Capão Redondo', 'R. Comendador Antunes dos Santos, 1.300', 'Capão Redondo', 'Seg. a sex., 7h às 19h', 'laudo médico', -23.707576, -46.751143, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('f1', 'Farmácia', 'Drogaria Bem-Estar', 'Av. Guarapiranga, 4.410', NULL, 'Todos os dias, 7h às 22h', 'Farmácia Popular', -23.672424, -46.772571, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('f2', 'Farmácia', 'Farmácia São Judas', 'Av. Belmira Marin, 2.250', NULL, 'Todos os dias, 8h às 21h', 'Farmácia Popular', -23.793636, -46.731429, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('f3', 'Farmácia', 'Drogaria Santo Amaro', 'Estr. de Itapecerica, 3.800', NULL, 'Seg. a sáb., 8h às 20h', 'Farmácia Popular', -23.702727, -46.710857, 1);
INSERT INTO ponto_atendimento (id, tipo, nome, endereco, bairro, horario, obs, lat, lng, ativo) VALUES ('d1', 'Defensoria', 'Defensoria Pública · Santo Amaro', 'Av. Adolfo Pinheiro, 1.180', NULL, 'Seg. a sex., 9h às 16h', 'recurso gratuito', -23.666364, -46.681714, 1);

-- Unidade e equipe -----------------------------------------------------
INSERT INTO unidade (id, nome, telefone, endereco, sem_agendamento, horarios, territorio, servicos, mensagem_retorno, retencao_dias, resumo_semanal, configurada)
VALUES (1, 'CRAS Vila Santa Lúcia', '(11) 5833-1200', 'R. Luís Gomes Pinto, 318 · Jardim Ângela · São Paulo', 1,
 '[{"dia":"Segunda","abre":"08:00","fecha":"17:00","aberto":true},{"dia":"Terça","abre":"08:00","fecha":"17:00","aberto":true},{"dia":"Quarta","abre":"08:00","fecha":"17:00","aberto":true},{"dia":"Quinta","abre":"08:00","fecha":"17:00","aberto":true},{"dia":"Sexta","abre":"08:00","fecha":"17:00","aberto":true},{"dia":"Sábado","abre":"08:00","fecha":"17:00","aberto":false},{"dia":"Domingo","abre":"08:00","fecha":"17:00","aberto":false}]',
 '["Jardim Ângela","Capão Redondo","Grajaú","Parelheiros","Jardim São Luís","Campo Limpo"]',
 '["Cadastro Único","Bolsa Família","BPC (orientação)","Tarifa Social de Energia","Acompanhamento familiar (PAIF)"]',
 'O CRAS pediu para você voltar. Leve os documentos do seu Kit do Direito.', 90, 1, 1);

INSERT INTO usuario_painel (email, nome, perfil, senha_hash, situacao, unidade_id, criado_em) VALUES ('ana.ribeiro@prefeitura.sp.gov.br', 'Ana Ribeiro', 'COORDENACAO', '$2b$10$kUb6rqBOxs8ICnoXPYd7I.btj62IHSB11bDeNng0eQ5CQezsfghSe', 'ATIVO', 1, SYSTIMESTAMP);
INSERT INTO usuario_painel (email, nome, perfil, senha_hash, situacao, unidade_id, criado_em) VALUES ('marcos.lima@prefeitura.sp.gov.br', 'Marcos Lima', 'ATENDENTE', '$2b$10$kUb6rqBOxs8ICnoXPYd7I.btj62IHSB11bDeNng0eQ5CQezsfghSe', 'ATIVO', 1, SYSTIMESTAMP);
INSERT INTO usuario_painel (email, nome, perfil, senha_hash, situacao, unidade_id, criado_em) VALUES ('mateus.duarte@temdireito.org', 'Mateus Duarte', 'GESTOR', '$2b$10$kUb6rqBOxs8ICnoXPYd7I.btj62IHSB11bDeNng0eQ5CQezsfghSe', 'ATIVO', 1, SYSTIMESTAMP);

COMMIT;
