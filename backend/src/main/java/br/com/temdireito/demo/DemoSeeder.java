package br.com.temdireito.demo;

import br.com.temdireito.atendimento.*;
import br.com.temdireito.comum.Json;
import br.com.temdireito.config.AppProperties;
import br.com.temdireito.painel.*;
import br.com.temdireito.regras.*;
import br.com.temdireito.regras.servico.*;
import br.com.temdireito.triagem.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Carga inicial no primeiro start (banco vazio): catálogo dos 29 benefícios,
 * regras padrão publicadas, bairros e pontos do território, a unidade, a
 * equipe de demonstração e, com {@code app.demo=true}, as triagens fictícias.
 *
 * <p>As triagens de demonstração são o port exato do {@code gerarDemo()} do
 * protótipo (mesmo gerador mulberry32 e mesma semente), para o painel mostrar
 * os mesmos números da apresentação. São marcadas com {@code demo = 1}.</p>
 */
@Component
public class DemoSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoSeeder.class);
    static final List<String> BN = List.of("Jardim Ângela", "Capão Redondo", "Grajaú", "Parelheiros", "Jardim São Luís", "Campo Limpo");
    static final Object[][] FALTA = {{"Comprovante de endereço", .38}, {"Certidão de nascimento", .21}, {"Laudo médico", .17},
            {"CPF de dependente", .12}, {"Carteira de trabalho", .07}, {"Documento com foto", .05}};

    private final BeneficioEntityRepository beneficios;
    private final RegraVersaoRepository versoes;
    private final HistoricoRegraRepository historico;
    private final BairroRepository bairros;
    private final PontoAtendimentoRepository pontos;
    private final UnidadeRepository unidades;
    private final UsuarioPainelRepository usuarios;
    private final TriagemRepository triagens;
    private final TriagemEventoRepository eventos;
    private final MotorDeRegras motor;
    private final RegraService regras;
    private final PasswordEncoder encoder;
    private final Json json;
    private final AppProperties props;

    public DemoSeeder(BeneficioEntityRepository beneficios, RegraVersaoRepository versoes, HistoricoRegraRepository historico,
                      BairroRepository bairros, PontoAtendimentoRepository pontos, UnidadeRepository unidades,
                      UsuarioPainelRepository usuarios, TriagemRepository triagens, TriagemEventoRepository eventos,
                      MotorDeRegras motor, RegraService regras, PasswordEncoder encoder, Json json, AppProperties props) {
        this.beneficios = beneficios;
        this.versoes = versoes;
        this.historico = historico;
        this.bairros = bairros;
        this.pontos = pontos;
        this.unidades = unidades;
        this.usuarios = usuarios;
        this.triagens = triagens;
        this.eventos = eventos;
        this.motor = motor;
        this.regras = regras;
        this.encoder = encoder;
        this.json = json;
        this.props = props;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (beneficios.count() > 0) return;
        log.info("Banco vazio: carregando dados iniciais do Tem Direito");
        catalogoERegras();
        territorio();
        unidadeEEquipe();
        if (props.demo()) {
            int n = triagensDemo();
            log.info("{} triagens de demonstração criadas", n);
        }
        regras.limparCache();
    }

    private void catalogoERegras() {
        Parametros p = RegrasPadrao.criar();
        Respostas vazio = new Respostas();
        vazio.pessoas = 2;
        int ordem = 0;
        for (ResultadoBeneficio b : motor.avaliar(vazio, p)) {
            BeneficioEntity e = new BeneficioEntity();
            e.id = b.id;
            e.chaveRegra = p.todas().keySet().stream().filter(k -> k.equalsIgnoreCase(b.id)).findFirst().orElse(b.id);
            e.nome = b.nome;
            e.orgao = b.orgao;
            e.abrangencia = b.esf == null ? "Federal" : b.esf;
            e.ativoUnidade = true;
            e.ordem = ordem++;
            beneficios.save(e);
        }
        LocalDateTime agora = LocalDateTime.now();
        RegraVersao geral = new RegraVersao();
        geral.chave = RegraService.GERAL;
        geral.versao = 1;
        geral.parametros = json.escrever(Map.of("sm", RegrasPadrao.SALARIO_MINIMO));
        geral.situacao = "PUBLICADA";
        geral.autor = "Carga inicial";
        geral.criadaEm = agora;
        geral.publicadaEm = agora;
        versoes.save(geral);
        p.todas().forEach((chave, campos) -> {
            RegraVersao r = new RegraVersao();
            r.chave = chave;
            r.versao = p.versao(chave);
            Map<String, Object> c = new LinkedHashMap<>(campos);
            c.remove("v");
            r.parametros = json.escrever(c);
            r.situacao = "PUBLICADA";
            r.autor = "Carga inicial";
            r.revisor = "Equipe técnica";
            r.motivo = "Valores vigentes em 2026";
            r.criadaEm = agora;
            r.publicadaEm = agora;
            versoes.save(r);
        });
        HistoricoRegra h = new HistoricoRegra();
        h.titulo = "Carga inicial das regras";
        h.chave = RegraService.GERAL;
        h.versao = 1;
        h.autor = "Mateus Duarte";
        h.revisor = "Ana Ribeiro";
        h.motivo = "Valores vigentes em 2026 (salário mínimo de R$ 1.621)";
        h.mudancas = "[]";
        h.dataHora = agora;
        historico.save(h);
    }

    private void territorio() {
        // Centro aproximado de cada bairro; famílias no Cadastro Único são estimativas de demonstração.
        Object[][] b = {{"Jardim Ângela", "04930-04949", -23.7120, -46.7680, 38200}, {"Capão Redondo", "05860-05879", -23.6680, -46.7790, 31500},
                {"Grajaú", "04820-04859", -23.7630, -46.6950, 41700}, {"Parelheiros", "04880-04899", -23.8270, -46.7290, 15300},
                {"Jardim São Luís", "05840-05859;04900-04929", -23.6650, -46.7330, 24800}, {"Campo Limpo", "05760-05799", -23.6400, -46.7600, 22100}};
        for (Object[] x : b) {
            Bairro e = new Bairro();
            e.nome = (String) x[0];
            e.cepFaixas = (String) x[1];
            e.lat = (Double) x[2];
            e.lng = (Double) x[3];
            e.familiasCad = (Integer) x[4];
            bairros.save(e);
        }
        // Mesmos pontos do protótipo; a posição no mapa SVG vira latitude/longitude aproximada.
        Object[][] p = {
                {"c1", "CRAS", "CRAS Vila Santa Lúcia", "R. Luís Gomes Pinto, 318 · Jardim Ângela", "Seg. a sex., 8h às 17h", 118, 150, null},
                {"c2", "CRAS", "CRAS Capão Redondo", "R. Cassiano dos Santos, 499 · Capão Redondo", "Seg. a sex., 8h às 17h", 370, 58, null},
                {"c3", "CRAS", "CRAS Grajaú", "R. Prof. Oscar Barreto Filho, 210 · Grajaú", "Seg. a sex., 8h às 17h", 300, 255, null},
                {"c4", "CRAS", "CRAS Parelheiros", "Estr. da Colônia, 1.020 · Parelheiros", "Seg. a sex., 8h às 17h", 600, 290, null},
                {"c5", "CRAS", "CRAS Jardim São Luís", "Av. Maria Coelho Aguiar, 75 · Jardim São Luís", "Seg. a sex., 8h às 17h", 470, 70, null},
                {"c6", "CRAS", "CRAS Campo Limpo", "R. Nossa Sra. do Bom Conselho, 59 · Campo Limpo", "Seg. a sex., 8h às 17h", 640, 150, null},
                {"u1", "UBS", "UBS Jardim Ângela", "Estr. da Baronesa, 1.120", "Seg. a sex., 7h às 19h", 205, 175, "laudo médico"},
                {"u2", "UBS", "UBS Grajaú", "R. Domingos Tarroso, 101", "Seg. a sex., 7h às 19h", 380, 200, "laudo médico"},
                {"u3", "UBS", "UBS Capão Redondo", "R. Comendador Antunes dos Santos, 1.300", "Seg. a sex., 7h às 19h", 285, 128, "laudo médico"},
                {"f1", "Farmácia", "Drogaria Bem-Estar", "Av. Guarapiranga, 4.410", "Todos os dias, 7h às 22h", 160, 70, "Farmácia Popular"},
                {"f2", "Farmácia", "Farmácia São Judas", "Av. Belmira Marin, 2.250", "Todos os dias, 8h às 21h", 400, 270, "Farmácia Popular"},
                {"f3", "Farmácia", "Drogaria Santo Amaro", "Estr. de Itapecerica, 3.800", "Seg. a sáb., 8h às 20h", 520, 120, "Farmácia Popular"},
                {"d1", "Defensoria", "Defensoria Pública · Santo Amaro", "Av. Adolfo Pinheiro, 1.180", "Seg. a sex., 9h às 16h", 690, 60, "recurso gratuito"}};
        for (Object[] x : p) {
            PontoAtendimento e = new PontoAtendimento();
            e.id = (String) x[0];
            e.tipo = (String) x[1];
            e.nome = (String) x[2];
            e.endereco = (String) x[3];
            e.horario = (String) x[4];
            e.lng = -46.80 + ((Integer) x[5]) / 700.0 * 0.12;
            e.lat = -23.63 - ((Integer) x[6]) / 330.0 * 0.20;
            e.obs = (String) x[7];
            e.bairro = BN.stream().filter(n -> e.endereco.contains(n) || e.nome.contains(n)).findFirst().orElse(null);
            e.ativo = true;
            pontos.save(e);
        }
    }

    private void unidadeEEquipe() {
        Unidade u = new Unidade();
        u.id = 1L;
        u.nome = "CRAS Vila Santa Lúcia";
        u.telefone = "(11) 5833-1200";
        u.endereco = "R. Luís Gomes Pinto, 318 · Jardim Ângela · São Paulo";
        u.semAgendamento = true;
        List<Map<String, Object>> horarios = new ArrayList<>();
        for (String d : List.of("Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo")) {
            boolean util = !d.startsWith("Sáb") && !d.equals("Domingo");
            horarios.add(Map.of("dia", d, "abre", "08:00", "fecha", "17:00", "aberto", util));
        }
        u.horarios = json.escrever(horarios);
        u.territorio = json.escrever(BN);
        u.servicos = json.escrever(List.of("Cadastro Único", "Bolsa Família", "BPC (orientação)", "Tarifa Social de Energia", "Acompanhamento familiar (PAIF)"));
        u.mensagemRetorno = "O CRAS pediu para você voltar. Leve os documentos do seu Kit do Direito.";
        u.retencaoDias = 90;
        u.resumoSemanal = true;
        u.configurada = true;
        unidades.save(u);
        String senha = encoder.encode("demo2026");
        String[][] eq = {{"ana.ribeiro@prefeitura.sp.gov.br", "Ana Ribeiro", "COORDENACAO"},
                {"marcos.lima@prefeitura.sp.gov.br", "Marcos Lima", "ATENDENTE"},
                {"mateus.duarte@temdireito.org", "Mateus Duarte", "GESTOR"}};
        for (String[] x : eq) {
            UsuarioPainel p = new UsuarioPainel();
            p.email = x[0];
            p.nome = x[1];
            p.perfil = x[2];
            p.senhaHash = senha;
            p.situacao = "ATIVO";
            p.unidadeId = 1L;
            p.criadoEm = LocalDateTime.now();
            usuarios.save(p);
        }
    }

    /** Gerador pseudoaleatório mulberry32, idêntico ao do protótipo (aritmética de 32 bits). */
    static final class Mulberry32 {
        private int a;

        Mulberry32(int semente) {
            a = semente;
        }

        double next() {
            a = a + 0x6D2B79F5;
            int t = (a ^ (a >>> 15)) * (1 | a);
            t = (t + ((t ^ (t >>> 7)) * (61 | t))) ^ t;
            return ((t ^ (t >>> 14)) & 0xFFFFFFFFL) / 4294967296.0;
        }
    }

    record Linha(String bairro, String etapa) {
    }

    /** Port de gerarDemo(). */
    int triagensDemo() {
        Mulberry32 rnd = new Mulberry32(20261111);
        int[] w = {182, 201, 236, 254, 279, 301, 318, 350};
        int[] tri = {312, 268, 241, 187, 140, 100}, enc = {151, 133, 118, 92, 70, 48}, trav = {23, 17, 18, 12, 6, 3},
                cons = {46, 41, 35, 27, 21, 14}, agd = {35, 32, 28, 22, 18, 13};
        int[] kitOnly = new int[6];
        int acc = 0;
        for (int i = 0; i < 6; i++) {
            int r = tri[i] - enc[i];
            int k = i < 5 ? (int) Math.round(r * 419.0 / 636) : 419 - acc;
            kitOnly[i] = k;
            acc += k;
        }
        List<Linha> recent = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            List<String> st = new ArrayList<>();
            add(st, "agendado", agd[i]);
            add(st, "atendido", enc[i] - trav[i] - cons[i] - agd[i]);
            add(st, "conseguiu", cons[i]);
            add(st, "travado", trav[i]);
            add(st, "kit", kitOnly[i]);
            add(st, "triagem", tri[i] - enc[i] - kitOnly[i]);
            shuffle(st, rnd);
            for (String e : st) recent.add(new Linha(BN.get(i), e));
        }
        shuffle(recent, rnd);
        LocalDate hoje = LocalDate.now();
        record Item(Linha l, LocalDate data) {
        }
        List<Item> out = new ArrayList<>();
        int idx = 0;
        for (int s = 4; s < 8; s++) {
            for (int k = 0; k < w[s]; k++) {
                Linha r = recent.get(idx++);
                int dias = (7 - s) * 7 + (int) Math.floor(rnd.next() * 7);
                out.add(new Item(r, hoje.minusDays(dias)));
            }
        }
        Object[][] pb = {{BN.get(0), .25}, {BN.get(1), .21}, {BN.get(2), .19}, {BN.get(3), .15}, {BN.get(4), .11}, {BN.get(5), .09}};
        Object[][] pe = {{"conseguiu", .22}, {"atendido", .18}, {"travado", .08}, {"agendado", .04}, {"kit", .26}, {"triagem", .22}};
        for (int s = 0; s < 4; s++) {
            for (int k = 0; k < w[s]; k++) {
                int dias = (7 - s) * 7 + (int) Math.floor(rnd.next() * 7);
                String b = pick(pb, rnd), e = pick(pe, rnd);
                out.add(new Item(new Linha(b, e), hoje.minusDays(dias)));
            }
        }
        out.sort(Comparator.comparing(Item::data)); // ordenação estável, como Array.sort do JS
        Object[][] extras = {{"gas", .33}, {"agua", .41}, {"desc", .12}, {"pdm", .09}, {"idj", .11}, {"cpi", .14}, {"tid", .19}, {"bom", .22},
                {"ple", .10}, {"dign", .08}, {"mae", .04}, {"segd", .05}, {"mcmv", .06}, {"sup", .15}, {"isen", .06}, {"abono", .07},
                {"ctd", .03}, {"bupcd", .03}, {"prouni", .03}, {"fies", .02}, {"pot", .02}, {"plpcd", .015}, {"incl", .006}};
        Map<String, String> nomes = new HashMap<>();
        beneficios.findAll().forEach(b -> nomes.put(b.id, b.nome));
        List<Triagem> lista = new ArrayList<>();
        List<TriagemEvento> evs = new ArrayList<>();
        LocalDateTime agora = LocalDateTime.now();
        for (int i = 0; i < out.size(); i++) {
            Item it = out.get(i);
            Triagem t = new Triagem();
            t.codigo = "T-" + String.format("%04d", 361 + i);
            t.bairro = it.l().bairro();
            t.cidade = "São Paulo";
            t.uf = "SP";
            t.etapa = it.l().etapa();
            t.criadaEm = it.data().atTime(8 + (i % 9), (i * 7) % 60);
            t.atualizadaEm = t.criadaEm;
            List<String> ben = new ArrayList<>();
            if (rnd.next() < .71) ben.add("cad");
            if (rnd.next() < .38) ben.add("bolsa");
            if (rnd.next() < .23) ben.add("bpci");
            if (rnd.next() < .06) ben.add("bpcp");
            if (rnd.next() < .54) ben.add("tar");
            if (rnd.next() < .46) ben.add("farm");
            if (ben.isEmpty()) ben.add("cad");
            Mulberry32 r2 = new Mulberry32(9001 + i);
            for (Object[] x : extras) if (r2.next() < (Double) x[1]) ben.add((String) x[0]);
            t.beneficios = String.join(",", ben);
            t.pessoas = 1 + (int) Math.floor(rnd.next() * 5);
            t.rendaPc = BigDecimal.valueOf(Math.round(80 + rnd.next() * 700)).setScale(2);
            t.autorizou = rnd.next() < .7;
            t.canal = rnd.next() < .4 ? "App · voz" : rnd.next() < .7 ? "App" : "Site";
            t.falta = "travado".equals(t.etapa) ? pick(FALTA, rnd) : null;
            t.etapaTexto = "travado".equals(t.etapa) ? "Aguardando: " + t.falta.toLowerCase() : TriagemService.ETAPA_TXT.get(t.etapa);
            t.regrasUsadas = String.join(", ", ben.stream().map(b -> nomes.getOrDefault(b, b)).toList());
            t.demo = true;
            lista.add(t);
            LocalDateTime d0 = t.criadaEm;
            List<Object[]> tl = new ArrayList<>();
            tl.add(new Object[]{"Triagem concluída", d0, false});
            if (!"triagem".equals(t.etapa)) tl.add(new Object[]{"Kit do Direito enviado", d0, false});
            if (List.of("agendado", "atendido", "conseguiu", "travado").contains(t.etapa)) tl.add(new Object[]{"Lembrete marcado", d0.plusDays(1), false});
            if (List.of("atendido", "conseguiu").contains(t.etapa)) tl.add(new Object[]{"Retorno de 7 dias: “fui e deu certo”", d0.plusDays(7), false});
            if ("travado".equals(t.etapa)) tl.add(new Object[]{"Retorno de 7 dias: “faltou " + t.falta.toLowerCase() + "”", d0.plusDays(7), true});
            if ("conseguiu".equals(t.etapa)) tl.add(new Object[]{"Benefício concedido", d0.plusDays(20), false});
            for (Object[] x : tl) {
                if (((LocalDateTime) x[1]).isAfter(agora)) continue;
                TriagemEvento e = new TriagemEvento();
                e.triagemCodigo = t.codigo;
                e.texto = (String) x[0];
                e.dataHora = (LocalDateTime) x[1];
                e.alerta = (Boolean) x[2];
                evs.add(e);
            }
        }
        triagens.saveAll(lista);
        eventos.saveAll(evs);
        return lista.size();
    }

    private static void add(List<String> l, String e, int n) {
        for (int k = 0; k < n; k++) l.add(e);
    }

    private static <T> void shuffle(List<T> arr, Mulberry32 rnd) {
        for (int i = arr.size() - 1; i > 0; i--) {
            int j = (int) Math.floor(rnd.next() * (i + 1));
            T tmp = arr.get(i);
            arr.set(i, arr.get(j));
            arr.set(j, tmp);
        }
    }

    private static String pick(Object[][] pesos, Mulberry32 rnd) {
        double r = rnd.next(), s = 0;
        for (Object[] x : pesos) {
            s += (Double) x[1];
            if (r < s) return (String) x[0];
        }
        return (String) pesos[pesos.length - 1][0];
    }
}
