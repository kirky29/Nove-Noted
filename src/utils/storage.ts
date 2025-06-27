import { Book, ReadingStatus } from '@/types/book';

const STORAGE_KEY = 'novel-noted-books';

export const storage = {
  // Get all books from localStorage
  getBooks: (): Book[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const books = JSON.parse(stored);
      // Convert date strings back to Date objects
      return books.map((book: Book) => ({
        ...book,
        dateAdded: new Date(book.dateAdded),
        dateStarted: book.dateStarted ? new Date(book.dateStarted) : undefined,
        dateFinished: book.dateFinished ? new Date(book.dateFinished) : undefined,
      }));
    } catch (error) {
      console.error('Error loading books from storage:', error);
      return [];
    }
  },

  // Save books to localStorage
  saveBooks: (books: Book[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.error('Error saving books to storage:', error);
    }
  },

  // Add a new book
  addBook: (book: Omit<Book, 'id' | 'dateAdded'>): Book => {
    const newBook: Book = {
      ...book,
      id: crypto.randomUUID(),
      dateAdded: new Date(),
    };
    
    const books = storage.getBooks();
    books.push(newBook);
    storage.saveBooks(books);
    
    return newBook;
  },

  // Update an existing book
  updateBook: (id: string, updates: Partial<Book>): Book | null => {
    const books = storage.getBooks();
    const bookIndex = books.findIndex(book => book.id === id);
    
    if (bookIndex === -1) return null;
    
    books[bookIndex] = { ...books[bookIndex], ...updates };
    storage.saveBooks(books);
    
    return books[bookIndex];
  },

  // Delete a book
  deleteBook: (id: string): boolean => {
    const books = storage.getBooks();
    const filteredBooks = books.filter(book => book.id !== id);
    
    if (filteredBooks.length === books.length) return false;
    
    storage.saveBooks(filteredBooks);
    return true;
  },

  // Get books by status
  getBooksByStatus: (status: ReadingStatus): Book[] => {
    return storage.getBooks().filter(book => book.status === status);
  },

  // Get reading statistics
  getReadingStats: () => {
    const books = storage.getBooks();
    return {
      total: books.length,
      read: books.filter(book => book.status === 'read').length,
      currentlyReading: books.filter(book => book.status === 'currently-reading').length,
      wantToRead: books.filter(book => book.status === 'want-to-read').length,
    };
  },
}; 