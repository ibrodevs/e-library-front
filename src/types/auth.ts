// Типы для авторизации
export interface LoginCredentials {
  studentIdOrEmail: string;
  password: string;
}

export interface AuthToken {
  token: string;
  expiresAt: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  studentId: string;
  email: string;
  password?: string; // Для mock-проверки смены пароля
  avatar?: string;
  department?: string;
  course?: number;
  group?: string;
}

// Типы для книг студента
export interface StudentBook {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  borrowedDate: string;
  returnDate: string;
  status: 'active' | 'overdue' | 'returned';
}

// История посещений
export interface VisitHistory {
  id: string;
  date: string;
  action: string;
  description?: string;
}

// Рекомендованные учебники
export interface RecommendedBook {
  id: string;
  title: string;
  author: string;
  coverImage?: string;
  subject: string;
  rating?: number;
}

// Данные профиля студента
export interface StudentProfile {
  student: Student;
  borrowedBooks: StudentBook[];
  visitHistory: VisitHistory[];
  recommendedBooks: RecommendedBook[];
}
