import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  UpdateData
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Book, ReadingStatus } from '@/types/book';

const COLLECTION_NAME = 'books';

// Get current user ID or throw error if not authenticated
const getCurrentUserId = (): string => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }
  return auth.currentUser.uid;
};

// Convert Firestore document to Book object
const convertFirestoreDoc = (doc: QueryDocumentSnapshot<DocumentData>): Book => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    author: data.author,
    isbn: data.isbn,
    coverUrl: data.coverUrl,
    pages: data.pages,
    genre: data.genre,
    status: data.status,
    dateAdded: data.dateAdded?.toDate() || new Date(),
    dateStarted: data.dateStarted?.toDate(),
    dateFinished: data.dateFinished?.toDate(),
    rating: data.rating,
    thoughts: data.thoughts,
    notes: data.notes,
    currentPage: data.currentPage,
    userId: data.userId,
  };
};

// Convert Book object to Firestore document
const convertToFirestoreDoc = (book: Omit<Book, 'id'>, userId: string) => {
  return {
    ...book,
    dateAdded: book.dateAdded ? Timestamp.fromDate(book.dateAdded) : Timestamp.now(),
    dateStarted: book.dateStarted ? Timestamp.fromDate(book.dateStarted) : null,
    dateFinished: book.dateFinished ? Timestamp.fromDate(book.dateFinished) : null,
    userId: userId,
  };
};

export const firestoreStorage = {
  // Get all books from Firestore for current user
  getBooks: async (): Promise<Book[]> => {
    try {
      const userId = getCurrentUserId();
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('dateAdded', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreDoc);
    } catch (error) {
      console.error('Error loading books from Firestore:', error);
      return [];
    }
  },

  // Add a new book to Firestore for current user
  addBook: async (book: Omit<Book, 'id' | 'dateAdded'>): Promise<Book> => {
    try {
      const userId = getCurrentUserId();
      const newBook = {
        ...book,
        dateAdded: new Date(),
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), convertToFirestoreDoc(newBook, userId));
      
      return {
        id: docRef.id,
        ...newBook,
        userId,
      };
    } catch (error) {
      console.error('Error adding book to Firestore:', error);
      throw error;
    }
  },

  // Update an existing book in Firestore for current user
  updateBook: async (id: string, updates: Partial<Book>): Promise<Book | null> => {
    try {
      const userId = getCurrentUserId();
      const docRef = doc(db, COLLECTION_NAME, id);
      
      // Filter out undefined values and convert date objects to Timestamps for Firestore
      const firestoreUpdates = {} as UpdateData<DocumentData>;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'dateStarted' && value instanceof Date) {
            firestoreUpdates.dateStarted = Timestamp.fromDate(value);
          } else if (key === 'dateFinished' && value instanceof Date) {
            firestoreUpdates.dateFinished = Timestamp.fromDate(value);
          } else if (key === 'dateAdded' && value instanceof Date) {
            firestoreUpdates.dateAdded = Timestamp.fromDate(value);
          } else {
            firestoreUpdates[key] = value;
          }
        }
      });
      
      await updateDoc(docRef, firestoreUpdates);
      
      // Return the updated book (we'll need to fetch it)
      const booksCollection = collection(db, COLLECTION_NAME);
      const q = query(booksCollection, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const updatedDoc = querySnapshot.docs.find(doc => doc.id === id);
      
      return updatedDoc ? convertFirestoreDoc(updatedDoc) : null;
    } catch (error) {
      console.error('Error updating book in Firestore:', error);
      return null;
    }
  },

  // Delete a book from Firestore for current user
  deleteBook: async (id: string): Promise<boolean> => {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting book from Firestore:', error);
      return false;
    }
  },

  // Get books by status from Firestore for current user
  getBooksByStatus: async (status: ReadingStatus): Promise<Book[]> => {
    try {
      const userId = getCurrentUserId();
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('dateAdded', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(convertFirestoreDoc);
    } catch (error) {
      console.error('Error loading books by status from Firestore:', error);
      return [];
    }
  },

  // Get reading statistics for current user
  getReadingStats: async () => {
    try {
      const books = await firestoreStorage.getBooks();
      return {
        total: books.length,
        read: books.filter(book => book.status === 'read').length,
        currentlyReading: books.filter(book => book.status === 'currently-reading').length,
        wantToRead: books.filter(book => book.status === 'want-to-read').length,
      };
    } catch (error) {
      console.error('Error calculating reading stats:', error);
      return {
        total: 0,
        read: 0,
        currentlyReading: 0,
        wantToRead: 0,
      };
    }
  },

  // Set up real-time listener for books for current user
  onBooksChange: (callback: (books: Book[]) => void): (() => void) => {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('dateAdded', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const books = querySnapshot.docs.map(convertFirestoreDoc);
      callback(books);
    }, (error) => {
      console.error('Error in books listener:', error);
      callback([]);
    });

    return unsubscribe;
  },

  // Migrate data from localStorage to Firestore for current user (one-time operation)
  migrateFromLocalStorage: async (): Promise<void> => {
    try {
      const userId = getCurrentUserId();
      
      // Check if we have localStorage data
      const localData = localStorage.getItem('novel-noted-books');
      if (!localData) return;

      const localBooks = JSON.parse(localData);
      if (!Array.isArray(localBooks) || localBooks.length === 0) return;

      console.log(`Migrating ${localBooks.length} books from localStorage to Firestore...`);

      // Use batch write for efficiency
      const batch = writeBatch(db);
      
      for (const book of localBooks) {
        const bookData = {
          ...book,
          dateAdded: book.dateAdded ? Timestamp.fromDate(new Date(book.dateAdded)) : Timestamp.now(),
          dateStarted: book.dateStarted ? Timestamp.fromDate(new Date(book.dateStarted)) : null,
          dateFinished: book.dateFinished ? Timestamp.fromDate(new Date(book.dateFinished)) : null,
          userId: userId,
        };

        const docRef = doc(collection(db, COLLECTION_NAME));
        batch.set(docRef, bookData);
      }

      await batch.commit();
      
      // Clear localStorage after successful migration
      localStorage.removeItem('novel-noted-books');
      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Error migrating data from localStorage:', error);
    }
  },
}; 