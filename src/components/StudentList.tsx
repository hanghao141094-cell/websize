import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Trophy,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  ArrowLeft,
  Upload,
  User as UserIcon,
  Flag,
  File,
  X,
  FileCheck,
  Award,
  Camera,
  Calendar,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { ClassroomStudent, Task, TaskPriority } from '../types';
import TaskBoard from './TaskBoard';

interface StudentListProps {
  students: ClassroomStudent[];
  className: string;
  onGoBack: () => void;
  onUpdateStudentsList: (updated: ClassroomStudent[]) => void;
  
  // New props for integrated TaskBoard
  tasks: Task[];
  role: 'student' | 'teacher';
  onAddTask: (
    title: string,
    priority: TaskPriority,
    subject: string,
    stars: number,
    attachmentName?: string,
    attachmentData?: string,
    attachmentType?: 'image' | 'document' | 'spreadsheet' | 'file',
    timeLimit?: string
  ) => void;
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearAll: () => void;
}

export default function StudentList({
  students,
  className,
  onGoBack,
  onUpdateStudentsList,
  tasks,
  role,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onClearAll
}: StudentListProps) {
  // Tabs state: 'attendance' for general list/actions, 'leaderboard' for full tracking grid, 'tasks' for task board
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaderboard' | 'tasks'>('attendance');
  const [activeStudentForViolations, setActiveStudentForViolations] = useState<string | null>(null);
  
  // Ref map to trigger document/file uploads on computer
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  // Single ref for avatar uploads
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedStudentForAvatar, setSelectedStudentForAvatar] = useState<string | null>(null);

  const [taskCompletionStatus, setTaskCompletionStatus] = useState<Record<string, boolean>>(() => {
    // Default: some students have completed their assignments, some haven't
    const states: Record<string, boolean> = {};
    students.forEach((s, idx) => {
      states[s.id] = idx % 2 === 0; // Even index = completed
    });
    return states;
  });

  // 1. Attendance Toggles
  const isAllPresent = students.every((s) => s.isPresent);

  const handleToggleSelectAll = (checked: boolean) => {
    const updated = students.map((s) => ({
      ...s,
      isPresent: checked
    }));
    onUpdateStudentsList(updated);
  };

  const handleToggleStudentPresence = (studentId: string) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return { ...s, isPresent: !s.isPresent };
      }
      return s;
    });
    onUpdateStudentsList(updated);
  };

  // 2. Star & Flag Management
  const updateStudentStars = (studentId: string, amount: number) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        const newStars = Math.max(0, s.stars + amount);
        return {
          ...s,
          stars: newStars
        };
      }
      return s;
    });
    onUpdateStudentsList(updated);
  };

  const handleSetStudentStars = (studentId: string, exactStars: number) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          stars: Math.max(0, exactStars)
        };
      }
      return s;
    });
    onUpdateStudentsList(updated);
  };

  // Modify absent days
  const handleUpdateAbsentDays = (studentId: string, amount: number) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          absentDays: Math.max(0, s.absentDays + amount)
        };
      }
      return s;
    });
    onUpdateStudentsList(updated);
  };

  // 3. Violation Logging with direct Star modification
  const handleLogViolation = (
    studentId: string,
    violationType: 'talkative' | 'offTask' | 'badLanguage' | 'wrongUniform' | 'noHomework',
    action: 'add' | 'subtract'
  ) => {
    let starDiff = 5;
    if (violationType === 'badLanguage' || violationType === 'noHomework') {
      starDiff = 10;
    }

    const valueChange = action === 'add' ? 1 : -1;
    const starChange = action === 'add' ? -starDiff : +starDiff;

    const updated = students.map((s) => {
      if (s.id === studentId) {
        const newViolationCount = Math.max(0, (s.violations[violationType] || 0) + valueChange);
        const newStars = Math.max(0, s.stars + starChange);
        return {
          ...s,
          stars: newStars,
          violations: {
            ...s.violations,
            [violationType]: newViolationCount
          }
        };
      }
      return s;
    });
    onUpdateStudentsList(updated);
  };

  // 4. File uploads
  const handleTriggerFileInput = (studentId: string) => {
    const input = fileInputRefs.current[studentId];
    if (input) {
      input.click();
    }
  };

  const handleFileUpload = (
    studentId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    let computedType: 'image' | 'document' | 'spreadsheet' | 'file' = 'file';

    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(fileType || '')) {
      computedType = 'image';
    } else if (['doc', 'docx', 'pdf', 'txt', 'rtf'].includes(fileType || '')) {
      computedType = 'document';
    } else if (['xls', 'xlsx', 'csv'].includes(fileType || '')) {
      computedType = 'spreadsheet';
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = students.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            attachedFiles: [
              ...s.attachedFiles,
              {
                name: file.name,
                type: computedType,
                dataUrl
              }
            ]
          };
        }
        return s;
      });
      onUpdateStudentsList(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = (studentId: string, fileIndex: number) => {
    const updated = students.map((s) => {
      if (s.id === studentId) {
        const updatedFiles = [...s.attachedFiles];
        updatedFiles.splice(fileIndex, 1);
        return {
          ...s,
          attachedFiles: updatedFiles
        };
      }
      return s;
    });
    onUpdateStudentsList(updated);
  };

  // 5. Toggle individual completion
  const handleToggleTaskCompletion = (studentId: string) => {
    setTaskCompletionStatus((prev) => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Trigger Avatar selection
  const handleTriggerAvatarChange = (studentId: string) => {
    setSelectedStudentForAvatar(studentId);
    setTimeout(() => {
      avatarInputRef.current?.click();
    }, 50);
  };

  // Handle Avatar base64 load
  const handleAvatarFileLoaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudentForAvatar) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = students.map((s) => {
        if (s.id === selectedStudentForAvatar) {
          return {
            ...s,
            avatarUrl: dataUrl
          };
        }
        return s;
      });
      onUpdateStudentsList(updated);
      setSelectedStudentForAvatar(null);
    };
    reader.readAsDataURL(file);
  };

  const VIOLATION_METADATA = {
    talkative: { label: '🗣️ Nói chuyện (-5⭐)', penalty: 5, vText: 'Nói chuyện' },
    offTask: { label: '📱 Làm việc riêng (-5⭐)', penalty: 5, vText: 'Làm việc riêng' },
    badLanguage: { label: '🤬 Chửi tục (-10⭐)', penalty: 10, vText: 'Chửi tục' },
    wrongUniform: { label: '👚 Sai đồng phục (-5⭐)', penalty: 5, vText: 'Sai đồng phục' },
    noHomework: { label: '📝 Không làm bài (-10⭐)', penalty: 10, vText: 'Không làm bài' }
  };

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-md select-none animate-fade-in relative overflow-hidden" id="student-management-root">
      {/* Decorative ribbons */}
      <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>

      {/* Hidden input for Avatar change */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileLoaded}
        accept="image/*"
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between pb-6 mb-5 border-b-2 border-slate-100 gap-4" id="student-list-header-bar">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoBack}
            className="p-2.5 bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-700 rounded-xl transition-all cursor-pointer border-none shadow-xs active:scale-95"
            title="Quay lại bảng nhiệm vụ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600 animate-pulse" />
              <span>Sổ Điểm Danh & Thi đua Lớp {className} 🏫</span>
            </h2>
            <p className="text-xs text-slate-405 font-bold">
              Công cụ quản lý học sinh toàn diện: Ghi nhận chuyên cần, điểm sao, cờ thi đua và rèn nề nếp.
            </p>
          </div>
        </div>

        {/* Info Cards / Trackers */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-center">
            <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-wider">CÓ MẶT</span>
            <span className="text-xs font-black text-emerald-800">
              {students.filter((s) => s.isPresent).length} / {students.length} Bạn
            </span>
          </div>

          <div className="bg-rose-50 border border-rose-150 px-3 py-1.5 rounded-2xl text-center">
            <span className="block text-[8px] font-black text-rose-500 uppercase tracking-wider">VẮNG MẶT</span>
            <span className="text-xs font-black text-rose-800">
              {students.filter((s) => !s.isPresent).length} Bạn
            </span>
          </div>

          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl text-center">
            <span className="block text-[8px] font-black text-amber-600 uppercase tracking-wider">TỔNG SAO LỚP</span>
            <span className="text-xs font-black text-amber-800">
              {students.reduce((acc, s) => acc + s.stars, 0)} ⭐
            </span>
          </div>
        </div>
      </div>

      {/* TABS SELECTION INTERFACE: Điểm danh vs Bảng xếp hạng vs Quản lý nhiệm vụ */}
      <div className="flex border-b border-slate-200 mb-6" id="student-tab-controls">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 md:flex-initial py-3 px-6 text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 border-b-4 ${
            activeTab === 'attendance'
              ? 'border-indigo-600 text-indigo-950 bg-indigo-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>📋 ĐIỂM DANH & HÀNH VI</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 md:flex-initial py-3 px-6 text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 border-b-4 ${
            activeTab === 'leaderboard'
              ? 'border-emerald-500 text-emerald-950 bg-emerald-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <Trophy className="w-4 h-4 text-emerald-500" />
          <span>🏆 BẢNG XẾP HẠNG THI ĐUA 5/6</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 md:flex-initial py-3 px-6 text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-2 border-b-4 ${
            activeTab === 'tasks'
              ? 'border-violet-600 text-violet-950 bg-violet-50/50 rounded-t-2xl'
              : 'border-transparent text-slate-400 hover:text-violet-600 hover:bg-slate-50 rounded-t-xl'
          }`}
        >
          <BookOpen className="w-4 h-4 text-violet-600" />
          <span>📝 GIAO NHIỆM VỤ & HOÀN THÀNH</span>
        </button>
      </div>

      {/* TAB CONTENT 1: ATTENDANCE & BEHAVIOR GENERAL PANEL */}
      {activeTab === 'attendance' && (
        <div className="space-y-6" id="tab-attendance-view">
          {/* Attendance Selection Ribbon */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllPresent}
                onChange={(e) => handleToggleSelectAll(e.target.checked)}
                className="w-5 h-5 text-indigo-600 focus:ring-0 border-2 border-slate-350 rounded-md cursor-pointer transition-all"
              />
              <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                ✅ Đã hiện diện tất cả học sinh đang có mặt tại lớp 5/6
              </span>
            </label>
            <span className="text-xs text-indigo-500 font-bold">
              * Thầy Cô bấm trực tiếp vào Ảnh đại diện (Avatar) của học sinh để thay ảnh nhanh.
            </span>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto min-h-[300px]" id="attendance-table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-2 text-center w-12">Đ.Danh</th>
                  <th className="py-3 px-4">Học sinh (Nhấp ảnh để đổi)</th>
                  <th className="py-3 px-4">Sao & Cờ</th>
                  <th className="py-3 px-4 text-center">Hành vi phạm lỗi (Cộng / Trừ sao)</th>
                  <th className="py-3 px-4 text-right">Hồ sơ / File đính kèm (+)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => {
                  const studentFlags = Math.floor(st.stars / 50);
                  return (
                    <tr
                      key={st.id}
                      className={`transition-colors hover:bg-slate-50/70 group ${
                        !st.isPresent ? 'opacity-65 bg-slate-50/40' : ''
                      }`}
                    >
                      {/* 1. Point Attendance marker */}
                      <td className="py-4 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={st.isPresent}
                          onChange={() => handleToggleStudentPresence(st.id)}
                          className="w-4.5 h-4.5 text-indigo-600 focus:ring-0 border-2 border-slate-300 rounded-md cursor-pointer"
                          title={st.isPresent ? "Đang có mặt tại lớp" : "Đang vắng học"}
                        />
                      </td>

                      {/* 2. Avatar changing action + Name info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {/* Image Avatar change container */}
                          <div
                            onClick={() => handleTriggerAvatarChange(st.id)}
                            className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 cursor-pointer group/avatar border-2 border-slate-200 hover:border-indigo-400 transition-all shadow-sm flex items-center justify-center bg-slate-100"
                            title="Bấm để đổi ảnh đại diện học sinh này"
                          >
                            {st.avatarUrl ? (
                              <img
                                src={st.avatarUrl}
                                alt={st.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">
                                {st.name.charAt(0)}
                              </div>
                            )}

                            {/* Camera overlay indicator on hover */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="flex flex-col">
                            <span className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                              {st.name}
                              {!st.isPresent && (
                                <span className="text-[9px] bg-rose-100 text-rose-700 rounded-md px-1.5 py-0.5 font-bold uppercase border border-rose-200">
                                  Vắng
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              Lớp {st.className} • {st.isPresent ? '🟢 Đang có mặt' : '🔴 Vắng học'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Star adjust */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-yellow-200 justify-between">
                            <span className="text-xs font-bold flex items-center gap-1">
                              ⭐ 
                              <input
                                type="number"
                                min="0"
                                value={st.stars}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  handleSetStudentStars(st.id, isNaN(v) ? 0 : v);
                                }}
                                className="w-14 bg-white text-slate-850 font-black text-xs text-center border-2 border-amber-200 rounded px-1 py-0.5 focus:border-amber-400 focus:scale-105 transition-all outline-none"
                                title="Nhập số sao mong muốn trực tiếp"
                              />
                            </span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                onClick={() => updateStudentStars(st.id, -5)}
                                className="p-0.5 hover:bg-amber-200 rounded-md text-amber-600 cursor-pointer border-none bg-transparent"
                                title="Trừ 5 sao nhanh"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => updateStudentStars(st.id, 5)}
                                className="p-0.5 hover:bg-amber-200 rounded-md text-amber-600 cursor-pointer border-none bg-transparent"
                                title="Tặng 5 sao nhanh"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Flag display */}
                          <div
                            className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2 py-0.5"
                            title="Tự động tích lũy (50 sao = 1 cờ)"
                          >
                            <span>🚩 Cờ:</span>
                            <span className="text-slate-800 text-xs font-black">{studentFlags}</span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Violations lists with quick config */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-center gap-1.5 justify-center">
                          <div className="flex flex-wrap gap-1 justify-center max-w-[280px]">
                            {Object.entries(st.violations).some(([_, count]) => count > 0) ? (
                              Object.entries(st.violations)
                                .filter(([_, count]) => count > 0)
                                .map(([key, count]) => {
                                  return (
                                    <span
                                      key={key}
                                      className="text-[10px] bg-rose-50 text-rose-600 border border-rose-150 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1.5"
                                    >
                                      <span>{key === 'talkative' ? '🗣️ Nói chuyện' : key === 'offTask' ? '📱 Làm việc riêng' : key === 'badLanguage' ? '🤬 Nói bậy' : key === 'wrongUniform' ? '👚 Sai quy chế' : '📝 Thiếu bài'}</span>
                                      <span className="bg-rose-200 text-rose-800 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] font-black">{count}</span>
                                    </span>
                                  );
                                })
                            ) : (
                              <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-150 rounded-lg px-2.5 py-0.5">
                                😇 Chăm ngoan gương mẫu, chưa vi phạm lỗi nào!
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              setActiveStudentForViolations(
                                activeStudentForViolations === st.id ? null : st.id
                              )
                            }
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-805 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                          >
                            <span>{activeStudentForViolations === st.id ? '🔼 Thu gọn bộ sửa' : '⚙️ Đóng góp / Phạt / Sửa lỗi vi phạm'}</span>
                          </button>

                          {/* Quick Edit Violations Section */}
                          {activeStudentForViolations === st.id && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 shadow-2xs w-[320px] sm:w-[480px]">
                              {Object.entries(VIOLATION_METADATA).map(([key, meta]) => {
                                const count = st.violations[key as keyof typeof st.violations] || 0;
                                return (
                                  <div
                                    key={key}
                                    className="bg-white border border-slate-100 p-2 rounded-lg text-center flex flex-col justify-between gap-1"
                                  >
                                    <span className="text-[9px] font-black text-slate-600 block leading-tight">
                                      {meta.vText}
                                    </span>
                                    <div className="text-xs font-black text-rose-600 bg-rose-50 rounded py-0.5">
                                      Lỗi: {count}
                                    </div>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <button
                                        onClick={() => handleLogViolation(st.id, key as any, 'subtract')}
                                        className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[9px] font-extrabold flex-1 border-none cursor-pointer"
                                        title="Giảm 1 lỗi vi phạm"
                                      >
                                        - Khóa
                                      </button>
                                      <button
                                        onClick={() => handleLogViolation(st.id, key as any, 'add')}
                                        className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-md text-[9px] font-black flex-1 border-none cursor-pointer"
                                        title={`Phạt thêm lỗi này (Trừ ${meta.penalty} sao)`}
                                      >
                                        + Phạt
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Document & File management */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <button
                            onClick={() => handleTriggerFileInput(st.id)}
                            className="bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-xl text-indigo-600 border border-indigo-200 shadow-3xs cursor-pointer flex items-center justify-center transition-all duration-150 active:scale-95"
                            title="Tải tệp tin/sổ điểm từ máy tính"
                          >
                            <span className="text-[10px] font-black mr-1 uppercase">Đính file</span>
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="file"
                            ref={(el) => {
                              fileInputRefs.current[st.id] = el;
                            }}
                            onChange={(e) => handleFileUpload(st.id, e)}
                            accept=".jpg,.jpeg,.png,.gif,.doc,.docx,.pdf,.xls,.xlsx"
                            className="hidden"
                          />

                          {st.attachedFiles && st.attachedFiles.length > 0 && (
                            <div className="flex flex-col gap-1 items-end mt-1 max-w-[180px]">
                              {st.attachedFiles.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="bg-slate-100 border border-slate-200 rounded-lg p-1 px-1.5 text-slate-700 text-[10px] flex items-center gap-1"
                                >
                                  {file.type === 'image' && <ImageIcon className="w-3 h-3 text-emerald-500 shrink-0" />}
                                  {file.type === 'document' && <FileText className="w-3 h-3 text-blue-500 shrink-0" />}
                                  {file.type === 'spreadsheet' && <FileSpreadsheet className="w-3 h-3 text-teal-600 shrink-0" />}
                                  {file.type === 'file' && <File className="w-3 h-3 text-slate-500 shrink-0" />}
                                  <span className="truncate max-w-[80px] font-semibold">{file.name}</span>
                                  <button
                                    onClick={() => handleRemoveFile(st.id, idx)}
                                    className="text-slate-400 hover:text-rose-500 cursor-pointer border-none bg-transparent"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: COMPLETE LEADERBOARD/RANKS WITH FULL MEMBERS */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4" id="tab-leaderboard-view">
          <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <span className="text-xs font-black block uppercase tracking-wide">BẢNG VÀNG THI ĐUA CHẤT LƯỢNG LỚP {className}</span>
                <span className="text-[11px] font-bold text-emerald-700">
                  Thống kê toàn bộ thành viên lớp để phụ huynh & học sinh nắm bắt hành vi, ngày chuyên cần và bài tập.
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-extrabold rounded-lg px-2 py-1">
              Quy đổi: 50 Sao = 1 Cờ 🚩
            </span>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto min-h-[300px]" id="leaderboard-grid-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-3 text-center w-12">Hạng</th>
                  <th className="py-3 px-4">Tên học sinh (Nhấp để đổi ảnh)</th>
                  <th className="py-3 px-4 text-center">Điểm Sao ⭐</th>
                  <th className="py-3 px-4 text-center">Cờ thi đua 🚩</th>
                  <th className="py-3 px-4 text-center">Số Ngày Nghỉ 📅</th>
                  <th className="py-3 px-4">Tình Trạng Lỗi Vi Phạm tại Lớp ⚠️</th>
                  <th className="py-3 px-4 text-center">Nhiệm Vụ Giao Tuần 📋</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Sort student list by stars descending to show as a real leaderboard */}
                {[...students]
                  .sort((a, b) => b.stars - a.stars)
                  .map((st, idx) => {
                    const studentFlags = Math.floor(st.stars / 50);
                    const isCompleted = taskCompletionStatus[st.id] || false;
                    const trophyColor = idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300';
                    const hasActiveViolations = Object.values(st.violations).some((v) => (v || 0) > 0);

                    return (
                      <tr key={st.id} className="transition-colors hover:bg-slate-50/60 font-semibold text-slate-700">
                        {/* Rank indicator */}
                        <td className="py-4 px-3 text-center">
                          <div className="flex items-center justify-center">
                            {idx < 3 ? (
                              <div className="flex flex-col items-center">
                                <Trophy className={`w-5 h-5 ${trophyColor} animate-bounce`} />
                                <span className="text-[10px] font-black -mt-1">{idx + 1}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-extrabold"># {idx + 1}</span>
                            )}
                          </div>
                        </td>

                        {/* Student Name and Avatar */}
                        <td className="py-4 px-4 text-slate-900">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => handleTriggerAvatarChange(st.id)}
                              className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-slate-150 cursor-pointer group/leaderboard-avatar hover:border-emerald-400 transition-all shadow-3xs flex items-center justify-center bg-slate-100"
                              title="Bấm đổi ảnh đại diện trực tiếp"
                            >
                              {st.avatarUrl ? (
                                <img
                                  src={st.avatarUrl}
                                  alt={st.name}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                                  {st.name.charAt(0)}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/leaderboard-avatar:opacity-100 transition-all">
                                <Camera className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-extrabold text-sm">{st.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
                                Lớp {st.className}
                                {!st.isPresent && (
                                  <span className="text-[8px] bg-slate-200 text-slate-500 rounded px-1">Vắng mặt hôm nay</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Direct star editor */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-amber-50 rounded-lg border border-yellow-200 px-2 py-0.5 justify-center">
                            <span className="text-amber-500 text-xs text-center font-bold">⭐</span>
                            <input
                              type="number"
                              min="0"
                              value={st.stars}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                handleSetStudentStars(st.id, isNaN(v) ? 0 : v);
                              }}
                              className="w-12 bg-transparent text-slate-800 text-xs font-black text-center outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              title="Đánh số thay đổi nhanh điểm của học sinh"
                            />
                            {/* Fast adjust */}
                            <div className="flex flex-col gap-0.5 ml-1 select-none shrink-0 border-l border-amber-200 pl-1.5">
                              <button
                                onClick={() => updateStudentStars(st.id, 1)}
                                className="hover:bg-amber-200 hover:text-amber-800 rounded text-[10px] px-0.5 border-none bg-transparent cursor-pointer"
                                title="Cộng 1 sao"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => updateStudentStars(st.id, -1)}
                                className="hover:bg-amber-200 hover:text-amber-800 rounded text-[10px] px-0.5 border-none bg-transparent cursor-pointer"
                                title="Trừ 1 sao"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Display Flags */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-150 rounded-lg px-2.5 py-0.5 text-xs font-black text-rose-700 justify-center">
                            <span>🚩</span>
                            <span>{studentFlags} cờ</span>
                          </div>
                        </td>

                        {/* Absent Days column with quick modification buttons */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 justify-center">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs font-black text-slate-805" title="Chuyên cần: Số buổi vắng">
                              {st.absentDays || 0} nghỉ
                            </span>
                            <div className="flex items-center gap-0.5 ml-1 select-none shrink-0 border-l border-slate-200 pl-1">
                              <button
                                onClick={() => handleUpdateAbsentDays(st.id, -1)}
                                className="p-0.5 text-slate-500 hover:bg-slate-200 rounded cursor-pointer border-none bg-transparent"
                                title="Giảm 1 ngày nghỉ"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateAbsentDays(st.id, 1)}
                                className="p-0.5 text-slate-500 hover:bg-slate-200 rounded cursor-pointer border-none bg-transparent"
                                title="Tăng 1 ngày nghỉ"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Specific violation details next to student's nick */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5 max-w-[280px]">
                            {hasActiveViolations ? (
                              <div className="flex flex-wrap gap-1 leading-relaxed">
                                {st.violations.talkative > 0 && (
                                  <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold">
                                    🗣️ Nói chuyện ({st.violations.talkative})
                                  </span>
                                )}
                                {st.violations.offTask > 0 && (
                                  <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold">
                                    📱 Việc riêng ({st.violations.offTask})
                                  </span>
                                )}
                                {st.violations.badLanguage > 0 && (
                                  <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold">
                                    🤬 Nói bậy ({st.violations.badLanguage})
                                  </span>
                                )}
                                {st.violations.wrongUniform > 0 && (
                                  <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold">
                                    👚 Sai đồng phục ({st.violations.wrongUniform})
                                  </span>
                                )}
                                {st.violations.noHomework > 0 && (
                                  <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md font-bold">
                                    📝 Thiếu bài ({st.violations.noHomework})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] bg-emerald-50 border border-emerald-150 text-emerald-800 font-extrabold px-2 py-0.5 rounded-lg w-max" id="good-behavior-badge">
                                😇 Không vi phạm
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Uncompleted tasks column */}
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-col sm:flex-row">
                            {isCompleted ? (
                              <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md" id="homework-completed-badge">
                                Đã nộp bài ✔️
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-100 border border-rose-200 text-rose-800 font-extrabold px-2 py-0.5 rounded-md" id="homework-not-completed-badge">
                                Chưa nộp bài ❌
                              </span>
                            )}
                            {/* Fast switch toggle */}
                            <button
                              onClick={() => handleToggleTaskCompletion(st.id)}
                              className={`p-1 text-[9px] font-black rounded-lg cursor-pointer border-none transition-colors ${
                                isCompleted
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-3xs'
                              }`}
                              title={isCompleted ? 'Thu hồi bài nộp' : 'Đánh dấu nộp bài ngay lớp'}
                            >
                              {isCompleted ? 'Hủy' : 'Nộp hộ'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: INTEGRATED TASKBOARD */}
      {activeTab === 'tasks' && (
        <div id="tab-tasks-view" className="space-y-4">
          <div className="bg-violet-50 border border-violet-150 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-violet-900">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <span className="text-xs font-black block uppercase tracking-wide">QUẢN LÝ & GIAO NHIỆM VỤ CHO LỚP {className}</span>
                <span className="text-[11px] font-bold text-violet-700">
                  Thầy Cô có thể thêm các nhiệm vụ học tập, bài tập về nhà mới, quy định thời hạn và tải tài liệu mẫu đính kèm cho học sinh.
                </span>
              </div>
            </div>
          </div>
          
          <TaskBoard
            tasks={tasks}
            role={role}
            onAddTask={onAddTask}
            onToggleComplete={onToggleComplete}
            onDeleteTask={onDeleteTask}
            onClearAll={onClearAll}
          />
        </div>
      )}

      {/* FOOTER INFO TRASH */}
      <div className="mt-5 border-t border-slate-100 pt-4 flex flex-col md:flex-row items-center justify-between text-slate-400 text-[10px] font-bold">
        <span>🏫 Học đường thi đua thông minh lớp {className} • Google AI Studio</span>
        <span className="text-slate-350 italic">Hệ thống đồng bộ trực tiếp tới màn hình của Phụ huynh & Học sinh khi đăng nhập.</span>
      </div>
    </div>
  );
}
