'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Book, ReadingStatus } from '@/types/book';
import { firestoreStorage } from '@/utils/firestoreStorage';
import { 
  ArrowLeft, BookOpen, Calendar, Hash, Star, Edit3, Trash2, 
  Plus, Save, Clock, CheckCircle2, Heart,
  FileText, MessageSquare, Target, User, LogOut, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export default function BookProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'progress'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [newJourneyEntry, setNewJourneyEntry] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
    'want-to-read': {
      icon: Heart,
      label: 'Want to Read',
      color: 'border-red-200 bg-red-50 text-red-700',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
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

  const addJourneyEntry = async () => {
    if (!newJourneyEntry.trim()) return;
    
    const currentThoughts = book.thoughts || '';
    const timestamp = format(new Date(), 'MMM d, yyyy');
    const entry = `[${timestamp}] ${newJourneyEntry.trim()}`;
    const updatedThoughts = currentThoughts 
      ? `${currentThoughts}\n\n${entry}`
      : entry;
    
    await firestoreStorage.updateBook(book.id, { thoughts: updatedThoughts });
    setBook({ ...book, thoughts: updatedThoughts });
    setNewJourneyEntry('');
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
    { key: 'journey', label: 'My Journey', icon: MessageSquare },
    { key: 'progress', label: 'Progress', icon: Target },
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
                  onClick={() => setActiveTab(tab.key as 'overview' | 'journey' | 'progress')}
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
                    <div className="mb-4">
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={`${book.title} cover`}
                          width={200}
                          height={280}
                          className="w-full max-w-48 mx-auto rounded-lg object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-full max-w-48 h-64 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-400" />
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

          {/* Journey Tab */}
          {activeTab === 'journey' && (
            <div className="space-y-6">
              {/* Add New Entry */}
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Journey Entry
                </h3>
                <div className="space-y-3">
                  <textarea
                    value={newJourneyEntry}
                    onChange={(e) => setNewJourneyEntry(e.target.value)}
                    placeholder="What are your thoughts about this book? Any quotes, insights, or reflections..."
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                  />
                  <button
                    onClick={addJourneyEntry}
                    disabled={!newJourneyEntry.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    Add Entry
                  </button>
                </div>
              </div>

              {/* Existing Thoughts */}
              {book.thoughts && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">My Journey</h3>
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {book.thoughts}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {book.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {book.notes}
                    </div>
                  </div>
                </div>
              )}

              {!book.thoughts && !book.notes && (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No journey entries yet. Start by adding your first thoughts!</p>
                </div>
              )}
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
        </div>
      </div>
    </div>
  );
} 