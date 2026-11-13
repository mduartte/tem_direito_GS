"""Sinônimos do dia a dia para cada benefício.

As pessoas não perguntam "Tarifa Social de Energia Elétrica"; perguntam
"desconto na conta de luz". Esta lista liga as palavras comuns ao id do
benefício no motor de regras. É a mesma tabela ALIAS do protótipo; ao criar
um benefício novo, acrescente aqui (ver CLAUDE.md, seção 8).
"""

ALIAS: dict[str, list[str]] = {
    "cad": ["cadastro", "cadunico", "nis"],
    "bolsa": ["bolsa familia", "bolsa"],
    "bpci": ["bpc", "loas", "idoso", "65 anos"],
    "bpcp": ["deficiencia", "pcd", "deficiente", "pericia"],
    "tar": ["luz", "energia", "conta de luz", "tarifa social"],
    "desc": ["desconto social", "luz", "energia"],
    "farm": ["farmacia", "remedio", "medicamento", "fralda"],
    "dign": ["absorvente", "menstrua"],
    "gas": ["gas", "botijao"],
    "pdm": ["pe-de-meia", "pe de meia", "ensino medio", "poupanca"],
    "idj": ["id jovem", "jovem", "viagem"],
    "cpi": ["carteira da pessoa idosa", "carteira do idoso", "idoso"],
    "mcmv": ["minha casa", "moradia", "casa propria"],
    "abono": ["abono", "pis"],
    "segd": ["seguro-desemprego", "seguro desemprego", "demitido"],
    "incl": ["auxilio-inclusao", "auxilio inclusao"],
    "isen": ["isencao", "enem", "concurso", "taxa"],
    "prouni": ["prouni", "faculdade", "bolsa de estudo"],
    "fies": ["fies", "financiamento"],
    "plpcd": ["passe livre interestadual", "viagem pcd"],
    "agua": ["agua", "sabesp"],
    "sup": ["superacao", "superação"],
    "bom": ["bom prato", "comida", "refeicao", "almoco"],
    "ctd": ["trabalhador desempregado", "metro", "cptm"],
    "tid": ["onibus", "60 anos", "transporte"],
    "bupcd": ["bilhete unico especial", "bilhete pcd"],
    "ple": ["passe livre estudantil", "estudante", "escola"],
    "mae": ["mae paulistana", "gestante", "gravida", "pre-natal", "bebe", "enxoval"],
    "pot": ["pot", "operacao trabalho", "curso"],
}
