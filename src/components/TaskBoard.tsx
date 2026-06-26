import { useState, KeyboardEvent, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Check, Trash2, Calendar, Star, AlertCircle, BookOpen, Clock, Ribbon, RefreshCw,
  Paperclip, FileText, Image, FileSpreadsheet, File, X, Download
} from 'lucide-react';
import { Task, TaskPriority } from '../types';

interface TaskBoardProps {
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

const POPULAR_SUBJECTS = [
  { name: 'Toán', icon: '📐', ticker: 'Nhạy bén tư duy logic', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Tiếng Việt', icon: '✍️', ticker: 'Nét chữ nết người', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Khoa học', icon: '🔬', ticker: 'Ươm mầm đam mê khám phá', color: 'bg-teal-50 text-teal-850 border-teal-200' },
  { name: 'Lịch sử và Địa lí', icon: '🌍', ticker: 'Hành trình tự hào non sông', color: 'bg-emerald-50 text-emerald-800 border-emerald-250' },
  { name: 'Tin học', icon: '💻', ticker: 'Làm chủ công nghệ số', color: 'bg-slate-100 text-slate-700 border-slate-250' },
  { name: 'Công nghệ', icon: '🛠️', ticker: 'Đôi tay khéo léo chế tạo', color: 'bg-amber-55 text-amber-850 border-amber-200' },
  { name: 'Đạo đức', icon: '🌸', ticker: 'Lời hay ý đẹp trăm điều ngoan', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Mĩ thuật', icon: '🎨', ticker: 'Sáng tạo ngập trạng sắc màu', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Âm nhạc', icon: '🎵', ticker: 'Giai điệu vui tươi yêu đời', color: 'bg-fuchsia-50 text-fuchsia-750 border-fuchsia-200' },
  { name: 'Giáo dục thể chất', icon: '⚽', ticker: 'Khỏe mạnh, bền bỉ mỗi ngày', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { name: 'Tiếng Anh', icon: '🇬🇧', ticker: 'Tự tin kết nối thế giới', color: 'bg-blue-50 text-blue-750 border-blue-200' },
];

export default function TaskBoard({
  tasks,
  role,
  onAddTask,
  onToggleComplete,
  onDeleteTask,
  onClearAll,
}: TaskBoardProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Mức 1');
  const [subject, setSubject] = useState('Toán');
  const [stars, setStars] = useState(1);
  const [timeLimitOption, setTimeLimitOption] = useState<'unlimited' | 'hours' | 'date'>('unlimited');
  const [timeLimitHours, setTimeLimitHours] = useState<number>(1);
  const [timeLimitDate, setTimeLimitDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [error, setError] = useState('');

  // Local Computer File Attachment States
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentData, setAttachmentData] = useState('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | 'spreadsheet' | 'file' | undefined>(undefined);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewImageName, setPreviewImageName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Count uncompleted and completed
  const uncompletedTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentName(file.name);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
      setAttachmentType('image');
    } else if (['doc', 'docx'].includes(ext || '')) {
      setAttachmentType('document');
    } else if (['xls', 'xlsx'].includes(ext || '')) {
      setAttachmentType('spreadsheet');
    } else {
      setAttachmentType('file');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachmentName('');
    setAttachmentData('');
    setAttachmentType(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddNewTask = () => {
    if (!title.trim()) {
      setError('Hãy nhập tên nhiệm vụ nhé!');
      return;
    }
    setError('');

    let finalTimeLimit = 'Không giới hạn';
    if (timeLimitOption === 'hours') {
      finalTimeLimit = `⏳ Trong vòng ${timeLimitHours} giờ`;
    } else if (timeLimitOption === 'date') {
      const parts = timeLimitDate.split('-');
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : timeLimitDate;
      finalTimeLimit = `📅 Ngày ${formattedDate}`;
    }

    onAddTask(
      title.trim(),
      priority,
      subject,
      stars,
      attachmentName || undefined,
      attachmentData || undefined,
      attachmentType,
      finalTimeLimit
    );
    setTitle('');
    // Reset defaults
    setPriority('Mức 1');
    setSubject('Toán');
    setStars(1);
    setTimeLimitOption('unlimited');
    setTimeLimitHours(1);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setTimeLimitDate(`${yyyy}-${mm}-${dd}`);
    setAttachmentName('');
    setAttachmentData('');
    setAttachmentType(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddNewTask();
    }
  };

  // Quick select icons
  const getSubjectIcon = (subName: string) => {
    const found = POPULAR_SUBJECTS.find((s) => s.name === subName);
    return found ? found.icon : '📌';
  };

  const getSubjectTicker = (subName: string) => {
    const found = POPULAR_SUBJECTS.find((s) => s.name === subName);
    return found ? found.ticker : 'Bài tập rèn luyện';
  };

  const getSubjectBadgeColor = (subName: string) => {
    const found = POPULAR_SUBJECTS.find((s) => s.name === subName);
    return found ? found.color : 'bg-slate-50 text-slate-650 border-slate-205';
  };

  const getPriorityStyle = (prio: TaskPriority) => {
    switch (prio) {
      case 'Mức 3':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Mức 2':
        return 'bg-amber-100 text-amber-750 border-amber-200';
      default:
        return 'bg-green-150 text-green-800 border-green-200';
    }
  };

  return (
    <div id="taskboard-container" className="space-y-8">
      {/* 1. Quick Add Section - ONLY visible if user is a teacher, else show friendly student banner */}
      {role === 'teacher' ? (
        <div 
          id="quick-add-section"
          className="bg-white p-6 rounded-3xl shadow-md border-2 border-sky-100 relative overflow-hidden animate-fade-in"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full opacity-60"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-sky-100 h-11 w-11 rounded-2xl flex items-center justify-center text-xl text-sky-500 shrink-0">
              ✨
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Bảng Thêm Nhiệm Vụ Mới (Giáo Viên)</h2>
              <p className="text-xs text-slate-400 font-bold">Hãy soạn đề mục bài tập và dặn dò, bấm thêm để giao cho học sinh.</p>
            </div>
          </div>

          {/* Form content */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end relative z-10">
            {/* Title */}
            <div className="md:col-span-12 lg:col-span-8">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">
                Nội dung bài tập được giao:
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  id="new-task-title-input"
                  placeholder="Ví dụ: Làm bài tập Toán trang 45, đọc truyện cổ tích 15 phút..."
                  className="w-full border-2 border-slate-200 focus:border-sky-400 focus:ring-0 rounded-2xl pl-4 pr-16 py-3.5 text-slate-700 bg-slate-50 font-semibold placeholder-slate-350 transition-all outline-hidden text-sm"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 bg-sky-500 hover:bg-sky-600 text-white px-2.5 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-0.5 cursor-pointer shadow-xs border-none"
                  title="Đính kèm tệp từ máy tính (ảnh, word, excel)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>TỆP</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                />
              </div>

              {/* Display chosen file preview element beneath */}
              {attachmentName && (
                <div className="mt-2 flex items-center justify-between bg-slate-100 border border-slate-200 py-1.5 px-3 rounded-xl text-xs font-bold text-slate-705 animate-fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm select-none">
                      {attachmentType === 'image' && '🖼️'}
                      {attachmentType === 'document' && '📝'}
                      {attachmentType === 'spreadsheet' && '📊'}
                      {attachmentType === 'file' && '📎'}
                    </span>
                    <span className="truncate text-slate-700 text-xs" title={attachmentName}>{attachmentName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-650 transition-colors shrink-0 cursor-pointer"
                    title="Hủy dính kèm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Due Date / Time Limit Selector (Defaults to Không giới hạn) */}
            <div className="md:col-span-12 lg:col-span-4">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>Gia hạn thời gian làm bài:</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={timeLimitOption}
                  onChange={(e) => setTimeLimitOption(e.target.value as 'unlimited' | 'hours' | 'date')}
                  id="task-time-limit-type-select"
                  className="w-full border-2 border-slate-200 focus:border-sky-400 focus:ring-0 rounded-2xl px-3 py-3.5 text-slate-700 bg-slate-50 font-extrabold text-xs outline-hidden cursor-pointer shadow-xs"
                >
                  <option value="unlimited">♾️ Không giới hạn</option>
                  <option value="hours">⏱️ Đặt số giờ (1h - 23h)</option>
                  <option value="date">📅 Đặt ngày cụ thể</option>
                </select>

                {timeLimitOption === 'unlimited' && (
                  <div className="flex items-center px-3 py-3 font-semibold text-[11px] text-slate-400 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 select-none justify-center">
                    <span>Làm đi làm lại ôn tập</span>
                  </div>
                )}

                {timeLimitOption === 'hours' && (
                  <select
                    value={timeLimitHours}
                    onChange={(e) => setTimeLimitHours(Number(e.target.value))}
                    id="task-time-limit-hours-select"
                    className="w-full border-2 border-slate-200 focus:border-sky-400 focus:ring-0 rounded-2xl px-3 py-3.5 text-slate-700 bg-slate-50 font-extrabold text-xs outline-hidden cursor-pointer animate-fade-in"
                  >
                    {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={h}>
                        Hạn: Trong {h} giờ tới
                      </option>
                    ))}
                  </select>
                )}

                {timeLimitOption === 'date' && (
                  <input
                    type="date"
                    value={timeLimitDate}
                    onChange={(e) => setTimeLimitDate(e.target.value)}
                    id="task-time-limit-date-input"
                    className="w-full border-2 border-slate-200 focus:border-sky-400 focus:ring-0 rounded-2xl px-3 py-3 text-slate-700 bg-slate-50 font-extrabold text-xs outline-hidden cursor-pointer animate-fade-in"
                  />
                )}
              </div>
            </div>

            {/* Subject Select */}
            <div className="md:col-span-4 lg:col-span-3">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">
                Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                id="task-subject-select"
                className="w-full border-2 border-slate-200 focus:border-sky-400 focus:ring-0 rounded-2xl px-3 py-3.5 text-slate-700 bg-slate-50 font-extrabold text-xs outline-hidden cursor-pointer"
              >
                {POPULAR_SUBJECTS.map((sub) => (
                  <option key={sub.name} value={sub.name}>
                    {sub.icon} {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Select */}
            <div className="md:col-span-4 lg:col-span-3">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">
                Mức độ
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as TaskPriority;
                  setPriority(val);
                  if (val === 'Mức 3') setStars(3);
                  else if (val === 'Mức 2') setStars(2);
                  else setStars(1);
                }}
                id="task-priority-select"
                className="w-full border-2 border-slate-200 focus:border-sky-400 focus:ring-0 rounded-2xl px-3 py-3.5 text-slate-700 bg-slate-50 font-extrabold text-xs outline-hidden cursor-pointer"
              >
                <option value="Mức 1">🟢 Mức 1</option>
                <option value="Mức 2">🟡 Mức 2</option>
                <option value="Mức 3">🔴 Mức 3</option>
              </select>
            </div>

            {/* Stars Select */}
            <div className="md:col-span-4 lg:col-span-3">
              <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">
                Sao Thưởng
              </label>
              <select
                value={stars}
                onChange={(e) => setStars(Number(e.target.value))}
                id="task-stars-select"
                className="w-full border-2 border-slate-200 focus:border-sky-400 focus:ring-0 rounded-2xl px-3 py-3.5 text-yellow-700 bg-slate-50 font-extrabold text-xs outline-hidden cursor-pointer"
              >
                <option value={1}>⭐ 1 Sao</option>
                <option value={2}>⭐ 2 Sao</option>
                <option value={3}>⭐ 3 Sao</option>
                <option value={5}>⭐ 5 Sao</option>
              </select>
            </div>

            {/* Add task button */}
            <div className="md:col-span-12 lg:col-span-3">
              <button
                onClick={handleAddNewTask}
                id="add-task-confirm-btn"
                className="w-full bg-sky-500 hover:bg-sky-600 px-4 py-3.5 rounded-2xl text-white font-black text-sm shadow-md transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer border-none"
              >
                <span>THÊM NHIỆM VỤ</span>
                <Plus className="w-5 h-5 shrink-0" />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-black mt-3" id="task-input-error">
              ⚠️ {error}
            </p>
          )}
        </div>
      ) : (
        <div 
          id="student-info-section"
          className="bg-white p-6 rounded-3xl shadow-sm border-2 border-emerald-100 relative overflow-hidden flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full opacity-65"></div>
          <div className="bg-emerald-100 h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 relative z-10">
            🎒
          </div>
          <div className="relative z-10 text-center sm:text-left">
            <h2 className="text-md sm:text-lg font-black text-slate-800 tracking-tight">Sổ Tay Nhiệm Vụ Học Tập Của Em</h2>
            <p className="text-xs text-slate-500 font-bold mt-1 leading-relaxed">
              Thầy cô đã thiết kế dặn dò bài tập dành riêng cho em ở phía dưới. Em hãy hoàn thành tốt nhiệm vụ tự học để tích lũy thật nhiều Sao Điểm thưởng lấp lánh nhé!
            </p>
          </div>
        </div>
      )}

      {/* 2. Bento Grid Columns Layout */}
      <div 
        id="task-columns-grid"
        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
      >
        {/* LEFT COLUMN: NHIỆM VỤ (Red/Rose bento wrapper) */}
        <div
          id="uncompleted-column"
          className="flex flex-col bg-red-500 rounded-[2.5rem] p-6 shadow-xl border-b-8 border-red-700 overflow-hidden"
        >
          {/* Bento Header */}
          <div className="flex items-center justify-between mb-6 px-2 select-none">
            <div className="flex items-center gap-3">
              <span className="text-4xl">📝</span>
              <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">
                Nhiệm vụ
              </h2>
            </div>
            <span className="bg-white/20 px-4 py-1.5 rounded-full text-white font-black text-lg border border-white/30">
              {String(uncompletedTasks.length).padStart(2, '0')}
            </span>
          </div>

          {/* Column inner container */}
          <div className="space-y-4 min-h-[300px]">
            {uncompletedTasks.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-center p-6 bg-white/10 rounded-2xl border-4 border-dashed border-white/20 text-white">
                <span className="text-4xl mb-2">🎉</span>
                <h3 className="font-black text-lg">Tuyệt vời ông mặt trời!</h3>
                <p className="text-xs text-red-100 mt-2 max-w-[220px]">
                  Em đã hoàn thành hết bài tập rồi. Hãy tự thưởng một ly nước mát nhé!
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {uncompletedTasks.map((task, idx) => (
                  <motion.div
                    key={task.id}
                    layoutId={task.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 50 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    id={`task-item-uncompleted-${task.id}`}
                    className="bg-white rounded-2xl p-5 shadow-md flex items-center justify-between gap-3 group/item transition-all hover:scale-[1.01] relative"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Check completing circular button */}
                      <button
                        onClick={() => onToggleComplete(task.id)}
                        id={`complete-btn-${task.id}`}
                        className="h-11 w-11 bg-slate-100 hover:bg-emerald-100 hover:scale-105 active:scale-95 border-2 border-slate-250 hover:border-emerald-400 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transition-all"
                        title="Đánh dấu hoàn thành!"
                      >
                        <Check className="w-5 h-5 text-emerald-500 opacity-20 group-hover/item:opacity-100 transition-opacity" />
                      </button>

                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-extrabold text-slate-800 text-md leading-snug break-words">
                          {task.title}
                        </span>
                        
                        {/* Tags Row */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
                          {task.subject && (
                            <>
                              <span className={`px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${getSubjectBadgeColor(task.subject)}`}>
                                <span>{getSubjectIcon(task.subject)}</span>
                                <span>{task.subject}</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 text-[10px] uppercase font-black tracking-wide">
                                ⚡ {getSubjectTicker(task.subject)}
                              </span>
                            </>
                          )}

                          {task.priority && (
                            <span className={`px-2 py-0.5 rounded-lg border ${getPriorityStyle(task.priority)}`}>
                              {task.priority}
                            </span>
                          )}

                          {task.rewardStars && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>+{task.rewardStars} Sao</span>
                            </span>
                          )}

                          {task.timeLimit && (
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-150 flex items-center gap-1 select-none">
                              <Clock className="w-3 h-3 text-indigo-500" />
                              <span>Hạn: {task.timeLimit}</span>
                            </span>
                          )}
                        </div>

                        {/* Attachments Row */}
                        {task.attachmentName && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2">
                            {task.attachmentType === 'image' && task.attachmentData ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewImageUrl(task.attachmentData || null);
                                  setPreviewImageName(task.attachmentName || '');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs"
                                title="Bấm để xem ảnh bài tập"
                              >
                                <span>🖼️</span>
                                <span className="truncate max-w-[140px]">{task.attachmentName}</span>
                                <span className="text-[10px] text-indigo-500 underline font-black shrink-0">(Xem hình)</span>
                              </button>
                            ) : (
                              <a
                                href={task.attachmentData || '#'}
                                download={task.attachmentName}
                                onClick={(e) => {
                                  if (!task.attachmentData) {
                                    e.preventDefault();
                                    alert(`Tập tin "${task.attachmentName}" đang được tải mẫu!`);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 hover:border-slate-350 text-slate-700 rounded-xl text-xs font-black transition-all shadow-2xs cursor-pointer text-decoration-none"
                                title="Bấm để tải tệp về máy tính"
                              >
                                <span>
                                  {task.attachmentType === 'document' ? '📝' : task.attachmentType === 'spreadsheet' ? '📊' : '📎'}
                                </span>
                                <span className="truncate max-w-[140px]">{task.attachmentName}</span>
                                <Download className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trash Button - only show if teacher */}
                    {role === 'teacher' && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        id={`delete-btn-${task.id}`}
                        className="text-slate-300 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Xóa khỏi danh sách"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: NHIỆM VỤ HOÀN THÀNH (Green/Emerald bento wrapper) */}
        <div
          id="completed-column"
          className="flex flex-col bg-green-500 rounded-[2.5rem] p-6 shadow-xl border-b-8 border-green-700 overflow-hidden"
        >
          {/* Bento Header */}
          <div className="flex items-center justify-between mb-6 px-2 select-none">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏆</span>
              <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">
                Hoàn thành
              </h2>
            </div>
            <span className="bg-white/20 px-4 py-1.5 rounded-full text-white font-black text-lg border border-white/30">
              {String(completedTasks.length).padStart(2, '0')}
            </span>
          </div>

          {/* Column inner container */}
          <div className="space-y-4 min-h-[300px]">
            {completedTasks.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-center p-6 bg-white/10 rounded-2xl border-4 border-dashed border-white/20 text-white">
                <span className="text-4xl mb-2">🌱</span>
                <h3 className="font-black text-lg">Chưa có nhiệm vụ hoàn thành</h3>
                <p className="text-xs text-green-150 mt-2 max-w-[220px]">
                  Bấm nút hoàn thành của nhiệm vụ để nhận sao điểm và lưu thành tích lấp lánh tại đây.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {completedTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layoutId={task.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, x: -50 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    id={`task-item-completed-${task.id}`}
                    className="bg-green-50/50 backdrop-blur-xs border-2 border-green-400 rounded-2xl p-5 flex items-center justify-between gap-3 group/item text-white"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Interactive circular checkbox for undoing completion */}
                      <button
                        onClick={() => onToggleComplete(task.id)}
                        id={`uncomplete-btn-${task.id}`}
                        className="h-10 w-10 bg-white hover:bg-rose-50 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all border-none"
                        title="Bấm để đưa về mục Cần làm"
                      >
                        <Check className="w-5 h-5 text-green-500 group-hover/item:hidden" />
                        <span className="hidden group-hover/item:inline text-xs font-black text-rose-500">↩</span>
                      </button>

                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-black text-green-950 line-through text-md break-words opacity-75">
                          {task.title}
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black">
                          {task.subject && (
                            <>
                              <span className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 ${getSubjectBadgeColor(task.subject).replace('text-indigo-750', 'text-green-950')}`}>
                                {getSubjectIcon(task.subject)} {task.subject}
                              </span>
                              <span className="px-1.5 py-0.5 roundedbg-emerald-950 bg-green-900/40 text-green-100 border border-green-400/40 text-[9px] uppercase font-black tracking-wider">
                                {getSubjectTicker(task.subject)}
                              </span>
                            </>
                          )}
                          <span className="text-green-950 bg-white/70 px-2 py-0.5 rounded-lg flex items-center gap-0.5 font-black border border-green-300">
                            🌟 Nhận +{task.rewardStars || 1} Sao!
                          </span>
                          <span className="text-white bg-emerald-700/80 px-2 py-0.5 rounded-lg flex items-center gap-1 font-black border border-emerald-500 shadow-2xs select-none">
                            ♾️ Ôn tập: Không giới hạn thời gian!
                          </span>
                        </div>

                        {/* Redo Practicing button for student revision */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            onClick={() => onToggleComplete(task.id)}
                            className="bg-white hover:bg-green-150 text-green-950 border-none px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 select-none shadow-xs active:scale-95"
                            title="Bấm để đưa bài tập này về mục Cần làm để ôn tập và làm lại nhiều lần!"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-green-700 animate-pulse" />
                            <span>🔄 LÀM LẠI ÔN TẬP</span>
                          </button>
                        </div>

                        {/* Attachments Row (Completed) */}
                        {task.attachmentName && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {task.attachmentType === 'image' && task.attachmentData ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewImageUrl(task.attachmentData || null);
                                  setPreviewImageName(task.attachmentName || '');
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/35 border border-white/30 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                                title="Bấm để xem lại ảnh"
                              >
                                <span>🖼️</span>
                                <span className="truncate max-w-[120px]">{task.attachmentName}</span>
                              </button>
                            ) : (
                              <a
                                href={task.attachmentData || '#'}
                                download={task.attachmentName}
                                onClick={(e) => {
                                  if (!task.attachmentData) {
                                    e.preventDefault();
                                    alert(`Tập tin "${task.attachmentName}" đang được tải mẫu!`);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/35 border border-white/30 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer text-decoration-none"
                                title="Bấm để tải tệp về"
                              >
                                <span>
                                  {task.attachmentType === 'document' ? '📝' : task.attachmentType === 'spreadsheet' ? '📊' : '📎'}
                                </span>
                                <span className="truncate max-w-[120px]">{task.attachmentName}</span>
                                <Download className="w-3 h-3 text-white/75 shrink-0" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trash button for permanent deletion of completed task - only show if teacher */}
                    {role === 'teacher' && (
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        id={`delete-btn-${task.id}`}
                        className="text-green-800 hover:text-red-500 p-2 rounded-xl hover:bg-white/20 transition-colors shrink-0 cursor-pointer"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* 3. Utility actions - only show if teacher */}
      {role === 'teacher' && tasks.length > 0 && (
        <div className="flex justify-end pt-2" id="taskboard-footer-clear-all-row">
          <button
            onClick={onClearAll}
            id="clear-all-button"
            className="flex items-center gap-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-black py-3 px-5 rounded-2xl border-2 border-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Reset tất cả nhiệm vụ học tập</span>
          </button>
        </div>
      )}

      {/* 4. Beautiful File/Image Attachment Modal Previewer */}
      <AnimatePresence>
        {previewImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewImageUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border-4 border-sky-400 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 p-2 rounded-2xl transition-all cursor-pointer border-none"
                title="Đóng bản xem trước"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 select-none pr-12">
                <span className="text-3xl">🖼️</span>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-md leading-tight truncate max-w-[240px] sm:max-w-md">
                    {previewImageName}
                  </h3>
                  <p className="text-[10px] text-sky-500 font-extrabold uppercase tracking-tight">Bài tập đính kèm từ thầy cô</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-2 flex items-center justify-center flex-1 max-h-[60vh] mb-5">
                <img
                  src={previewImageUrl}
                  alt={previewImageName}
                  className="max-w-full max-h-[50vh] object-contain rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3">
                <a
                  href={previewImageUrl}
                  download={previewImageName}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer inline-flex text-decoration-none"
                >
                  <Download className="w-4 h-4" />
                  <span>TẢI TẬP TIN XUỐNG</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer border-none"
                >
                  ĐÓNG LẠI
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
