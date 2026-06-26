export interface Student {
  name: string;
  className: string;
  role: 'student' | 'teacher';
  avatarUrl?: string;
}

export interface ClassroomStudent {
  id: string;
  name: string;
  className: string;
  isPresent: boolean;
  stars: number;
  absentDays: number; // Số ngày nghỉ
  avatarUrl?: string; // Ảnh đại diện tùy chọn
  violations: {
    talkative: number;      // Nói chuyện
    offTask: number;        // Làm việc riêng
    badLanguage: number;    // Chửi tục
    wrongUniform: number;   // Sai đồng phục
    noHomework: number;     // Không làm bài
  };
  attachedFiles: {
    name: string;
    type: 'image' | 'document' | 'spreadsheet' | 'file';
    dataUrl?: string;
  }[];
}

export type TaskPriority = 'Mức 1' | 'Mức 2' | 'Mức 3';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  priority?: TaskPriority;
  subject?: string;
  rewardStars?: number; // motivative element for elementary kids
  attachmentName?: string;
  attachmentData?: string; // base64 data URL for images or mockup preview
  attachmentType?: 'image' | 'document' | 'spreadsheet' | 'file';
  timeLimit?: string; // e.g., 'Không giới hạn' or a custom date limit
}
