import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import { EventAggregatorService } from "./src/services/aggregator/eventAggregatorService";
import {
  EventDatabase,
  type SavedCrawlEvent,
  type SavedCrawlSource,
} from "./src/services/aggregator/eventDatabase";

const OPENAI_KEY = process.env.OPENAI_API_KEY?.trim() || "";
const OPENAI_MODEL_NAME = process.env.OPENAI_MODEL?.trim() || "gpt-5-nano";
const OPENAI_SEARCH_CONTEXT = process.env.OPENAI_SEARCH_CONTEXT?.trim() || "low";

const openaiClient = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;
const eventDatabase = new EventDatabase();
const CRAWL_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type SearchResult = {
  url?: string;
  title?: string;
  snippet?: string;
};

type DiscoverCriteria = {
  region?: string;
  category?: string;
  date?: string;
};

function isVideoLink(url: string = ""): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com") ||
    lower.includes("tiktok.com") ||
    lower.includes("dailymotion.com") ||
    lower.includes("facebook.com/watch") ||
    lower.includes("/reel/") ||
    lower.includes("/shorts/") ||
    lower.includes("/video/")
  );
}

function normalizeText(value: string | undefined): string {
  return String(value || "").trim();
}

const ALLOWED_OFFICIAL_DOMAINS = [
  "campinas.sp.gov.br",
  "campinas.com.br",
  "agendavivasp.com.br",
  "spmaiscultura.sp.gov.br",
  "cultura.prefeitura.rio",
  "riotur.rio",
  "secult.mg.gov.br",
  "minasgerais.com.br",
  "portalbelohorizonte.com.br",
  "paranaturismo.com.br",
  "curitiba.pr.gov.br",
  "turismo.sc.gov.br",
  "pmf.sc.gov.br",
  "turismo.rs.gov.br",
  "portoalegre.rs.gov.br",
  "bahiatursa.ba.gov.br",
  "salvadordabahia.com",
  "empetur.pe.gov.br",
  "olharecife.com.br",
  "setur.ce.gov.br",
  "fortaleza.ce.gov.br",
  "goiasturismo.go.gov.br",
  "turismo.df.gov.br",
  "brasilia.df.gov.br",
  "descubraoespiritosanto.es.gov.br",
  "turismo.mt.gov.br",
  "turismo.ms.gov.br",
  "paraturismo.pa.gov.br",
  "amazonastur.am.gov.br",
  "turismo.gov.br",
  "cultura.gov.br",
  "sescsp.org.br",
  "sescrio.org.br",
  "sesc.com.br",
  "unicamp.br",
  "usp.br",
  "unesp.br",
  "puc-campinas.edu.br",
  "ifsp.edu.br",
  "cultura.sp.gov.br",
  "turismo.sp.gov.br",
  "dados.gov.br",
  "agendacultural.sp.gov.br",
  "museus.sp.gov.br",
  "sp.gov.br",
  "rj.gov.br",
  "mg.gov.br",
  "pr.gov.br",
  "rs.gov.br",
  "ba.gov.br",
  "pe.gov.br",
  "ce.gov.br",
  "go.gov.br",
  "df.gov.br",
  "es.gov.br",
  "mt.gov.br",
  "ms.gov.br",
  "pa.gov.br",
  "am.gov.br",
  "sc.gov.br",
  "pb.gov.br",
  "rn.gov.br",
  "al.gov.br",
  "se.gov.br",
  "pi.gov.br",
  "ma.gov.br",
  "to.gov.br",
  "ro.gov.br",
  "ac.gov.br",
  "rr.gov.br",
  "ap.gov.br",
  "joaopessoa.pb.gov.br",
  "natal.rn.gov.br",
  "maceio.al.gov.br",
  "aracaju.se.gov.br",
  "portovelho.ro.gov.br",
  "riobranco.ac.gov.br",
  "macapa.ap.gov.br",
  "boavista.rr.gov.br",
  "niteroi.rj.gov.br",
  "santos.sp.gov.br",
  "ouropreto.mg.gov.br",
  "olinda.pe.gov.br",
  "blumenau.sc.gov.br",
  "bentogoncalves.rs.gov.br",
  "tiradentes.mg.gov.br",
  "pmvc.ba.gov.br",
];

