import React, { useState } from 'react';
import { CulturalEvent, QuizAnswers } from '../types';
import { ArrowLeft, Sparkles, Clock, MapPin, Star, Bookmark, CheckCircle, X } from 'lucide-react';

interface SuggestionQuizViewProps {
  events: CulturalEvent[];
  onSelectEvent: (event: CulturalEvent) => void;
  onGoToMap: () => void;
}

export const SuggestionQuizView: React.FC<SuggestionQuizViewProps> = ({
  events,
  onSelectEvent,
  onGoToMap,
}) => {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizStep, setQuizStep] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({
    categories: [],
    format: 'tanto_faz',
    cost: 'tanto_faz',
    timing: 'qualquer_momento',
  });
  const [quizRecommendation, setQuizRecommendation] = useState<{ event: CulturalEvent; reason: string } | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Default suggestion of the day matching Image 6 (Ghaia Market)
  const suggestionOfDay = events.find(e => e.id === '2' || e.title.includes('Ghaia')) || events[0];

  const categoriesOptions = [
    'Evento Musical',
    'Feira artesanal',
    'Evento artístico - Poesia',
    'Teatro e Performance',
    'Gastronomia e Cultura',
    'Literatura e Livros',
    'Tecnologia e Geek',
    'Dança e Expressão',
  ];

  const handleCategoryToggle = (cat: any) => {
    setQuizAnswers(prev => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat]
      };
    });
  };

  const handleRunQuizMatch = async () => {
    setIsLoadingAi(true);

    try {
      const response = await fetch('/api/ai/quiz-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: quizAnswers, events }),
      });
      const data = await response.json();

      if (data && data.eventId) {
        const found = events.find(e => e.id === data.eventId);
        if (found) {
          setQuizRecommendation({ event: found, reason: data.reason });
          setIsLoadingAi(false);
          setQuizStep(4);
          return;
        }
      }
    } catch (e) {
      console.warn('API quiz match fallback');
    }

    // Fallback logic
    const matched = events.find((e) =>
      quizAnswers.categories.length > 0
        ? quizAnswers.categories.includes(e.category)
        : true
    ) || events[0];

    if (matched) {
      setQuizRecommendation({
        event: matched,
        reason: `Encontramos uma atividade perfeita baseada nas suas preferências por ${matched.category || 'Cultura'}!`,
      });
    } else {
      setQuizRecommendation(null);
    }
    setIsLoadingAi(false);
    setQuizStep(4);
  };

  // Mini stacked posters data for right card
  const stackedPosters = [
    { bg: 'bg-red-600', text: 'PARADA POÉTICA', textStyle: 'text-white font-extrabold text-[9px] text-center leading-none p-1' },
    { bg: 'bg-indigo-900', text: '1º Festival Internacional de Música', textStyle: 'text-blue-100 font-bold text-[8px] text-center leading-tight p-1' },
    { bg: 'bg-amber-400', text: 'ROCK FEST SBO', textStyle: 'text-black font-black text-[9px] text-center leading-none p-1' },
    { bg: 'bg-white', text: 'SLAM TRIUNFO', textStyle: 'text-red-600 font-black text-[9px] text-center leading-none p-1 border border-black' },
    { bg: 'bg-amber-500', text: 'PLANETA ROCK', textStyle: 'text-black font-black text-[8px] text-center leading-none p-1' },
  ];

  return (
    <div className="w-full h-full bg-[#08080a] text-zinc-100 p-4 md:p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
      {/* Header Back Button */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 shrink-0">
        <button
          onClick={onGoToMap}
          className="flex items-center gap-2 text-sm font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400" />
          <span>Sugestão</span>
        </button>
      </div>

      {/* Split Suggestions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 flex-1 max-w-6xl mx-auto w-full items-start">
        {/* LEFT COLUMN: Sugestão Do Dia */}
        <div className="flex flex-col items-center justify-between space-y-4">
          <div className="w-full text-center space-y-1">
            <p className="text-xs font-semibold text-zinc-400">
              expira em <strong className="text-orange-500 font-bold">14h</strong>
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Sugestão Do Dia:
            </h2>
            <h3 className="text-2xl md:text-3xl font-extrabold text-orange-500">
              Feira Artesanal
            </h3>
          </div>

          {/* Featured Card */}
          <div className="w-full max-w-sm bg-[#12131a] border-2 border-orange-500 rounded-3xl p-4 space-y-3 shadow-2xl relative">
            {/* Custom Logo/Banner Graphic for Casa Ghaia */}
            <div className="w-full aspect-[4/3] rounded-2xl bg-[#c84818] flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner">
              <div className="text-center text-white space-y-1">
                <h1 className="text-4xl font-black tracking-tighter leading-none font-serif">
                  casa<br />ghaia
                </h1>
                <p className="text-[10px] tracking-widest uppercase text-amber-200 font-medium">
                  experiências wellness & criativas
                </p>
              </div>
            </div>

            {/* Title & Info */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-baseline justify-between">
                <h4 className="text-xl font-black text-white">
                  Ghaia Market <span className="text-xs font-normal text-zinc-400">(25/07)</span>
                </h4>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                <div className="flex text-amber-400">
                  {'★★★★★'.split('').map((star, i) => (
                    <span key={i}>{star}</span>
                  ))}
                </div>
                <span>5.0</span>
                <span className="text-zinc-500 font-normal">(1.495)</span>
              </div>

              {/* Travel Time & Location */}
              <div className="space-y-0.5 text-xs">
                <p className="text-zinc-400">
                  A apenas <strong className="text-orange-500 font-bold">7 Minutos</strong> de você!
                </p>
                <p className="text-zinc-400 text-[11px] truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                  Casa Navio - Cambuí, Campinas - SP
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    if (suggestionOfDay) {
                      onSelectEvent(suggestionOfDay);
                      onGoToMap();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
                >
                  Saiba mais
                </button>

                <button
                  onClick={() => setIsSaved(!isSaved)}
                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                    isSaved 
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                      : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                  title="Salvar evento"
                >
                  <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-orange-400' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-center font-medium text-zinc-300">
            Descubra o encanto do artesanato e <strong className="text-orange-500 font-bold">valorize o feito á mão</strong>
          </p>
        </div>

        {/* RIGHT COLUMN: Sugestão Personalizada */}
        <div className="flex flex-col items-center justify-between space-y-4">
          <div className="w-full text-center space-y-1">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Sugestão
            </h2>
            <h3 className="text-2xl md:text-3xl font-extrabold text-orange-500">
              Personalizada
            </h3>
          </div>

          {/* Container with dark map backdrop */}
          <div className="w-full max-w-md bg-[#12131a] border-2 border-orange-500 rounded-3xl p-6 text-center space-y-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[360px]">
            {/* Dark Map Overlay background effect */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Overlapping Posters Row with Real Event Images */}
            <div className="flex items-center justify-center -space-x-2 py-2 z-10">
              {(events && events.length > 0 ? events.slice(0, 4) : []).map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  onClick={() => {
                    onSelectEvent(ev);
                    onGoToMap();
                  }}
                  className="w-16 h-20 md:w-20 md:h-24 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-900 relative transition-transform hover:scale-110 hover:z-30 cursor-pointer group bg-zinc-900"
                  style={{
                    transform: `rotate(${(idx - 1.5) * 6}deg) translateY(${Math.abs(idx - 1.5) * 4}px)`,
                  }}
                  title={`Ver ${ev.title}`}
                >
                  <img
                    src={ev.image}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-1 flex flex-col justify-end text-left">
                    <span className="text-[8px] md:text-[9px] font-black text-white leading-tight line-clamp-2 uppercase">
                      {ev.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Text & Quiz Prompt */}
            <div className="space-y-1 z-10">
              <h4 className="text-2xl font-black text-white">Descubra Aqui</h4>
              <p className="text-xs text-zinc-400 font-medium max-w-xs mx-auto">
                qual é a melhor Atividade Cultural para <strong className="text-orange-500 font-bold uppercase">VOCÊ!</strong>
              </p>
              <p className="text-[11px] text-zinc-500 font-medium pt-1">
                Responda ao Quiz e adquira já
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={() => {
                setQuizStep(1);
                setShowQuizModal(true);
              }}
              className="w-full max-w-xs py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer z-10"
            >
              Começar
            </button>
          </div>

          <p className="text-xs text-center font-medium text-zinc-300">
            A <strong className="text-orange-500 font-bold">atividade perfeita</strong> para você está à sua espera
          </p>
        </div>
      </div>

      {/* Quiz Modal Overlay */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#12131a] border border-zinc-800 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl animate-scaleIn text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-orange-500 font-extrabold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Quiz Cultural Personalizado</span>
              </div>
              <button
                onClick={() => setShowQuizModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP 1: Categories */}
            {quizStep === 1 && (
              <div className="space-y-4 text-xs">
                <p className="font-bold text-white text-sm">
                  1. Quais categorias de cultura você tem interesse hoje?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {categoriesOptions.map((cat) => {
                    const isSelected = quizAnswers.categories.includes(cat as any);
                    return (
                      <button
                        key={cat}
                        onClick={() => handleCategoryToggle(cat)}
                        className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white text-black border-white font-bold shadow-md'
                            : 'bg-[#181a24] text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setQuizStep(2)}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Próximo Passo →
                </button>
              </div>
            )}

            {/* STEP 2: Format & Cost */}
            {quizStep === 2 && (
              <div className="space-y-4 text-xs">
                <p className="font-bold text-white text-sm">
                  2. Suas preferências de formato e entrada:
                </p>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Formato:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['presencial', 'virtual', 'tanto_faz'] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, format: fmt }))}
                        className={`p-2 rounded-xl capitalize font-bold border transition-all cursor-pointer ${
                          quizAnswers.format === fmt ? 'bg-white text-black border-white' : 'bg-[#181a24] text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {fmt === 'tanto_faz' ? 'Tanto faz' : fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Entrada:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['gratuito', 'pago', 'tanto_faz'] as const).map((cst) => (
                      <button
                        key={cst}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, cost: cst }))}
                        className={`p-2 rounded-xl capitalize font-bold border transition-all cursor-pointer ${
                          quizAnswers.cost === cst ? 'bg-white text-black border-white' : 'bg-[#181a24] text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {cst === 'tanto_faz' ? 'Tanto faz' : cst}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setQuizStep(1)}
                    className="w-1/3 py-2.5 bg-[#181a24] text-zinc-300 font-bold rounded-xl border border-zinc-800 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleRunQuizMatch}
                    className="w-2/3 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Gerar Recomendação ✨
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Loading AI */}
            {isLoadingAi && (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-white">Analisando eventos e combinando o seu perfil...</p>
              </div>
            )}

            {/* STEP 4: Results */}
            {quizStep === 4 && quizRecommendation && (
              <div className="space-y-4 animate-fadeIn text-xs">
                <div className="bg-emerald-950/60 border border-emerald-500/50 p-3.5 rounded-2xl text-center space-y-1">
                  <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-extrabold text-white">
                    Encontramos a atividade perfeita para você!
                  </h3>
                  <p className="text-emerald-200 text-[11px]">{quizRecommendation.reason}</p>
                </div>

                <div className="bg-[#181a24] border border-zinc-800 p-3.5 rounded-2xl space-y-2">
                  <img
                    src={quizRecommendation.event.image}
                    alt={quizRecommendation.event.title}
                    className="w-full aspect-video rounded-xl object-cover"
                  />
                  <h4 className="text-base font-black text-white">{quizRecommendation.event.title}</h4>
                  <p className="text-xs text-orange-400 font-bold">{quizRecommendation.event.category}</p>
                  <p className="text-xs text-zinc-300 line-clamp-2">{quizRecommendation.event.description}</p>
                </div>

                <button
                  onClick={() => {
                    setShowQuizModal(false);
                    onSelectEvent(quizRecommendation.event);
                    onGoToMap();
                  }}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Ver no Mapa →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
