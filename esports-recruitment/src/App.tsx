/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Flame } from 'lucide-react';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import GameView from './components/GameView';
import { ViewType, SessionInfo } from './types';

export default function App() {
  const [view, setView] = useState<ViewType>('login');
  const [session, setSession] = useState<SessionInfo>({
    isLoggedIn: false,
    user: null,
  });
  const [checkingSession, setCheckingSession] = useState(true);

  // States to persist registration credentials for convenient prefill
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);
  const [lastRegUser, setLastRegUser] = useState<string | null>(null);
  const [lastPlayerId, setLastPlayerId] = useState<string | null>(null);

  // Fetch active session on boot
  useEffect(() => {
    const checkActiveSession = async () => {
      const token = localStorage.getItem('esports_token');
      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch('/api/session', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (response.ok && data.isLoggedIn) {
          setSession({
            isLoggedIn: true,
            user: data.user,
          });
          setView('game');
        } else {
          localStorage.removeItem('esports_token');
        }
      } catch (err) {
        console.error('Session validation failed:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkActiveSession();
  }, []);

  const handleLoginSuccess = (token: string, user: any) => {
    setSession({
      isLoggedIn: true,
      user,
    });
    setView('game');
  };

  const handleRegisterSuccess = (username: string, player_id: string, message: string) => {
    setLastRegUser(username);
    setLastPlayerId(player_id);
    setRegSuccessMsg(message);
    setView('login');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('esports_token');
    if (token) {
      try {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}
    }
    localStorage.removeItem('esports_token');
    setSession({ isLoggedIn: false, user: null });
    setRegSuccessMsg(null);
    setView('login');
  };

  const handleScoreUpdatedOnClient = (newHighScore: number) => {
    if (session.user) {
      setSession((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, high_score: newHighScore } : null,
      }));
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#05070a] border-8 border-[#0d1117] flex flex-col items-center justify-center text-center p-6 text-gray-200">
        <div className="w-10 h-10 rounded-full border-4 border-[#00f0ff]/20 border-t-[#00f0ff] animate-spin mb-4"></div>
        <p className="text-xs font-mono uppercase tracking-widest text-[#00f0ff]">Authenticating Nexus Feed...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex flex-col justify-between font-sans selection:bg-[#00f0ff] selection:text-black border-4 md:border-8 border-[#0d1117] overflow-hidden">
      {/* Interactive top-lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent pointer-events-none"></div>

      {/* Global Header */}
      <header className="border-b border-[#1a2333] bg-[#0a0f18] h-16 px-6 sm:px-8 relative z-10 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 select-none">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff] to-[#7000ff] rounded-sm flex items-center justify-center rotate-45 shrink-0">
              <span className="-rotate-45 font-mono font-black text-black text-lg">N</span>
            </div>
            <span className="font-sans font-bold text-lg sm:text-xl tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#ffffff] ml-4">
              NEXUS ESPORTS TRYOUT
            </span>
          </div>

          <div className="flex items-center space-x-6 text-sm font-medium">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse"></div>
              <span className="text-[#00f0ff] font-mono text-xs tracking-wider uppercase hidden sm:inline-block">SYSTEM ACTIVE</span>
            </div>
            {session.isLoggedIn && session.user && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[9px] text-gray-500 font-mono">PLAYER_SESSION</span>
                <span className="text-[#7000ff] tracking-wider font-mono text-xs font-bold uppercase">{session.user.username}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Primary Display View Routing */}
      <main className="flex-grow flex items-center justify-center relative z-10">
        {view === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setView('register')}
            registrationSuccessMsg={regSuccessMsg}
            lastRegisteredUser={lastRegUser}
            lastPlayerId={lastPlayerId}
          />
        )}

        {view === 'register' && (
          <RegisterView
            onBackToLogin={() => setView('login')}
            onRegisterSuccess={handleRegisterSuccess}
          />
        )}

        {view === 'game' && session.user && (
          <GameView
            token={localStorage.getItem('esports_token') || ''}
            user={session.user}
            onLogout={handleLogout}
            onScoreUpdated={handleScoreUpdatedOnClient}
          />
        )}
      </main>

      {/* Global Footer */}
      <footer className="h-10 border-t border-[#1a2333] flex items-center justify-between px-6 sm:px-8 bg-[#05070a] text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase tracking-widest relative z-10">
        <span>ENCRYPTION: AES-256-BIT // SECURE FEED</span>
        <span>V.2.0.4 - STABLE // BUILT FOR NEXUS SYSTEMS</span>
      </footer>
    </div>
  );
}
