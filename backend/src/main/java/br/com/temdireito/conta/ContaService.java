package br.com.temdireito.conta;

import br.com.temdireito.comum.ApiExceptionHandler;
import br.com.temdireito.comum.Json;
import br.com.temdireito.comum.Seguranca;
import br.com.temdireito.config.AppProperties;
import br.com.temdireito.config.JwtService;
import br.com.temdireito.notificacao.SmsGateway;
import br.com.temdireito.triagem.*;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Conta opcional do cidadão, só com o celular (telas D2 a D11).
 *
 * <p>LGPD: o número fica em hash (para achar a conta), cifrado (só para
 * mandar SMS) e mascarado (para mostrar). Exportar devolve tudo o que temos;
 * apagar remove a conta e as triagens ligadas a ela.</p>
 */
@Service
public class ContaService {

    private final ContaCidadaoRepository contas;
    private final VerificacaoService verificacao;
    private final SmsGateway sms;
    private final Seguranca seguranca;
    private final JwtService jwt;
    private final Json json;
    private final AppProperties props;
    private final TriagemRepository triagens;
    private final TriagemService triagemService;
    private final TriagemEventoRepository eventos;

    public ContaService(ContaCidadaoRepository contas, VerificacaoService verificacao, SmsGateway sms, Seguranca seguranca,
                        JwtService jwt, Json json, AppProperties props, TriagemRepository triagens, TriagemService triagemService,
                        TriagemEventoRepository eventos) {
        this.contas = contas;
        this.verificacao = verificacao;
        this.sms = sms;
        this.seguranca = seguranca;
        this.jwt = jwt;
        this.json = json;
        this.props = props;
        this.triagens = triagens;
        this.triagemService = triagemService;
        this.eventos = eventos;
    }

    public record PedidoCodigo(String telefone, String nome, Boolean aceiteTermos, Boolean aceiteSensiveis) {
    }

    /** Manda o código por SMS. Em desenvolvimento o código volta em {@code codigoTeste}. */
    public Map<String, Object> pedirCodigo(PedidoCodigo p) {
        String d = Seguranca.digitos(p.telefone());
        if (d.length() < 10 || d.length() > 11) throw ApiExceptionHandler.invalido("Digite o celular com DDD.");
        boolean nova = contas.findByTelefoneHash(seguranca.hash(d)).isEmpty();
        if (nova && !Boolean.TRUE.equals(p.aceiteTermos())) {
            throw ApiExceptionHandler.invalido("Para criar a conta, aceite os termos de uso.");
        }
        Map<String, Object> dados = new HashMap<>();
        dados.put("nome", p.nome());
        dados.put("aceiteTermos", Boolean.TRUE.equals(p.aceiteTermos()));
        dados.put("aceiteSensiveis", Boolean.TRUE.equals(p.aceiteSensiveis()));
        String codigo = verificacao.gerar(d, "CIDADAO", json.escrever(dados));
        sms.enviar("+55" + d, "Tem Direito: seu código é " + codigo + ". Não passe este código para ninguém.");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enviado", true);
        out.put("mascara", Seguranca.mascarar(d));
        out.put("contaNova", nova);
        if (props.exporCodigoTeste() && !sms.real()) out.put("codigoTeste", codigo);
        return out;
    }

    public record Confirmacao(String telefone, String codigo) {
    }

    @Transactional
    public Map<String, Object> confirmar(Confirmacao c) {
        String d = Seguranca.digitos(c.telefone());
        String dadosJson = verificacao.conferir(d, "CIDADAO", c.codigo()).orElse("{}");
        Map<String, Object> dados = json.ler(dadosJson, new TypeReference<>() { });
        ContaCidadao conta = contas.findByTelefoneHash(seguranca.hash(d)).orElseGet(() -> {
            ContaCidadao n = new ContaCidadao();
            n.telefoneHash = seguranca.hash(d);
            n.telefoneCifrado = seguranca.cifrar(d);
            n.telefoneMascara = Seguranca.mascarar(d);
            n.nome = (String) dados.get("nome");
            n.aceiteTermos = Boolean.TRUE.equals(dados.get("aceiteTermos"));
            n.aceiteSensiveis = Boolean.TRUE.equals(dados.get("aceiteSensiveis"));
            n.avisoCras = true;
            n.avisoNovos = true;
            n.avisoPrazos = true;
            n.criadaEm = LocalDateTime.now();
            return contas.save(n);
        });
        String token = jwt.emitir(String.valueOf(conta.id), "CIDADAO", Map.of());
        return Map.of("token", token, "conta", resumo(conta));
    }

