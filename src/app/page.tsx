'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import BookCard from '@/components/BookCard';
import StatsCard from '@/components/StatsCard';
import AddBookModal from '@/components/AddBookModal';
import BookSearchModal from '@/components/BookSearchModal';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import LocalSearchBar from '@/components/LocalSearchBar';
import { Book, ReadingStatus } from '@/types/book';
import { firestoreStorage } from '@/utils/firestoreStorage';
import { 
  Book as BookIcon, 
  Plus, 
  Search, 
  User, 
  LogOut, 
  ChevronDown,
  BookOpen,
  CheckCircle2,
  Heart,
  FileText,
  Camera
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const unsubscribe = firestoreStorage.onBooksChange((updatedBooks: Book[]) => {
        setBooks(updatedBooks);
      });

      return unsubscribe;
    }
  }, [user]);

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Filter books based on active tab and search query
  const filteredBooks = books.filter(book => {
    const matchesTab = activeTab === 'all' || book.status === activeTab;
    const matchesSearch = searchQuery === '' || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleAddBook = async (newBook: Omit<Book, 'id' | 'dateAdded'>) => {
    await firestoreStorage.addBook(newBook);
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    await firestoreStorage.updateBook(updatedBook.id, updatedBook);
  };

  const handleDeleteBook = async (bookId: string) => {
    await firestoreStorage.deleteBook(bookId);
  };

  const getStats = () => {
    const reading = books.filter(book => book.status === 'currently-reading').length;
    const completed = books.filter(book => book.status === 'read').length;
    const wantToRead = books.filter(book => book.status === 'want-to-read').length;
    const totalPages = books
      .filter(book => book.status === 'read')
      .reduce((sum, book) => sum + (book.pages || 0), 0);

    return { reading, completed, wantToRead, totalPages };
  };

  const stats = getStats();

  const getTabCount = (tab: ReadingStatus | 'all') => {
    if (tab === 'all') {
      return books.length;
    }
    return books.filter(book => book.status === tab).length;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { key: 'all' as const, label: 'My Library', icon: '📚' },
    { key: 'want-to-read' as const, label: 'Want to Read', icon: '📚' },
    { key: 'currently-reading' as const, label: 'Currently Reading', icon: '📖' },
    { key: 'read' as const, label: 'Read', icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <BookIcon className="h-8 w-8 text-white mr-3" />
              <h1 className="text-2xl font-bold text-white">Novel Noted</h1>
            </div>
            
            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
              >
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <span className="hidden sm:block">{user.displayName || user.email}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-white/80 border-b border-white/10">
                      {user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Close user menu when clicking outside */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome back, {user.displayName?.split(' ')[0] || 'Reader'}!
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Track your reading journey and discover new worlds
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Currently Reading"
            value={stats.reading}
            icon={BookOpen}
            color="blue"
          />
          <StatsCard
            title="Books Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            title="Want to Read"
            value={stats.wantToRead}
            icon={Heart}
            color="red"
          />
          <StatsCard
            title="Pages Read"
            value={stats.totalPages}
            icon={FileText}
            color="orange"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Book
          </button>
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg"
          >
            <Search className="h-5 w-5 mr-2" />
            Search Books
          </button>
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Scan Barcode
          </button>
        </div>

        {/* Search and Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <LocalSearchBar
            onSearch={setSearchQuery}
            placeholder="Search your library..."
          />
          
          <div className="flex flex-wrap gap-2 mt-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                  {getTabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onUpdate={(id, updates) => handleUpdateBook({ ...book, ...updates })}
              onDelete={handleDeleteBook}
              onOpenProfile={() => router.push(`/book/${book.id}`)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-16">
            <BookIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No books found' : 'No books in this category'}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery 
                ? `No books match "${searchQuery}"`
                : activeTab === 'all' 
                  ? 'Start building your personal library by adding your first book!'
                  : `Add some books to your ${activeTab.replace('-', ' ')} list!`
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200"
              >
                Add Your First Book
              </button>
            )}
          </div>
        )}
      </div>

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

      <BarcodeScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddBook={handleAddBook}
      />
    </div>
  );
}
