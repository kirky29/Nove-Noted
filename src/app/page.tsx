'use client';

import { useState, useEffect } from 'react';
import { Book, ReadingStatus } from '@/types/book';
import { firestoreStorage } from '@/utils/firestoreStorage';
import { BookOpen, Plus, Clock, CheckCircle2, Heart, Search } from 'lucide-react';
import BookCard from '@/components/BookCard';
import AddBookModal from '@/components/AddBookModal';
import BookSearchModal from '@/components/BookSearchModal';
import BookProfileModal from '@/components/BookProfileModal';
import LocalSearchBar from '@/components/LocalSearchBar';
import StatsCard from '@/components/StatsCard';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    currentlyReading: 0,
    wantToRead: 0,
  });

  // Load books on component mount and set up real-time listener
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeData = async () => {
      try {
        // Migrate localStorage data to Firestore if needed
        await firestoreStorage.migrateFromLocalStorage();
        
        // Set up real-time listener for books
        unsubscribe = firestoreStorage.onBooksChange(async (books) => {
          setBooks(books);
          // Recalculate stats when books change
          const stats = await firestoreStorage.getReadingStats();
          setStats(stats);
        });
      } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to loading books once if real-time fails
        const books = await firestoreStorage.getBooks();
        setBooks(books);
        const stats = await firestoreStorage.getReadingStats();
        setStats(stats);
      }
    };

    initializeData();

    // Cleanup listener on component unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Handle adding a new book (from both modals)
  const handleAddBook = async (bookData: Omit<Book, 'id' | 'dateAdded'>) => {
    try {
      await firestoreStorage.addBook(bookData);
      // Real-time listener will update the UI automatically
      setIsAddModalOpen(false);
      setIsSearchModalOpen(false);
    } catch (error) {
      console.error('Error adding book:', error);
      // You could show a toast notification here
    }
  };

  // Handle updating a book
  const handleUpdateBook = async (id: string, updates: Partial<Book>) => {
    try {
      await firestoreStorage.updateBook(id, updates);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error updating book:', error);
      // You could show a toast notification here
    }
  };

  // Handle deleting a book
  const handleDeleteBook = async (id: string) => {
    try {
      await firestoreStorage.deleteBook(id);
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error deleting book:', error);
      // You could show a toast notification here
    }
  };

  // Handle opening book profile
  const handleOpenBookProfile = (book: Book) => {
    setSelectedBook(book);
  };

  // Filter books based on active tab and search query
  const filteredBooks = books
    .filter(book => activeTab === 'all' || book.status === activeTab)
    .filter(book => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre?.toLowerCase().includes(query) ||
        book.thoughts?.toLowerCase().includes(query) ||
        book.notes?.toLowerCase().includes(query)
      );
    });

  const tabs = [
    { key: 'all' as const, label: 'All Books', icon: BookOpen, count: stats.total },
    { key: 'want-to-read' as const, label: 'Want to Read', icon: Heart, count: stats.wantToRead },
    { key: 'currently-reading' as const, label: 'Currently Reading', icon: Clock, count: stats.currentlyReading },
    { key: 'read' as const, label: 'Read', icon: CheckCircle2, count: stats.read },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Novel Noted
                </h1>
                <p className="text-gray-600 text-sm">Track your reading journey</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Search className="h-5 w-5" />
                <span className="hidden sm:inline">Search Books</span>
                <span className="sm:hidden">Search</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Add Manually</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Books"
            value={stats.total}
            icon={BookOpen}
            color="blue"
          />
          <StatsCard
            title="Want to Read"
            value={stats.wantToRead}
            icon={Heart}
            color="red"
          />
          <StatsCard
            title="Currently Reading"
            value={stats.currentlyReading}
            icon={Clock}
            color="orange"
          />
          <StatsCard
            title="Books Read"
            value={stats.read}
            icon={CheckCircle2}
            color="green"
          />
        </div>

        {/* Search Bar */}
        {books.length > 0 && (
          <div className="mb-6">
            <LocalSearchBar
              onSearch={setSearchQuery}
              placeholder="Search your library by title, author, genre, or notes..."
            />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="border-b border-gray-100">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      isActive 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Books Grid */}
          <div className="p-6">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery 
                    ? `No books found matching ${searchQuery}`
                    : activeTab === 'all' 
                      ? 'No books yet' 
                      : `No books in ${tabs.find(t => t.key === activeTab)?.label || ''}`
                  }
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery 
                    ? 'Try a different search term or browse all books.'
                    : activeTab === 'all' 
                      ? 'Start building your personal library by adding your first book!'
                      : 'Books you add to this category will appear here.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setIsSearchModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                  >
                    <Search className="h-5 w-5" />
                    Search & Add Books
                  </button>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                  >
                    <Plus className="h-5 w-5" />
                    Add Manually
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {searchQuery && (
                  <div className="mb-4 text-sm text-gray-600">
                    Found {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} matching &ldquo;{searchQuery}&rdquo;
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onUpdate={handleUpdateBook}
                    onDelete={handleDeleteBook}
                    onOpenProfile={handleOpenBookProfile}
                  />
                ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {isAddModalOpen && (
        <AddBookModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddBook}
        />
      )}
      
      {isSearchModalOpen && (
        <BookSearchModal
          onClose={() => setIsSearchModalOpen(false)}
          onAdd={handleAddBook}
        />
      )}

      {selectedBook && (
        <BookProfileModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onUpdate={handleUpdateBook}
          onDelete={handleDeleteBook}
        />
      )}
    </div>
  );
}