function isLikelyEventPageUrl(url: string): boolean {
  if (!url || typeof url !== "string" || !url.startsWith("http")) return false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes(".")) return false;

    // Google search URLs or Sympla search URLs are valid fallback search links
    if (host.includes("google.com") || host.includes("google.com.br")) {
      return true;
    }

    // Reject generic root / home page URLs
    const pathname = parsed.pathname.toLowerCase().replace(/\/$/, "");
    if (!pathname || pathname === "" || pathname === "/") return false;

    // Reject generic portal landing pages / index pages
    const genericPaths = new Set([
      "/agenda",
      "/cultura",
      "/eventos",
      "/programacao",
      "/programação",
      "/home",
      "/inicio",
      "/index.html",
      "/index.php",
      "/governo/cultura-e-turismo",
      "/agenda-cultural",
      "/busca",
      "/search",
    ]);

    if (genericPaths.has(pathname)) return false;

    // Verify path has deep link structure (path segments or ID slug)
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return false;
    if (segments.length === 1 && segments[0].length < 3) return false;

    // High confidence cultural and event ticketing platforms are allowed as deep links
    const allowedPlatforms = [
      "sescsp.org.br",
      "sympla.com.br",
      "eventbrite.com.br",
      "feverup.com",
      "campinas.com.br",
      "ondevamo.com",
      "portalbelohorizonte.com.br",
      "royalpalmeventos.com.br",
      "multiarenacampinas.com.br",
      "casadeartistas.com.br",
      "teatrooficinadoestudante.com.br",
      "portalhortolandia.com.br",
      "hortolandia.sp.gov.br",
      "ribeiraopreto.sp.gov.br",
      "revide.com.br",
      "ribeiraoshopping.com.br",
      "riopreto.sp.gov.br",
      "diariodaregiao.com.br",
      "jcnet.com.br",
      "bauru.sp.gov.br",
      "sorocaba.sp.gov.br",
      "jornalcruzeiro.com.br",
      "jundiai.sp.gov.br",
      "piracicaba.sp.gov.br",
      "jornaldepiracicaba.com.br",
      "saocarlosagora.com.br",
      "promemoria.saocarlos.sp.gov.br",
      "araraquara.com.br",
      "araraquara.sp.gov.br",
      "gcn.net.br",
      "marilianoticia.com.br",
      "ifronteira.com",
      "soubh.com.br",
      "correiodeuberlandia.com.br",
      "zinecultural.com",
      "curitibacult.com.br",
      "guiacuritiba.com.br",
      "londrina.pr.gov.br",
      "maringapost.com.br",
      "floripamilgrau.com.br",
      "guiafloripa.com.br",
      "ocp.news",
      "agendapoa.com.br",
      "poacultural.com",
      "clicrbs.com.br",
      "curtamais.com.br",
      "goiania.go.gov.br",
      "aloalobahia.com",
      "salvadordabahia.com",
      "visit.recife.br",
      "leiaja.com",
      "fortaleza24h.com.br",
      "opovo.com.br",
      "americana.sp.gov.br",
      "indaiatuba.sp.gov.br",
      "sumare.sp.gov.br",
      "paulinia.sp.gov.br",
      "valinhos.sp.gov.br",
      "vinhedo.sp.gov.br",
      "jaguariuna.sp.gov.br",
      "itatiba.sp.gov.br",
      "novaodessa.sp.gov.br",
      "santabarbara.sp.gov.br",
      "unicamp.br",
      "usp.br",
      "unesp.br",
    ];

    if (allowedPlatforms.some(platform => host.includes(platform))) {
      return true;
    }

    const allowed = ALLOWED_OFFICIAL_DOMAINS.some(
      (domain) => host === domain || host.endsWith(`.${domain}`) || host.includes(domain),
    );

    if (!allowed) {
      if (
        !host.endsWith(".gov.br") &&
        !host.endsWith(".edu.br") &&
        !host.endsWith(".org.br") &&
        !host.endsWith(".rio")
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Identifica a "fonte" (plataforma de origem) a partir da URL.
 */
function identifyFonte(url: string): string {
  if (!url) return "";
  const lower = url.toLowerCase();
  try {
    const host = new URL(lower).hostname;
    if (host.includes("sympla")) return "sympla";
    if (host.includes("eventbrite")) return "eventbrite";
    if (host.includes("sescsp") || host.includes("sesc.com")) return "sesc";
    if (host.includes("unicamp")) return "unicamp";
    if (host.includes("meetup.com")) return "meetup";
    if (host.includes("feverup")) return "fever";
    if (host.includes("even3")) return "even3";
    if (host.includes("doity")) return "doity";
    if (host.includes("bilheteriadigital")) return "bilheteriadigital";
    if (host.includes("shotgun.live")) return "shotgun";
    if (host.includes("ingresse")) return "ingresse";
    if (host.includes("ticket360")) return "ticket360";
    if (host.includes("eventim")) return "eventim";
    if (host.includes(".gov.br")) return "governo";
    if (host.includes("usp.br")) return "usp";
    if (host.includes("unesp.br")) return "unesp";
    if (host.includes("ifsp.edu")) return "ifsp";
    if (host.includes("puc-campinas")) return "puc";
  } catch {
    // fall through
  }
  return "web";
}

/**
 * Extrai um external_id da URL quando possivel.
 */
function extractExternalId(url: string, fonte: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] || "";

    if (fonte === "sympla" && /^\d{4,}$/.test(last)) return last;
    if (fonte === "eventbrite") {
      const match = last.match(/(\d{6,})$/);
      if (match) return match[1];
    }
    if (fonte === "meetup" && /^\d{5,}$/.test(last)) return last;
    if (fonte === "even3") {
      const match = last.match(/-(\d+)$/);
      if (match) return match[1];
    }
    if (/^\d{3,}$/.test(last)) return last;
  } catch {
    // ignore
  }
  return "";
}

