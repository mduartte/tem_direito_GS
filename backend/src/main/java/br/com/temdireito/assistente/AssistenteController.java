package br.com.temdireito.assistente;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/** Assistente de dúvidas (tela A11) e transcrição de voz. */
@RestController
@RequestMapping("/api/assistente")
@Tag(name = "Assistente")
public class AssistenteController {

    /** Sugestões que aparecem antes da primeira pergunta (as mesmas do protótipo). */
    public static final List<String> SUGESTOES = List.of("Preciso estar no Cadastro Único?", "Quem tem direito ao BPC?", "Quanto é o Bolsa Família?",
            "O que eu levo no CRAS?", "Meu pedido foi negado. E agora?", "Me cobraram para liberar um benefício. É golpe?");

    private final AssistenteService service;

    public AssistenteController(AssistenteService service) {
        this.service = service;
    }

    @GetMapping("/sugestoes")
    public List<String> sugestoes() {
        return SUGESTOES;
    }

    @PostMapping("/perguntar")
    @Operation(summary = "Pergunta ao assistente; responde só com a base do motor de regras")
    public Map<String, Object> perguntar(@RequestBody AssistenteService.Pergunta p) {
        return service.perguntar(p);
    }

    @PostMapping(value = "/transcrever", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Transcreve áudio (quando o navegador não tem reconhecimento de voz)")
    public Map<String, Object> transcrever(@RequestParam("audio") MultipartFile audio) throws IOException {
        return service.transcrever(audio.getBytes(), audio.getContentType());
    }
}
