import React, { useState } from 'react';
import { CulturalEvent, UserProfile } from '../types';
import { formatDistance } from '../utils/distance';
import { getEventImage, handleImageError } from '../utils/imageUtils';
import { getGoogleSearchUrl } from '../utils/linkUtils';
import { 
  Star, 
  MapPin, 
  Clock, 
  Calendar, 
  Bookmark, 
  Navigation, 
  CheckCircle2, 
  Bell, 
  Share2, 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Video, 
  ExternalLink,
  MessageSquare,
  UserCheck
} from 'lucide-react';

interface EventDrawerProps {
  events: CulturalEvent[];
  selectedEvent: CulturalEvent | null;
  onSelectEvent: (event: CulturalEvent | null) => void;
  userProfile: UserProfile;
  onToggleSave: (eventId: string) => void;
  onToggleParticipated: (eventId: string) => void;
  onAddReminder: (eventId: string, minutesBefore: number) => void;
  onAddReview: (eventId: string, rating: number, comment: string) => void;
  onTraceRoute: (event: CulturalEvent) => void;
}

export const EventDrawer: React.FC<EventDrawerProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  userProfile,
  onToggleSave,
  onToggleParticipated,
  onAddReminder,
  onAddReview,
  onTraceRoute,
}) => {
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminderOffset, setSelectedReminderOffset] = useState(60); // 1 hr default
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');

  const sortedEvents = [...events].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  const isSaved = selectedEvent ? userProfile.savedEventIds.includes(selectedEvent.id) : false;
  const isParticipated = selectedEvent ? userProfile.participatedEventIds.includes(selectedEvent.id) : false;
  const hasReminder = selectedEvent ? userProfile.reminders.some(r => r.eventId === selectedEvent.id) : false;

  const handleShare = (event: CulturalEvent) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Venha comigo no evento cultural "${event.title}" no dia ${event.dateRange}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${event.title} - ${event.address} (${event.dateRange})`);
      alert('Link do evento copiado para a área de transferência!');
    }
  };

  return (
    <div className="w-full flex flex-col h-full overflow-hidden">
      {/* ----------------- CASE A: DETAIL VIEW (Image 2) ----------------- */}
      {selectedEvent ? (
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Header Back Button */}
          <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between sticky top-0 bg-[#0f1015]/90 backdrop-blur-md z-20">
            <button
              onClick={() => onSelectEvent(null)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-300" />
              <span>Detalhes</span>
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* Hero Image Card */}
            <div className="relative rounded-2xl overflow-hidden border border-zinc-700/60 group shadow-xl bg-zinc-900 aspect-video">
              <img
                src={getEventImage(selectedEvent.image, selectedEvent.category)}
                alt={selectedEvent.title}
                onError={(e) => handleImageError(e, selectedEvent.category)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Category Badge & Virtual Tag */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-900/90 text-zinc-100 border border-zinc-700/80 backdrop-blur-sm shadow-md">
                  {selectedEvent.category}
                </span>
                {selectedEvent.isVirtual && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-600/90 text-white backdrop-blur-sm shadow-md flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" />
                    Virtual
                  </span>
                )}
              </div>

              {/* Price Pill */}
              <div className="absolute bottom-3 right-3 text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-900/90 text-zinc-100 border border-zinc-700/80 backdrop-blur-sm">
                {selectedEvent.price || (selectedEvent.isPaid ? 'Pago' : 'Gratuito')}
              </div>
            </div>

            {/* Title, Date & Bookmark */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                  {selectedEvent.title}
                  <span className="text-xs text-zinc-400 font-normal ml-2">
                    ({selectedEvent.dateRange})
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-medium mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedEvent.address} • {selectedEvent.cityRegion}
                </p>
              </div>

              <button
                onClick={() => onToggleSave(selectedEvent.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                }`}
                title={isSaved ? 'Remover dos salvos' : 'Salvar evento'}
              >
                <Bookmark className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Event Distance & Estimated Time */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Distância: <strong className="text-white">{selectedEvent.distanceKm} km</strong></span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Navigation className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Tempo est.: <strong className="text-white">{selectedEvent.travelTimeMinutes} min</strong></span>
              </div>
            </div>

            {/* Description & Organizer Source */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Sobre o Evento</h3>
              <p className="text-xs text-zinc-300 leading-relaxed bg-[#14161f] p-3 rounded-xl border border-zinc-800/60">
                {selectedEvent.description}
              </p>

              {/* Organizer & Google Search Button */}
              <div className="bg-[#14161f] p-3 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Organização:</span>
                  <span className="font-semibold text-zinc-200 truncate ml-2">{selectedEvent.organizer}</span>
                </div>

                <div className="pt-1">
                  <a
                    href={getGoogleSearchUrl(selectedEvent)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                    title="Pesquisar confirmação e matérias oficiais do evento no Google"
                  >
                    <ExternalLink className="w-4 h-4 text-white shrink-0" />
                    <span>Pesquisar no Google</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Virtual Link if virtual */}
            {selectedEvent.isVirtual && selectedEvent.virtualLink && (
              <a
                href={selectedEvent.virtualLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs hover:bg-indigo-900/60 transition-colors font-medium"
              >
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-400" />
                  Acessar Sala / Transmissão Virtual
                </span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {/* Ratings & Reviews Section (Matching Image 2) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  Avaliações 
                  {selectedEvent.reviewsCount > 0 ? (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {selectedEvent.rating} ({selectedEvent.reviewsCount})
                    </span>
                  ) : (
                    <span className="text-zinc-500 font-normal">(Sem avaliações)</span>
                  )}
                </span>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Adicionar Avaliação"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Review input modal */}
              {showReviewModal && (
                <div className="bg-[#171922] p-3 rounded-xl border border-emerald-500/40 space-y-3 animate-fadeIn">
                  <p className="text-xs font-semibold text-emerald-400">Avaliar este evento</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewReviewRating(star)}
                        className="text-amber-400 p-0.5"
                      >
                        <Star className={`w-5 h-5 ${star <= newReviewRating ? 'fill-amber-400' : 'text-zinc-600'}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Escreva sua opinião sobre a organização e atrações..."
                    className="w-full bg-zinc-900 text-xs text-white p-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-emerald-500 h-16"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        if (newReviewComment.trim()) {
                          onAddReview(selectedEvent.id, newReviewRating, newReviewComment);
                          setNewReviewComment('');
                          setShowReviewModal(false);
                          alert('Avaliação enviada com sucesso! Obrigado por ajudar a comunidade.');
                        }
                      }}
                      className="px-3 py-1 rounded-lg text-xs bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Event Schedule (Programação do evento - Matching Image 2) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Programação do evento
              </h3>

              {selectedEvent.schedule && selectedEvent.schedule.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvent.schedule.map((day, dIdx) => (
                    <div key={dIdx} className="bg-[#161822] p-3 rounded-xl border border-zinc-800 space-y-2">
                      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-200 font-extrabold text-xs flex items-center justify-center border border-zinc-700">
                          {day.dayNumber}
                        </div>
                        <span className="text-xs font-bold text-white uppercase">{day.monthShort}</span>
                      </div>

                      <div className="space-y-1.5 pl-1">
                        {day.items.map((item, iIdx) => (
                          <div key={iIdx} className="flex items-start justify-between text-xs py-1 border-b border-zinc-800/40 last:border-0">
                            <span className="text-zinc-200 font-medium">{item.title}</span>
                            <span className="text-[11px] text-zinc-500 shrink-0 font-mono ml-2">
                              {item.time || 'Horário livre'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-400 bg-[#161822] p-3 rounded-xl border border-zinc-800">
                  <p>Programação contínua das {selectedEvent.dateRange}. Consulte o organizador ({selectedEvent.organizer}) no local.</p>
                </div>
              )}
            </div>

            {/* Actions Grid (Traçar Rota, Favoritar, Já Participei, Ativar Lembrete, Compartilhar) */}
            <div className="pt-2 border-t border-zinc-800 space-y-2">
              {/* Primary Route Button */}
              <button
                onClick={() => onTraceRoute(selectedEvent)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-black" />
                Traçar Rota e Navegar no Mapa
              </button>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {/* Participated Toggle */}
                <button
                  onClick={() => onToggleParticipated(selectedEvent.id)}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isParticipated
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {isParticipated ? 'Já Participei ✓' : 'Já participei'}
                </button>

                {/* Reminder Modal Trigger */}
                <button
                  onClick={() => setShowReminderModal(true)}
                  className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    hasReminder
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                      : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  {hasReminder ? 'Lembrete Ativo' : 'Ativar Lembrete'}
                </button>
              </div>

              {/* Share & Google Search Grid */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={getGoogleSearchUrl(selectedEvent)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  title="Pesquisar detalhes do evento no Google"
                >
                  <ExternalLink className="w-4 h-4 text-white shrink-0" />
                  <span className="truncate">Pesquisar no Google</span>
                </a>

                <button
                  onClick={() => handleShare(selectedEvent)}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Compartilhar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ----------------- CASE B: CARD LIST VIEW (Image 1) ----------------- */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-zinc-800/80 flex items-center justify-between sticky top-0 bg-[#0f1015]/95 z-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              ATIVIDADES CULTURAIS ({sortedEvents.length})
            </h2>
            <span className="text-[11px] text-zinc-400 font-medium">Toque para detalhes</span>
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1.5 custom-scrollbar">
            {sortedEvents.length === 0 ? (
              <div className="text-center py-12 px-4 text-zinc-500 space-y-2">
                <MapPin className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-xs">Nenhuma atividade encontrada com os filtros selecionados.</p>
              </div>
            ) : (
              sortedEvents.map((ev) => {
                const isEvSaved = userProfile.savedEventIds.includes(ev.id);
                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-1.5 rounded-xl hover:bg-white/[0.05] border-b border-zinc-800/40 last:border-b-0 transition-colors cursor-pointer flex gap-2.5 group relative"
                  >
                    {/* Thumbnail Image */}
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-zinc-800 border border-zinc-700/40 relative">
                      <img
                        src={getEventImage(ev.image, ev.category)}
                        alt={ev.title}
                        onError={(e) => handleImageError(e, ev.category)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {ev.isVirtual && (
                        <span className="absolute bottom-0.5 left-0.5 bg-indigo-600 text-[8px] font-bold text-white px-1 rounded">
                          Virtual
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-xs font-bold text-white truncate leading-tight group-hover:text-zinc-300 transition-colors">
                          {ev.title}
                          <span className="text-[10px] font-normal text-zinc-400 ml-1">
                            ({ev.dateRange})
                          </span>
                        </h3>
                        {isEvSaved && (
                          <Bookmark className="w-3 h-3 text-white fill-white shrink-0" />
                        )}
                      </div>

                      <p className="text-[10px] text-zinc-400 font-medium truncate">
                        {ev.category}
                      </p>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 text-[10px]">
                        {ev.reviewsCount > 0 ? (
                          <>
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-2.5 h-2.5 ${i < Math.floor(ev.rating) ? 'fill-amber-400' : 'text-zinc-600'}`}
                                />
                              ))}
                            </div>
                            <span className="text-zinc-300 font-bold text-[10px]">{ev.rating}</span>
                            <span className="text-zinc-500 text-[9px]">({ev.reviewsCount})</span>
                          </>
                        ) : (
                          <span className="text-zinc-500 text-[9px]">Sem avaliações</span>
                        )}
                      </div>

                      {/* Address & Distance */}
                      <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1 pt-0.5">
                        <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="font-bold text-white">{formatDistance(ev.distanceKm)}</span>
                        <span>•</span>
                        <span className="truncate">{ev.address}</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Reminder Popup Modal */}
      {showReminderModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#171922] border border-zinc-700 p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Bell className="w-5 h-5" />
              <span>Programar Lembrete</span>
            </div>
            <p className="text-xs text-zinc-300">
              Quanto tempo antes do evento <strong>"{selectedEvent.title}"</strong> você deseja ser notificado?
            </p>

            <div className="space-y-2">
              {[
                { label: '15 minutos antes', minutes: 15 },
                { label: '1 hora antes', minutes: 60 },
                { label: '3 horas antes', minutes: 180 },
                { label: '1 dia antes (24h)', minutes: 1440 },
              ].map((opt) => (
                <button
                  key={opt.minutes}
                  onClick={() => setSelectedReminderOffset(opt.minutes)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold text-left transition-colors border ${
                    selectedReminderOffset === opt.minutes
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onAddReminder(selectedEvent.id, selectedReminderOffset);
                  setShowReminderModal(false);
                  alert(`Lembrete ativado para ${selectedReminderOffset < 60 ? `${selectedReminderOffset} min` : `${selectedReminderOffset / 60}h`} antes do evento!`);
                }}
                className="px-4 py-1.5 rounded-xl text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold cursor-pointer"
              >
                Confirmar Lembrete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
