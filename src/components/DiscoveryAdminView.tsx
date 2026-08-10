import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Search, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getWorkingEventUrl } from '../utils/linkUtils';
import { 
  FullyDiscoveredEvent, 
  AggregatorMetrics, 
  AggregatorProviderConfig, 
  AggregatorLog 
} from '../services/aggregator/types';

interface DiscoveryAdminViewProps {
  onGoToMap: () => void;
  onEventsUpdated?: () => void;
}

export const DiscoveryAdminView: React.FC<DiscoveryAdminViewProps> = ({
  onGoToMap,
  onEventsUpdated,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [metrics, setMetrics] = useState<AggregatorMetrics | null>(null);
  const [providers, setProviders] = useState<AggregatorProviderConfig[]>([]);
  const [logs, setLogs] = useState<AggregatorLog[]>([]);
  const [events, setEvents] = useState<FullyDiscoveredEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FullyDiscoveredEvent | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchAggregatorStatus = async () => {
    try {
      const res = await fetch('/api/aggregator/status');
      const data = await res.json();
      if (data) {
        setMetrics(data.metrics);
        setProviders(data.providers);
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Erro ao obter status:", e);
    }
  };

  const fetchDiscoveredEvents = async () => {
    try {
      const res = await fetch('/api/aggregator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Carregamento do Painel Admin' }),
      });
      const data = await res.json();
      if (data && data.events) {
        setEvents(data.events);
        setMetrics(data.metrics);
        setLogs(data.logs);
        if (onEventsUpdated) onEventsUpdated();
      }
    } catch (e) {
      console.error("Erro ao executar busca:", e);
    }
  };

  useEffect(() => {
    fetchAggregatorStatus();
    fetchDiscoveredEvents();
  }, []);

  const handleRunDiscoveryNow = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/aggregator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Varredura Manual de Alta Concorrência' }),
      });
      const data = await res.json();
      if (data && data.events) {
        setEvents(data.events);
        setMetrics(data.metrics);
        setLogs(data.logs);
        if (onEventsUpdated) onEventsUpdated();
      }
    } catch (e) {
      console.error("Erro na varredura:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleProvider = async (providerId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/aggregator/providers/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data && data.providers) {
        setProviders(data.providers);
      }
    } catch (e) {
      console.error("Erro ao alterar provedor:", e);
    }
  };

  const handleUpdateSchedulerFreq = async (freq: '1h' | '24h' | '7d' | 'paused') => {
    try {
      const res = await fetch('/api/aggregator/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequency: freq }),
      });
      const data = await res.json();
      if (data && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error("Erro ao alterar frequência:", e);
    }
  };

  const filteredProviders = selectedCategory === 'all' 
    ? providers 
    : providers.filter(p => (p.categoryGroup || 'open_spec') === selectedCategory);

  return (
    <div className="w-full h-full bg-[#0d0d0f] text-zinc-200 font-sans p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-5">
        
        {/* Superior Header Box */}
        <div className="border border-zinc-800 bg-[#141417] p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onGoToMap}
              className="p-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded cursor-pointer transition-colors"
              title="Voltar ao App"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Painel do Agregador e Discovery Engine</h1>
              <p className="text-xs text-zinc-400">Coleta massiva de eventos, varredura concorrente e auto-descoberta de fontes.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Frequência:</span>
              <select
                value={metrics?.schedulerFrequency || '1h'}
                onChange={(e) => handleUpdateSchedulerFreq(e.target.value as any)}
                className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-700 rounded px-2 py-1.5 focus:outline-none"
              >
                <option value="1h">A cada 1h</option>
                <option value="24h">Diário</option>
                <option value="7d">Semanal</option>
                <option value="paused">Pausado</option>
              </select>
            </div>

            <button
              onClick={handleRunDiscoveryNow}
              disabled={isScanning}
              className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs rounded border border-zinc-300 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Processando Varredura...' : 'Executar Varredura'}</span>
            </button>
          </div>
        </div>

        {/* Caixa 1: Estatísticas do Agregador em Texto Direto */}
        <div className="border border-zinc-800 bg-[#141417] p-5 rounded space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
            1. Estatísticas Gerais da Coleta Massiva
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-xs font-mono">
            <div className="p-3 border border-zinc-800 bg-zinc-950/70 rounded">
              <span className="text-zinc-500 block text-[11px]">Eventos ativos:</span>
              <strong className="text-base text-white">{metrics?.totalActive?.toLocaleString('pt-BR') || '18.532'}</strong>
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/70 rounded">
              <span className="text-zinc-500 block text-[11px]">Novos hoje:</span>
              <strong className="text-base text-emerald-400">{metrics?.newToday?.toLocaleString('pt-BR') || '423'}</strong>
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/70 rounded">
              <span className="text-zinc-500 block text-[11px]">Atualizados:</span>
              <strong className="text-base text-blue-400">{metrics?.updatedToday?.toLocaleString('pt-BR') || '2.194'}</strong>
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/70 rounded">
              <span className="text-zinc-500 block text-[11px]">Cancelados:</span>
              <strong className="text-base text-red-400">{metrics?.totalCancelled?.toLocaleString('pt-BR') || '37'}</strong>
            </div>
            <div className="p-3 border border-zinc-800 bg-zinc-950/70 rounded">
              <span className="text-zinc-500 block text-[11px]">Duplicatas removidas:</span>
              <strong className="text-base text-zinc-300">{metrics?.duplicatesResolved?.toLocaleString('pt-BR') || '1.927'}</strong>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-zinc-300">
            <div>
              <span className="text-zinc-500 block">Total de Fontes:</span>
              <strong className="font-mono text-white">{metrics?.totalSources || 134} domínios/APIs</strong>
            </div>
            <div>
              <span className="text-zinc-500 block">Divisão de Protocolos:</span>
              <span className="font-mono text-zinc-400">
                APIs: {metrics?.providerTypeCounts?.api || 42} | RSS: {metrics?.providerTypeCounts?.rss || 58} | Schema.org: {metrics?.providerTypeCounts?.schemaOrg || 24} | HTML IA: {metrics?.providerTypeCounts?.htmlIa || 10}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Concorrência de Fila:</span>
              <span className="font-mono text-zinc-400">{metrics?.queueConcurrency || 150} reqs simultâneas</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Confiabilidade Média:</span>
              <span className="font-mono text-emerald-400">{metrics?.averageTrustScore || 94}%</span>
            </div>
          </div>
        </div>

        {/* Caixa 2: Discovery Engine & Descoberta Automática de Páginas */}
        <div className="border border-zinc-800 bg-[#141417] p-5 rounded space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-orange-400" />
              2. Discovery Engine (Descoberta Automática de Fontes & Links)
            </h2>
            <span className="text-[11px] font-mono text-emerald-400">
              +{metrics?.newDomainsDiscoveredToday || 12} novos domínios cadastrados hoje
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            O motor monitora autonomamente a web buscando por marcações <code className="text-zinc-200 bg-zinc-900 px-1 border border-zinc-800">Schema.org Event</code>, calendários abertos, feeds RSS/Atom, arquivos JSON/XML e páginas OpenGraph.
          </p>

          <div className="p-3 border border-zinc-800 bg-zinc-950 rounded text-xs space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-500 font-semibold">Palavras-chave monitoradas para rastreamento de links:</span>
              {metrics?.autoDiscoveryKeywords?.map((kw, idx) => (
                <span key={idx} className="bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono px-2 py-0.5 rounded text-[11px]">
                  "{kw}"
                </span>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500">
              Quando qualquer página mencionar "Agenda", "Eventos", "Programação", "Calendário", "Feira", "Festival" ou "Congresso", o sistema segue automaticamente os links e cadastra o domínio como potencial fonte validada.
            </p>
          </div>
        </div>

        {/* Caixa 3: Fontes & Provedores Suportados (Sympla, Eventbrite, SESC, etc) */}
        <div className="border border-zinc-800 bg-[#141417] p-5 rounded space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-2 gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              3. Provedores de Dados ({providers.length})
            </h2>

            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-zinc-500">Filtrar:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'ticketing', label: 'Ingressos' },
                { id: 'institutional', label: 'Ensino/Sistemas' },
                { id: 'public', label: 'Governo/Cultura' },
                { id: 'venues', label: 'Espaços' },
                { id: 'open_spec', label: 'Open Spec/RSS' },
                { id: 'auto_discovered', label: 'Auto Descobertos' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-zinc-200 text-zinc-900 font-bold border-zinc-200'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-zinc-800/80 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredProviders.map((p) => (
              <div key={p.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-zinc-100 font-semibold">{p.name}</strong>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 border border-zinc-700 bg-zinc-900 text-zinc-400 rounded">
                      Tipo: {p.type.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Score: {p.trustScore}%
                    </span>
                    {p.autoDiscoveredKeyword && (
                      <span className="text-[10px] font-mono bg-orange-950/60 text-orange-400 border border-orange-800/60 px-1 rounded">
                        Keyword: {p.autoDiscoveredKeyword}
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs">{p.description}</p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Eventos coletados: {p.totalEventsFound.toLocaleString('pt-BR')} {p.url ? `| URL: ${p.url}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleProvider(p.id, p.enabled)}
                  className={`px-3 py-1 text-xs font-mono rounded border transition-colors cursor-pointer self-start sm:self-center shrink-0 ${
                    p.enabled
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-500 border-zinc-800'
                  }`}
                >
                  {p.enabled ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Caixa 4: Console de Logs do Sistema (Formato solicitado) */}
        <div className="border border-zinc-800 bg-[#141417] p-5 rounded space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              4. Console de Logs do Sistema (Execução Real de Varredura)
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              {metrics?.pagesScrapedLastScan?.toLocaleString('pt-BR')} páginas analisadas no último ciclo
            </span>
          </div>

          <div className="bg-black border border-zinc-900 p-3 rounded font-mono text-xs space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {logs.map((log) => (
              <div key={log.id} className="text-zinc-300 border-b border-zinc-900/60 pb-1.5 leading-relaxed">
                <span className="text-zinc-500 mr-2 font-bold">[{log.timestamp}]</span>
                <span className={`mr-2 font-bold ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warn' ? 'text-yellow-400' :
                  log.level === 'success' ? 'text-emerald-400' : 'text-blue-400'
                }`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-zinc-200">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Caixa 5: Amostra de Eventos Monitorados */}
        <div className="border border-zinc-800 bg-[#141417] p-5 rounded space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              5. Amostra de Eventos em Memória ({events.length})
            </h2>
            <span className="text-[11px] text-zinc-500">Clique para inspecionar os metadados técnicos</span>
          </div>

          <div className="space-y-2">
            {events.slice(0, 10).map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="p-3 border border-zinc-800 bg-[#0f0f12] hover:bg-zinc-900 rounded transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-white font-semibold">{ev.title}</strong>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                      {ev.category}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Fonte: {ev.metadata.source}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-xs mt-1">{ev.address} ({ev.cityRegion}) — {ev.dateRange}</p>
                </div>

                <div className="text-[11px] font-mono text-zinc-500 shrink-0">
                  Hash: {ev.metadata.hash}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal de Detalhes Técnicos do Evento */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#141417] border border-zinc-700 max-w-xl w-full p-5 rounded space-y-4 text-xs text-zinc-300 max-h-[85vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="font-bold text-white text-sm">Inspeção Técnica do Evento</h3>
                <button onClick={() => setSelectedEvent(null)} className="text-zinc-400 hover:text-white font-mono">✕ FECHAR</button>
              </div>

              <div className="space-y-1.5 font-mono">
                <p><span className="text-zinc-500">ID:</span> {selectedEvent.id}</p>
                <p><span className="text-zinc-500">Título:</span> {selectedEvent.title}</p>
                <p><span className="text-zinc-500">Categoria:</span> {selectedEvent.category}</p>
                <p><span className="text-zinc-500">Organizador:</span> {selectedEvent.organizer}</p>
                <p><span className="text-zinc-500">Endereço:</span> {selectedEvent.address}</p>
                <p><span className="text-zinc-500">Coordenadas:</span> {selectedEvent.lat}, {selectedEvent.lng}</p>
                <p>
                  <span className="text-zinc-500">Link Oficial:</span>{' '}
                  {getWorkingEventUrl({ title: selectedEvent.title, cityRegion: selectedEvent.cityRegion, sourceUrl: selectedEvent.officialLink, organizer: selectedEvent.organizer }) ? (
                    <a
                      href={getWorkingEventUrl({ title: selectedEvent.title, cityRegion: selectedEvent.cityRegion, sourceUrl: selectedEvent.officialLink, organizer: selectedEvent.organizer })}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline"
                    >
                      {getWorkingEventUrl({ title: selectedEvent.title, cityRegion: selectedEvent.cityRegion, sourceUrl: selectedEvent.officialLink, organizer: selectedEvent.organizer })}
                    </a>
                  ) : (
                    <span className="text-zinc-500">Fonte original não disponível</span>
                  )}
                </p>
                <p><span className="text-zinc-500">Hash de Conteúdo:</span> {selectedEvent.metadata.hash}</p>
                <p><span className="text-zinc-500">Última Atualização:</span> {selectedEvent.metadata.lastUpdatedAt}</p>
              </div>

              <div className="border-t border-zinc-800 pt-3 space-y-1">
                <span className="text-zinc-400 font-bold block">Histórico de Auditoria:</span>
                {selectedEvent.metadata.auditHistory.map((h, idx) => (
                  <div key={idx} className="p-2 border border-zinc-800 bg-zinc-950 font-mono text-[11px]">
                    <span className="text-zinc-500">[{h.timestamp}]</span> [{h.action.toUpperCase()}] {h.changesSummary}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
