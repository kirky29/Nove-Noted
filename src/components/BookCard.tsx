import { useState } from 'react';
import { Book } from '@/types/book';
import { MoreVertical, Edit, Trash2, Star, Clock, CheckCircle2, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface BookCardProps {
  book: Book;
  onUpdate: (id: string, updates: Partial<Book>) => void;
  onDelete: (id: string) => void;
}

const statusConfig = {
  'want-to-read': {
    icon: Heart,
    label: 'Want to Read',
    color: 'text-red-600 bg-red-50',
  },
  'currently-reading': {
    icon: Clock,
    label: 'Currently Reading',
    color: 'text-orange-600 bg-orange-50',
  },
  'read': {
    icon: CheckCircle2,
    label: 'Read',
    color: 'text-green-600 bg-green-50',
  },
};

export default function BookCard({ book, onUpdate, onDelete }: BookCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const StatusIcon = statusConfig[book.status].icon;

  const handleStatusChange = (newStatus: Book['status']) => {
    const updates: Partial<Book> = { status: newStatus };
    
    // Set appropriate dates based on status
    if (newStatus === 'currently-reading' && !book.dateStarted) {
      updates.dateStarted = new Date();
    } else if (newStatus === 'read') {
      if (!book.dateStarted) updates.dateStarted = new Date();
      updates.dateFinished = new Date();
    }
    
    onUpdate(book.id, updates);
    setShowDropdown(false);
  };

  const handleRatingChange = (rating: number) => {
    onUpdate(book.id, { rating });
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[book.status].color}`}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig[book.status].label}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4 text-gray-400" />
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-10">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Change Status
              </div>
              {Object.entries(statusConfig).map(([status, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status as Book['status'])}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Icon className="h-4 w-4" />
                    {config.label}
                  </button>
                );
              })}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    onDelete(book.id);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Book
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book Cover Placeholder */}
      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-4 flex items-center justify-center">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`${book.title} cover`}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <div className="text-center">
            <div className="w-16 h-20 bg-white rounded-lg shadow-sm mx-auto mb-2 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <p className="text-xs text-gray-500">No cover</p>
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-gray-600 text-sm">by {book.author}</p>
        
        {book.genre && (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {book.genre}
          </span>
        )}

        {/* Reading Progress */}
        {book.status === 'currently-reading' && book.pages && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span>{book.currentPage || 0} / {book.pages} pages</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(((book.currentPage || 0) / book.pages) * 100, 100)}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Rating */}
        {book.status === 'read' && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingChange(star)}
                className="transition-colors"
              >
                <Star
                  className={`h-4 w-4 ${
                    star <= (book.rating || 0)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="text-xs text-gray-500 space-y-1">
          {book.dateStarted && (
            <p>Started: {format(book.dateStarted, 'MMM d, yyyy')}</p>
          )}
          {book.dateFinished && (
            <p>Finished: {format(book.dateFinished, 'MMM d, yyyy')}</p>
          )}
        </div>

        {/* Thoughts Preview */}
        {book.thoughts && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800 font-medium mb-1">My Thoughts</p>
            <p className="text-sm text-amber-700 line-clamp-3">
              {book.thoughts}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 