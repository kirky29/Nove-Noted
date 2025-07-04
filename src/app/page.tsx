'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/LoginPage';
import BookCard from '@/components/BookCard';
import StatsCard from '@/components/StatsCard';
import AddBookModal from '@/components/AddBookModal';
import BookSearchModal from '@/components/BookSearchModal';
import BarcodeScannerModal from '@/components/BarcodeScannerModal';
import LocalSearchBar from '@/components/LocalSearchBar';
import { Book, ReadingStatus, WishListBook } from '@/types/book';
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
  FileText,
  Camera,
  Star,
  Trash2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function Home() {
  const { user, signOut, loading, error: authError } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [wishListBooks, setWishListBooks] = useState<WishListBook[]>([]);
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'all' | 'wishlist'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      try {
        console.log('Setting up Firestore listeners for user:', user.uid);
        
        const unsubscribeBooks = firestoreStorage.onBooksChange((updatedBooks: Book[]) => {
          console.log('Books updated:', updatedBooks.length);
          setBooks(updatedBooks);
          setFirestoreError(null);
        });

        const unsubscribeWishList = firestoreStorage.onWishListBooksChange((updatedWishListBooks: WishListBook[]) => {
          console.log('Wish list updated:', updatedWishListBooks.length);
          setWishListBooks(updatedWishListBooks);
          setFirestoreError(null);
        });

        return () => {
          console.log('Cleaning up Firestore listeners');
          unsubscribeBooks();
          unsubscribeWishList();
        };
      } catch (error) {
        console.error('Error setting up Firestore listeners:', error);
        setFirestoreError(error instanceof Error ? error.message : 'Failed to connect to database');
      }
    }
  }, [user]);

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-800">Authentication Error</h2>
            </div>
            <p className="text-red-700 text-sm mb-4">{authError}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reload Page
              </button>
              <details className="text-xs text-red-600">
                <summary className="cursor-pointer">Debug Info</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {JSON.stringify({
                    userAgent: navigator.userAgent,
                    hostname: window.location.hostname,
                    protocol: window.location.protocol,
                    timestamp: new Date().toISOString()
                  }, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show Firestore error if database connection failed
  if (firestoreError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-yellow-800">Database Connection Error</h2>
            </div>
            <p className="text-yellow-700 text-sm mb-4">{firestoreError}</p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Retry Connection
              </button>
              <button
                onClick={() => setFirestoreError(null)}
                className="w-full px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                Continue Offline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter books based on active tab and search query
  const filteredBooks = books.filter(book => {
    const matchesTab = activeTab === 'all' || book.status === activeTab;
    const matchesSearch = searchQuery === '' || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Filter wish list books based on search query
  const filteredWishListBooks = wishListBooks.filter(book => {
    const matchesSearch = searchQuery === '' || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddBook = async (newBook: Omit<Book, 'id' | 'dateAdded'>) => {
    try {
      await firestoreStorage.addBook(newBook);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding book:', error);
      setFirestoreError(error instanceof Error ? error.message : 'Failed to add book');
    }
  };

  const handleAddWishListBook = async (newBook: Omit<WishListBook, 'id' | 'dateAdded'>) => {
    console.log('🔍 Adding book to wish list:', newBook);
    try {
      const result = await firestoreStorage.addWishListBook(newBook);
      console.log('✅ Book added to wish list successfully:', result);
      setIsSearchModalOpen(false);
      setIsScanModalOpen(false);
    } catch (error) {
      console.error('❌ Error adding book to wish list:', error);
      setFirestoreError(error instanceof Error ? error.message : 'Failed to add book to wish list');
    }
  };

  const handleUpdateBook = async (updatedBook: Book) => {
    try {
      await firestoreStorage.updateBook(updatedBook.id, updatedBook);
    } catch (error) {
      console.error('Error updating book:', error);
      setFirestoreError(error instanceof Error ? error.message : 'Failed to update book');
    }
  };

  const handleDeleteWishListBook = async (bookId: string) => {
    try {
      await firestoreStorage.deleteWishListBook(bookId);
    } catch (error) {
      console.error('Error deleting wish list book:', error);
      setFirestoreError(error instanceof Error ? error.message : 'Failed to delete book from wish list');
    }
  };

  const handleMoveWishListBookToCollection = async (wishListBookId: string, status: ReadingStatus = 'currently-reading') => {
    try {
      await firestoreStorage.moveWishListBookToCollection(wishListBookId, status);
    } catch (error) {
      console.error('Error moving book to collection:', error);
      setFirestoreError(error instanceof Error ? error.message : 'Failed to move book to collection');
    }
  };

  const getStats = () => {
    const reading = books.filter(book => book.status === 'currently-reading').length;
    const completed = books.filter(book => book.status === 'read').length;
    const totalPages = books
      .filter(book => book.status === 'read')
      .reduce((sum, book) => sum + (book.pages || 0), 0);

    return { reading, completed, totalPages, wishList: wishListBooks.length };
  };

  const stats = getStats();

  const getTabCount = (tab: ReadingStatus | 'all' | 'wishlist') => {
    if (tab === 'all') {
      return books.length;
    }
    if (tab === 'wishlist') {
      return wishListBooks.length;
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
    { key: 'all' as const, label: 'My Library', mobileLabel: 'Library', icon: '📚' },
    { key: 'currently-reading' as const, label: 'Currently Reading', mobileLabel: 'Reading', icon: '📖' },
    { key: 'read' as const, label: 'Read', mobileLabel: 'Read', icon: '✅' },
    { key: 'wishlist' as const, label: 'Wish List', mobileLabel: 'Wish List', icon: '⭐' },
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
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={32}
                      height={32}
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

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Welcome Section */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            Welcome back, {user.displayName?.split(' ')[0] || 'Reader'}!
          </h1>
          <p className="text-lg sm:text-xl text-white/80 mb-6">
            Track your personal book collection and ratings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="flex gap-2 overflow-x-auto mb-4 hide-scrollbar">
                  <div className="flex gap-2 min-w-max">
          <StatsCard title="Currently Reading" value={stats.reading} icon={BookOpen} color="blue" />
          <StatsCard title="Books Completed" value={stats.completed} icon={CheckCircle2} color="green" />
          <StatsCard title="Wish List" value={stats.wishList} icon={Star} color="purple" />
          <StatsCard title="Pages Read" value={stats.totalPages} icon={FileText} color="orange" />
        </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 flex items-center justify-center px-2 py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow text-base font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add
          </button>
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex-1 flex items-center justify-center px-2 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </button>
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex-1 flex items-center justify-center px-2 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow"
          >
            <Camera className="h-5 w-5 mr-2" />
            Scan
          </button>
        </div>

        {/* Search and Tabs */}
        <div className="mb-4">
          <LocalSearchBar
            onSearch={setSearchQuery}
            placeholder={activeTab === 'wishlist' ? "Search your wish list..." : "Search your library..."}
          />
          <div className="flex gap-2 overflow-x-auto mt-3 pb-3 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all duration-200 text-sm whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white shadow-lg ring-1 ring-white/30'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="font-medium">
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.mobileLabel}</span>
                </span>
                <span className="ml-1 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-semibold">
                  {getTabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'wishlist' ? (
          // Wish List Books Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWishListBooks.map((wishListBook) => (
              <div key={wishListBook.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200">
                <div className="flex gap-4">
                  {/* Book Cover */}
                  <div className="flex-shrink-0">
                    {wishListBook.coverUrl ? (
                                              <Image
                          src={wishListBook.coverUrl}
                          alt={`${wishListBook.title} cover`}
                          width={120}
                          height={180}
                          className="rounded-lg object-cover shadow-md w-[90px] h-[135px] sm:w-[110px] sm:h-[165px] hover:shadow-lg transition-shadow duration-200"
                        />
                      ) : (
                        <div className="w-[90px] h-[135px] sm:w-[110px] sm:h-[165px] bg-white/20 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200">
                        <BookOpen className="h-8 w-8 text-white/60" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base leading-tight line-clamp-2 mb-2">
                      {wishListBook.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">
                      by {wishListBook.author}
                    </p>
                    
                    {wishListBook.publishedYear && (
                      <p className="text-white/50 text-xs mb-1">{wishListBook.publishedYear}</p>
                    )}
                    
                    {wishListBook.pages && (
                      <p className="text-white/50 text-xs mb-3">{wishListBook.pages} pages</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveWishListBookToCollection(wishListBook.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors text-xs font-medium"
                        title="Add to collection"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Add
                      </button>
                      <button
                        onClick={() => handleDeleteWishListBook(wishListBook.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30 transition-colors text-xs font-medium"
                        title="Remove from wish list"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {wishListBook.description && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-white/60 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {wishListBook.description.replace(/<[^>]*>/g, '')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // Regular Books Grid - Optimized for larger covers
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onUpdate={(id, updates) => handleUpdateBook({ ...book, ...updates })}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'wishlist' && filteredWishListBooks.length === 0) || 
          (activeTab !== 'wishlist' && filteredBooks.length === 0)) && (
          <div className="text-center py-16">
            {activeTab === 'wishlist' ? (
              <Star className="h-16 w-16 text-white/40 mx-auto mb-4" />
            ) : (
              <BookIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No books found' : 
               activeTab === 'wishlist' ? 'Your wish list is empty' : 
               'No books in this category'}
            </h3>
            <p className="text-white/60 mb-6">
              {searchQuery 
                ? `No books match "${searchQuery}"`
                : activeTab === 'wishlist'
                  ? 'Start adding books you want to read someday!'
                  : activeTab === 'all' 
                    ? 'Start building your personal library by adding your first book!'
                    : activeTab === 'currently-reading'
                      ? 'Add some books you are currently reading!'
                      : 'Add some books you have read!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
              >
                {activeTab === 'wishlist' ? 'Search Books to Add' : 'Add Your First Book'}
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
          onAddToWishList={handleAddWishListBook}
        />
      )}

      <BarcodeScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddBook={handleAddBook}
        onAddToWishList={handleAddWishListBook}
      />
    </div>
  );
}
