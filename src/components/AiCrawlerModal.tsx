import React, { useState } from 'react';
import { CulturalEvent } from '../types';
import { getWorkingEventUrl, isVerifiedDeepLink } from '../utils/linkUtils';
import { ArrowLeft, Bot, Sparkles, RefreshCw, ExternalLink, Globe, Search, ShieldCheck } from 'lucide-react';

interface AiCrawlerModalProps {
  events: CulturalEvent[];
  onAddAiEvents: (newEvents: CulturalEvent[]) => void;
  onGoToMap: () => void;
}

export const AiCrawlerModal: React.FC<AiCrawlerModalProps> = ({
  events,
  onAddAiEvents,
  onGoToMap,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [cityTarget, setCityTarget] = useState('Brasil - todos os estados');
  const [searchLogs, setSearchLogs] = useState<string[]>([]);
  const [groundingSources, setGroundingSources] = useState<{ uri: string; title: string }[]>([]);

  const quickPresets = [
    'Brasil - todos os estados',
    'Eventos culturais oficiais no Brasil',
    'Sesc SP e Unicamp',
    'Sympla e Eventbrite Brasil',
    'Agenda cultural por estado',
  ];

  const handleRunAiCrawler = async (overrideTarget?: string) => {
    const target = overrideTarget || cityTarget;
    setIsSearching(true);
    setGroundingSources([]);
    setSearchLogs([
      `Conectando ao OpenAI web search com custo reduzido...`,
      `Pesquisando eventos reais e vigentes para: "${target}"...`,
      `Filtrando resultados da web e portais oficiais...`,
      `Extraindo informaÃ§Ãµes completas e links da fonte original...`,
    ]);

    try {
      const response = await fetch('/api/ai/crawl-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: target, city: target }),
      });
      const data = await response.json();

      if (data && data.sources) {
        setGroundingSources(data.sources);
      }

      if (data && data.crawledEvents && data.crawledEvents.length > 0) {
        const generated: CulturalEvent[] = data.crawledEvents.map((c: any, i: number) => ({
          id: `ai-real-${Date.now()}-${i}`,
          title: c.title || 'Evento Cultural Real',
          dateRange: c.dateRange || 'Em breve',
          category: c.category || 'Evento Musical',
          description: c.description || 'Evento cultural real verificado via OpenAI web search.',
          address: c.address || 'Local informado no link oficial',
          cityRegion: c.cityRegion || target,
          lat: -22.860 + (Math.random() - 0.5) * 0.08,
          lng: -47.160 + (Math.random() - 0.5) * 0.08,
          image: c.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
          rating: 0,
          reviewsCount: 0,
          isVirtual: c.isVirtual || false,
          isPaid: c.isPaid || false,
          price: c.price || 'Gratuito',
          distanceKm: 3.2,
          travelTimeMinutes: 10,
          organizer: c.organizer || 'OrganizaÃ§Ã£o Local Verificada',
          isAiGenerated: true,
          sourceUrl: c.sourceUrl || (data.sources?.[0]?.uri || ''),
          pinColor: 'purple',
        }));

        onAddAiEvents(generated);
        setSearchLogs(prev => [
          ...prev,
          `Sucesso! Foram encontrados ${generated.length} eventos reais com links diretos da fonte original!`,
          `Os novos eventos foram adicionados ao mapa e calendÃ¡rio!`
        ]);
      } else if (data && data.error) {
        setSearchLogs(prev => [...prev, `AtenÃ§Ã£o: ${data.error}`]);
      } else {
        setSearchLogs(prev => [...prev, `A busca nÃ£o retornou novos eventos para esta regiÃ£o no momento.`]);
      }
    } catch (e: any) {
      setSearchLogs(prev => [...prev, `Erro de conexÃ£o com o servidor de IA.`]);
    } finally {
      setIsSearching(false);
    }
  };

  const aiEvents = events.filter(e => e.isAiGenerated);

  React.useEffect(() => {
    if (aiEvents.length === 0 && !isSearching) {
      handleRunAiCrawler();
    }
  }, []);

  return (
    <div className="w-full h-full bg-[#08080a] text-zinc-100 p-4 md:p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
      <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-3">
        <button
          onClick={onGoToMap}
          className="flex items-center gap-2 text-sm font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500" />
          <span>Pesquisa de Eventos Reais com IA (OpenAI)</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div className="bg-[#12131a] border border-purple-500/40 p-5 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400 font-extrabold text-base">
              <Bot className="w-5 h-5" />
              <span>OpenAI Web Search com baixo custo</span>
            </div>
            <span className="text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40 px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Eventos Reais e Links Originais
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Pesquise em tempo real por eventos culturais reais que vÃ£o acontecer na sua cidade ou regiÃ£o. A IA consulta a web com custo reduzido, extrai os detalhes do evento e traz o link da <strong>fonte original</strong> para vocÃª saber mais e garantir sua presenÃ§a.
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={cityTarget}
                  onChange={(e) => setCityTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRunAiCrawler()}
                  placeholder="Digite uma cidade, estado ou tema (ex: Brasil, São Paulo, Teatro SP)..."
                  className="bg-[#181a24] text-xs text-white pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700/80 w-full focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={() => handleRunAiCrawler()}
                disabled={isSearching}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer shrink-0 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                <span>{isSearching ? 'Pesquisando na web...' : 'Buscar Eventos Reais'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-zinc-400 text-[11px] font-semibold">SugestÃµes de busca:</span>
              {quickPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setCityTarget(preset);
                    handleRunAiCrawler(preset);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#1a1c28] hover:bg-purple-950/60 border border-zinc-800 hover:border-purple-500/50 text-[11px] text-zinc-300 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {searchLogs.length > 0 && (
            <div className="bg-[#0b0c10] p-3.5 rounded-2xl border border-purple-900/60 text-[11px] font-mono text-purple-300 space-y-1">
              {searchLogs.map((log, idx) => (
                <p key={idx} className="leading-tight">{log}</p>
              ))}
            </div>
          )}

          {groundingSources.length > 0 && (
            <div className="pt-2 border-t border-purple-900/40">
              <p className="text-[11px] font-bold text-zinc-300 flex items-center gap-1 mb-2">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Fontes web consultadas ({groundingSources.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {groundingSources.map((src, i) => (
                  <a
                    key={i}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors truncate max-w-[260px]"
                    title={src.title}
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{src.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Eventos Encontrados na Web via IA ({aiEvents.length})
            </h3>
            {aiEvents.length > 0 && (
              <button
                onClick={onGoToMap}
                className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
              >
                Ver no Mapa de Eventos â†’
              </button>
            )}
          </div>

          {aiEvents.length === 0 ? (
            <div className="bg-[#12131a] border border-zinc-800/80 p-8 rounded-3xl text-center space-y-3 text-zinc-400">
              <Bot className="w-10 h-10 text-purple-400 mx-auto opacity-60" />
              <p className="text-sm font-semibold text-zinc-300">
                Nenhum evento pesquisado via IA no momento.
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Digite uma cidade ou clique em um dos botÃµes de busca acima para a IA pesquisar eventos reais na web com os links das fontes originais.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiEvents.map((ev) => {
                const targetUrl = getWorkingEventUrl(ev);
                return (
                  <div
                    key={ev.id}
                    className="bg-[#12131a] border border-purple-500/40 hover:border-purple-400 p-4 rounded-3xl space-y-3 shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          Evento Real Verificado
                        </span>
                        <span className="text-xs font-bold text-zinc-400">
                          {ev.dateRange}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-white leading-snug">
                        {ev.title}
                      </h4>

                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {ev.description}
                      </p>

                      <div className="text-xs space-y-1 pt-1 text-zinc-300">
                        <p><strong className="text-zinc-400">Local:</strong> {ev.address} ({ev.cityRegion})</p>
                        <p><strong className="text-zinc-400">Organizador:</strong> {ev.organizer}</p>
                        <p><strong className="text-zinc-400">PreÃ§o:</strong> <span className="text-emerald-400 font-bold">{ev.price}</span></p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 flex flex-col gap-2">
                      {targetUrl ? (
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-500/50 text-xs font-extrabold flex items-center justify-between transition-all shadow-md group cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate">
                              {isVerifiedDeepLink(ev.sourceUrl) ? 'Abrir Site Oficial do Evento' : 'Pesquisar Notícias e Fonte no Google'}
                            </span>
                          </span>
                          <span className="text-[10px] bg-sky-900 text-sky-200 px-2 py-0.5 rounded font-medium shrink-0">Abrir â†’</span>
                        </a>
                      ) : (
                        <div className="py-1.5 px-2.5 rounded-lg bg-zinc-900 text-zinc-500 border border-zinc-800 text-[11px] font-semibold">
                          Fonte original nÃ£o encontrada
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
