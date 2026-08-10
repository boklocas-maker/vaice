import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LoginModalProps {
  userProfile: UserProfile;
  reason?: string | null;
  onLoginSuccess: (name: string, email: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  userProfile,
  reason,
  onLoginSuccess,
  onLogout,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const displayName = name.trim() || (email.split('@')[0]) || 'Usuário Cultural';
      onLoginSuccess(displayName, email);
    }
  };

  const handleQuickGuestLogin = () => {
    onLoginSuccess('Visitante Cultural', 'visitante@mapacultural.local');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1016] border border-zinc-800 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl animate-scaleIn relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 relative z-10">
          <div className="flex items-center gap-2 text-white font-extrabold text-base">
            <span>{userProfile.isLoggedIn ? 'Minha Conta' : 'Identificação / Login'}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Reason Banner */}
        {reason && !userProfile.isLoggedIn && (
          <div className="bg-zinc-900 border border-zinc-700/80 p-3.5 rounded-2xl text-xs text-zinc-300">
            <p className="leading-relaxed font-medium">{reason}</p>
          </div>
        )}

        {userProfile.isLoggedIn ? (
          <div className="space-y-4 text-center py-2 relative z-10">
            <div className="w-16 h-16 rounded-full bg-zinc-800 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl border-2 border-zinc-600">
              {userProfile.name[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center justify-center text-base font-bold text-white">
                <span>{userProfile.name}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{userProfile.email}</p>
            </div>

            <div className="bg-[#181a24] p-3 rounded-2xl border border-zinc-800 text-xs text-zinc-300 flex justify-around text-center font-medium">
              <div>
                <span className="block text-base font-bold text-white">{userProfile.savedEventIds.length}</span>
                <span className="text-[11px] text-zinc-400">Salvos</span>
              </div>
              <div className="w-[1px] bg-zinc-800" />
              <div>
                <span className="block text-base font-bold text-white">Ativo</span>
                <span className="text-[11px] text-zinc-400">Status</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
              >
                Sair da Conta
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            {/* Mode Tabs */}
            <div className="grid grid-cols-2 bg-[#181a24] p-1 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-zinc-800 text-white shadow' : 'hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`py-2 rounded-lg transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-zinc-800 text-white shadow' : 'hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {mode === 'register' && (
                <div className="space-y-1">
                  <label className="font-semibold text-zinc-300">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-zinc-300">Seu E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full bg-[#181a24] text-white p-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-lg cursor-pointer transition-colors"
              >
                {mode === 'login' ? 'Entrar na Conta' : 'Criar minha conta'}
              </button>
            </form>

            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <span className="relative bg-[#0f1016] px-2 text-[10px] uppercase font-bold text-zinc-500">
                Ou acesse rápido
              </span>
            </div>

            <button
              type="button"
              onClick={handleQuickGuestLogin}
              className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold cursor-pointer transition-colors"
            >
              Entrar como Convidado
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

