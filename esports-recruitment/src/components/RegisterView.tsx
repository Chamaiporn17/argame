import React, { useState } from 'react';
import { ArrowLeft, User, Mail, ShieldAlert, Award } from 'lucide-react';

interface RegisterViewProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (username: string, player_id: string, successMsg: string) => void;
}

export default function RegisterView({ onBackToLogin, onRegisterSuccess }: RegisterViewProps) {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !email || !username || !password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, email, username, password }),
      });
      const data = await response.json();

      if (response.ok && data.status === 'success') {
        onRegisterSuccess(data.username, data.player_id, 'ลงทะเบียนสมัครเป็นนักกีฬาสำเร็จ! ได้รับรหัสประจำตัวโปรเพลเยอร์เรียบร้อย');
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน!');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex flex-col justify-center items-center py-10 px-4 md:px-8 bg-[#05070a]">
      <div className="max-w-md w-full">
        <div className="bg-[#0a0f18] border border-[#1a2333] rounded-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Neon accents */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-[#7000ff]/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#00f0ff]/5 rounded-full blur-2xl pointer-events-none"></div>

          {/* Header & Back Button */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={onBackToLogin}
              className="flex items-center gap-1.5 text-xs font-bold text-[#00f0ff] hover:text-[#00f0ff]/80 transition duration-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปเข้าสู่ระบบ
            </button>
            <span className="px-2.5 py-0.5 rounded-sm bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[10px] font-bold text-[#00f0ff] font-mono tracking-widest uppercase">
              REGISTER SECURE
            </span>
          </div>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white tracking-wide">สร้างบัญชีนักกีฬา</h2>
            <p className="text-xs text-gray-400 mt-1">กรอกข้อมูลให้ครบถ้วนเพื่อทำการจัดเก็บโปรไฟล์และคำนวณ Player ID</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-left flex items-start gap-2 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 font-mono">
                ชื่อ - นามสกุล (Full Name)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="สมศักดิ์ สปีดคีย์"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1a2333] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7000ff] focus:ring-1 focus:ring-[#7000ff] transition duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 font-mono">
                อีเมลผู้สมัคร (Email Address)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="pro_player@nexus.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#1a2333] rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7000ff] focus:ring-1 focus:ring-[#7000ff] transition duration-200"
                />
              </div>
            </div>

            <div className="border-t border-[#1a2333] my-4 pt-4"></div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-mono">
                Username (ชื่อล็อกอิน)
              </label>
              <input
                type="text"
                required
                placeholder="ภาษาอังกฤษหรือตัวเลขอย่างน้อย 4 ตัว"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#1a2333] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7000ff] focus:ring-1 focus:ring-[#7000ff] transition duration-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-mono">
                Password (รหัสผ่าน)
              </label>
              <input
                type="password"
                required
                placeholder="รหัสผ่านสำหรับเข้าใช้งานคัดตัว"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#1a2333] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#7000ff] focus:ring-1 focus:ring-[#7000ff] transition duration-200"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg font-mono font-black tracking-widest text-white uppercase text-xs cursor-pointer bg-[#7000ff] hover:bg-[#7000ff]/90 hover:shadow-[0_0_20px_rgba(112,0,255,0.4)] transition-all duration-300 flex justify-center items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full"></div>
                ) : (
                  <>
                    <span>REGISTER ATHLETE</span>
                    <Award className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500 font-sans">
            <span>มีบัญชีนักกีฬาอยู่แล้วหรือไม่? </span>
            <button
              onClick={onBackToLogin}
              className="text-[#00f0ff] font-bold hover:underline cursor-pointer"
            >
              เข้าสู่ระบบเลย
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
