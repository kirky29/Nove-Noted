export type ReadingStatus = 'currently-reading' | 'read';

export type OwnershipType = 'physical' | 'digital';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  pages?: number;
  genre?: string;
  status: ReadingStatus;
  ownershipType: OwnershipType; // Physical book, digital copy, or just interested
  dateAdded: Date;
  dateStarted?: Date;
  dateFinished?: Date;
  rating?: number; // 1-5 stars
  currentPage?: number;
  userId?: string; // For Firebase user association
  series?: string; // Series name if part of a series
  seriesNumber?: number; // Position in series
}

export interface WishListBook {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  coverUrl?: string;
  pages?: number;
  genre?: string;
  publisher?: string;
  publishedYear?: string;
  description?: string;
  dateAdded: Date;
  userId?: string; // For Firebase user association
}

export interface SeriesBook {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  publishedYear?: string;
  description?: string;
  seriesNumber?: number;
  inLibrary?: boolean; // Whether user has this book in their library
}

export interface BookFilters {
  status?: ReadingStatus;
  genre?: string;
  search?: string;
} 