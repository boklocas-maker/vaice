import React from 'react';
import { CulturalEvent } from '../types';
import { ArrowLeft, BarChart3, PieChart, TrendingUp, MapPin, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface AnalyticsDataViewProps {
  events: CulturalEvent[];
  onGoToMap: () => void;
}

export const AnalyticsDataView: React.FC<AnalyticsDataViewProps> = ({
  events,
  onGoToMap,
}) => {
  const totalEvents = events.length;
  const freeEventsCount = events.filter(e => !e.isPaid).length;
  const paidEventsCount = events.filter(e => e.isPaid).length;
  const virtualEventsCount = events.filter(e => e.isVirtual).length;
  const happeningNowCount = events.filter(e => e.isHappeningNow).length;

  const freePercentage = totalEvents > 0 ? Math.round((freeEventsCount / totalEvents) * 100) : 0;
  const happeningNowPercentage = totalEvents > 0 ? Math.round((happeningNowCount / totalEvents) * 100) : 0;

  // Group by category
  const categoryCounts: Record<string, number> = {};
  events.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });

  return (
    <div className="w-full h-full bg-[#0e0f14] p-4 md:p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <button
          onClick={onGoToMap}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500" />
          <span>Painel de Dados e Mapeamento Cultural</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#141620] p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Total no Mapa</span>
            <p className="text-2xl font-extrabold text-white">{totalEvents}</p>
            <p className="text-[10px] text-emerald-400 font-semibold">+18% este mês</p>
          </div>

          <div className="bg-[#141620] p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Atividades Gratuitas</span>
            <p className="text-2xl font-extrabold text-emerald-400">{freePercentage}%</p>
            <p className="text-[10px] text-zinc-500">{freeEventsCount} de {totalEvents} eventos</p>
          </div>

          <div className="bg-[#141620] p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Acontecendo Agora</span>
            <p className="text-2xl font-extrabold text-amber-400">{happeningNowCount}</p>
            <p className="text-[10px] text-zinc-500">{happeningNowPercentage}% em tempo real</p>
          </div>

          <div className="bg-[#141620] p-4 rounded-2xl border border-zinc-800 space-y-1 shadow-lg">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Atividades Virtuais</span>
            <p className="text-2xl font-extrabold text-indigo-400">{virtualEventsCount}</p>
            <p className="text-[10px] text-zinc-500">Acesso livre global</p>
          </div>
        </div>

        {/* Diagnostic Sections: Highest vs Lowest Cultural Supply Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* High Density Zone */}
          <div className="bg-[#141620] border border-emerald-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <MapPin className="w-5 h-5" />
              <span>Regiões com Maior Oferta Cultural</span>
            </div>
            <p className="text-xs text-zinc-300">
              Locais com intensa movimentação artística, feiras frequentes e festivais:
            </p>
            <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Barão Geraldo & Vila São Francisco:</strong> 38% dos eventos musicais e saraus.</li>
              <li><strong>Centro & Parque Ecológico:</strong> 25% de feiras de artesanato e gastronomia.</li>
            </ul>
          </div>

          {/* Under-supplied Zone (Desertos Culturais) */}
          <div className="bg-[#141620] border border-amber-500/30 p-5 rounded-3xl space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>Diagnóstico de Pouca Oferta (Desertos Culturais)</span>
            </div>
            <p className="text-xs text-zinc-300">
              Regiões que necessitam de apoio de órgãos públicos e novos coletivos:
            </p>
            <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
              <li><strong>Jardim Amanda & Bairros Periféricos:</strong> Apenas 2% das atividades cadastradas.</li>
              <li><strong>Incentivo Recomendado:</strong> Oficinas itinerantes e cinema de rua ao ar livre.</li>
            </ul>
          </div>
        </div>

        {/* Category Breakdown Progress Bars */}
        <div className="bg-[#141620] border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            Distribuição por Categorias Culturais
          </h3>

          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / totalEvents) * 100);
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-zinc-200">{cat}</span>
                    <span className="text-orange-400">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div 
                      className="h-full bg-orange-600 rounded-full transition-all duration-500" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