function enrichEventWithSourceMetadata(
  event: SavedCrawlEvent,
): SavedCrawlEvent {
  const fonte = event.fonte || identifyFonte(event.sourceUrl);
  const externalId =
    event.externalId || extractExternalId(event.sourceUrl, fonte);
  return {
    ...event,
    fonte,
    externalId: externalId || undefined,
  };
}

function isValidUpcomingEvent(ev: any): boolean {
  if (!ev) return false;
  if (!isLikelyEventPageUrl(ev.sourceUrl || "")) return false;
  if (isVideoLink(ev.sourceUrl || "")) return false;

  const title = normalizeText(ev.title).toLowerCase();
  const address = normalizeText(ev.address).toLowerCase();
  const dateRange = normalizeText(ev.dateRange).toLowerCase();

  if (!title || title.length < 3) return false;
  if (title.includes("cancelado") || title.includes("adiado") || title.includes("encerrado")) return false;

  const invalidDateKeywords = [
    "a definir",
    "data a definir",
    "em breve",
    "a confirmar",
    "sem data",
    "tbd",
    "tba",
    "encerrado",
    "passado",
    "finalizado",
    "concluido",
  ];
  if (!dateRange || dateRange.length < 3 || invalidDateKeywords.some((k) => dateRange.includes(k))) {
    return false;
  }

  const invalidAddressKeywords = [
    "a definir",
    "local a definir",
    "a confirmar",
    "nao informado",
    "não informado",
    "verificar local",
    "desconhecido",
    "tbd",
    "tba",
  ];
  if (!address || address.length < 4 || invalidAddressKeywords.some((k) => address.includes(k))) {
    return false;
  }

  return true;
}

function buildSourcesFromEvents(events: SavedCrawlEvent[]): SavedCrawlSource[] {
  const seen = new Set<string>();
  const sources: SavedCrawlSource[] = [];

  for (const event of events) {
    const uri = event.sourceUrl?.trim();
    if (!isLikelyEventPageUrl(uri) || seen.has(uri) || isVideoLink(uri)) continue;
    seen.add(uri);
    sources.push({
      uri,
      title: event.sourceTitle || event.organizer || event.title || "Fonte do evento",
    });
  }

  return sources;
}

