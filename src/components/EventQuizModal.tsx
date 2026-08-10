import React, { useState, useMemo } from 'react';
import { CulturalEvent } from '../types';
import { 
  ArrowLeft, 
  X, 
  Star, 
  Bookmark, 
  MapPin, 
  RotateCcw, 
  ArrowRight, 
  Check, 
  Car, 
  Footprints, 
  Bike, 
  Bus 
} from 'lucide-react';
import { getEstimatedTravelTimeMinutes } from '../utils/distance';
import { getEventImage } from '../utils/imageUtils';

interface EventQuizModalProps {
  events: CulturalEvent[];
  savedEventIds?: string[];
  onToggleSave?: (eventId: string) => void;
  onClose: () => void;
  onSelectEvent: (event: CulturalEvent) => void;
  onApplyQuizFilter?: (matchedEvents: CulturalEvent[]) => void;
}

export const EventQuizModal: React.FC<EventQuizModalProps> = ({
  events,
  savedEventIds = [],
  onToggleSave,
  onClose,
  onSelectEvent,
  onApplyQuizFilter,
}) => {
  // Step 0 = Cover ("Começar"), Steps 1..4 = Quiz questions, Step 5 = Results
  const [step, setStep] = useState<number>(0);

  // Local fallback saved IDs if not supplied
  const [localSavedIds, setLocalSavedIds] = useState<string[]>([]);
  const activeSavedIds = savedEventIds.length > 0 ? savedEventIds : localSavedIds;

  const handleToggleSaveEvent = (eventId: string) => {
    if (onToggleSave) {
      onToggleSave(eventId);
    } else {
      setLocalSavedIds((prev) =>
        prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
      );
    }
  };

  // Quiz state
  const [vibe, setVibe] = useState<string>('');
  const [companion, setCompanion] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [distance, setDistance] = useState<string>('');

  // Scored results
  const [results, setResults] = useState<{ event: CulturalEvent; matchScore: number }[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);

  // Fixed featured event for the left card ("Sugestão do Dia") - remains stable
  const activeSuggestedEvent = useMemo(() => {
    return events[0] || null;
  }, [events]);

  const handleCalculateResults = (
    selectedVibe: string,
    selectedCompanion: string,
    selectedCost: string,
    selectedDistance: string
  ) => {
    let maxDist = 9999;
    if (selectedDistance === 'near') maxDist = 12;
    else if (selectedDistance === 'region') maxDist = 35;

    const scored = events.map((ev) => {
      let score = 50; // Base score

      // 1. Vibe matching
      const cat = (ev.category || '').toLowerCase();
      const desc = (ev.description || '').toLowerCase();
      const title = (ev.title || '').toLowerCase();

      if (selectedVibe === 'musica') {
        if (cat.includes('música') || cat.includes('show') || cat.includes('musical') || title.includes('show') || title.includes('concerto') || title.includes('banda')) {
          score += 25;
        }
      } else if (selectedVibe === 'gastronomia') {
        if (cat.includes('feira') || cat.includes('gastronomia') || desc.includes('food') || desc.includes('comida') || title.includes('feira') || title.includes('culinária')) {
          score += 25;
        }
      } else if (selectedVibe === 'teatro') {
        if (cat.includes('teatro') || cat.includes('arte') || cat.includes('poesia') || cat.includes('cinema') || cat.includes('literatura')) {
          score += 25;
        }
      } else if (selectedVibe === 'cursos') {
        if (cat.includes('curso') || cat.includes('oficina') || cat.includes('palestra') || desc.includes('aula') || desc.includes('workshop')) {
          score += 25;
        }
      } else {
        score += 15; // Surprise me
      }

      // 2. Companion / Format
      if (selectedCompanion === 'online') {
        if (ev.isVirtual) score += 20;
        else score -= 15;
      } else if (selectedCompanion === 'family') {
        if (desc.includes('criança') || desc.includes('família') || desc.includes('livre') || cat.includes('feira') || cat.includes('teatro')) {
          score += 15;
        }
      }

      // 3. Cost
      if (selectedCost === 'free') {
        if (!ev.isPaid || ev.price?.toLowerCase().includes('grátis') || ev.price?.toLowerCase().includes('gratuito')) {
          score += 20;
        } else {
          score -= 30; // Strong penalty if user wants free only
        }
      } else {
        score += 10;
      }

      // 4. Distance
      if (ev.distanceKm <= maxDist) {
        score += 15;
      } else {
        score -= 10;
      }

      // Normalize max 99%
      const finalScore = Math.min(99, Math.max(45, Math.round(score)));

      return { event: ev, matchScore: finalScore };
    });

    // Sort by highest match score
    scored.sort((a, b) => b.matchScore - a.matchScore);

    setResults(scored.slice(0, 5));
    setSelectedResultIndex(0);
    setStep(5); // Results step
  };

  const handleNextStep = (nextVibe?: string, nextComp?: string, nextCost?: string, nextDist?: string) => {
    const v = nextVibe !== undefined ? nextVibe : vibe;
    const cmp = nextComp !== undefined ? nextComp : companion;
    const cst = nextCost !== undefined ? nextCost : cost;
    const dst = nextDist !== undefined ? nextDist : distance;

    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      setVibe(v);
      setStep(2);
    } else if (step === 2) {
      setCompanion(cmp);
      setStep(3);
    } else if (step === 3) {
      setCost(cst);
      setStep(4);
    } else if (step === 4) {
      setDistance(dst);
      handleCalculateResults(v, cmp, cst, dst);
    }
  };

  const handleReset = () => {
    setStep(0);
    setVibe('');
    setCompanion('');
    setCost('');
    setDistance('');
    setResults([]);
    setSelectedResultIndex(0);
  };

  // Travel time calculations for active suggested event
  const carMins = activeSuggestedEvent ? getEstimatedTravelTimeMinutes(activeSuggestedEvent.distanceKm, 'car') : 5;
  const walkMins = activeSuggestedEvent ? getEstimatedTravelTimeMinutes(activeSuggestedEvent.distanceKm, 'walk') : 18;
  const bikeMins = activeSuggestedEvent ? getEstimatedTravelTimeMinutes(activeSuggestedEvent.distanceKm, 'bicycle') : 12;
  const busMins = activeSuggestedEvent ? getEstimatedTravelTimeMinutes(activeSuggestedEvent.distanceKm, 'transit') : 25;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-5xl bg-[#0c0d10] border border-zinc-800/90 rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden text-zinc-100 flex flex-col gap-5 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* TOP HEADER BAR */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-bold text-white hover:text-orange-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-orange-400 transition-colors" />
            <span>Sugestão Personalizada</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TWO COLUMN CONTENT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
          
          {/* LEFT SIDE: SUGESTÃO DO DIA CARD */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between gap-3 bg-[#121318] border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl">
            {/* Header info */}
            <div className="text-center space-y-1 w-full">
              <span className="text-[11px] font-medium text-zinc-400 block">Expira em: 14h</span>
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-300 block">
                SUGESTÃO DO DIA
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#f05a22] tracking-wide truncate">
                {activeSuggestedEvent ? activeSuggestedEvent.category : 'Feira Artesanal'}
              </h3>
            </div>

            {/* Event Card */}
            {activeSuggestedEvent ? (
              <div className="w-full bg-[#181920] border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2.5 shadow-md">
                {/* Image */}
                <div className="w-full h-40 rounded-xl overflow-hidden relative bg-zinc-900 border border-zinc-800">
                  <img
                    src={getEventImage(activeSuggestedEvent.image, activeSuggestedEvent.category, activeSuggestedEvent.title)}
                    alt={activeSuggestedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <h4 className="font-bold text-sm sm:text-base text-white truncate">
                    {activeSuggestedEvent.title}
                  </h4>
                </div>

                {/* Rating & Bookmark */}
                {(() => {
                  const revCount = activeSuggestedEvent.reviews
                    ? activeSuggestedEvent.reviews.length
                    : (activeSuggestedEvent.reviewsCount || 0);
                  const ratingVal = activeSuggestedEvent.rating && activeSuggestedEvent.rating > 0
                    ? activeSuggestedEvent.rating
                    : (revCount > 0 ? 5 : 0);
                  const isSaved = activeSavedIds.includes(activeSuggestedEvent.id);

                  return (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < Math.round(ratingVal) && ratingVal > 0
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-zinc-600'
                              }`}
                            />
                          ))}
                        </div>
                        {revCount > 0 ? (
                          <>
                            <span>{ratingVal.toFixed(1)}</span>
                            <span className="text-zinc-500 font-normal text-[11px]">
                              ({revCount} {revCount === 1 ? 'avaliação' : 'avaliações'})
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-500 font-normal text-[11px]">
                            (Sem avaliações)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSaveEvent(activeSuggestedEvent.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer group"
                        title={isSaved ? 'Remover dos salvos' : 'Salvar este evento'}
                      >
                        <Bookmark
                          className={`w-4 h-4 transition-all group-hover:scale-110 ${
                            isSaved ? 'fill-[#f05a22] text-[#f05a22]' : 'text-zinc-400 hover:text-amber-400'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })()}

                {/* Travel times row */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300 bg-[#121318] px-2.5 py-1.5 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{carMins}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{walkMins}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{bikeMins}min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{busMins}min</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-xs text-zinc-400 truncate">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{activeSuggestedEvent.address || activeSuggestedEvent.cityRegion}</span>
                </div>

                {/* Saiba mais Button */}
                <button
                  onClick={() => {
                    onSelectEvent(activeSuggestedEvent);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#f05a22] hover:bg-[#d94e1c] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer text-center mt-1 shadow-md"
                >
                  Saiba mais &gt;
                </button>
              </div>
            ) : (
              <div className="w-full text-center text-xs text-zinc-500 py-10">
                Nenhum evento disponível no momento.
              </div>
            )}

            {/* Bottom Caption */}
            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              Descubra o encanto da cultura e{' '}
              <strong className="text-[#f05a22]">valorize as atrações da sua região</strong>
            </p>
          </div>

          {/* RIGHT SIDE: SUGESTÃO PERSONALIZADA QUIZ BOX */}
          <div className="lg:col-span-7 flex flex-col justify-between items-center bg-[#121318] border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-xl min-h-[420px]">
            {/* Top Subtitle */}
            <div className="text-center mb-2">
              <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-white">
                SUGESTÃO <span className="text-[#f05a22]">Personalizada</span>
              </h3>
            </div>

            {/* Central Main Box */}
            <div className="w-full bg-[#181920] border border-zinc-800/90 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner my-auto min-h-[340px]">
              {/* Dark subtle background grid effect */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none bg-center bg-cover"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgba(240, 90, 34, 0.15) 0%, transparent 70%)`
                }}
              />

              {/* COVER STATE (STEP 0) */}
              {step === 0 && (
                <div className="flex flex-col items-center justify-center gap-5 z-10 w-full animate-fadeIn">
                  {/* Stacked Artwork Poster Cards with Real Event Images */}
                  {(() => {
                    const showcase = (() => {
                      if (!events || events.length === 0) return [];
                      const parade = events.find(e => /poéti|poeti|sarau|slam|literatura/i.test(e.title) || /poet/i.test(e.category)) || events[0];
                      const fest = events.find(e => (/música|musica|festival|jazz|sinfônica/i.test(e.title) || /música|musica/i.test(e.category)) && e?.id !== parade?.id) || events[1] || events[0];
                      const rock = events.find(e => (/rock|fest|show|aovivo/i.test(e.title) || /música/i.test(e.category)) && e?.id !== parade?.id && e?.id !== fest?.id) || events[2] || events[0];
                      const slam = events.find(e => (/slam|teatro|exposição|arte|cinema/i.test(e.title) || /teatro|arte/i.test(e.category)) && e?.id !== parade?.id && e?.id !== fest?.id && e?.id !== rock?.id) || events[3] || events[0];

                      const list = [parade, fest, rock, slam].filter(Boolean);
                      const uniqueList: CulturalEvent[] = [];
                      list.forEach(item => {
                        if (item && !uniqueList.some(u => u.id === item.id)) {
                          uniqueList.push(item);
                        }
                      });
                      for (const ev of events) {
                        if (uniqueList.length >= 4) break;
                        if (!uniqueList.some(u => u.id === ev.id)) {
                          uniqueList.push(ev);
                        }
                      }
                      return uniqueList;
                    })();

                    const rotations = ['-rotate-6', '-rotate-2', 'rotate-3', 'rotate-6'];

                    return (
                      <div className="flex items-center justify-center gap-2 sm:gap-3 py-2 z-10">
                        {showcase.map((ev, idx) => (
                          <div
                            key={ev.id || idx}
                            onClick={() => onSelectEvent(ev)}
                            className={`w-20 sm:w-24 h-28 sm:h-32 rounded-xl overflow-hidden relative shadow-2xl border border-zinc-700/80 transform ${rotations[idx % 4]} hover:rotate-0 hover:scale-105 transition-all cursor-pointer group bg-zinc-900`}
                            title={`Ver ${ev.title}`}
                          >
                            <img
                              src={ev.image}
                              alt={ev.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-1.5 flex flex-col justify-end text-left">
                              <span className="text-[9px] font-black text-white leading-tight line-clamp-2 uppercase drop-shadow">
                                {ev.title}
                              </span>
                              <span className="text-[8px] font-medium text-[#f05a22] truncate">
                                {ev.category.split(',')[0]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Main Call to Action Text */}
                  <h4 className="text-base sm:text-lg font-bold text-white max-w-md">
                    Qual é a melhor atividade cultural para{' '}
                    <span className="text-[#f05a22] font-black">VOCÊ?</span>
                  </h4>

                  {/* Começar Button */}
                  <button
                    onClick={() => setStep(1)}
                    className="px-10 py-3 bg-[#f05a22] hover:bg-[#d94e1c] text-white font-black text-sm rounded-full transition-all transform hover:scale-105 cursor-pointer shadow-lg shadow-orange-600/30"
                  >
                    Começar
                  </button>
                </div>
              )}

              {/* QUIZ QUESTION STEPS (STEPS 1..4) */}
              {step >= 1 && step <= 4 && (
                <div className="w-full max-w-md space-y-4 z-10 text-left animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[11px] font-extrabold uppercase text-[#f05a22]">
                      Passo {step} de 4
                    </span>
                    <button
                      onClick={handleReset}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reiniciar</span>
                    </button>
                  </div>

                  {/* STEP 1 */}
                  {step === 1 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white">
                        O que você está com vontade de curtir hoje?
                      </h4>
                      <div className="space-y-2 text-xs font-medium">
                        {[
                          { id: 'musica', label: 'Shows, Música ao Vivo & Festivais' },
                          { id: 'gastronomia', label: 'Gastronomia, Feiras & Culinária' },
                          { id: 'teatro', label: 'Teatro, Arte, Cinema & Literatura' },
                          { id: 'cursos', label: 'Cursos, Oficinas & Educação' },
                          { id: 'any', label: 'Surpreenda-me! (Qualquer estilo)' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleNextStep(opt.id)}
                            className="w-full p-3.5 rounded-xl bg-[#121318] hover:bg-[#20222a] border border-zinc-800 hover:border-[#f05a22]/60 text-zinc-200 hover:text-white transition-colors cursor-pointer text-left font-semibold"
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white">
                        Com quem você pretende ir ao evento?
                      </h4>
                      <div className="space-y-2 text-xs font-medium">
                        {[
                          { id: 'solo', label: 'Passeio Solo (Aproveitar minha companhia)' },
                          { id: 'pair', label: 'Em Casal / Em Dupla' },
                          { id: 'friends', label: 'Com Grupo de Amigos' },
                          { id: 'family', label: 'Com Família & Crianças' },
                          { id: 'online', label: 'Virtual / Sem Sair de Casa' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleNextStep(undefined, opt.id)}
                            className="w-full p-3.5 rounded-xl bg-[#121318] hover:bg-[#20222a] border border-zinc-800 hover:border-[#f05a22]/60 text-zinc-200 hover:text-white transition-colors cursor-pointer text-left font-semibold"
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white">
                        Qual a sua preferência de orçamento / entrada?
                      </h4>
                      <div className="space-y-2 text-xs font-medium">
                        {[
                          { id: 'free', label: '100% Gratuito (Entrada Franca)' },
                          { id: 'any', label: 'Pago ou Grátis (Sem restrições)' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleNextStep(undefined, undefined, opt.id)}
                            className="w-full p-3.5 rounded-xl bg-[#121318] hover:bg-[#20222a] border border-zinc-800 hover:border-[#f05a22]/60 text-zinc-200 hover:text-white transition-colors cursor-pointer text-left font-semibold"
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 4 */}
                  {step === 4 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-white">
                        Até qual distância você prefere ir?
                      </h4>
                      <div className="space-y-2 text-xs font-medium">
                        {[
                          { id: 'near', label: 'Pertinho de mim (Até 12 km)' },
                          { id: 'region', label: 'Na minha Região (Até 35 km)' },
                          { id: 'all', label: 'Sem limite de raio' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => handleNextStep(undefined, undefined, undefined, opt.id)}
                            className="w-full p-3.5 rounded-xl bg-[#121318] hover:bg-[#20222a] border border-zinc-800 hover:border-[#f05a22]/60 text-zinc-200 hover:text-white transition-colors cursor-pointer text-left font-semibold"
                          >
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RESULTS STATE (STEP 5) */}
              {step === 5 && (
                <div className="w-full space-y-3 z-10 text-left animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#f05a22] tracking-wider">
                        SUGESTÃO PERSONALIZADA
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Esta é a melhor atividade cultural para você!
                      </h4>
                    </div>
                    <button
                      onClick={handleReset}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Refazer</span>
                    </button>
                  </div>

                  {results.length > 0 && results[selectedResultIndex] ? (() => {
                    const activeRes = results[selectedResultIndex];
                    const resEv = activeRes.event;
                    const resCar = getEstimatedTravelTimeMinutes(resEv.distanceKm, 'car');
                    const resWalk = getEstimatedTravelTimeMinutes(resEv.distanceKm, 'walk');
                    const resBike = getEstimatedTravelTimeMinutes(resEv.distanceKm, 'bicycle');
                    const resBus = getEstimatedTravelTimeMinutes(resEv.distanceKm, 'transit');
                    const isResSaved = activeSavedIds.includes(resEv.id);

                    const revCount = resEv.reviews
                      ? resEv.reviews.length
                      : (resEv.reviewsCount || 0);
                    const ratingVal = resEv.rating && resEv.rating > 0
                      ? resEv.rating
                      : (revCount > 0 ? 5 : 0);

                    return (
                      <div className="flex flex-col gap-3">
                        {/* Featured Suggestion Card (Same style as Sugestão do Dia) */}
                        <div className="w-full bg-[#121318] border border-zinc-800 rounded-2xl p-3 flex flex-col gap-2.5 shadow-md">
                          {/* Image */}
                          <div className="w-full h-36 sm:h-40 rounded-xl overflow-hidden relative bg-zinc-900 border border-zinc-800">
                            <img
                              src={getEventImage(resEv.image, resEv.category, resEv.title)}
                              alt={resEv.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Title */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <h4 className="font-bold text-sm sm:text-base text-white truncate">
                              {resEv.title}
                            </h4>
                          </div>

                          {/* Rating & Bookmark */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3.5 h-3.5 ${
                                      i < Math.round(ratingVal) && ratingVal > 0
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-zinc-600'
                                    }`}
                                  />
                                ))}
                              </div>
                              {revCount > 0 ? (
                                <>
                                  <span>{ratingVal.toFixed(1)}</span>
                                  <span className="text-zinc-500 font-normal text-[11px]">
                                    ({revCount} {revCount === 1 ? 'avaliação' : 'avaliações'})
                                  </span>
                                </>
                              ) : (
                                <span className="text-zinc-500 font-normal text-[11px]">
                                  (Sem avaliações)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSaveEvent(resEv.id);
                              }}
                              className="p-1 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer group"
                              title={isResSaved ? 'Remover dos salvos' : 'Salvar este evento'}
                            >
                              <Bookmark
                                className={`w-4 h-4 transition-all group-hover:scale-110 ${
                                  isResSaved ? 'fill-[#f05a22] text-[#f05a22]' : 'text-zinc-400 hover:text-amber-400'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Travel times row */}
                          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-300 bg-[#181920] px-2.5 py-1.5 rounded-lg border border-zinc-800">
                            <div className="flex items-center gap-1">
                              <Car className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{resCar}min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Footprints className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{resWalk}min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bike className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{resBike}min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bus className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{resBus}min</span>
                            </div>
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1 text-xs text-zinc-400 truncate">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{resEv.address || resEv.cityRegion}</span>
                          </div>

                          {/* Saiba mais Button */}
                          <button
                            onClick={() => {
                              onSelectEvent(resEv);
                              onClose();
                            }}
                            className="w-full py-2.5 rounded-xl bg-[#f05a22] hover:bg-[#d94e1c] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer text-center mt-1 shadow-md"
                          >
                            Saiba mais &gt;
                          </button>
                        </div>

                        {/* Other Options Selector if multiple */}
                        {results.length > 1 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar w-full">
                            <span className="text-[11px] text-zinc-400 shrink-0 font-medium">Outras opções:</span>
                            {results.map(({ event }, idx) => (
                              <button
                                key={event.id}
                                onClick={() => setSelectedResultIndex(idx)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                  selectedResultIndex === idx
                                    ? 'bg-[#f05a22] text-white shadow-sm'
                                    : 'bg-[#121318] text-zinc-400 hover:text-white border border-zinc-800'
                                }`}
                              >
                                Opção #{idx + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="p-6 text-center text-zinc-400 text-xs space-y-2">
                      <p>Nenhum evento encontrado para os critérios selecionados.</p>
                      <button
                        onClick={handleReset}
                        className="px-4 py-2 bg-[#f05a22] text-white rounded-xl font-bold cursor-pointer"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Caption */}
            <p className="text-xs text-zinc-400 text-center mt-2">
              A <strong className="text-[#f05a22]">atividade perfeita</strong> para você está à sua espera
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

