import { useState } from 'react';
import { Book, ReadingStatus } from '@/types/book';
import { 
  X, BookOpen, Calendar, Hash, Star, Edit3, Trash2, 
  Plus, Save, Clock, CheckCircle2, Heart,
  FileText, MessageSquare, Target
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface BookProfileModalProps {
  book: Book;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Book>) => void;
  onDelete: (id: string) => void;
}

export default function BookProfileModal({ book, onClose, onUpdate, onDelete }: BookProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'progress'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [newJourneyEntry, setNewJourneyEntry] = useState('');

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

  const handleSave = () => {
    // Handle save functionality when editing mode is implemented
    setIsEditing(false);
  };

  const handleStatusChange = (newStatus: ReadingStatus) => {
    const updates: Partial<Book> = { status: newStatus };
    
    if (newStatus === 'currently-reading' && !book.dateStarted) {
      updates.dateStarted = new Date();
    } else if (newStatus === 'read') {
      if (!book.dateStarted) updates.dateStarted = new Date();
      updates.dateFinished = new Date();
    }
    
    onUpdate(book.id, updates);
  };

  const handleRatingChange = (rating: number) => {
    onUpdate(book.id, { rating });
  };

  const handleProgressUpdate = (currentPage: number) => {
    onUpdate(book.id, { currentPage });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this book from your library?')) {
      onDelete(book.id);
      onClose();
    }
  };

  const addJourneyEntry = () => {
    if (!newJourneyEntry.trim()) return;
    
    const currentThoughts = book.thoughts || '';
    const timestamp = format(new Date(), 'MMM d, yyyy');
    const entry = `[${timestamp}] ${newJourneyEntry.trim()}`;
    const updatedThoughts = currentThoughts 
      ? `${currentThoughts}\n\n${entry}`
      : entry;
    
    onUpdate(book.id, { thoughts: updatedThoughts });
    setNewJourneyEntry('');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig[book.status].bgColor}`}>
              <StatusIcon className={`h-5 w-5 ${statusConfig[book.status].textColor}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 line-clamp-1">{book.title}</h2>
              <p className="text-sm text-gray-600">by {book.author}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit book details"
            >
              <Edit3 className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete book"
            >
              <Trash2 className="h-5 w-5 text-red-400" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100">
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
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
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

        {/* Footer Actions */}
        {isEditing && (
          <div className="border-t border-gray-100 p-6">
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 