function findBestDirectUrl(evTitle: string, evSourceUrl: string, searchResults: SearchResult[]): string {
  if (isLikelyEventPageUrl(evSourceUrl)) {
    return evSourceUrl;
  }

  if (Array.isArray(searchResults) && searchResults.length > 0) {
    const titleWords = evTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    let bestMatchUrl = "";
    let maxMatchCount = 0;

    for (const result of searchResults) {
      const candidateUrl = result.url || "";
      if (!isLikelyEventPageUrl(candidateUrl) || isVideoLink(candidateUrl)) continue;
      const candidateText = `${result.title || ""} ${result.snippet || ""} ${candidateUrl}`.toLowerCase();
      const matchCount = titleWords.filter((word) => candidateText.includes(word)).length;
      if (matchCount > maxMatchCount) {
        maxMatchCount = matchCount;
        bestMatchUrl = candidateUrl;
      }
    }

    if (bestMatchUrl) return bestMatchUrl;
  }

  return "";
}

const VERIFIED_SEED_EVENTS: SavedCrawlEvent[] = [];

async function searchAndExtractWithOpenAI(
  searchQuery: string
): Promise<{ events: SavedCrawlEvent[]; sources: SavedCrawlSource[]; engine: string } | null> {
  if (!openaiClient) return null;

  try {
    console.log(`[OpenAI] Buscando eventos com o modelo ${OPENAI_MODEL_NAME}...`);

    const response = await openaiClient.responses.create({
      model: OPENAI_MODEL_NAME,
      tools: [
        {
          type: "web_search",
          search_context_size: OPENAI_SEARCH_CONTEXT === "medium" || OPENAI_SEARCH_CONTEXT === "high" ? OPENAI_SEARCH_CONTEXT : "low",
        },
      ],
      input: [
        {
          role: "system",
          content:
            "Você é um extrator rigoroso de eventos culturais reais, futuros e oficiais do Brasil. VOCÊ DEVE PESQUISAR E EXTRAIR EVENTOS EXCLUSIVAMENTE EM SITES DE PREFEITURAS, SECRETARIAS MUNICIPAIS E ESTADUAIS DE CULTURA/TURISMO, PORTAIS DE TURISMO MUNICIPAL E PORTAIS LOCAIS OFICIAIS DE CIDADES (ex: campinas.sp.gov.br, cultura.prefeitura.rio, secult.mg.gov.br, agendavivasp.com.br, portalbelohorizonte.com.br, salvadordabahia.com, curitiba.pr.gov.br, turismo.df.gov.br). É ESTRITAMENTE PROIBIDO retornar links do Sympla, Eventbrite ou plataformas privadas de ingressos. A 'sourceUrl' DEVE SER O LINK DIRETO PARA A MATÉRIA OU PÁGINA ESPECÍFICA DO EVENTO NO SITE OFICIAL."
        },
        {
          role: "user",
          content: `Pesquise e extraia próximos eventos culturais reais e oficiais no Brasil com base nos critérios informados.

REGRAS DE VERIFICAÇÃO DE FONTES E LINKS DIRETO:
- Hoje é 2026-08-07. Retorne apenas eventos futuros reais.
- A 'sourceUrl' DEVE SER O LINK DIRETO PARA A PÁGINA OU MATÉRIA ESPECÍFICA DO EVENTO EM SITES DA PREFEITURA OU SECRETARIAS.
- NUNCA envie a homepage do site ou plataformas de venda de ingressos privadas como Sympla/Eventbrite.
- Verifique se a página encontrada funciona e fala diretamente sobre o evento e seus detalhes (data, local, programação).
- Priorize sites e portais oficiais (.gov.br, .rio, agendavivasp.com.br, portalbelohorizonte.com.br, salvadordabahia.com, curitiba.pr.gov.br, etc).
- Retorne no máximo 8 eventos válidos em JSON.
- Campos obrigatórios: title, category, description, address, cityRegion, dateRange, isVirtual, isPaid, price, organizer, sourceUrl.

Consulta de busca: ${searchQuery}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "event_list",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["events"],
            properties: {
              events: {
                type: "array",
                maxItems: 8,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "title",
                    "category",
                    "description",
                    "address",
                    "cityRegion",
                    "dateRange",
                    "isVirtual",
                    "isPaid",
                    "price",
                    "organizer",
                    "sourceUrl",
                  ],
                  properties: {
                    title: { type: "string" },
                    category: { type: "string" },
                    description: { type: "string" },
                    address: { type: "string" },
                    cityRegion: { type: "string" },
                    dateRange: { type: "string" },
                    isVirtual: { type: "boolean" },
                    isPaid: { type: "boolean" },
                    price: { type: "string" },
                    organizer: { type: "string" },
                    sourceUrl: { type: "string" },
                    externalId: { type: "string" },
                    fonte: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      max_output_tokens: 1000,
      store: false,
    });

    const outputText = response.output_text || "";
    if (!outputText) return null;

    const parsed = JSON.parse(outputText) as { events?: any[] };
    const validEvents = (parsed.events || [])
      .map((event: any) => ({
        title: String(event.title || ""),
        category: String(event.category || ""),
        description: String(event.description || ""),
        address: String(event.address || ""),
        cityRegion: String(event.cityRegion || "Brasil"),
        dateRange: String(event.dateRange || ""),
        isVirtual: Boolean(event.isVirtual),
        isPaid: Boolean(event.isPaid),
        price: String(event.price || "Gratuito"),
        organizer: String(event.organizer || ""),
        sourceUrl: findBestDirectUrl(
          String(event.title || searchQuery),
          String(event.sourceUrl || ""),
          [],
        ),
        externalId: event.externalId ? String(event.externalId) : undefined,
        fonte: event.fonte ? String(event.fonte) : undefined,
      }))
      .filter(isValidUpcomingEvent)
      .map(enrichEventWithSourceMetadata)
      .slice(0, 8);

    if (validEvents.length === 0) return null;

    const sources = buildSourcesFromEvents(validEvents);
    console.log(`[OpenAI ${OPENAI_MODEL_NAME}] Encontrados ${validEvents.length} eventos validos.`);

    return {
      events: validEvents,
      sources,
      engine: `OpenAI Web Search (${OPENAI_MODEL_NAME})`,
    };
  } catch (err: any) {
    console.error("Erro na busca OpenAI:", err?.message || err);
    return null;
  }
}

/**
 * Constroi uma consulta de busca a partir de criterios estruturados.
 * Ex: { region: "Campinas", category: "tecnologia", date: "agosto 2026" }
 *   -> "eventos tecnologia Campinas agosto 2026"
 */
function buildSearchQueryFromCriteria(criteria: DiscoverCriteria): string {
  const parts: string[] = ["eventos"];
  if (criteria.category) parts.push(criteria.category);
  if (criteria.region) parts.push(criteria.region);
  if (criteria.date) parts.push(criteria.date);
  else parts.push("2026");
  return parts.join(" ");
}

const STARTUP_SEED_QUERIES = [
  "eventos culturais oficiais prefeitura agenda cultural Brasil 2026",
  "agenda cultural oficial site:campinas.sp.gov.br",
  "eventos oficiais site:cultura.prefeitura.rio",
  "agenda cultural oficial site:secult.mg.gov.br",
  "eventos oficiais site:agendavivasp.com.br",
  "eventos oficiais site:portalbelohorizonte.com.br",
  "agenda cultural oficial site:curitiba.pr.gov.br",
  "eventos turismo oficial site:turismo.df.gov.br",
];

async function seedInitialEventCatalog(): Promise<{ seededCount: number; batches: number }> {
  eventDatabase.clearAllEvents();
  console.log("[Seed Catalog] Todos os eventos foram limpos.");
  return { seededCount: 0, batches: 0 };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const aggregator = EventAggregatorService.getInstance();
  const crawlCache = new Map<string, { timestamp: number; data: any }>();

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      openaiConfigured: !!openaiClient,
      sqliteConfigured: true,
      openaiModel: OPENAI_MODEL_NAME,
      cacheTtlHours: CRAWL_CACHE_TTL_MS / (60 * 60 * 1000),
    });
  });

  app.get("/api/aggregator/status", (req, res) => {
    res.json({
      metrics: aggregator.getMetrics(),
      providers: aggregator.getProviders(),
      logs: aggregator.getLogs(),
      eventsCount: aggregator.getDiscoveredEvents().length,
    });
  });

  app.post("/api/aggregator/run", async (req, res) => {
    try {
      const { source } = req.body || {};
      const result = aggregator.runDiscoveryCycle(source || "Solicitacao via Painel Admin");
      res.json({
        success: true,
        summary: result,
        metrics: aggregator.getMetrics(),
        logs: aggregator.getLogs().slice(0, 15),
        events: aggregator.getDiscoveredEvents(),
        culturalEvents: aggregator.toCulturalEvents(),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Falha ao executar o agregador em tempo real: " + err.message });
    }
  });

  app.post("/api/aggregator/providers/toggle", (req, res) => {
    const { providerId, enabled } = req.body;
    const providers = aggregator.toggleProvider(providerId, enabled);
    res.json({ success: true, providers });
  });

  app.post("/api/aggregator/scheduler", (req, res) => {
    const { frequency } = req.body;
    if (["1h", "24h", "7d", "paused"].includes(frequency)) {
      aggregator.setSchedulerFrequency(frequency as any);
      return res.json({ success: true, metrics: aggregator.getMetrics() });
    }
    res.status(400).json({ error: "Frequencia invalida" });
  });

  app.post("/api/ai/quiz-recommendation", async (req, res) => {
    try {
      const { answers, events } = req.body;

      if (!openaiClient) {
        return res.json({
          recommendation: null,
          reasoning: "Assistente de IA offline (chave OpenAI nao configurada).",
        });
      }

      const response = await openaiClient.responses.create({
        model: OPENAI_MODEL_NAME,
        input: [
          {
            role: "system",
            content:
              "Voce e um curador de eventos culturais. Escolha o melhor evento com base nos gostos do usuario e responda apenas JSON.",
          },
          {
            role: "user",
            content: `Preferencias do usuario:
${JSON.stringify(answers, null, 2)}

Eventos disponiveis:
${JSON.stringify(
  (events || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    description: e.description,
  })),
  null,
  2
)}

Retorne apenas:
{
  "eventId": "id_do_evento_escolhido",
  "matchScore": 95,
  "reason": "explicacao curta em portugues"
}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "quiz_recommendation",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["eventId", "matchScore", "reason"],
              properties: {
                eventId: { type: "string" },
                matchScore: { type: "number" },
                reason: { type: "string" },
              },
            },
          },
        },
        max_output_tokens: 200,
        store: false,
      });

      const text = response.output_text || "";
      return res.json(text ? JSON.parse(text) : { recommendation: null });
    } catch (err: any) {
      console.error("OpenAI quiz error:", err);
      return res.status(500).json({ error: "Falha ao gerar recomendacao de IA" });
    }
  });

  app.post("/api/ai/crawl-events", async (req, res) => {
    const { city, query } = req.body || {};
    const targetRegion = String(query || city || "Brasil - todos os estados");
    const cacheKey = targetRegion.trim().toLowerCase();

    const dbCachedEvents = eventDatabase.getRecentEvents(cacheKey, CRAWL_CACHE_TTL_MS);
    if (dbCachedEvents.length > 0) {
      return res.json({
        crawledEvents: dbCachedEvents,
        sources: buildSourcesFromEvents(dbCachedEvents),
        groundingUsed: false,
        engine: "SQLite cache",
        isCached: true,
        message: `[Cache Persistente] ${dbCachedEvents.length} eventos para "${targetRegion}" carregados do banco.`,
      });
    }

    const cached = crawlCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CRAWL_CACHE_TTL_MS) {
      return res.json({
        ...cached.data,
        message: `[Cache Local] Proximos eventos para "${targetRegion}" carregados.`,
        isCached: true,
      });
    }

    try {
      const openAiResult = await searchAndExtractWithOpenAI(targetRegion);
      if (openAiResult && openAiResult.events.length > 0) {
        const resultPayload = {
          crawledEvents: openAiResult.events,
          sources: openAiResult.sources,
          groundingUsed: true,
          engine: openAiResult.engine,
          message: `Encontrados ${openAiResult.events.length} eventos reais via OpenAI web search (${OPENAI_MODEL_NAME}).`,
        };

        eventDatabase.saveCrawlBatch({
          queryKey: cacheKey,
          queryLabel: targetRegion,
          engine: openAiResult.engine,
          modelName: OPENAI_MODEL_NAME,
          sourceKind: "openai-web-search",
          sources: openAiResult.sources,
          events: openAiResult.events,
        });

        crawlCache.set(cacheKey, { timestamp: Date.now(), data: resultPayload });
        return res.json(resultPayload);
      }

      const directResult = {
        crawledEvents: [],
        sources: [] as SavedCrawlSource[],
        groundingUsed: false,
        isFallback: false,
        engine: `OpenAI Web Search (${OPENAI_MODEL_NAME})`,
        message: 'Nenhum evento novo encontrado nas fontes oficiais permitidas.',
      };

      crawlCache.set(cacheKey, { timestamp: Date.now(), data: directResult });
      return res.json(directResult);
    } catch (err: any) {
      console.warn("Aviso na busca de eventos:", err.message || err);
      const fallbackResult = {
        crawledEvents: [],
        sources: [] as SavedCrawlSource[],
        groundingUsed: false,
        isFallback: false,
        engine: `OpenAI Web Search (${OPENAI_MODEL_NAME})`,
        message: 'Falha na busca oficial. Nenhum evento novo foi retornado.',
      };

      crawlCache.set(cacheKey, { timestamp: Date.now(), data: fallbackResult });
      return res.json(fallbackResult);
    }
  });

  app.get("/api/events/saved", (req, res) => {
    res.json({
      events: eventDatabase.listSavedEvents(500),
      crawls: eventDatabase.getRecentCrawls(20),
      totals: {
        events: eventDatabase.countSavedEvents(),
        crawls: eventDatabase.countSavedCrawls(),
      },
    });
  });

  app.post("/api/events/clear", (req, res) => {
    try {
      eventDatabase.clearAllEvents();
      return res.json({ success: true, message: "Todos os eventos foram apagados com sucesso." });
    } catch (e) {
      console.error("Erro ao apagar eventos:", e);
      return res.status(500).json({ success: false, error: "Erro ao apagar eventos." });
    }
  });

  app.post("/api/events/create", (req, res) => {
    try {
      const eventData = req.body;
      if (!eventData || !eventData.title) {
        return res.status(400).json({ success: false, error: "Dados inválidos para o evento." });
      }

      const sourceUrl = eventData.sourceUrl || `https://mapacultural.local/evento/${eventData.id || Date.now()}`;
      
      const saveResult = eventDatabase.saveCrawlBatch({
        queryKey: "eventos cadastrados",
        queryLabel: "Cadastrado por Usuário",
        engine: "Sistema Mapa Cultural",
        modelName: "Manual",
        sourceKind: "user-created",
        sources: [{ uri: sourceUrl, title: eventData.title }],
        events: [{
          title: eventData.title,
          category: eventData.category || "Cultura",
          description: eventData.description || "",
          address: eventData.address || "Local a confirmar",
          cityRegion: eventData.cityRegion || "Brasil",
          dateRange: eventData.dateRange || "Em breve",
          isVirtual: Boolean(eventData.isVirtual),
          isPaid: Boolean(eventData.isPaid),
          price: eventData.price || "Gratuito",
          organizer: eventData.organizer || "Organizador Local",
          sourceUrl: sourceUrl,
          sourceTitle: "Mapa Cultural do Brasil",
          fonte: "manual",
          externalId: eventData.id || `custom-${Date.now()}`
        }]
      });

      return res.json({
        success: true,
        message: "Evento cadastrado e salvo no banco de dados com sucesso.",
        newCount: saveResult.newCount,
        updatedCount: saveResult.updatedCount,
        totals: {
          events: eventDatabase.countSavedEvents()
        }
      });
    } catch (err: any) {
      console.error("Erro ao salvar evento manual:", err);
      return res.status(500).json({ success: false, error: err.message || "Erro interno ao salvar evento." });
    }
  });

  app.post("/api/ai/seed-events", async (req, res) => {
    try {
      const summary = await seedInitialEventCatalog();
      res.json({
        success: true,
        ...summary,
        totals: {
          events: eventDatabase.countSavedEvents(),
          crawls: eventDatabase.countSavedCrawls(),
        },
        events: eventDatabase.listSavedEvents(100),
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || "Falha ao executar o seed inicial de eventos.",
      });
    }
  });

  app.post("/api/ai/discover-events", async (req, res) => {
    try {
      const { region, category, date, query } = req.body || {};

      const criteria: DiscoverCriteria = {
        region: region ? String(region).trim() : undefined,
        category: category ? String(category).trim() : undefined,
        date: date ? String(date).trim() : undefined,
      };

      const searchQuery = query
        ? String(query).trim()
        : buildSearchQueryFromCriteria(criteria);
      const cacheKey = searchQuery.trim().toLowerCase();

      const dbCachedEvents = eventDatabase.getRecentEvents(cacheKey, CRAWL_CACHE_TTL_MS);
      if (dbCachedEvents.length > 0) {
        return res.json({
          success: true,
          query: searchQuery,
          criteria,
          events: dbCachedEvents,
          newCount: 0,
          updatedCount: 0,
          totalInDb: eventDatabase.countSavedEvents(),
          isCached: true,
          message: `[Cache] ${dbCachedEvents.length} eventos para "${searchQuery}" carregados do banco sem novas chamadas à API.`,
        });
      }

      if (!openaiClient) {
        return res.json({
          success: false,
          query: searchQuery,
          criteria,
          events: [],
          newCount: 0,
          updatedCount: 0,
          totalInDb: eventDatabase.countSavedEvents(),
          message: "OpenAI nao configurada. Configure OPENAI_API_KEY no .env.",
        });
      }

      const result = await searchAndExtractWithOpenAI(searchQuery);
      if (!result || result.events.length === 0) {
        return res.json({
          success: true,
          query: searchQuery,
          criteria,
          events: [],
          newCount: 0,
          updatedCount: 0,
          totalInDb: eventDatabase.countSavedEvents(),
          message: "Nenhum evento novo encontrado nas fontes oficiais para os criterios informados.",
        });
      }

      const saved = eventDatabase.saveCrawlBatch({
        queryKey: cacheKey,
        queryLabel: searchQuery,
        engine: result.engine,
        modelName: OPENAI_MODEL_NAME,
        sourceKind: "ai-discover",
        sources: result.sources,
        events: result.events,
      });

      return res.json({
        success: true,
        query: searchQuery,
        criteria,
        events: saved.events,
        newCount: saved.newCount,
        updatedCount: saved.updatedCount,
        duplicatesSkipped: saved.duplicateCount,
        totalInDb: eventDatabase.countSavedEvents(),
        engine: result.engine,
        message: `Busca concluida: ${saved.newCount} evento(s) novo(s), ${saved.updatedCount} atualizado(s), ${saved.duplicateCount} duplicado(s) ignorado(s).`,
      });
    } catch (err: any) {
      console.error("Erro em /api/ai/discover-events:", err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || "Falha ao descobrir eventos.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const seedSummary = await seedInitialEventCatalog();
  console.log(`Seed inicial: ${seedSummary.seededCount} eventos salvos em ${seedSummary.batches} lotes.`);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor VAICE + Event Aggregator rodando em http://localhost:${PORT}`);
  });
}

startServer();

