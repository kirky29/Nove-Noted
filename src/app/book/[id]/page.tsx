'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Book, ReadingStatus, SeriesBook } from '@/types/book';
import { firestoreStorage } from '@/utils/firestoreStorage';
import { googleBooksAPI } from '@/utils/googleBooks';
import { 
  ArrowLeft, BookOpen, Calendar, Hash, Star, Edit3, Trash2, 
  Clock, CheckCircle2,
  FileText, Target, User, LogOut, ChevronDown, BookMarked,
  Home, Tablet
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export default function BookProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'series'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [seriesBooks, setSeriesBooks] = useState<SeriesBook[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const loadBook = async () => {
      try {
        const books = await firestoreStorage.getBooks();
        const foundBook = books.find(b => b.id === params.id);
        if (foundBook) {
          setBook(foundBook);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading book:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [params.id, user, router]);

  const loadSeriesBooks = async (book: Book) => {
    setLoadingSeries(true);
    try {
      const books = await googleBooksAPI.searchSeriesBooks(book.author, book.title);
      
      // Check which books are in user's library
      const userBooks = await firestoreStorage.getBooks();
      const booksWithLibraryStatus = books.map(seriesBook => ({
        ...seriesBook,
        inLibrary: userBooks.some(userBook => 
          userBook.title.toLowerCase().includes(seriesBook.title.toLowerCase()) ||
          seriesBook.title.toLowerCase().includes(userBook.title.toLowerCase())
        )
      }));

      setSeriesBooks(booksWithLibraryStatus);
    } catch (error) {
      console.error('Error loading series books:', error);
    } finally {
      setLoadingSeries(false);
    }
  };

  // Load series books when book changes and series tab becomes available
  useEffect(() => {
    if (book && activeTab === 'series' && seriesBooks.length === 0 && !loadingSeries) {
      loadSeriesBooks(book);
    }
  }, [book, activeTab, seriesBooks.length, loadingSeries]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Book not found</div>
      </div>
    );
  }

  const statusConfig = {
    'currently-reading': {
      icon: Clock,
      label: 'Currently Reading',
      color: 'border-orange-200 bg-orange-50 text-orange-700',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    'read': {
      icon: CheckCircle2,
      label: 'Read',
      color: 'border-green-200 bg-green-50 text-green-700',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
  };

  const ownershipConfig = {
    'physical': {
      icon: Home,
      label: 'Physical Book',
      description: 'I own this book physically',
      color: 'border-green-200 bg-green-50 text-green-700',
    },
    'digital': {
      icon: Tablet,
      label: 'Digital Copy',
      description: 'I have this as an eBook/audiobook',
      color: 'border-blue-200 bg-blue-50 text-blue-700',
    },
  };

  const handleStatusChange = async (newStatus: ReadingStatus) => {
    const updates: Partial<Book> = { status: newStatus };
    
    if (newStatus === 'currently-reading' && !book.dateStarted) {
      updates.dateStarted = new Date();
    } else if (newStatus === 'read') {
      if (!book.dateStarted) updates.dateStarted = new Date();
      updates.dateFinished = new Date();
    }
    
    await firestoreStorage.updateBook(book.id, updates);
    setBook({ ...book, ...updates });
  };

  const handleRatingChange = async (rating: number) => {
    await firestoreStorage.updateBook(book.id, { rating });
    setBook({ ...book, rating });
  };

  const handleOwnershipTypeChange = async (ownershipType: 'physical' | 'digital') => {
    await firestoreStorage.updateBook(book.id, { ownershipType });
    setBook({ ...book, ownershipType });
  };

  const handleProgressUpdate = async (currentPage: number) => {
    await firestoreStorage.updateBook(book.id, { currentPage });
    setBook({ ...book, currentPage });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this book from your library?')) {
      await firestoreStorage.deleteBook(book.id);
      router.push('/');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const StatusIcon = statusConfig[book.status].icon;
  const readingProgress = book.pages && book.currentPage 
    ? Math.min((book.currentPage / book.pages) * 100, 100) 
    : 0;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'progress', label: 'Progress', icon: Target },
    { key: 'series', label: 'Books in this series', icon: BookMarked },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Library</span>
              </button>
              <div className="w-px h-6 bg-white/20"></div>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${statusConfig[book.status].bgColor}`}>
                  <StatusIcon className={`h-5 w-5 ${statusConfig[book.status].textColor}`} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white line-clamp-1">{book.title}</h1>
                  <p className="text-sm text-white/70">by {book.author}</p>
                </div>
              </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              title="Edit book details"
            >
              <Edit3 className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
              title="Delete book"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-8">
          <nav className="flex px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as 'overview' | 'progress' | 'series')}
                  className={`flex items-center gap-2 py-4 px-4 font-medium text-sm border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-400 text-white'
                      : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Book Cover & Basic Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-xl p-6">
                    {/* Cover */}
                    <div className="mb-6">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={`${book.title} cover`}
                          width={280}
                          height={420}
                          className="w-full max-w-[220px] sm:max-w-[260px] lg:max-w-[280px] mx-auto rounded-xl object-cover shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full max-w-[220px] sm:max-w-[260px] lg:max-w-[280px] h-[330px] sm:h-[390px] lg:h-[420px] mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                          <BookOpen className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium mb-4 ${statusConfig[book.status].color}`}>
                      <StatusIcon className="h-4 w-4" />
                      {statusConfig[book.status].label}
                    </div>

                    {/* Book Details */}
                    <div className="space-y-3 text-sm">
                      {book.isbn && (
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">ISBN:</span>
                          <span className="text-gray-900">{book.isbn}</span>
                        </div>
                      )}
                      {book.pages && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Pages:</span>
                          <span className="text-gray-900">{book.pages}</span>
                        </div>
                      )}
                      {book.genre && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Genre:</span>
                          <span className="text-gray-900">{book.genre}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Added:</span>
                        <span className="text-gray-900">{format(book.dateAdded, 'MMM d, yyyy')}</span>
                      </div>
                      {book.dateStarted && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Started:</span>
                          <span className="text-gray-900">{format(book.dateStarted, 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {book.dateFinished && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Finished:</span>
                          <span className="text-gray-900">{format(book.dateFinished, 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Status Change */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Reading Status</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(statusConfig).map(([status, config]) => {
                        const Icon = config.icon;
                        const isActive = book.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status as ReadingStatus)}
                            className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                              isActive 
                                ? config.color + ' ring-2 ring-offset-2'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-5 w-5 mx-auto mb-1" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ownership Type */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Ownership Type</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(ownershipConfig).map(([ownership, config]) => {
                        const Icon = config.icon;
                        const isActive = (book.ownershipType || 'physical') === ownership;
                        return (
                          <button
                            key={ownership}
                                                         onClick={() => handleOwnershipTypeChange(ownership as 'physical' | 'digital')}
                            className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                              isActive 
                                ? config.color + ' ring-2 ring-offset-2'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="h-5 w-5 mx-auto mb-1" />
                            <div className="font-medium">{config.label}</div>
                            <div className="text-xs opacity-75 mt-1">{config.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rating */}
                  {book.status === 'read' && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">My Rating</h3>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingChange(star)}
                            className="p-1 rounded transition-colors hover:bg-yellow-50"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= (book.rating || 0)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                        {book.rating && (
                          <span className="ml-2 text-sm text-gray-600">
                            {book.rating} star{book.rating !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Current Progress */}
                  {book.status === 'currently-reading' && book.pages && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Reading Progress</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">Current page:</span>
                          <input
                            type="number"
                            value={book.currentPage || ''}
                            onChange={(e) => handleProgressUpdate(parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                            min="0"
                            max={book.pages}
                          />
                          <span className="text-sm text-gray-600">of {book.pages}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${readingProgress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          {Math.round(readingProgress)}% complete
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reading Timeline */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Reading Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Added to library:</span>
                      <span className="font-medium">{format(book.dateAdded, 'MMM d, yyyy')}</span>
                    </div>
                    {book.dateStarted && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Started reading:</span>
                        <span className="font-medium">{format(book.dateStarted, 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {book.dateFinished && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Finished reading:</span>
                        <span className="font-medium">{format(book.dateFinished, 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {book.dateStarted && book.dateFinished && (
                      <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                        <span className="text-gray-600">Reading duration:</span>
                        <span className="font-medium">
                          {Math.ceil((book.dateFinished.getTime() - book.dateStarted.getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Stats */}
                {book.pages && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Progress Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total pages:</span>
                        <span className="font-medium">{book.pages}</span>
                      </div>
                      {book.status === 'currently-reading' && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Current page:</span>
                            <span className="font-medium">{book.currentPage || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pages remaining:</span>
                            <span className="font-medium">{book.pages - (book.currentPage || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-medium">{Math.round(readingProgress)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Series Tab */}
          {activeTab === 'series' && (
            <div className="space-y-6">
              {loadingSeries ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Finding books in this series...</p>
                </div>
              ) : seriesBooks.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <BookMarked className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">
                      Books in this series ({seriesBooks.length} found)
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {seriesBooks.map((seriesBook) => (
                      <div 
                        key={seriesBook.id} 
                        className={`bg-white border rounded-lg p-4 transition-all hover:shadow-md ${
                          seriesBook.inLibrary ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex gap-3">
                          {/* Book Cover */}
                          <div className="flex-shrink-0">
                            {seriesBook.coverUrl ? (
                              <Image
                                src={seriesBook.coverUrl}
                                alt={`${seriesBook.title} cover`}
                                width={60}
                                height={80}
                                className="rounded object-cover shadow-sm"
                              />
                            ) : (
                              <div className="w-15 h-20 bg-gray-200 rounded flex items-center justify-center">
                                <BookOpen className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Book Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
                                {seriesBook.title}
                              </h4>
                              {seriesBook.seriesNumber && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                  #{seriesBook.seriesNumber}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-1">{seriesBook.author}</p>
                            
                            {seriesBook.publishedYear && (
                              <p className="text-xs text-gray-500 mt-1">{seriesBook.publishedYear}</p>
                            )}

                            {seriesBook.inLibrary && (
                              <div className="flex items-center gap-1 mt-2">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-green-700 font-medium">In your library</span>
                              </div>
                            )}

                            {seriesBook.description && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                {seriesBook.description.replace(/<[^>]*>/g, '').substring(0, 80)}
                                {seriesBook.description.length > 80 ? '...' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">About this series reference</p>
                        <p>
                          These books were found based on the author and title patterns. Books marked with a green background 
                          are already in your library. This is a reference to help you discover other books in the series.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookMarked className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-medium text-gray-900 mb-2">No series books found</h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto">
                    We couldn&apos;t find other books in this series. This might be a standalone book, 
                    or the series information isn&apos;t clearly indicated in the title.
                  </p>
                  <button
                    onClick={() => book && loadSeriesBooks(book)}
                    className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try searching again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 