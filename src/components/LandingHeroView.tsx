import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  ChevronRight, 
  ChevronDown, 
  SlidersHorizontal,
  Map,
  Calendar,
  Bookmark,
  PlusCircle,
  ShieldCheck,
  Menu,
  X,
  Compass
} from 'lucide-react';
import L from 'leaflet';
import firstHeroImage from '../assets/images/img.png';
import secondHeroImage from '../assets/images/img2.png';
import { handleImageError } from '../utils/imageUtils';
import { ViewType } from './Header';

interface LandingHeroViewProps {
  onExploreEvents: () => void;
  onNavigate?: (view: ViewType) => void;
  onSearchLocation: (locationText: string) => void;
}

// Mini interactive map preview inside the hero lower section
const HeroMapPreview: React.FC<{ onExploreEvents: () => void }> = ({ onExploreEvents }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-22.865, -47.165], // Hortolândia / Campinas center
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Sample cultural pins
    const samplePins = [
      { lat: -22.865, lng: -47.165, color: '#f95721' },
      { lat: -22.855, lng: -47.155, color: '#eab308' },
      { lat: -22.875, lng: -47.175, color: '#22c55e' },
      { lat: -22.860, lng: -47.180, color: '#3b82f6' },
      { lat: -22.870, lng: -47.150, color: '#a855f7' },
    ];

    samplePins.forEach((p) => {
      const pinIcon = L.divIcon({
        className: 'hero-map-pin',
        html: `
          <div style="cursor:pointer; width: 28px; height: 28px; border-radius: 50%; background-color: ${p.color}; border: 2.5px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.8); display: flex; items-center; justify-content: center;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: white;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([p.lat, p.lng], { icon: pinIcon });
      marker.on('click', onExploreEvents);
      marker.addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [onExploreEvents]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full cursor-pointer z-10"
      onClick={onExploreEvents}
    />
  );
};

export const LandingHeroView: React.FC<LandingHeroViewProps> = ({
  onExploreEvents,
  onNavigate,
  onSearchLocation,
}) => {
  const [locationInput, setLocationInput] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      onSearchLocation(locationInput);
      onExploreEvents();
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0c] text-zinc-100 overflow-y-auto custom-scrollbar flex flex-col selection:bg-orange-500 selection:text-white relative">
      {/* ----------------- FLOATING TOP NAVBAR (Menu Flutuante Suspenso) ----------------- */}
      <div className="sticky top-3 z-50 w-full px-3 sm:px-6 md:px-12 pointer-events-none mb-2">
        <header className="pointer-events-auto max-w-7xl mx-auto bg-black/95 backdrop-blur-xl border border-[#12141c] rounded-2xl sm:rounded-full px-4 sm:px-6 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3 text-xs font-medium text-zinc-300 transition-all hover:border-[#1c202d]">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <span className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase select-none drop-shadow group-hover:text-zinc-300 transition-colors">
                ÓRBITA CULTURAL
              </span>
            </div>
          </div>

          {/* Right Action Button & Mobile Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExploreEvents}
              className="px-5 py-2.5 rounded-full bg-[#f95721] hover:bg-[#ff642c] text-white font-black text-xs tracking-wider shadow-lg shadow-[#f95721]/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer uppercase"
            >
              <Compass className="w-4 h-4" />
              <span>EXPLORAR MAPA</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
              title="Abrir Menu Flutuante"
            >
              {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Mobile Floating Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="pointer-events-auto max-w-7xl mx-auto mt-2 bg-black/95 backdrop-blur-2xl border border-[#12141c] rounded-2xl p-4 shadow-2xl lg:hidden font-bold text-xs uppercase text-zinc-200 animate-fadeIn">
            <button
              onClick={() => { setIsMobileMenuOpen(false); onExploreEvents(); }}
              className="w-full text-left p-3 rounded-xl bg-[#f95721] text-white font-extrabold flex items-center gap-2.5 shadow-md"
            >
              <Compass className="w-4 h-4" />
              <span>Explorar Mapa</span>
            </button>
          </div>
        )}
      </div>

      {/* ----------------- MAIN HERO SECTION (Matching Reference Image) ----------------- */}
      <section className="relative px-6 md:px-12 py-8 md:py-12 max-w-7xl mx-auto w-full shrink-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
          
          {/* Left Column (Span 7 on desktop to ensure line text fit) */}
          <div className="lg:col-span-7 space-y-6 z-40 relative">
            {/* Main Headline with full graffiti spray styling matching reference screenshot */}
            <div className="space-y-2">
              {/* Line 1: Encontre cultura. */}
              <div className="flex items-baseline gap-4 sm:gap-6 lg:gap-8 flex-wrap sm:flex-nowrap">
                <span className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight">
                  Encontre
                </span>
                <span className="text-[#f95721] font-sedgwick text-5xl sm:text-7xl lg:text-8xl font-normal -rotate-2 transform spray-shadow-orange inline-block relative z-40">
                  cultura.
                </span>
              </div>

              {/* Line 2: Crie conexões. */}
              <div className="flex items-baseline gap-4 sm:gap-6 lg:gap-8 flex-wrap sm:flex-nowrap">
                <span className="text-[#f95721] text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
                  Crie
                </span>
                <span className="text-white font-sedgwick text-5xl sm:text-7xl lg:text-8xl font-normal rotate-1 transform spray-shadow-white inline-block">
                  conexões.
                </span>
              </div>
            </div>

            {/* Quote & Paragraph */}
            <div className="space-y-2 max-w-md pt-2">
              <div className="flex items-start gap-1.5">
                <span className="text-[#f95721] font-bold text-lg inline-block shrink-0 mt-0.5">//</span>
                <p className="text-sm sm:text-base text-zinc-300 font-medium leading-relaxed">
                  Ir a um evento é ainda melhor quando se tem{' '}
                  <strong className="text-[#f95721] font-bold">companhia.</strong>
                  <br />
                  Descubra atividades culturais e encontre pessoas com os mesmos interesses.{' '}
                  <span className="text-[#f95721] font-bold text-lg inline-block ml-1">//</span>
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <button
                onClick={onExploreEvents}
                className="px-7 py-3 rounded-full bg-[#f95721] hover:bg-[#ff642c] text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-[#f95721]/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
              >
                <span>Explorar eventos</span>
                <ChevronRight className="w-4 h-4 text-white stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Right Column (Span 5 on desktop) with Images & Orange Accent Block */}
          <div className="lg:col-span-5 relative flex flex-col justify-center min-h-[420px] md:min-h-[480px]">
            {/* Solid Orange Background Block (Behind top-right portion of top image, shifted slightly down) */}
            <div className="absolute top-2.5 sm:top-3.5 -right-4 sm:-right-6 md:-right-8 w-[140px] sm:w-[175px] md:w-[200px] h-[250px] sm:h-[295px] md:h-[320px] bg-[#f95721] z-0 rounded-none shadow-2xl" />

            {/* Top B&W Photo (z-20 so its doodle icon z-50 sits ON TOP of bottom photo z-10) */}
            <div className="relative z-20 w-[92%] sm:w-[88%] ml-0 rounded-none overflow-visible shadow-2xl border border-zinc-900 group">
              <img
                src={firstHeroImage}
                alt="Feira e movimento cultural"
                onError={(e) => handleImageError(e, 'Feira artesanal')}
                className="w-full h-52 sm:h-60 md:h-64 object-cover filter grayscale contrast-125 brightness-90 group-hover:scale-102 transition-transform duration-500"
              />

              {/* White Doodle Icon (Clam/Octopus with 2 vertical eye-slits & spray splatter from reference image) */}
              <div className="absolute -bottom-10 -right-7 sm:-right-5 md:-right-4 z-50 text-white filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] pointer-events-none">
                <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* White spray paint particle splatter clusters */}
                  <g fill="white">
                    {/* Right edge overspray */}
                    <circle cx="86" cy="22" r="1.3" opacity="0.85" />
                    <circle cx="89" cy="25" r="0.9" opacity="0.7" />
                    <circle cx="87" cy="28" r="1.5" opacity="0.9" />
                    <circle cx="92" cy="20" r="0.8" opacity="0.5" />
                    <circle cx="85" cy="31" r="1.1" opacity="0.75" />
                    <circle cx="90" cy="33" r="0.6" opacity="0.4" />
                    <circle cx="88" cy="18" r="1.2" opacity="0.8" />

                    {/* Bottom-left overspray */}
                    <circle cx="10" cy="58" r="1.2" opacity="0.85" />
                    <circle cx="8" cy="62" r="0.8" opacity="0.6" />
                    <circle cx="13" cy="65" r="1.4" opacity="0.85" />
                    <circle cx="11" cy="69" r="0.7" opacity="0.5" />
                    <circle cx="15" cy="71" r="1.1" opacity="0.7" />
                    <circle cx="7" cy="66" r="0.5" opacity="0.4" />
                    <circle cx="12" cy="74" r="0.9" opacity="0.6" />
                  </g>

                  {/* Outer clam/octopus hand doodle outline */}
                  <path
                    d="M 32 44 
                       C 20 41, 9 46, 7 52 
                       C 5 58, 16 61, 27 57 
                       C 25 66, 29 78, 37 78 
                       C 43 78, 44 68, 46 60 
                       C 48 70, 52 85, 60 85 
                       C 68 85, 66 70, 66 60 
                       C 70 70, 78 81, 84 76 
                       C 90 71, 84 55, 77 49 
                       C 89 39, 88 17, 70 9 
                       C 50 1, 29 17, 32 44 Z"
                    stroke="white"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />

                  {/* Two vertical eye-slits inside the top bulbous head */}
                  <path
                    d="M 43 25 L 42 43 M 56 26 L 55 44"
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            {/* Orange Spray Tag Doodle in the middle gap (Exact replica from user screenshot) */}
            <div className="absolute -left-6 sm:-left-9 top-[48%] -translate-y-1/2 z-30 text-[#f95721] pointer-events-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
              <svg width="78" height="56" viewBox="0 0 100 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Spray paint particle splatter at left tip */}
                <g fill="#f95721">
                  <circle cx="12" cy="22" r="1.3" opacity="0.9" />
                  <circle cx="10" cy="19" r="0.8" opacity="0.7" />
                  <circle cx="14" cy="17" r="1.1" opacity="0.8" />
                  <circle cx="8" cy="24" r="0.6" opacity="0.5" />
                  <circle cx="11" cy="26" r="0.9" opacity="0.7" />
                  <circle cx="15" cy="21" r="1.2" opacity="0.85" />
                  <circle cx="13" cy="28" r="0.7" opacity="0.6" />
                  <circle cx="9" cy="27" r="0.5" opacity="0.4" />
                  <circle cx="16" cy="24" r="1.4" opacity="0.9" />
                  <circle cx="18" cy="20" r="1.0" opacity="0.8" />
                  <circle cx="7" cy="21" r="0.7" opacity="0.5" />
                  <circle cx="14" cy="15" r="0.6" opacity="0.6" />

                  {/* Overspray dots under bottom intersection */}
                  <circle cx="48" cy="52" r="1.2" opacity="0.8" />
                  <circle cx="51" cy="55" r="0.8" opacity="0.65" />
                  <circle cx="45" cy="50" r="0.6" opacity="0.5" />
                  <circle cx="53" cy="51" r="1.1" opacity="0.85" />
                  <circle cx="49" cy="57" r="0.7" opacity="0.6" />
                  <circle cx="46" cy="54" r="0.9" opacity="0.7" />
                  <circle cx="52" cy="56" r="0.5" opacity="0.5" />
                </g>

                {/* Main horizontal arched spray stroke */}
                <path
                  d="M 18 24 C 38 21, 62 18, 85 22"
                  stroke="#f95721"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Top vertical/diagonal spray stroke crossing down-left */}
                <path
                  d="M 42 7 C 46 22, 44 38, 36 50"
                  stroke="#f95721"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Bottom right branch spray stroke */}
                <path
                  d="M 50 32 C 60 37, 72 41, 86 43"
                  stroke="#f95721"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Bottom B&W Photo (z-10 so top photo and its doodle sit ON TOP) */}
            <div className="relative z-10 w-[88%] sm:w-[84%] ml-0 mt-3 sm:mt-4 rounded-none overflow-hidden shadow-2xl border border-zinc-900 group">
              <img
                src={secondHeroImage}
                alt="Apresentação e show cultural"
                onError={(e) => handleImageError(e, 'Evento Musical')}
                className="w-full h-56 sm:h-64 md:h-72 object-cover filter grayscale contrast-125 brightness-90 group-hover:scale-102 transition-transform duration-500"
              />
            </div>

          </div>

        </div>

        {/* Bottom Left Corner Big Orange Swirl Doodle Accent */}
        <div className="absolute -bottom-8 -left-4 z-10 text-[#f95721] pointer-events-none opacity-90 hidden sm:block">
          <svg width="120" height="120" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round">
            <path d="M20 80 Q 10 30, 50 20 Q 90 10, 60 70 Q 30 110, 20 50 Q 10 10, 40 30" />
          </svg>
        </div>
      </section>

      {/* ----------------- LOWER MAP LOCATION SEARCH SECTION (Matching User Reference Image) ----------------- */}
      <section className="px-4 sm:px-8 md:px-12 py-10 md:py-16 max-w-7xl mx-auto w-full space-y-8 text-center bg-[#0a0a0c] shrink-0">
        {/* Title Block */}
        <div className="space-y-1 sm:space-y-2">
          {/* Line 1: DIGITE SUA LOCALIZAÇÃO */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-wider uppercase flex items-center justify-center gap-2 flex-wrap">
            <span>DIGITE SUA LOCALIZAÇÃO</span>
          </h2>

          {/* Line 2: veja quais atividades estão rolando! */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-[#f95721] text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              veja quais atividades estão rolando!
            </span>
          </div>
        </div>

        {/* Map Container with Electric Blue Rounded Frame matching user image */}
        <div className="relative max-w-5xl mx-auto w-full h-[450px] sm:h-[520px] md:h-[580px] rounded-[24px] sm:rounded-[32px] overflow-hidden border-[2.5px] border-[#2563eb] shadow-[0_0_35px_rgba(37,99,235,0.22)] bg-[#0b0c0e]">
          {/* Top Floating Dark Search Bar Pill */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-lg bg-[#0c0d12]/90 backdrop-blur-md border border-zinc-800/90 rounded-full py-2.5 px-4 flex items-center justify-between text-zinc-300 shadow-2xl">
            <form onSubmit={handleLocationSubmit} className="flex items-center gap-2.5 flex-1 min-w-0">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Placeholder"
                className="bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none w-full font-medium"
              />
            </form>
            <button
              type="button"
              onClick={onExploreEvents}
              className="w-7 h-7 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/60 flex items-center justify-center shrink-0 cursor-pointer text-zinc-400 hover:text-white transition-colors ml-2"
              title="Filtrar"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Embedded Live Leaflet Map Preview */}
          <HeroMapPreview onExploreEvents={onExploreEvents} />
        </div>
      </section>
    </div>
  );
};