    public ContaCidadao conta(Long id) {
        return contas.findById(id).orElseThrow(() -> ApiExceptionHandler.naoEncontrado("Conta não encontrada."));
    }

    public Map<String, Object> resumo(ContaCidadao c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.id);
        m.put("nome", c.nome);
        m.put("telefone", c.telefoneMascara);
        m.put("aceiteSensiveis", c.aceiteSensiveis);
        m.put("avisoCras", c.avisoCras);
        m.put("avisoNovos", c.avisoNovos);
        m.put("avisoPrazos", c.avisoPrazos);
        m.put("criadaEm", c.criadaEm);
        m.put("triagens", triagens.findByContaId(c.id).stream().map(t -> Map.of("codigo", t.codigo, "etapaTexto", t.etapaTexto, "criadaEm", t.criadaEm)).toList());
        return m;
    }

    public record Preferencias(String nome, Boolean aceiteSensiveis, Boolean avisoCras, Boolean avisoNovos, Boolean avisoPrazos) {
    }

    @Transactional
    public Map<String, Object> atualizar(Long id, Preferencias p) {
        ContaCidadao c = conta(id);
        if (p.nome() != null) c.nome = p.nome().isBlank() ? null : p.nome().trim();
        if (p.aceiteSensiveis() != null) c.aceiteSensiveis = p.aceiteSensiveis();
        if (p.avisoCras() != null) c.avisoCras = p.avisoCras();
        if (p.avisoNovos() != null) c.avisoNovos = p.avisoNovos();
        if (p.avisoPrazos() != null) c.avisoPrazos = p.avisoPrazos();
        return resumo(contas.save(c));
    }

    /** Liga ao perfil uma triagem feita neste aparelho (precisa da chave dela). */
    @Transactional
    public Map<String, Object> vincular(Long id, String codigo, String chave) {
        Triagem t = triagemService.autorizada(codigo, chave);
        t.contaId = id;
        triagens.save(t);
        return resumo(conta(id));
    }

    /** "Baixar meus dados" (D11): tudo o que guardamos, em JSON legível. */
    public Map<String, Object> exportar(Long id) {
        ContaCidadao c = conta(id);
        Map<String, Object> m = new LinkedHashMap<>(resumo(c));
        m.remove("triagens");
        m.put("telefone", Seguranca.mascarar(seguranca.decifrar(c.telefoneCifrado)));
        m.put("aviso", "O número completo não é exportado por segurança; guardamos só a forma cifrada.");
        m.put("triagens", triagens.findByContaId(id).stream().map(t -> {
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("codigo", t.codigo);
            x.put("criadaEm", t.criadaEm);
            x.put("bairro", t.bairro);
            x.put("pessoas", t.pessoas);
            x.put("rendaPorPessoa", t.rendaPc);
            x.put("beneficios", t.beneficios);
            x.put("etapa", t.etapaTexto);
            x.put("eventos", eventos.findByTriagemCodigoOrderByDataHoraAsc(t.codigo).stream().map(e -> e.dataHora + " " + e.texto).toList());
            return x;
        }).toList());
        return m;
    }

    /** Apaga a conta e as triagens dela, de verdade. */
    @Transactional
    public void apagar(Long id) {
        triagens.findByContaId(id).forEach(t -> triagemService.apagarTudo(t.codigo));
        contas.deleteById(id);
    }
}
