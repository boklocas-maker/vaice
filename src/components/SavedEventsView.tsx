import React, { useState } from 'react';
import { CulturalEvent, UserProfile } from '../types';
import { ArrowLeft, Bookmark, Search, Star, MapPin, CheckCircle2, Trash2 } from 'lucide-react';
import { getEventImage, handleImageError } from '../utils/imageUtils';

interface SavedEventsViewProps {
  events: CulturalEvent[];
  userProfile: UserProfile;
  onSelectEvent: (event: CulturalEvent) => void;
  onToggleSave: (eventId: string) => void;
  onGoToMap: () => void;
}

export const SavedEventsView: React.FC<SavedEventsViewProps> = ({
  events,
  userProfile,
  onSelectEvent,
  onToggleSave,
  onGoToMap,
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const [filterQuery, setFilterQuery] = useState('');
  const [orderSort, setOrderSort] = useState<'recent' | 'rating'>('recent');

  const savedEvents = events.filter(e => userProfile.savedEventIds.includes(e.id));
  const participatedEvents = events.filter(e => userProfile.participatedEventIds.includes(e.id));

  const activeList = activeTab === 'saved' ? savedEvents : participatedEvents;

  const filteredList = activeList.filter(e => 
    !e ? false :
    (e.title || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (e.address || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-black p-4 md:p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar text-zinc-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToMap}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400" />
            <span>Salvos</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'saved' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Meus Favoritos ({savedEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Já Participei ({participatedEvents.length})</span>
          </button>
        </div>
      </div>

      {/* Container */}
      <div className="bg-black border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-2xl space-y-5 flex-1">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Digite o nome do evento"
              className="w-full bg-[#12141c] text-xs text-white placeholder-zinc-500 pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Filtro:</span>
            <span className="bg-[#12141c] text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-800 font-semibold">
              Geral
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 font-medium">Ordem:</span>
            <button
              onClick={() => setOrderSort(orderSort === 'recent' ? 'rating' : 'recent')}
              className="bg-[#12141c] hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-xl border border-zinc-800 font-semibold cursor-pointer"
            >
              {orderSort === 'recent' ? 'Mais recente' : 'Maior Avaliação'}
            </button>
          </div>
        </div>

        {/* Event List Items */}
        <div className="space-y-4">
          {filteredList.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 space-y-3">
              <Bookmark className="w-12 h-12 mx-auto text-zinc-700" />
              <p className="text-sm font-semibold">
                {activeTab === 'saved' 
                  ? 'Você ainda não salvou nenhum evento cultural.' 
                  : 'Nenhum histórico de participação registrado ainda.'}
              </p>
              <button
                onClick={onGoToMap}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Explorar Eventos no Mapa
              </button>
            </div>
          ) : (
            filteredList.map((ev) => (
              <div
                key={ev.id}
                className="bg-[#12141c] border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex flex-wrap md:flex-nowrap items-center gap-4 shadow-xl transition-all group relative"
              >
                {/* Bookmark Badge on Left */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave(ev.id);
                  }}
                  className="p-2 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Remover dos salvos"
                >
                  <Bookmark className="w-6 h-6 fill-white text-white" />
                </button>

                {/* Square Thumbnail Image */}
                <div 
                  onClick={() => {
                    onSelectEvent(ev);
                    onGoToMap();
                  }}
                  className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-zinc-800 cursor-pointer"
                >
                  <img 
                    src={getEventImage(ev.image, ev.category)} 
                    alt={ev.title} 
                    onError={(e) => handleImageError(e, ev.category)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                  />
                </div>

                {/* Event Details */}
                <div 
                  onClick={() => {
                    onSelectEvent(ev);
                    onGoToMap();
                  }}
                  className="flex-1 min-w-0 space-y-1.5 cursor-pointer"
                >
                  <h3 className="text-base font-extrabold text-white group-hover:text-zinc-300 transition-colors">
                    {ev.title} <span className="text-xs font-normal text-zinc-400">({ev.dateRange})</span>
                  </h3>
                  <p className="text-xs font-semibold text-zinc-400">{ev.category}</p>

                  <div className="flex items-center gap-1 text-xs">
                    <div className="flex text-zinc-300">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(ev.rating) ? 'fill-zinc-300' : 'text-zinc-700'}`} />
                      ))}
                    </div>
                    <span className="text-white font-bold ml-1">{ev.rating}</span>
                    <span className="text-zinc-500 text-[11px]">({ev.reviewsCount})</span>
                  </div>

                  <p className="text-xs text-zinc-400 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    {ev.address}
                  </p>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    onSelectEvent(ev);
                    onGoToMap();
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-zinc-200 text-xs font-bold shadow-md cursor-pointer ml-auto shrink-0"
                >
                  Ver no Mapa →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
