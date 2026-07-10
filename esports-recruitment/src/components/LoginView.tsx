import React, { useState } from 'react';
import { Shield, Sparkles, Trophy, UserCheck, Flame, Cpu } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigateToRegister: () => void;
  registrationSuccessMsg: string | null;
  lastRegisteredUser: string | null;
  lastPlayerId: string | null;
}

export default function LoginView({
  onLoginSuccess,
  onNavigateToRegister,
  registrationSuccessMsg,
  lastRegisteredUser,
  lastPlayerId,
}: LoginViewProps) {
  const [username, setUsername] = useState(lastRegisteredUser || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        localStorage.setItem('esports_token', data.token);
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col justify-center items-center py-10 px-4 md:px-8 bg-[#05070a]">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Side: Professional Esports Organization Branding & Tryout details */}
        <div className="lg:col-span-7 space-y-6 text-left" id="branding-panel">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-semibold text-xs tracking-widest uppercase font-mono">
            <Flame className="w-4 h-4 text-[#00f0ff] animate-pulse" />
            NEXUS WORLDWIDE TRYOUT 2026
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white font-sans">
            ก้าวเข้าสู่ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] via-white to-[#7000ff]">
              สังกัดระดับโลก
            </span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl">
            นี่คือระบบสมัครและคัดกรองนักกีฬาอีสปอร์ตอย่างเป็นทางการของ <strong className="text-[#00f0ff]">NEXUS ESPORTS</strong> สังกัดที่เพิ่งคว้าแชมป์โลกมาหมาดๆ เรากำลังตามล่าผู้เล่นที่มี **Chrono-Reaction Speed** ระดับแนวหน้ามาร่วมสังกัดหลัก!
          </p>

          {/* Core recruitment pillars / stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl pt-4">
            <div className="p-4 bg-[#0a0f18] rounded-lg border border-[#1a2333] border-l-4 border-l-[#00f0ff] flex items-start gap-3">
              <Cpu className="w-8 h-8 text-[#00f0ff] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white font-mono text-xs uppercase tracking-wider">AR HAND TRACKING</h4>
                <p className="text-xs text-gray-400 mt-1">ทดสอบความว่องไวของกล้ามเนื้อมือและสายตาแบบเรียลไทม์โดยใช้กล้องเว็บแคมของคุณ</p>
              </div>
            </div>

            <div className="p-4 bg-[#0a0f18] rounded-lg border border-[#1a2333] border-l-4 border-l-[#7000ff] flex items-start gap-3">
              <Trophy className="w-8 h-8 text-[#7000ff] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-white font-mono text-xs uppercase tracking-wider">GLOBAL CONTRACTS</h4>
                <p className="text-xs text-gray-400 mt-1">ผู้เล่นที่ผ่านการประเมินปฏิกิริยาและทำคะแนนได้เกณฑ์ดีเยี่ยมจะได้รับการสัญญาระดับอาชีพ</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-lg max-w-xl text-xs text-[#00f0ff] leading-relaxed flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-ping shrink-0"></span>
            <span>ขณะนี้ระเบียงสมัครเปิดใช้งานอย่างสมบูรณ์แล้ว โปรดล็อกอินเพื่อเข้าสแกนปฏิกิริยานิ้วมือ</span>
          </div>
        </div>

        {/* Right Side: Futuristic Dark Login Card */}
        <div className="lg:col-span-5" id="login-card">
          <div className="w-full bg-[#0a0f18] border border-[#1a2333] rounded-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            {/* Hologram lines background decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#7000ff]/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="mb-6 text-left">
              <h2 className="text-2xl font-bold text-white font-sans tracking-wide">เข้าสู่ระบบคัดตัว</h2>
              <p className="text-xs text-gray-400 mt-1">ป้อนข้อมูลประจำตัวของคุณเพื่อประเมินความเร็วการเคลื่อนไหว</p>
            </div>

            {/* Success message from registration redirect */}
            {registrationSuccessMsg && (
              <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-left space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <UserCheck className="w-4 h-4 shrink-0" />
                  <span>{registrationSuccessMsg}</span>
                </div>
                {lastRegisteredUser && (
                  <div className="bg-black/40 p-2.5 rounded-lg font-mono text-[11px] space-y-1 border border-emerald-500/10">
                    <div><span className="text-gray-500">Username:</span> <span className="text-[#00f0ff] font-bold">{lastRegisteredUser}</span></div>
                    {lastPlayerId && (
                      <div><span className="text-gray-500">Player ID:</span> <span className="text-[#7000ff] font-bold">{lastPlayerId}</span></div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error alerts */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left flex items-start gap-2">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-mono">
                  Username (ชื่อผู้ใช้)
                </label>
                <input
                  type="text"
                  required
                  placeholder="กรอกชื่อผู้ใช้งานที่ลงทะเบียน"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1a2333] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition duration-200 font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-mono">
                  Password (รหัสผ่าน)
                </label>
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1a2333] rounded-lg px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00f0ff] focus:ring-1 focus:ring-[#00f0ff] transition duration-200 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg font-mono font-black tracking-widest text-black uppercase text-xs cursor-pointer bg-[#00f0ff] hover:bg-[#00f0ff]/90 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all duration-300 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black animate-spin rounded-full"></div>
                ) : (
                  <>
                    <span>SIGN IN ACCESS</span>
                    <Sparkles className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </form>

            {/* Redirect / call to Register */}
            <div className="mt-8 pt-6 border-t border-[#1a2333] text-center">
              <p className="text-xs text-gray-500">ยังไม่ได้ลงทะเบียนสัญญานักกีฬากับเราใช่หรือไม่?</p>
              <button
                onClick={onNavigateToRegister}
                className="inline-block mt-3 px-5 py-2.5 border border-[#7000ff]/40 hover:bg-[#7000ff]/10 hover:border-[#7000ff] text-[#7000ff] text-xs font-bold font-mono rounded-lg transition duration-300 cursor-pointer"
              >
                ลงทะเบียนโปรเพลเยอร์ (REGISTER)
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
