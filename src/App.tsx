import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, BookOpen, Star, AlertCircle } from 'lucide-react';
import { Student, Task, TaskPriority, ClassroomStudent } from './types';
import Login from './components/Login';
import Header from './components/Header';
import TaskBoard from './components/TaskBoard';
import StudentList from './components/StudentList';

const DEFAULT_CLASSROOM_STUDENTS: ClassroomStudent[] = [
  {
    id: 'st-1',
    name: 'Nguyễn Văn An',
    className: '5/6',
    isPresent: true,
    stars: 120,
    absentDays: 2,
    violations: { talkative: 0, offTask: 0, badLanguage: 0, wrongUniform: 0, noHomework: 0 },
    attachedFiles: []
  },
  {
    id: 'st-2',
    name: 'Trần Thị Bình',
    className: '5/6',
    isPresent: true,
    stars: 45,
    absentDays: 0,
    violations: { talkative: 1, offTask: 0, badLanguage: 0, wrongUniform: 0, noHomework: 0 },
    attachedFiles: []
  },
  {
    id: 'st-3',
    name: 'Phạm Quốc Cường',
    className: '5/6',
    isPresent: true,
    stars: 75,
    absentDays: 4,
    violations: { talkative: 0, offTask: 0, badLanguage: 0, wrongUniform: 0, noHomework: 0 },
    attachedFiles: []
  },
  {
    id: 'st-4',
    name: 'Lê Thu Thảo',
    className: '5/6',
    isPresent: true,
    stars: 95,
    absentDays: 1,
    violations: { talkative: 0, offTask: 0, badLanguage: 0, wrongUniform: 0, noHomework: 0 },
    attachedFiles: []
  },
  {
    id: 'st-5',
    name: 'Hoàng Minh Đức',
    className: '5/6',
    isPresent: false,
    stars: 10,
    absentDays: 5,
    violations: { talkative: 0, offTask: 1, badLanguage: 0, wrongUniform: 0, noHomework: 0 },
    attachedFiles: []
  },
  {
    id: 'st-6',
    name: 'Đặng Khánh Linh',
    className: '5/6',
    isPresent: true,
    stars: 150,
    absentDays: 0,
    violations: { talkative: 0, offTask: 0, badLanguage: 0, wrongUniform: 0, noHomework: 0 },
    attachedFiles: []
  },
  {
    id: 'st-7',
    name: 'Vũ Hoàng Nam',
    className: '5/6',
    isPresent: true,
    stars: 30,
    absentDays: 3,
    violations: { talkative: 0, offTask: 0, badLanguage: 0, wrongUniform: 1, noHomework: 0 },
    attachedFiles: []
  },
  {
    id: 'st-8',
    name: 'Mai Thùy Dung',
    className: '5/6',
    isPresent: true,
    stars: 85,
    absentDays: 1,
    violations: { talkative: 0, offTask: 0, badLanguage: 0, wrongUniform: 0, noHomework: 0 },
    attachedFiles: []
  }
];

const DEFAULT_INITIAL_TASKS: Task[] = [
  {
    id: 'default-1',
    title: 'Làm bài tập ôn Toán trang 12 (phép nhân phép chia)',
    completed: false,
    createdAt: new Date().toISOString(),
    priority: 'Mức 2',
    subject: 'Toán',
    rewardStars: 2,
    timeLimit: 'Không giới hạn',
  },
  {
    id: 'default-2',
    title: 'Đọc truyện ngắn tiếng Việt hoặc truyện cổ tích 15 phút',
    completed: false,
    createdAt: new Date().toISOString(),
    priority: 'Mức 1',
    subject: 'Tiếng Việt',
    rewardStars: 1,
    timeLimit: 'Không giới hạn',
  },
  {
    id: 'default-3',
    title: 'Học 5 từ vựng tiếng Anh chủ đề học tập trường lớp',
    completed: false,
    createdAt: new Date().toISOString(),
    priority: 'Mức 3',
    subject: 'Tiếng Anh',
    rewardStars: 3,
    timeLimit: 'Không giới hạn',
  },
  {
    id: 'default-4',
    title: 'Vẽ tranh sắc màu ước mơ của em bằng sáp màu',
    completed: true,
    createdAt: new Date().toISOString(),
    priority: 'Mức 1',
    subject: 'Mĩ thuật',
    rewardStars: 1,
    timeLimit: 'Không giới hạn',
  },
];

