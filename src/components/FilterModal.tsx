import React from 'react';
import { 
  X, 
  Music, 
  Footprints, 
  Theater, 
  BookOpen, 
  Utensils, 
  Wrench, 
  Cpu, 
  Gamepad2, 
  Film, 
  Palette 
} from 'lucide-react';

interface FilterModalProps {
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  maxDistanceKm: number;
  setMaxDistanceKm: (dist: number) => void;
  formatFilter: 'all' | 'presencial' | 'virtual';
  setFormatFilter: (fmt: 'all' | 'presencial' | 'virtual') => void;
  costFilter: 'all' | 'free' | 'paid';
  setCostFilter: (cst: 'all' | 'free' | 'paid') => void;
  happeningNowOnly: boolean;
  setHappeningNowOnly: (val: boolean) => void;
  onClose: () => void;
  onResetFilters: () => void;
  filteredEventsCount?: number;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  categoryFilter,
  setCategoryFilter,
  maxDistanceKm,
  setMaxDistanceKm,
  formatFilter,
  setFormatFilter,
  costFilter,
  setCostFilter,
  onClose,
  onResetFilters,
  filteredEventsCount = 0,
}) => {
  const categories = [
    { id: 'Evento Musical', label: 'Música', Icon: Music },
    { id: 'Dança e Expressão', label: 'Dança', Icon: Footprints },
    { id: 'Teatro e Performance', label: 'Teatro', Icon: Theater },
    { id: 'Literatura e Livros', label: 'Literatura', Icon: BookOpen },
    { id: 'Gastronomia e Cultura', label: 'Gastronomia', Icon: Utensils },
    { id: 'Feira artesanal', label: 'Artesanato', Icon: Wrench },
    { id: 'Tecnologia e Geek', label: 'Tecnologia', Icon: Cpu },
    { id: 'Cultura Geek', label: 'Cultura Geek', Icon: Gamepad2 },
    { id: 'Cinema e Audiovisual', label: 'Cinema', Icon: Film },
    { id: 'Exposição e Artes', label: 'Artes Visuais', Icon: Palette },
  ];

  const distances = [
    { value: 5000, label: 'Qualquer (Todo o Brasil)' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 25, label: '25 km' },
    { value: 50, label: '50 km' },
  ];

  const costs: { id: 'all' | 'free' | 'paid'; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'free', label: 'Gratuitos' },
    { id: 'paid', label: 'Pagos' },
  ];

  const formats: { id: 'all' | 'presencial' | 'virtual'; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'presencial', label: 'Presenciais' },
    { id: 'virtual', label: 'Virtuais' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-4">
      <div className="bg-[#0b0c10] border border-zinc-800 rounded-3xl max-w-sm w-full max-h-[85vh] flex flex-col shadow-2xl animate-scaleIn text-xs text-zinc-100 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-[#0b0c10] shrink-0">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">Filtros</h2>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {/* CATEGORIAS */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">CATEGORIAS</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const isSelected = categoryFilter === c.id;
                const IconComponent = c.Icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(isSelected ? 'Todas as categorias' : c.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold shadow-md'
                        : 'bg-[#141620] text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DISTÂNCIA MÁXIMA */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">DISTÂNCIA MÁXIMA</h3>
            <div className="flex flex-wrap gap-2">
              {distances.map((d) => {
                const isSelected = maxDistanceKm === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => setMaxDistanceKm(d.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold shadow-md'
                        : 'bg-[#141620] text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* PREÇO */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">PREÇO</h3>
            <div className="flex flex-wrap gap-2">
              {costs.map((c) => {
                const isSelected = costFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCostFilter(c.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold shadow-md'
                        : 'bg-[#141620] text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODALIDADE */}
          <div className="space-y-2 pt-1">
            <h3 className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">MODALIDADE</h3>
            <div className="flex flex-wrap gap-2">
              {formats.map((f) => {
                const isSelected = formatFilter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormatFilter(f.id)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white font-bold shadow-md'
                        : 'bg-[#141620] text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COUNTER & RESET */}
          <div className="pt-3 space-y-3">
            <p className="text-center text-xs font-medium text-zinc-400">
              <strong className="text-white font-bold">{filteredEventsCount}</strong> {filteredEventsCount === 1 ? 'evento encontrado' : 'eventos encontrados'}
            </p>

            <button
              onClick={onResetFilters}
              className="w-full py-2.5 rounded-2xl bg-[#141620] hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


