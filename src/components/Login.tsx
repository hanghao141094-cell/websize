import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, User, BookOpen, Sparkles, Shield, UserCog } from 'lucide-react';
import { Student } from '../types';

interface LoginProps {
  onLogin: (student: Student) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(role === 'teacher' ? 'Hãy nhập tên của thầy/cô nhé!' : 'Hãy nhập tên của em nhé!');
      return;
    }
    if (!className.trim()) {
      setError(role === 'teacher' ? 'Hãy nhập lớp phụ trách nhé!' : 'Hãy nhập lớp của em nữa nhé!');
      return;
    }

    if (role === 'teacher') {
      const normalPass = passcode.trim().toLowerCase();
      // Allow '1234' or 'giaovien' or 'teacher' for easy grading and demo
      if (normalPass !== '1234' && normalPass !== 'giaovien' && normalPass !== 'teacher') {
        setError("Mã xác thực của Giáo viên chưa đúng (Hãy nhập thử '1234')");
        return;
      }
    }

    setError('');
    onLogin({
      name: name.trim(),
      className: className.trim(),
      role: role,
    });
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#E0F2FE] to-[#F0FDFA] flex items-center justify-center p-4">
      {/* Decorative background shapes */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full blur-2xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-300 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-1/4 left-1/4 w-24 h-24 bg-teal-200 rounded-full blur-2xl opacity-40"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border-4 border-amber-300 overflow-hidden relative"
        id="login-card-container"
      >
        {/* Playful ribbon under border */}
        <div className="h-4 bg-amber-300 w-full animate-pulse"></div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#FFF7ED] border-4 border-amber-400 rounded-2xl flex items-center justify-center shadow-md mb-3 transform -rotate-3 hover:rotate-3 transition-transform">
              <GraduationCap className="w-9 h-9 text-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 text-center tracking-tight flex items-center gap-1">
              Góc Học Tập Nhỏ <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </h1>
            <p className="text-slate-500 text-xs mt-1 text-center font-bold">
              Hệ thống quản lý bài tập & nhiệm vụ thông minh
            </p>
          </div>

          {/* Role Switching Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setRole('student');
                setError('');
              }}
              className={`py-2.5 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'student'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🎒 Học Sinh
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('teacher');
                setError('');
              }}
              className={`py-2.5 px-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                role === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-500'
              }`}
            >
              🏫 Giáo Viên
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
            {/* Context message based on role */}
            <div className="text-center bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs text-slate-500 font-bold leading-relaxed">
              {role === 'student' ? (
                <span>🙋 Em hãy đăng nhập để xem danh bạ nhiệm vụ và nhận Sao vàng điểm thưởng nhé!</span>
              ) : (
                <span className="text-indigo-600">👩‍🏫 Thầy cô đăng nhập để thiết kế thêm thử thách học tập mới!</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-650 mb-1.5 flex items-center gap-1.5">
                <User className={`w-4 h-4 ${role === 'teacher' ? 'text-indigo-500' : 'text-sky-500'}`} />
                {role === 'teacher' ? 'Họ và tên Thầy / Cô:' : 'Họ và tên của em:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  id="student-name-input"
                  placeholder={role === 'teacher' ? 'Ví dụ: Cô Hà Thị Hương' : 'Ví dụ: Nguyễn Văn A'}
                  className="w-full border-2 border-slate-200 focus:border-amber-400 focus:ring-0 rounded-2xl px-4 py-3 text-slate-700 bg-slate-50 font-bold placeholder-slate-300 transition-colors outline-hidden text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-650 mb-1.5 flex items-center gap-1.5">
                <BookOpen className={`w-4 h-4 ${role === 'teacher' ? 'text-indigo-500' : 'text-emerald-500'}`} />
                {role === 'teacher' ? 'Chọn lớp phụ trách:' : 'Lớp học của em:'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    if (error) setError('');
                  }}
                  id="student-class-input"
                  placeholder="Ví dụ: Lớp 3A, Lớp 5B"
                  className="w-full border-2 border-slate-200 focus:border-amber-400 focus:ring-0 rounded-2xl px-4 py-3 text-slate-700 bg-slate-50 font-bold placeholder-slate-300 transition-colors outline-hidden text-sm"
                />
              </div>
            </div>

            {role === 'teacher' && (
              <div>
                <label className="block text-xs font-black text-slate-650 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-500" />
                  Mã xác thực Thầy / Cô:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (error) setError('');
                    }}
                    id="teacher-passcode-input"
                    placeholder="Nhập: 1234"
                    className="w-full border-2 border-slate-200 focus:border-amber-400 focus:ring-0 rounded-2xl px-4 py-3 text-slate-750 bg-slate-50 font-bold placeholder-slate-400 transition-colors outline-hidden text-sm"
                  />
                  <span className="text-[10px] text-amber-600 block mt-1 font-bold">
                    💡 Hãy dùng mã mật khẩu dùng thử: <strong className="underline">1234</strong> nhé!
                  </span>
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 text-rose-600 text-xs font-black px-4 py-2.5 rounded-2xl border border-rose-200 flex items-center gap-2"
                id="login-error-message"
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}

            <button
              type="submit"
              id="login-submit-button"
              className={`w-full hover:scale-[1.01] active:transform active:scale-[0.98] text-white font-black text-md py-3.5 px-6 rounded-2xl shadow-md border-b-4 transform transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 border-none ${
                role === 'teacher' 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {role === 'teacher' ? 'Đăng nhập Giáo Viên 🏫' : 'Vào học thôi! 🚀'}
            </button>
          </form>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center text-xs text-slate-400 font-bold gap-1 select-none">
          <span>🎯 Hãy chọn đúng vai trò để tiếp tục!</span>
        </div>
      </motion.div>
    </div>
  );
}
