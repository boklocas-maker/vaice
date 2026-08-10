import React, { useState } from 'react';
import { AccessibilitySettings } from '../types';
import { Settings, Eye, Move, Compass, Volume2, ArrowLeft, Check, HelpCircle, Info, ChevronRight, Sparkles } from 'lucide-react';

interface AccessibilityViewProps {
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onGoToMap: () => void;
}

export const AccessibilityView: React.FC<AccessibilityViewProps> = ({
  settings,
  onUpdateSettings,
  onGoToMap,
}) => {
  const [activeTab, setActiveTab] = useState<'acessibilidade' | 'aparencia' | 'ajuda' | 'sobre'>('acessibilidade');
  const [speechTesting, setSpeechTesting] = useState(false);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      setSpeechTesting(true);
      utterance.onend = () => setSpeechTesting(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Seu navegador não suporta a síntese de voz nativa.');
    }
  };

  return (
    <div className="w-full h-full bg-[#0e0f14] p-4 md:p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
      {/* Header Back Button */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <button
          onClick={onGoToMap}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-orange-500" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Split Layout matching Image 5 */}
      <div className="bg-[#12141c] border border-zinc-800/90 rounded-2xl flex flex-col md:flex-row overflow-hidden shadow-2xl flex-1">
        {/* Left Preferences Navigation Menu */}
        <div className="w-full md:w-64 bg-[#151722] border-r border-zinc-800 p-5 space-y-6 shrink-0">
          <div className="flex items-center gap-2 font-bold text-base text-white border-b border-zinc-800 pb-3">
            <Settings className="w-5 h-5 text-orange-500" />
            <span>Configurações</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Section: PREFERÊNCIAS */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2">
                PREFERÊNCIAS
              </span>
              <button
                onClick={() => setActiveTab('acessibilidade')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'acessibilidade' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-400" />
                  Acessibilidade
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('aparencia')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'aparencia' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  Aparência
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Section: UTILIDADES */}
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2">
                UTILIDADES
              </span>
              <button
                onClick={() => setActiveTab('ajuda')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'ajuda' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  Ajuda
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveTab('sobre')}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl font-bold transition-all cursor-pointer ${
                  activeTab === 'sobre' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-400" />
                  Sobre
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Settings Panel (Image 5) */}
        <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {activeTab === 'acessibilidade' && (
            <>
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold text-lg border border-orange-500/30">
                  ♿
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Acessibilidade</h2>
                  <p className="text-xs text-zinc-400">Ajustes visuais, motores e leitores de áudio para inclusão completa.</p>
                </div>
              </div>

              {/* Group 1: VISÃO */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">VISÃO</h3>

                <div className="space-y-3 bg-[#171924] p-4 rounded-2xl border border-zinc-800">
                  {/* Tamanho da fonte */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-zinc-800/60">
                    <span className="text-xs font-semibold text-zinc-200">Tamanho da fonte</span>
                    <div className="flex items-center gap-2">
                      {(['pequeno', 'padrao', 'medio', 'grande'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => onUpdateSettings({ fontSize: sz })}
                          className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                            settings.fontSize === sz ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sz === 'padrao' ? 'Padrão' : sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Espaçamento do texto */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-zinc-800/60">
                    <span className="text-xs font-semibold text-zinc-200">Espaçamento do texto</span>
                    <div className="flex items-center gap-2">
                      {(['normal', 'largo', 'extra'] as const).map((sp) => (
                        <button
                          key={sp}
                          onClick={() => onUpdateSettings({ textSpacing: sp })}
                          className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                            settings.textSpacing === sp ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fonte para dislexia */}
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Fonte para dislexia</span>
                      <span className="text-[11px] text-zinc-500">Aplica tipografia OpenDyslexic adaptada para leitura fluida.</span>
                    </div>
                    <button
                      onClick={() => onUpdateSettings({ dyslexiaFont: !settings.dyslexiaFont })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.dyslexiaFont ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.dyslexiaFont ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  {/* Filtro para daltonismo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-zinc-800/60">
                    <span className="text-xs font-semibold text-zinc-200">Filtro para daltonismo</span>
                    <select
                      value={settings.daltonismFilter}
                      onChange={(e) => onUpdateSettings({ daltonismFilter: e.target.value as any })}
                      className="bg-zinc-800 text-xs text-white p-2 rounded-xl border border-zinc-700 focus:outline-none"
                    >
                      <option value="off">Desativado</option>
                      <option value="protanopia">Protanopia (Red-blind)</option>
                      <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                      <option value="tritanopia">Tritanopia (Blue-blind)</option>
                    </select>
                  </div>

                  {/* Alto contraste */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-semibold text-zinc-200">Alto contraste</span>
                    <button
                      onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.highContrast ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.highContrast ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group 2: MOVIMENTO */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">MOVIMENTO</h3>

                <div className="space-y-3 bg-[#171924] p-4 rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                    <span className="text-xs font-semibold text-zinc-200">Reduzir animações</span>
                    <button
                      onClick={() => onUpdateSettings({ reduceAnimations: !settings.reduceAnimations })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.reduceAnimations ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.reduceAnimations ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs font-semibold text-zinc-200">Desativar efeitos visuais</span>
                    <button
                      onClick={() => onUpdateSettings({ disableVisualFX: !settings.disableVisualFX })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.disableVisualFX ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.disableVisualFX ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group 3: NAVEGAÇÃO & VOZ */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">NAVEGAÇÃO</h3>

                <div className="space-y-3 bg-[#171924] p-4 rounded-2xl border border-zinc-800">
                  <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                    <span className="text-xs font-semibold text-zinc-200">Cursor ampliado</span>
                    <button
                      onClick={() => onUpdateSettings({ largeCursor: !settings.largeCursor })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.largeCursor ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.largeCursor ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
                    <span className="text-xs font-semibold text-zinc-200">Aumentar área clicável</span>
                    <button
                      onClick={() => onUpdateSettings({ largeClickArea: !settings.largeClickArea })}
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                        settings.largeClickArea ? 'bg-emerald-500' : 'bg-zinc-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${settings.largeClickArea ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>

                  {/* Virtual Audio Assistant Narrator */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200 block">Assistente Virtual de Voz</span>
                      <span className="text-[11px] text-zinc-500">Lê os eventos e instruções em voz alta.</span>
                    </div>
                    <button
                      onClick={() => speakText('Assistente de voz ativado! O Mapa Cultural está configurado para leitura em áudio.')}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{speechTesting ? 'Falando...' : 'Testar Voz'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'aparencia' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Aparência do Mapa</h2>
              <p className="text-xs text-zinc-400">Personalize o tema escuro do mapa e as cores dos marcadores de categorias.</p>
              <div className="p-4 bg-[#171924] rounded-2xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
                <p>🎨 O mapa e a interface utilizam como base o estilo escuro oficial do protótipo.</p>
              </div>
            </div>
          )}

          {activeTab === 'ajuda' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Central de Ajuda</h2>
              <p className="text-xs text-zinc-400">Como funciona o mapa cultural sem necessidade de login:</p>
              <div className="p-4 bg-[#171924] rounded-2xl border border-zinc-800 text-xs text-zinc-300 space-y-3">
                <p>📍 <strong>Localização Automática:</strong> Ao acessar, permitindo a localização, o sistema mostra eventos próximos.</p>
                <p>🔑 <strong>Sem Login Obrigatório:</strong> Nenhuma conta é exigida para navegar. Faça login apenas se quiser favoritar ou criar eventos.</p>
                <p>🏛️ <strong>Fontes Oficiais:</strong> Os eventos são sincronizados a partir de canais e agendas de prefeituras e órgãos culturais.</p>
              </div>
            </div>
          )}

          {activeTab === 'sobre' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Sobre o Projeto Mapa Cultural</h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Plataforma colaborativa desenhada para democratizar o acesso às manifestações culturais locais, conectar produtores independentes a espectadores e mapear desertos culturais na região.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
