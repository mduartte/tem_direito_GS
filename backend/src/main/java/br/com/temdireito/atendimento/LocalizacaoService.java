package br.com.temdireito.atendimento;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Localização para o Brasil todo: CEP → endereço → coordenadas → pontos de
 * atendimento por perto.
 *
 * <ul>
 *   <li><b>Endereço:</b> ViaCEP; se falhar, BrasilAPI; se os dois falharem, as
 *       faixas de CEP do território do piloto (tabela {@code bairro}).</li>
 *   <li><b>Coordenadas:</b> Nominatim (OpenStreetMap); se falhar, as da
 *       BrasilAPI; por último, o centro do bairro cadastrado.</li>
 *   <li><b>Pontos por perto:</b> os cadastrados na gestão + os do OpenStreetMap
 *       (Overpass), que cobrem o país todo.</li>
 * </ul>
 *
 * <p>Os serviços abertos pedem uso moderado, então tudo fica em cache na
 * memória. Nada disso é gravado: o CEP e as coordenadas não vão para o banco.</p>
 */
@Service
public class LocalizacaoService {

    private static final Logger log = LoggerFactory.getLogger(LocalizacaoService.class);
    /** Raio de busca por tipo, em metros: CRAS e Defensoria podem estar longe; farmácia, perto. */
    static final Map<String, Integer> RAIO = Map.of("CRAS", 15000, "UBS", 6000, "Farmácia", 2500, "Defensoria", 40000);

    private final BairroRepository bairros;
    private final PontoAtendimentoRepository pontos;
    private final ObjectMapper om = new ObjectMapper();
    private final RestClient http;
    private final String viacep, brasilapi, nominatim, overpass;
    private final Map<String, Map<String, Object>> cacheCep = new ConcurrentHashMap<>();
    private final Map<String, double[]> cacheGeo = new ConcurrentHashMap<>();
    private final Map<String, List<Map<String, Object>>> cacheOsm = new ConcurrentHashMap<>();

    public LocalizacaoService(BairroRepository bairros, PontoAtendimentoRepository pontos,
                              @Value("${app.viacep-url:https://viacep.com.br/ws}") String viacep,
                              @Value("${app.brasilapi-url:https://brasilapi.com.br/api}") String brasilapi,
                              @Value("${app.nominatim-url:https://nominatim.openstreetmap.org}") String nominatim,
                              @Value("${app.overpass-url:https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter,https://overpass.private.coffee/api/interpreter}") String overpass) {
        this.bairros = bairros;
        this.pontos = pontos;
        this.viacep = viacep;
        this.brasilapi = brasilapi;
        this.nominatim = nominatim;
        this.overpass = overpass;
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(3000);
        f.setReadTimeout(8000); // espera curta: se um servidor do mapa travar, passa para o próximo
        // Os serviços do OpenStreetMap exigem identificar o aplicativo.
        this.http = RestClient.builder().requestFactory(f).defaultHeader("User-Agent", "TemDireito/1.0 (projeto academico FIAP; github.com/mduartte/tem_direito_GS)").build();
    }

    /** Endereço e coordenadas de um CEP de qualquer lugar do Brasil. */
    public Map<String, Object> cep(String cep) {
        String d = cep == null ? "" : cep.replaceAll("\\D", "");
        if (d.length() != 8) return Map.of("cep", d, "valido", false);
        Map<String, Object> c = cacheCep.get(d);
        if (c != null) return c;
        Map<String, Object> r = buscarCep(d);
        // Só guarda o que achou: uma falha de rede não pode ficar presa no cache.
        if (Boolean.TRUE.equals(r.get("encontrado"))) cacheCep.put(d, r);
        return r;
    }