export default function App() {
  const [student, setStudent] = useState<Student | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [view, setView] = useState<'dashboard' | 'student-list'>('dashboard');
  const [studentsList, setStudentsList] = useState<ClassroomStudent[]>([]);

  // 1. Initial State Loading from LocalStorage safely
  useEffect(() => {
    const savedStudent = localStorage.getItem('school_student_profile');
    const savedTasks = localStorage.getItem('school_student_tasks');
    const savedClassroomStudents = localStorage.getItem('school_classroom_students');

    if (savedStudent) {
      setStudent(JSON.parse(savedStudent));
    }
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(DEFAULT_INITIAL_TASKS);
      localStorage.setItem('school_student_tasks', JSON.stringify(DEFAULT_INITIAL_TASKS));
    }

    if (savedClassroomStudents) {
      setStudentsList(JSON.parse(savedClassroomStudents));
    } else {
      setStudentsList(DEFAULT_CLASSROOM_STUDENTS);
      localStorage.setItem('school_classroom_students', JSON.stringify(DEFAULT_CLASSROOM_STUDENTS));
    }
  }, []);

  const handleUpdateStudentsList = (updated: ClassroomStudent[]) => {
    setStudentsList(updated);
    localStorage.setItem('school_classroom_students', JSON.stringify(updated));
  };

  // 2. Setup initial sample tasks for a new student if none exist
  const handleLogin = (newStudent: Student) => {
    setStudent(newStudent);
    localStorage.setItem('school_student_profile', JSON.stringify(newStudent));

    // Reset view position on login
    setView('dashboard');

    // Load current master tasks list from local storage, keeping what the teacher or others have updated
    const savedTasks = localStorage.getItem('school_student_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks(DEFAULT_INITIAL_TASKS);
      localStorage.setItem('school_student_tasks', JSON.stringify(DEFAULT_INITIAL_TASKS));
    }

    // Ensure we load/set the student list as well
    const savedClassroomStudents = localStorage.getItem('school_classroom_students');
    if (savedClassroomStudents) {
      setStudentsList(JSON.parse(savedClassroomStudents));
    } else {
      setStudentsList(DEFAULT_CLASSROOM_STUDENTS);
      localStorage.setItem('school_classroom_students', JSON.stringify(DEFAULT_CLASSROOM_STUDENTS));
    }
  };

  const handleLogout = () => {
    setStudent(null);
    setView('dashboard');
    // Do NOT clear or remove the tasks list! Keep it preserved in memory and localStorage so it syncs between Teacher and Student logins
    localStorage.removeItem('school_student_profile');
  };

  const handleUpdateAvatar = (avatarUrl: string) => {
    if (student) {
      const updatedStudent = { ...student, avatarUrl };
      setStudent(updatedStudent);
      localStorage.setItem('school_student_profile', JSON.stringify(updatedStudent));

      // Đồng bộ cập nhật ảnh đại diện vào danh sách lớp học
      const updatedList = studentsList.map((s) => {
        if (s.name.toLowerCase() === student.name.toLowerCase()) {
          return { ...s, avatarUrl };
        }
        return s;
      });
      setStudentsList(updatedList);
      localStorage.setItem('school_classroom_students', JSON.stringify(updatedList));
    }
  };

  const handleAddTask = (
    title: string,
    priority: TaskPriority,
    subject: string,
    stars: number,
    attachmentName?: string,
    attachmentData?: string,
    attachmentType?: 'image' | 'document' | 'spreadsheet' | 'file',
    timeLimit?: string
  ) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      priority,
      subject,
      rewardStars: stars,
      attachmentName,
      attachmentData,
      attachmentType,
      timeLimit: timeLimit || 'Không giới hạn',
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    localStorage.setItem('school_student_tasks', JSON.stringify(updatedTasks));
  };

  const handleToggleComplete = (id: string) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === id) {
        const nextCompletedState = !task.completed;
        
        // Show celebration effect when a task gets completed
        if (nextCompletedState) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
        
        return { ...task, completed: nextCompletedState };
      }
      return task;
    });

    setTasks(updatedTasks);
    localStorage.setItem('school_student_tasks', JSON.stringify(updatedTasks));
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    localStorage.setItem('school_student_tasks', JSON.stringify(updatedTasks));
  };

  const handleClearAll = () => {
    const confirmClear = window.confirm('Em có chắc chắn muốn xóa tất cả nhiệm vụ học tập này không?');
    if (confirmClear) {
      setTasks([]);
      localStorage.setItem('school_student_tasks', JSON.stringify([]));
    }
  };

  // Determine earned stats
  const totalCompletedCount = tasks.filter((t) => t.completed).length;
  const uncompletedCount = tasks.filter((t) => !t.completed).length;
  const totalCount = tasks.length;

  // Compute starsGained dynamically: if Student, use their classroom record; if Teacher, show total sum
  let starsGained = 0;
  if (student) {
    if (student.role === 'student') {
      const matchS = studentsList.find((s) => s.name.toLowerCase() === student.name.toLowerCase());
      if (matchS) {
        starsGained = matchS.stars;
      } else {
        starsGained = tasks
          .filter((t) => t.completed)
          .reduce((acc, t) => acc + (t.rewardStars || 1), 0);
      }
    } else {
      starsGained = studentsList.reduce((acc, s) => acc + s.stars, 0);
    }
  }

  const handleToggleView = () => {
    if (student && student.role === 'teacher') {
      setView((prev) => (prev === 'dashboard' ? 'student-list' : 'dashboard'));
    }
  };

  // If not logged in, trigger login screen
  if (!student) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-sky-50 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Playful top banner decoration */}
        <div className="bg-amber-100 border-2 border-amber-300 text-amber-800 rounded-3xl p-3 px-4 flex items-center justify-between text-xs sm:text-sm font-bold gap-2 shadow-2xs select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>Ồ tuyệt vời! Hãy hoàn thành bài tập để nhận thêm thật nhiều Sao điểm thưởng nhé! 🌟</span>
          </div>
          <span className="hidden md:inline-block bg-amber-400 text-slate-800 px-2 py-0.5 rounded-md">Chăm ngoan học tốt</span>
        </div>

        {/* 1. Playful Bento Header */}
        <Header 
          student={student} 
          onLogout={handleLogout} 
          starsGained={starsGained} 
          currentView={view}
          onToggleView={handleToggleView}
          classroomStudent={studentsList.find((s) => s.name.toLowerCase() === student.name.toLowerCase())}
          onUpdateAvatar={handleUpdateAvatar}
        />

        {/* 2. Interactive Celebration Toast */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              className="bg-emerald-500 text-white rounded-2xl p-4 shadow-lg border-2 border-emerald-300 flex items-center justify-between gap-4 max-w-md mx-auto relative z-50 select-none"
              id="celebrative-badge"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce text-xl shrink-0">
                  🎉
                </div>
                <div>
                  <h4 className="font-extrabold text-sm md:text-base">Mũi tên chiến thắng!</h4>
                  <p className="text-xs text-emerald-100 font-semibold">Tích tắc, em đã tích lũy thêm sao vàng!</p>
                </div>
              </div>
              <Trophy className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Task Dashboard / Student List Component View */}
        {student.role === 'teacher' ? (
          view === 'student-list' ? (
            <StudentList
              students={studentsList}
              className={student.className}
              onGoBack={() => setView('dashboard')}
              onUpdateStudentsList={handleUpdateStudentsList}
              tasks={tasks}
              role={student.role}
              onAddTask={handleAddTask}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onClearAll={handleClearAll}
            />
          ) : (
            /* Teacher Home Portal: display Teacher name, Stars, Emulation flag, Logout button and entryway button */
            <div id="teacher-home-portal" className="py-8 select-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-2 border-indigo-100 rounded-3xl p-8 md:p-12 shadow-md text-center max-w-xl mx-auto space-y-6"
              >
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-sm border border-indigo-100 animate-bounce">
                  🏫
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Khu Vực Quản Lý Lớp Học {student.className}</h2>
                  <p className="text-sm text-slate-500 font-bold leading-relaxed">
                    Chào mừng Thầy/Cô {student.name}! Từ đây, Thầy Cô có thể kiểm tra sỉ số chuyên cần, điểm thưởng nề nếp thi đua lớp học và quản lý danh sách giao nhiệm vụ tuần mới.
                  </p>
                </div>
                <button
                  onClick={() => setView('student-list')}
                  className="w-full bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer text-sm"
                >
                  <span>MỞ SỔ ĐIỂM DANH & QUẢN LÝ LỚP HỌC 📋</span>
                </button>
              </motion.div>
            </div>
          )
        ) : (
          <div id="app-main-desktop-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Main dashboard list (9 columns) */}
            <main className="lg:col-span-9" id="main-content-flow">
              <TaskBoard
                tasks={tasks}
                role={student.role}
                onAddTask={handleAddTask}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
                onClearAll={handleClearAll}
              />
            </main>

            {/* Sider Stats Module (3 columns) */}
            <aside className="lg:col-span-3 space-y-4" id="sidebar-stats-module">
              {/* Gamification Progress Card */}
              <div className="bg-white border-2 border-sky-100 rounded-3xl p-5 shadow-sm text-center select-none">
                <h3 className="font-extrabold text-slate-700 text-sm mb-3 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" /> Tiến độ hôm nay
                </h3>
                
                {/* Dynamic state meters */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-slate-100"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-emerald-400 transition-all duration-500"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={301.6}
                      strokeDashoffset={
                        totalCount > 0 
                          ? 301.6 - (301.6 * totalCompletedCount) / totalCount 
                          : 301.6
                      }
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-800" id="stats-complete-pct">
                      {totalCount > 0 ? Math.round((totalCompletedCount / totalCount) * 100) : 0}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hoàn thành</span>
                  </div>
                </div>

                {/* Counts details */}
                <div className="space-y-2.5 text-xs text-left font-bold text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Tổng nhiệm vụ:</span>
                    <span className="text-slate-800 font-black text-sm">{totalCount}</span>
                  </div>
                  <div className="flex justify-between text-rose-500 animate-pulse">
                    <span>Cần làm:</span>
                    <span className="font-black text-sm">{uncompletedCount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Đã xong:</span>
                    <span className="font-black text-sm">{totalCompletedCount}</span>
                  </div>
                </div>
              </div>

              {/* Parent & Student Action/Behavior Log */}
              {student?.role === 'student' && (() => {
                const matchedStudent = studentsList.find((s) => s.name.toLowerCase() === student.name.toLowerCase());
                if (!matchedStudent) return null;
                const hasViolations = 
                  (matchedStudent.violations.talkative || 0) > 0 ||
                  (matchedStudent.violations.offTask || 0) > 0 ||
                  (matchedStudent.violations.badLanguage || 0) > 0 ||
                  (matchedStudent.violations.wrongUniform || 0) > 0 ||
                  (matchedStudent.violations.noHomework || 0) > 0;
                return (
                  <div className="bg-white border-2 border-rose-100 rounded-3xl p-5 shadow-sm select-none" id="student-behavior-card">
                    <h3 className="font-extrabold text-slate-800 text-sm mb-3 uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 fill-rose-100 animate-pulse" />
                      <span>Sổ Nề Nếp & Hành Vi 📋</span>
                    </h3>
                    
                    {hasViolations ? (
                      <div className="space-y-2.5">
                        <p className="text-[10px] text-rose-600 font-bold text-center leading-relaxed">
                          ⚠️ Chi tiết nhắc nhở nề nếp thi đua từ Thầy / Cô:
                        </p>
                        <div className="space-y-1.5">
                          {matchedStudent.violations.talkative > 0 && (
                            <div className="flex justify-between items-center bg-rose-50 border border-rose-150 p-2 rounded-xl text-xs text-rose-700 font-extrabold">
                              <span>🗣️ Nói chuyện trong lớp</span>
                              <span className="bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-lg text-[10px]">
                                {matchedStudent.violations.talkative} lần
                              </span>
                            </div>
                          )}
                          {matchedStudent.violations.offTask > 0 && (
                            <div className="flex justify-between items-center bg-rose-50 border border-rose-150 p-2 rounded-xl text-xs text-rose-700 font-extrabold">
                              <span>📱 Làm việc riêng trong giờ</span>
                              <span className="bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-lg text-[10px]">
                                {matchedStudent.violations.offTask} lần
                              </span>
                            </div>
                          )}
                          {matchedStudent.violations.badLanguage > 0 && (
                            <div className="flex justify-between items-center bg-rose-50 border border-rose-150 p-2 rounded-xl text-xs text-rose-700 font-extrabold">
                              <span>🤬 Chửi tục, nói bậy</span>
                              <span className="bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-lg text-[10px]">
                                {matchedStudent.violations.badLanguage} lần
                              </span>
                            </div>
                          )}
                          {matchedStudent.violations.wrongUniform > 0 && (
                            <div className="flex justify-between items-center bg-rose-50 border border-rose-150 p-2 rounded-xl text-xs text-rose-700 font-extrabold">
                              <span>👚 Sai đồng phục, tác phong</span>
                              <span className="bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-lg text-[10px]">
                                {matchedStudent.violations.wrongUniform} lần
                              </span>
                            </div>
                          )}
                          {matchedStudent.violations.noHomework > 0 && (
                            <div className="flex justify-between items-center bg-rose-50 border border-rose-150 p-2 rounded-xl text-xs text-rose-700 font-extrabold">
                              <span>📝 Không làm bài tập về nhà</span>
                              <span className="bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-lg text-[10px]">
                                {matchedStudent.violations.noHomework} lần
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-emerald-50 border border-emerald-150 rounded-2xl">
                        <span className="text-2xl block">😇🌸</span>
                        <p className="text-xs font-black text-emerald-800 mt-1">Học sinh chăm ngoan!</p>
                        <p className="text-[10px] text-emerald-600 font-bold px-3 mt-0.5">Tuyệt vời! Không có lỗi vi phạm nề nếp nào tại lớp.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Motivational Slogan Card */}
              <div className="bg-white border-2 border-sky-150 rounded-3xl p-4 text-center select-none shadow-sm">
                <span className="text-2xl mb-1 block">🏆</span>
                <p className="text-xs font-black text-slate-600 italic">
                  &ldquo;Học tập tự giác, rèn luyện chăm chỉ. Mỗi ngày tiến bộ thêm một chút em nhé!&rdquo;
                </p>
              </div>
            </aside>

          </div>
        )}

      </div>
    </div>
  );
}
