import React from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  Calendar, 
  Bookmark, 
  Globe,
  Sparkles,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { AccessibilitySettings, UserProfile } from '../types';

export type ViewType = 'landing' | 'map' | 'calendar' | 'saved' | 'settings' | 'suggestion' | 'create' | 'analytics' | 'ai-crawler' | 'admin';

interface HeaderProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenFilterModal: () => void;
  onOpenQuizModal: () => void;
  onOpenCreateEvent: () => void;
  userProfile: UserProfile;
  onOpenLoginModal: () => void;
  accessibility: AccessibilitySettings;
  totalEventsCount: number;
  onFetchMoreEvents: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  onOpenFilterModal,
  onOpenQuizModal,
  onOpenCreateEvent,
  userProfile,
  onOpenLoginModal,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0b10] border-b border-[#181a24] px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2 sm:gap-4 text-zinc-200">
      {/* Brand / Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <button 
          onClick={() => setCurrentView('landing')}
          className="text-base sm:text-lg font-black tracking-wider text-white hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-2"
          title="Voltar para a Página Inicial"
        >
          ÓRBITA CULTURAL
        </button>
      </div>

      {/* Middle: Search input bar + Filter button */}
      <div className="flex-1 max-w-lg mx-auto flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="O que você quer curtir hoje?"
            className="w-full bg-[#181a24] text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 pl-10 pr-8 py-2 rounded-full border border-zinc-800/80 focus:outline-none focus:border-zinc-600 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={onOpenFilterModal}
          className="p-2.5 rounded-full bg-[#181a24] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer shrink-0"
          title="Filtrar eventos por categoria, distância e formato"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Menu Buttons */}
      <nav className="flex items-center gap-1.5 shrink-0">
        {/* Sugestão Personalizada Button */}
        <button
          onClick={onOpenQuizModal}
          className="px-2.5 py-1 rounded-full bg-[#181a24] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] sm:text-xs font-medium transition-colors cursor-pointer"
          title="Sugestão Personalizada: Ache a atração cultural ideal para você"
        >
          <span className="hidden md:inline">Sugestão Personalizada</span>
          <span className="md:hidden">Sugestão</span>
        </button>

        {/* Anunciar Evento Button */}
        <button
          onClick={onOpenCreateEvent}
          className={`px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            currentView === 'create'
              ? 'bg-zinc-700 text-white border border-zinc-600 font-bold'
              : 'bg-[#181a24] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800'
          }`}
          title="Anunciar um evento ou atividade cultural no mapa"
        >
          <PlusCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Anunciar Evento</span>
          <span className="sm:hidden">Anunciar</span>
        </button>

        {/* User Tools Bar */}
        <div className="flex items-center bg-[#181a24] border border-zinc-800 rounded-full px-2.5 py-1.5 gap-2 text-zinc-400 shadow-sm ml-1">
          <button
            onClick={() => setCurrentView(currentView === 'calendar' ? 'map' : 'calendar')}
            className={`hover:text-white transition-colors ${currentView === 'calendar' ? 'text-white font-bold' : ''}`}
            title="Calendário de Eventos"
          >
            <Calendar className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-3 bg-zinc-700/60" />

          <button
            onClick={() => setCurrentView(currentView === 'saved' ? 'map' : 'saved')}
            className={`hover:text-white transition-colors relative ${currentView === 'saved' ? 'text-white font-bold' : ''}`}
            title="Eventos Salvos"
          >
            <Bookmark className="w-4 h-4" />
            {userProfile.savedEventIds.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-500 shadow-sm" />
            )}
          </button>

          <div className="w-[1px] h-3 bg-zinc-700/60" />

          <button
            onClick={onOpenLoginModal}
            className={`hover:text-white transition-colors flex items-center gap-1 ${userProfile.isLoggedIn ? 'text-emerald-400 font-bold' : ''}`}
            title="Sua Conta / Perfil"
          >
            <Globe className="w-4 h-4" />
            {userProfile.isLoggedIn && (
              <span className="text-[10px] hidden lg:inline max-w-[80px] truncate">{userProfile.name.split(' ')[0]}</span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};

