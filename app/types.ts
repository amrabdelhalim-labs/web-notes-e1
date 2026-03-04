export type SupportedLocale = 'ar' | 'en';
export type NoteType = 'text' | 'voice';

export interface User {
  _id: string;
  username: string;
  email: string;
  displayName?: string;
  language: SupportedLocale;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content?: string;
  audioData?: string;
  audioDuration?: number;
  type: NoteType;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: ApiError;
}