    private Map<String, Object> buscarCep(String d) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("cep", d);
        out.put("valido", true);
        double[] coord = null;
        JsonNode v = get(viacep + "/" + d + "/json/");
        if (v != null && !v.has("erro")) {
            out.put("logradouro", v.path("logradouro").asText(""));
            out.put("bairro", v.path("bairro").asText(""));
            out.put("cidade", v.path("localidade").asText(""));
            out.put("uf", v.path("uf").asText(""));
            out.put("fonte", "ViaCEP");
        } else {
            JsonNode b = get(brasilapi + "/cep/v2/" + d);
            if (b != null && b.hasNonNull("city")) {
                out.put("logradouro", b.path("street").asText(""));
                out.put("bairro", b.path("neighborhood").asText(""));
                out.put("cidade", b.path("city").asText(""));
                out.put("uf", b.path("state").asText(""));
                out.put("fonte", "BrasilAPI");
                coord = coordBrasilApi(b);
            }
        }
        if (!out.containsKey("cidade")) {
            // Sem rede: tenta as faixas do território cadastrado (o piloto em São Paulo).
            Optional<Bairro> b = bairroPorFaixa(d);
            if (b.isEmpty()) {
                out.put("encontrado", false);
                return out;
            }
            out.put("bairro", b.get().nome);
            out.put("cidade", "São Paulo");
            out.put("uf", "SP");
            out.put("fonte", "faixas do território");
            coord = new double[]{b.get().lat, b.get().lng};
        }
        out.put("encontrado", true);
        if (coord == null) coord = geocodificar((String) out.get("logradouro"), (String) out.get("bairro"), (String) out.get("cidade"), (String) out.get("uf"));
        if (coord == null) coord = coordBrasilApi(get(brasilapi + "/cep/v2/" + d));
        if (coord == null) coord = bairros.findById(String.valueOf(out.get("bairro"))).map(b -> new double[]{b.lat, b.lng}).orElse(null);
        if (coord != null) {
            out.put("lat", coord[0]);
            out.put("lng", coord[1]);
        }
        return out;
    }

    private static double[] coordBrasilApi(JsonNode b) {
        if (b == null) return null;
        JsonNode c = b.path("location").path("coordinates");
        if (!c.hasNonNull("latitude") || c.path("latitude").asText("").isBlank()) return null;
        try {
            return new double[]{Double.parseDouble(c.path("latitude").asText()), Double.parseDouble(c.path("longitude").asText())};
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /** Coordenadas de um endereço (rua, bairro, cidade, UF), do mais exato ao mais geral. */
    public double[] geocodificar(String rua, String bairro, String cidade, String uf) {
        if (cidade == null || cidade.isBlank()) return null;
        List<String> tentativas = new ArrayList<>();
        if (rua != null && !rua.isBlank()) tentativas.add(rua + ", " + cidade + ", " + uf);
        if (bairro != null && !bairro.isBlank()) tentativas.add(bairro + ", " + cidade + ", " + uf);
        tentativas.add(cidade + ", " + uf);
        for (String q : tentativas) {
            double[] c = cacheGeo.computeIfAbsent(q.toLowerCase(), k -> nominatim(q));
            if (c.length == 2) return c;
        }
        return null;
    }

    private double[] nominatim(String q) {
        JsonNode r = get(nominatim + "/search?format=json&limit=1&countrycodes=br&q=" + URLEncoder.encode(q + ", Brasil", StandardCharsets.UTF_8));
        if (r != null && r.isArray() && !r.isEmpty()) {
            return new double[]{r.get(0).path("lat").asDouble(), r.get(0).path("lon").asDouble()};
        }
        return new double[0]; // guarda a falha no cache também, para não insistir no serviço
    }

    /** Pontos cadastrados + do OpenStreetMap, ordenados pela distância. */
    public List<Map<String, Object>> perto(double lat, double lng, String tipo) {
        List<String> tipos = tipo == null || tipo.isBlank() ? List.of("CRAS", "UBS", "Farmácia", "Defensoria") : List.of(tipo);
        List<Map<String, Object>> out = new ArrayList<>();
        for (PontoAtendimento p : pontos.findByAtivoTrueOrderByTipoAscNomeAsc()) {
            if (!tipos.contains(p.tipo) || p.lat == null) continue;
            double km = km(lat, lng, p.lat, p.lng);
            if (km * 1000 > RAIO.getOrDefault(p.tipo, 10000)) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.id);
            m.put("tipo", p.tipo);
            m.put("nome", p.nome);
            m.put("endereco", p.endereco);
            m.put("horario", p.horario);
            m.put("telefone", p.telefone);
            m.put("obs", p.obs);
            m.put("lat", p.lat);
            m.put("lng", p.lng);
            m.put("km", km);
            m.put("fonte", "cadastro");
            out.add(m);
        }
        // Os tipos são consultados em paralelo para a tela "Onde ir" não esperar um de cada vez.
        Map<String, java.util.concurrent.CompletableFuture<List<Map<String, Object>>>> futuros = new LinkedHashMap<>();
        for (String t : tipos) futuros.put(t, java.util.concurrent.CompletableFuture.supplyAsync(() -> osm(lat, lng, t)));
        for (String t : tipos) {
            for (Map<String, Object> o : futuros.get(t).join()) {
                Map<String, Object> m = new LinkedHashMap<>(o);
                m.put("km", km(lat, lng, (Double) o.get("lat"), (Double) o.get("lng")));
                // Não repete um lugar que já está no cadastro (mesmo tipo a menos de 150 m).
                boolean repetido = out.stream().anyMatch(x -> t.equals(x.get("tipo"))
                        && km((Double) x.get("lat"), (Double) x.get("lng"), (Double) m.get("lat"), (Double) m.get("lng")) < 0.15);
                if (!repetido) out.add(m);
            }
        }
        out.sort(Comparator.comparingDouble(m -> (Double) m.get("km")));
        return out.size() > 40 ? out.subList(0, 40) : out;
    }

    /** Consulta o Overpass (OpenStreetMap). A coordenada é arredondada no cache (~1 km). */
    List<Map<String, Object>> osm(double lat, double lng, String tipo) {
        String chave = tipo + ":" + Math.round(lat * 100) + ":" + Math.round(lng * 100);
        return cacheOsm.computeIfAbsent(chave, k -> consultarOsm(lat, lng, tipo));
    }

    private List<Map<String, Object>> consultarOsm(double lat, double lng, String tipo) {
        int r = RAIO.getOrDefault(tipo, 10000);
        String a = "(around:" + r + "," + lat + "," + lng + ")";
        String filtro = switch (tipo) {
            // Filtra primeiro por etiqueta (barato) e só depois pelo nome (regex é caro em cidade grande).
            case "CRAS" -> "nwr" + a + "[\"amenity\"~\"social_facility|community_centre|public_building\"][\"name\"~\"CRAS|Assist[eê]ncia Social\",i];"
                    + "nwr" + a + "[\"office\"~\"government|ngo\"][\"name\"~\"CRAS|Assist[eê]ncia Social\",i];"
                    + "nwr" + a + "[\"social_facility\"][\"name\"~\"CRAS\",i];";
            case "UBS" -> "nwr" + a + "[\"amenity\"~\"clinic|doctors|hospital\"][\"name\"~\"UBS|Unidade B[aá]sica|Posto de Sa[uú]de|Centro de Sa[uú]de|Sa[uú]de da Fam\",i];"
                    + "nwr" + a + "[\"healthcare\"][\"name\"~\"UBS|Unidade B[aá]sica|Posto de Sa[uú]de|Centro de Sa[uú]de|Sa[uú]de da Fam\",i];";
            case "Farmácia" -> "nwr" + a + "[\"amenity\"=\"pharmacy\"];";
            case "Defensoria" -> "nwr" + a + "[\"office\"][\"name\"~\"Defensoria\",i];"
                    + "nwr" + a + "[\"amenity\"~\"courthouse|public_building\"][\"name\"~\"Defensoria\",i];";
            default -> null;
        };
        if (filtro == null) return List.of();
        String q = "[out:json][timeout:25];(" + filtro + ");out center 25;";
        // O servidor público principal do Overpass vive sobrecarregado: tenta os espelhos em seguida.
        String corpo = null;
        for (String url : overpass.split(",")) {
            try {
                corpo = http.post().uri(url.trim()).contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .body("data=" + URLEncoder.encode(q, StandardCharsets.UTF_8)).retrieve().body(String.class);
                if (corpo != null && corpo.trim().startsWith("{")) break;
            } catch (Exception e) {
                log.warn("Overpass {} falhou para {}: {}", url.trim(), tipo, e.getMessage());
            }
            corpo = null;
        }
        if (corpo == null) return List.of();
        try {
            JsonNode els = om.readTree(corpo).path("elements");
            List<Map<String, Object>> out = new ArrayList<>();
            for (JsonNode e : els) {
                JsonNode tg = e.path("tags");
                String nome = tg.path("name").asText("");
                if (nome.isBlank()) continue;
                double la = e.has("lat") ? e.path("lat").asDouble() : e.path("center").path("lat").asDouble();
                double lo = e.has("lon") ? e.path("lon").asDouble() : e.path("center").path("lon").asDouble();
                String end = String.join(", ", List.of(tg.path("addr:street").asText(""), tg.path("addr:housenumber").asText(""),
                        tg.path("addr:suburb").asText(""), tg.path("addr:city").asText("")).stream().filter(s -> !s.isBlank()).toList());
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", "osm-" + e.path("type").asText() + "-" + e.path("id").asText());
                m.put("tipo", tipo);
                m.put("nome", nome);
                m.put("endereco", end.isBlank() ? "Endereço no mapa" : end);
                m.put("horario", tg.path("opening_hours").asText("Confira o horário antes de ir"));
                m.put("telefone", tg.path("phone").asText(tg.path("contact:phone").asText("")));
                m.put("obs", "Farmácia".equals(tipo) ? "confira se é credenciada na Farmácia Popular" : null);
                m.put("lat", la);
                m.put("lng", lo);
                m.put("fonte", "OpenStreetMap");
                out.add(m);
            }
            return out;
        } catch (Exception e) {
            log.warn("Resposta do Overpass inválida para {}: {}", tipo, e.getMessage());
            return List.of();
        }
    }

    private JsonNode get(String url) {
        try {
            String s = http.get().uri(java.net.URI.create(url)).retrieve().body(String.class);
            return s == null ? null : om.readTree(s);
        } catch (Exception e) {
            log.debug("Falha em {}: {}", url, e.getMessage());
            return null;
        }
    }

    Optional<Bairro> bairroPorFaixa(String cep8) {
        int n = Integer.parseInt(cep8.substring(0, 5));
        for (Bairro b : bairros.findAll()) {
            if (b.cepFaixas == null) continue;
            for (String faixa : b.cepFaixas.split(";")) {
                String[] p = faixa.trim().split("-");
                if (p.length == 2 && n >= Integer.parseInt(p[0]) && n <= Integer.parseInt(p[1])) return Optional.of(b);
            }
        }
        return Optional.empty();
    }

    /** Distância em km (haversine). */
    public static double km(double lat1, double lng1, double lat2, double lng2) {
        double r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r;
        double h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * 6371 * Math.asin(Math.sqrt(h));
    }
}
