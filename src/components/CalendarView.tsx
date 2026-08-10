import React, { useState, useMemo } from 'react';
import { CulturalEvent, UserProfile } from '../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Compass,
  Sparkles,
  Info,
  CalendarCheck,
  CheckCircle,
  X,
  DollarSign
} from 'lucide-react';
import { getEventImage, handleImageError } from '../utils/imageUtils';
import {
  MONTH_NAMES,
  WEEKDAY_SHORT_NAMES,
  getCalendarGrid,
  isEventOnDate
} from '../utils/dateUtils';

interface CalendarViewProps {
  events: CulturalEvent[];
  userProfile: UserProfile;
  onSelectEvent: (event: CulturalEvent) => void;
  onGoToMap: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

// Helper to extract or estimate event hour
function getEventStartHour(ev: CulturalEvent): number {
  if (!ev || !ev.dateRange) return 14;
  const str = ev.dateRange.toLowerCase();

  // Match "20h00", "20h", "20:00", "09h00", "11h00", "18h30"
  const match = str.match(/(\d{1,2})\s*(?:h|:)/);
  if (match) {
    const h = parseInt(match[1], 10);
    if (!isNaN(h) && h >= 0 && h <= 23) {
      return h;
    }
  }

  // Consistent fallback hash mapping to realistic hours (9, 10, 11, 14, 16, 18, 20)
  let hash = 0;
  const idStr = ev.id || ev.title || '';
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
  }
  const hours = [9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21];
  return hours[Math.abs(hash) % hours.length];
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  userProfile,
  onSelectEvent,
  onGoToMap,
  userLocation,
}) => {
  // Reference date: default August 8, 2026
  const [year, setYear] = useState<number>(2026);
  const [monthIndex, setMonthIndex] = useState<number>(7); // 7 = Agosto
  const [selectedDay, setSelectedDay] = useState<number>(8); // 8 de Agosto
  const [viewMode, setViewMode] = useState<'dia' | 'mes' | 'ano'>('dia');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('minha_regiao');
  const [hoveredEvent, setHoveredEvent] = useState<CulturalEvent | null>(null);
  const [modalEvent, setModalEvent] = useState<CulturalEvent | null>(null);

  // Generate 7-day strip around selectedDay
  const weekDays = useMemo(() => {
    const days = [];
    const baseDate = new Date(year, monthIndex, selectedDay);
    const dayOfWeek = baseDate.getDay(); // 0 = Dom, 6 = Sáb
    
    // Create 7 days starting from Sunday or around selected day
    const startDate = new Date(year, monthIndex, selectedDay - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      days.push({
        dayNumber: d.getDate(),
        monthIdx: d.getMonth(),
        yearNum: d.getFullYear(),
        weekdayShort: WEEKDAY_SHORT_NAMES[d.getDay()],
        isToday: d.getDate() === 8 && d.getMonth() === 7 && d.getFullYear() === 2026,
        isSelected: d.getDate() === selectedDay && d.getMonth() === monthIndex && d.getFullYear() === year,
        dateObj: d
      });
    }
    return days;
  }, [year, monthIndex, selectedDay]);

  // Navigate forward / backward in time based on viewMode
  const handlePrev = () => {
    if (viewMode === 'dia') {
      const targetDate = new Date(year, monthIndex, selectedDay - 7);
      setYear(targetDate.getFullYear());
      setMonthIndex(targetDate.getMonth());
      setSelectedDay(targetDate.getDate());
    } else if (viewMode === 'mes') {
      if (monthIndex === 0) {
        setMonthIndex(11);
        setYear((y) => y - 1);
      } else {
        setMonthIndex((m) => m - 1);
      }
    } else {
      setYear((y) => y - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === 'dia') {
      const targetDate = new Date(year, monthIndex, selectedDay + 7);
      setYear(targetDate.getFullYear());
      setMonthIndex(targetDate.getMonth());
      setSelectedDay(targetDate.getDate());
    } else if (viewMode === 'mes') {
      if (monthIndex === 11) {
        setMonthIndex(0);
        setYear((y) => y + 1);
      } else {
        setMonthIndex((m) => m + 1);
      }
    } else {
      setYear((y) => y + 1);
    }
  };

  // Hours array from 8h to 22h
  const hoursList = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

  // Deduplicate input events list
  const uniqueEvents = useMemo(() => {
    const seen = new Set<string>();
    return events.filter((ev) => {
      if (!ev) return false;
      const cleanTitle = (ev.title || '').replace(/\s+\d+$/, '').toLowerCase().trim();
      const key = `${cleanTitle}||${ev.dateRange || ''}||${ev.address || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events]);

  // Extract available unique cities/regions
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    uniqueEvents.forEach((ev) => {
      if (ev.cityRegion && ev.cityRegion.trim()) {
        set.add(ev.cityRegion.trim());
      }
    });
    return Array.from(set).sort();
  }, [uniqueEvents]);

  // Filter events based on selected city/region
  const filteredCalendarEvents = useMemo(() => {
    if (selectedCityFilter === 'todas') {
      return uniqueEvents;
    }
    if (selectedCityFilter === 'minha_regiao') {
      // Priority 1: Events within 50km if GPS distance is computed
      const nearby = uniqueEvents.filter(
        (ev) => typeof ev.distanceKm === 'number' && ev.distanceKm <= 50
      );
      if (nearby.length > 0) return nearby;

      // Priority 2: Fallback to local region
      const campinasOrLocal = uniqueEvents.filter((ev) =>
        (ev.cityRegion || '').toLowerCase().includes('campinas') ||
        (ev.address || '').toLowerCase().includes('campinas')
      );
      if (campinasOrLocal.length > 0) return campinasOrLocal;

      return uniqueEvents;
    }

    return uniqueEvents.filter(
      (ev) =>
        (ev.cityRegion || '').toLowerCase().includes(selectedCityFilter.toLowerCase()) ||
        (ev.address || '').toLowerCase().includes(selectedCityFilter.toLowerCase())
    );
  }, [uniqueEvents, selectedCityFilter]);

  // Map events by dayNumber and hour
  const eventTimelineMap = useMemo(() => {
    const map = new Map<string, CulturalEvent[]>();
    
    filteredCalendarEvents.forEach((ev) => {
      if (!ev) return;
      const evHour = getEventStartHour(ev);

      weekDays.forEach((wd) => {
        if (isEventOnDate(ev, wd.yearNum, wd.monthIdx, wd.dayNumber)) {
          const key = `${wd.dayNumber}-${evHour}`;
          const currentList = map.get(key) || [];
          const cleanTitle = (ev.title || '').replace(/\s+\d+$/, '').toLowerCase().trim();
          
          const isDuplicate = currentList.some((item) => {
            if (item.id === ev.id) return true;
            const itemCleanTitle = (item.title || '').replace(/\s+\d+$/, '').toLowerCase().trim();
            if (itemCleanTitle === cleanTitle) return true;
            if (item.image === ev.image && item.category === ev.category) return true;
            return false;
          });

          if (!isDuplicate) {
            map.set(key, [...currentList, ev]);
          }
        }
      });
    });

    return map;
  }, [filteredCalendarEvents, weekDays]);

  // Month grid for 'mes' mode
  const monthGrid = useMemo(() => {
    return getCalendarGrid(year, monthIndex);
  }, [year, monthIndex]);

  return (
    <div className="w-full h-full bg-[#161618] p-3 sm:p-6 overflow-y-auto custom-scrollbar text-zinc-100 font-sans flex flex-col gap-4 select-none">
      
      {/* TOP HEADER BAR (Exact layout as screenshot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        {/* Left: Back Arrow + Title + Region Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onGoToMap}
            className="flex items-center gap-2 text-sm font-bold text-zinc-200 hover:text-white transition-colors cursor-pointer group shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
            <span className="text-sm font-semibold tracking-wide">Calendário</span>
          </button>

          {/* Region / City Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#232325] px-2.5 py-1 rounded-xl border border-zinc-700/60 shadow-inner text-xs">
            <select
              value={selectedCityFilter}
              onChange={(e) => setSelectedCityFilter(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer pr-1"
            >
              <option value="minha_regiao" className="bg-[#232325] text-white">
                Minha Região
              </option>
              <option value="todas" className="bg-[#232325] text-white">
                Todas as regiões
              </option>
              {availableCities.map((city) => (
                <option key={city} value={city} className="bg-[#232325] text-white">
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Navigation Controls `< 8 de Agosto de 2026 >` */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs sm:text-sm font-bold text-zinc-100 tracking-wide">
            {viewMode === 'dia'
              ? `${selectedDay} de ${MONTH_NAMES[monthIndex]} de ${year}`
              : viewMode === 'mes'
              ? `${MONTH_NAMES[monthIndex]} de ${year}`
              : `${year}`}
          </span>

          <button
            onClick={handleNext}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: View Mode Toggle Container [ Dia | Mês | Ano ] */}
        <div className="flex items-center bg-[#232325] p-1 rounded-xl border border-zinc-700/60 shadow-inner">
          <button
            onClick={() => setViewMode('dia')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'dia'
                ? 'bg-[#f05a22] text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => setViewMode('mes')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'mes'
                ? 'bg-[#f05a22] text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setViewMode('ano')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'ano'
                ? 'bg-[#f05a22] text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ano
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {viewMode === 'dia' && (
        <div className="bg-[#232325] border border-zinc-700/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
          
          {/* 7-DAYS HEADER STRIP */}
          <div className="grid grid-cols-7 gap-2 border-b border-zinc-700/60 pb-4 text-center">
            {weekDays.map((wd) => (
              <button
                key={`${wd.dayNumber}-${wd.monthIdx}`}
                onClick={() => {
                  setSelectedDay(wd.dayNumber);
                  setMonthIndex(wd.monthIdx);
                  setYear(wd.yearNum);
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
                  wd.isSelected
                    ? 'bg-zinc-700/80 border border-zinc-500 text-white shadow-md'
                    : 'hover:bg-zinc-800/50 text-zinc-400 border border-transparent'
                }`}
              >
                {/* Eyebrow HOJE */}
                <span className="text-[10px] font-extrabold tracking-wider text-[#f05a22] uppercase h-4">
                  {wd.isToday ? 'HOJE' : ''}
                </span>

                {/* Day Number */}
                <span className="text-xl sm:text-2xl font-black text-white">
                  {wd.dayNumber}
                </span>

                {/* Weekday name */}
                <span className="text-xs font-medium text-zinc-400 mt-0.5">
                  {wd.weekdayShort}
                </span>
              </button>
            ))}
          </div>

          {/* DAY HEADER TITLE */}
          <div className="flex items-center justify-between px-1 py-1">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Programação de {WEEKDAY_SHORT_NAMES[new Date(year, monthIndex, selectedDay).getDay()]}, {selectedDay} de {MONTH_NAMES[monthIndex]}</span>
            </h2>
            <span className="text-xs font-semibold text-white bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-700/60">
              {filteredCalendarEvents.filter((ev) => isEventOnDate(ev, year, monthIndex, selectedDay)).length} eventos na região
            </span>
          </div>

          {/* HOURLY TIMETABLE LIST FOR SELECTED DAY */}
          <div className="space-y-3 pt-1">
            {hoursList.map((hour) => {
              const hourEvents = filteredCalendarEvents.filter(
                (ev) =>
                  isEventOnDate(ev, year, monthIndex, selectedDay) &&
                  getEventStartHour(ev) === hour
              );

              return (
                <div
                  key={hour}
                  className="bg-[#2b2b2e] border border-zinc-700/50 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 min-h-[70px]"
                >
                  {/* Hour Indicator */}
                  <div className="w-12 sm:w-14 flex items-center justify-center shrink-0 pr-3 border-r border-zinc-700/80 py-1">
                    <span className="text-sm sm:text-base font-medium text-zinc-400 select-none">
                      {hour}h
                    </span>
                  </div>

                  {/* Events Container */}
                  <div className="flex-1 flex flex-wrap gap-2.5 items-center">
                    {hourEvents.length === 0 ? (
                      <span className="text-xs text-white/60 italic pl-1">
                        Nenhum evento neste horário
                      </span>
                    ) : (
                      hourEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => setModalEvent(ev)}
                          className="flex items-center gap-3 bg-[#18181b] border border-zinc-700 p-2 sm:p-2.5 rounded-none cursor-pointer max-w-full sm:max-w-md shadow-sm"
                        >
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-none overflow-hidden border border-zinc-700 shrink-0 bg-zinc-900">
                            <img
                              src={getEventImage(ev.image, ev.category, ev.title)}
                              alt={ev.title}
                              onError={(e) => handleImageError(e, ev.category)}
                              className="w-full h-full object-cover rounded-none"
                            />
                          </div>

                          {/* Event info */}
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-bold text-white truncate">
                              {ev.title}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-medium mt-0.5 truncate">
                              {ev.category}
                            </span>
                          </div>

                          {/* Price Tag */}
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none bg-zinc-800 text-zinc-200 border border-zinc-700 shrink-0 ml-auto">
                            {ev.price || 'Gratuito'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MONTH VIEW MODE (`mes`) */}
      {viewMode === 'mes' && (
        <div className="bg-[#232325] border border-zinc-700/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center border-b border-zinc-700/60 pb-3">
            {WEEKDAY_SHORT_NAMES.map((wd) => (
              <div
                key={wd}
                className="text-xs font-black uppercase tracking-wider text-zinc-400"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((cell) => {
              const dayEvs = filteredCalendarEvents.filter((ev) =>
                isEventOnDate(ev, cell.year, cell.monthIndex, cell.day)
              );
              const isSelected = selectedDay === cell.day && cell.isCurrentMonth;

              return (
                <button
                  key={cell.dateKey}
                  onClick={() => {
                    setSelectedDay(cell.day);
                    setMonthIndex(cell.monthIndex);
                    setYear(cell.year);
                    setViewMode('dia');
                  }}
                  className={`min-h-[85px] sm:min-h-[100px] p-2 rounded-2xl border text-left transition-colors flex flex-col justify-between cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'bg-[#18181a]/50 border-zinc-800 text-zinc-600'
                      : isSelected
                      ? 'bg-zinc-700/90 border-zinc-500 text-white'
                      : cell.isToday
                      ? 'bg-zinc-700/50 border-zinc-500 text-white'
                      : 'bg-[#2b2b2e] hover:bg-zinc-700/60 border-zinc-700/50 text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-extrabold ${
                        cell.isToday
                          ? 'bg-zinc-200 text-black px-1.5 py-0.5 rounded-md text-[11px]'
                          : 'text-zinc-200'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {dayEvs.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {dayEvs.length}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pt-1">
                    {dayEvs.slice(0, 3).map((ev) => (
                      <img
                        key={ev.id}
                        src={getEventImage(ev.image, ev.category, ev.title)}
                        alt={ev.title}
                        onError={(e) => handleImageError(e, ev.category)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-zinc-700 shrink-0"
                      />
                    ))}
                    {dayEvs.length > 3 && (
                      <span className="text-[9px] font-bold text-zinc-400 pl-0.5">
                        +{dayEvs.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* YEAR VIEW MODE (`ano`) */}
      {viewMode === 'ano' && (
        <div className="bg-[#232325] border border-zinc-700/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {MONTH_NAMES.map((mName, mIdx) => {
            const mEvs = filteredCalendarEvents.filter((ev) => isEventOnDate(ev, year, mIdx));
            return (
              <button
                key={mName}
                onClick={() => {
                  setMonthIndex(mIdx);
                  setViewMode('mes');
                }}
                className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer ${
                  mIdx === monthIndex
                    ? 'bg-zinc-700/90 border-zinc-500 text-white'
                    : 'bg-[#2b2b2e] hover:bg-zinc-700/60 border-zinc-700/50 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-700/60 pb-2 mb-2">
                  <span className="font-bold text-sm text-white">{mName}</span>
                  <span className="text-xs font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                    {mEvs.length} eventos
                  </span>
                </div>

                <div className="space-y-1.5">
                  {mEvs.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="text-xs truncate text-zinc-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                      <span className="truncate">{ev.title}</span>
                    </div>
                  ))}
                  {mEvs.length === 0 && (
                    <p className="text-xs text-zinc-500 italic">Nenhum evento registrado</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* EVENT DETAIL POPUP MODAL (Clicking any poster thumbnail) */}
      {modalEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#181920] border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
            
            {/* Modal Image Header */}
            <div className="relative h-48 w-full">
              <img
                src={getEventImage(modalEvent.image, modalEvent.category, modalEvent.title)}
                alt={modalEvent.title}
                onError={(e) => handleImageError(e, modalEvent.category)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181920] via-[#181920]/40 to-transparent" />
              
              <button
                onClick={() => setModalEvent(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black text-white backdrop-blur-md cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-zinc-700 backdrop-blur-md">
                  {modalEvent.category}
                </span>
                <span className="text-xs font-bold text-zinc-200 bg-zinc-900/90 px-2.5 py-1 rounded-full border border-zinc-700 backdrop-blur-md">
                  {modalEvent.price || 'Gratuito'}
                </span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">{modalEvent.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-3 leading-relaxed">
                  {modalEvent.description}
                </p>
              </div>

              <div className="space-y-2 text-xs text-zinc-300 bg-[#20222a] p-3 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>{modalEvent.dateRange}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="truncate">{modalEvent.address} ({modalEvent.cityRegion})</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    onSelectEvent(modalEvent);
                    setModalEvent(null);
                    onGoToMap();
                  }}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-zinc-700 shadow-md"
                >
                  <Compass className="w-4 h-4" />
                  <span>Ver Localização no Mapa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
