import React, { useRef } from 'react';
import { Home, LogOut, Award, Star, Flag, Camera } from 'lucide-react';
import { Student, ClassroomStudent } from '../types';

interface HeaderProps {
  student: Student;
  onLogout: () => void;
  starsGained: number;
  currentView: 'dashboard' | 'student-list';
  onToggleView: () => void;
  classroomStudent?: ClassroomStudent;
  onUpdateAvatar?: (avatarUrl: string) => void;
}

export default function Header({
  student,
  onLogout,
  starsGained,
  currentView,
  onToggleView,
  classroomStudent,
  onUpdateAvatar
}: HeaderProps) {
  const flagsGained = Math.floor(starsGained / 50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine avatar from classroomStudent or current session
  const avatarUrlToUse = student.role === 'student' && classroomStudent 
    ? classroomStudent.avatarUrl 
    : student.avatarUrl;

  const violationList: string[] = [];
  if (classroomStudent && classroomStudent.violations) {
    if (classroomStudent.violations.talkative > 0) {
      violationList.push(`🗣️ Nói chuyện (${classroomStudent.violations.talkative} lần)`);
    }
    if (classroomStudent.violations.offTask > 0) {
      violationList.push(`📱 Làm việc riêng (${classroomStudent.violations.offTask} lần)`);
    }
    if (classroomStudent.violations.badLanguage > 0) {
      violationList.push(`🤬 Chửi tục (${classroomStudent.violations.badLanguage} lần)`);
    }
    if (classroomStudent.violations.wrongUniform > 0) {
      violationList.push(`👚 Sai đồng phục (${classroomStudent.violations.wrongUniform} lần)`);
    }
    if (classroomStudent.violations.noHomework > 0) {
      violationList.push(`📝 Không làm bài (${classroomStudent.violations.noHomework} lần)`);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (onUpdateAvatar) {
        onUpdateAvatar(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <header
      id="app-header-container"
      className="flex flex-col md:flex-row md:items-center bg-white rounded-3xl shadow-sm border-2 border-sky-100 p-5 mb-8 justify-between gap-6 select-none"
    >
      {/* Horizontally aligned left-side elements */}
      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1" id="header-student-profile-row">
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Home icon button with kid-friendly bubble styling - bg-sky-500 is used on Bento theme */}
          <div
            id="header-home-bubble"
            onClick={onToggleView}
            className={`${
              currentView === 'student-list'
                ? 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-250 scale-105'
                : 'bg-sky-500 hover:bg-sky-600'
            } p-3.5 rounded-2xl text-white shadow-md transition-all cursor-pointer shrink-0`}
            title={
              student.role === 'teacher'
                ? 'Bấm để quản lý danh sách học sinh Lớp 🏫'
                : 'Trang chủ góc học tập'
            }
          >
            <Home className="w-7 h-7" />
          </div>

          {/* New Avatar Section immediately before name with click-to-change feature */}
          <div className="relative group/header-avatar shrink-0 select-none">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 hover:border-sky-400 cursor-pointer shadow-sm relative flex items-center justify-center bg-sky-50 transition-all"
              title="Nhấp trực tiếp để tải/thay đổi ảnh đại diện"
            >
              {avatarUrlToUse ? (
                <img
                  src={avatarUrlToUse}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-sky-100 text-sky-700 font-extrabold text-lg flex items-center justify-center uppercase">
                  {student.name.charAt(0)}
                </div>
              )}
              {/* Overlay camera */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/header-avatar:opacity-100 transition-opacity">
                <Camera className="w-4.5 h-4.5 text-white" />
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Student or Teacher name and class with Bento Grid Typography */}
        <div className="flex flex-col flex-1 w-full sm:w-auto text-center sm:text-left mt-3 sm:mt-0">
          <span className="text-xs font-black text-sky-400 uppercase tracking-widest">
            {student.role === 'teacher' ? 'Bảng Điều Khiển Giáo Viên 🏫' : 'Góc Học Tập Nhắc Nhở 🎒'}
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight" id="header-student-name">
              {student.role === 'teacher' ? `Thầy/Cô ${student.name}` : student.name}
            </h1>
            <span 
              id="header-student-class"
              className={`px-4 py-1 rounded-full font-black text-xs md:text-sm border-2 inline-block shrink-0 ${
                student.role === 'teacher'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}
            >
              {student.role === 'teacher' ? `Lớp phụ trách: ${student.className}` : `Lớp: ${student.className}`}
            </span>
          </div>

          {/* Detailed Violation names displayed prominently next to or below their name */}
          {violationList.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2.5" id="header-violation-details">
              <span className="text-[10px] bg-rose-55 text-rose-600 font-extrabold border border-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wide">
                ⚠️ Nhắc nhở nề nếp từ Giáo viên:
              </span>
              {violationList.map((badge, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-rose-100 border border-rose-200 text-rose-800 font-black px-2 py-0.5 rounded-lg whitespace-nowrap"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reward stars, flags, and logout actions on the right */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3.5 w-full md:w-auto" id="header-right-actions">
        {/* Star collection for gamified encouragement */}
        <div
          id="header-star-counter"
          className="flex items-center gap-2 bg-amber-50 border-2 border-yellow-300 rounded-2xl px-4 py-2 text-yellow-700 font-extrabold text-sm shadow-xs pulse-soft"
        >
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span>
            Điểm sao: <span className="text-lg text-slate-800 font-black">{starsGained}</span> ⭐
          </span>
        </div>

        {/* Competition flags counter added next to student stars counter: every 50 stars = 1 flag */}
        <div
          id="header-flag-counter"
          className="flex items-center gap-2 bg-rose-50 border-2 border-rose-300 rounded-2xl px-4 py-2 text-rose-700 font-extrabold text-sm shadow-xs"
          title="Mỗi 50 điểm sao sẽ đổi được 1 Cờ thi đua"
        >
          <Flag className="w-5 h-5 text-rose-500 fill-rose-500 animate-bounce" />
          <span>
            Cờ thi đua: <span className="text-lg text-slate-800 font-black">{flagsGained}</span> 🚩
          </span>
        </div>

        {/* Logout/switch button with Bento style */}
        <button
          onClick={onLogout}
          id="header-logout-button"
          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-black py-2.5 px-4 rounded-xl border-2 border-rose-200 transition-all cursor-pointer shadow-xs hover:shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Thoát</span>
        </button>
      </div>
    </header>
  );
}
