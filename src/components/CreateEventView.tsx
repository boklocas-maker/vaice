import React, { useState } from 'react';
import { CulturalEvent, EventCategory } from '../types';
import { getEventImage } from '../utils/imageUtils';
import { GeocodingService } from '../services/aggregator/geocodingService';
import { createFirestoreEvent } from '../services/firebaseEventsService';

interface CreateEventViewProps {
  onAddEvent: (newEvent: CulturalEvent) => void;
  onGoToMap: () => void;
}

export const CreateEventView: React.FC<CreateEventViewProps> = ({
  onAddEvent,
  onGoToMap,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Evento Musical');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [address, setAddress] = useState('');
  const [cityRegion, setCityRegion] = useState('Campinas - SP');
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('Gratuito');
  const [organizer, setOrganizer] = useState('');
  const [image, setImage] = useState('');
  const [scheduleText, setScheduleText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<CulturalEvent | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const customId = `custom-${Date.now()}`;
    const customUrl = `https://mapacultural.local/evento/${customId}`;
    const rawCity = cityRegion.trim() || 'Campinas - SP';

    // Geocode address and city
    const geocoded = GeocodingService.geocodeAddress(address || title, rawCity);
    const jittered = GeocodingService.jitterCoordinates(geocoded.lat, geocoded.lng, customId);

    const newEv: CulturalEvent = {
      id: customId,
      title: title.trim(),
      category,
      description: description.trim(),
      dateRange: dateRange.trim() || 'Data a confirmar',
      address: isVirtual ? 'Evento Virtual / Transmissão Online' : (address.trim() || 'Endereço Principal'),
      cityRegion: rawCity,
      lat: jittered.lat,
      lng: jittered.lng,
      image: getEventImage(image, category, title),
      rating: 0,
      reviewsCount: 0,
      isVirtual,
      virtualLink: isVirtual ? virtualLink : undefined,
      isPaid,
      price: isPaid ? (price.trim() || 'Pago') : 'Gratuito',
      distanceKm: 1.2,
      travelTimeMinutes: 4,
      organizer: organizer.trim() || 'Organizador Independente',
      isAiGenerated: false,
      isHappeningNow: false,
      sourceUrl: customUrl,
      pinColor: 'green',
      schedule: scheduleText ? [
        {
          dayNumber: 1,
          monthShort: 'EVENTO',
          items: scheduleText.split('\n').filter(Boolean).map(t => ({ title: t }))
        }
      ] : undefined
    };

    try {
      await createFirestoreEvent(newEv);
    } catch (err) {
      console.warn('Erro ao salvar evento no Firestore:', err);
    }

    try {
      await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEv),
      });
    } catch (err) {
      console.warn('Erro ao salvar evento no servidor:', err);
    }

    onAddEvent(newEv);
    setCreatedEvent(newEv);
    setIsSubmitted(true);
  };

  return (
    <div className="w-full h-full bg-[#0e0f14] p-4 md:p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <button
          onClick={onGoToMap}
          className="text-sm font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          &larr; Voltar ao Mapa Cultural
        </button>
      </div>

      <div className="max-w-2xl mx-auto w-full bg-[#12141c] border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-6">
        {isSubmitted ? (
          <div className="py-10 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Atividade Anunciada com Sucesso!</h2>
            <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
              O evento <strong className="text-emerald-300">{createdEvent?.title}</strong> ({createdEvent?.cityRegion}) já foi geolocalizado e inserido no mapa para todos os moradores e visitantes da região.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onGoToMap}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-colors"
              >
                Ver Anúncio no Mapa
              </button>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setTitle('');
                  setDescription('');
                  setDateRange('');
                  setAddress('');
                  setVirtualLink('');
                  setScheduleText('');
                }}
                className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Anunciar Outro Evento
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-white">Anunciar Novo Evento ou Atividade</h2>
              <p className="text-[11px] text-zinc-400">Divulgue sua programação gratuita ou paga para o público do mapa</p>
            </div>

            {/* Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Nome da Atividade / Evento *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Festival de Rock Local ou Sarau de Poesia"
                  className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Categoria Principal *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700 focus:outline-none"
                >
                  <option value="Evento Musical">Evento Musical / Show</option>
                  <option value="Feira artesanal">Feira artesanal / Mercado</option>
                  <option value="Evento artístico - Poesia">Evento artístico / Poesia / Literatura</option>
                  <option value="Teatro e Performance">Teatro e Performance / Dança</option>
                  <option value="Gastronomia e Cultura">Gastronomia e Cultura</option>
                  <option value="Literatura e Livros">Literatura e Livros</option>
                  <option value="Tecnologia e Geek">Tecnologia, Geek e Games</option>
                  <option value="Dança e Expressão">Dança e Expressão Corporal</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">Descrição Detalhada & Programação *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva as atrações, horários, artistas participantes e objetivos da sua atividade cultural..."
                className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700 focus:outline-none h-24"
              />
            </div>

            {/* Dates & Organizer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Data e Horário *</label>
                <input
                  type="text"
                  required
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  placeholder="Ex: 22/08/2026 das 14h às 20h"
                  className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Organizador ou Coletivo</label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  placeholder="Ex: Coletivo Cultural da Cidade"
                  className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700"
                />
              </div>
            </div>

            {/* Format: Virtual vs Presencial */}
            <div className="p-3 bg-[#181a24] rounded-xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  Atividade Transmitida Online (Virtual)?
                </span>
                <button
                  type="button"
                  onClick={() => setIsVirtual(!isVirtual)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    isVirtual ? 'bg-indigo-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isVirtual ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {isVirtual ? (
                <input
                  type="url"
                  value={virtualLink}
                  onChange={(e) => setVirtualLink(e.target.value)}
                  placeholder="Link da transmissão ao vivo ou sala (Meet, YouTube, Instagram)..."
                  className="w-full bg-zinc-900 text-white p-2 rounded-lg border border-zinc-700"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Cidade e Município</label>
                    <input
                      type="text"
                      required={!isVirtual}
                      value={cityRegion}
                      onChange={(e) => setCityRegion(e.target.value)}
                      placeholder="Digite a cidade e município (Ex: Campinas - SP)"
                      className="w-full bg-zinc-900 text-white p-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400">Endereço / Local Físico</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Praça, Rua, Parque ou Teatro..."
                      className="w-full bg-zinc-900 text-white p-2 rounded-lg border border-zinc-700"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Entry Cost */}
            <div className="p-3 bg-[#181a24] rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">
                  Entrada Paga ou Ingresso?
                </span>
                <button
                  type="button"
                  onClick={() => setIsPaid(!isPaid)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                    isPaid ? 'bg-amber-600' : 'bg-zinc-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isPaid ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              {isPaid && (
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Valor dos ingressos (Ex: R$ 20,00 Inteira / R$ 10,00 Meia)"
                  className="w-full bg-zinc-900 text-white p-2 rounded-lg border border-zinc-700"
                />
              )}
            </div>

            {/* Schedule Items */}
            <div className="space-y-1">
              <label className="font-semibold text-zinc-300">Cronograma / Atrações (Linha por Linha)</label>
              <textarea
                value={scheduleText}
                onChange={(e) => setScheduleText(e.target.value)}
                placeholder="14:00 - Recepção dos convidados&#10;15:30 - Apresentação principal"
                className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700 h-16"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg cursor-pointer transition-colors text-center"
            >
              Publicar Anúncio
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

