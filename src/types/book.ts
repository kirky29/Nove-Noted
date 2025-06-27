export type ReadingStatus = 'want-to-read' | 'currently-reading' | 'read';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  pages?: number;
  genre?: string;
  status: ReadingStatus;
  dateAdded: Date;
  dateStarted?: Date;
  dateFinished?: Date;
  rating?: number; // 1-5 stars
  thoughts?: string;
  notes?: string;
  currentPage?: number;
  userId?: string; // For Firebase user association
}

export interface BookFilters {
  status?: ReadingStatus;
  genre?: string;
  search?: string;
} 