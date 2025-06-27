import { useState } from 'react';
import { Book, ReadingStatus } from '@/types/book';
import { X, BookOpen, User, Hash, Image, FileText, Tag } from 'lucide-react';

interface AddBookModalProps {
  onClose: () => void;
  onAdd: (book: Omit<Book, 'id' | 'dateAdded'>) => void;
}

export default function AddBookModal({ onClose, onAdd }: AddBookModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    coverUrl: '',
    pages: '',
    genre: '',
    status: 'want-to-read' as ReadingStatus,
    rating: 0,
    thoughts: '',
    notes: '',
    currentPage: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.author.trim()) {
      alert('Please fill in the title and author fields.');
      return;
    }

    const bookData: Omit<Book, 'id' | 'dateAdded'> = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      isbn: formData.isbn.trim() || undefined,
      coverUrl: formData.coverUrl.trim() || undefined,
      pages: formData.pages ? parseInt(formData.pages) : undefined,
      genre: formData.genre.trim() || undefined,
      status: formData.status,
      rating: formData.rating || undefined,
      thoughts: formData.thoughts.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      currentPage: formData.currentPage ? parseInt(formData.currentPage) : undefined,
      dateStarted: formData.status === 'currently-reading' ? new Date() : undefined,
      dateFinished: formData.status === 'read' ? new Date() : undefined,
    };

    onAdd(bookData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Book</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="h-4 w-4" />
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter book title"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4" />
                Author *
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter author name"
                required
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Hash className="h-4 w-4" />
                ISBN
              </label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => handleInputChange('isbn', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="978-0123456789"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                Pages
              </label>
              <input
                type="number"
                value={formData.pages}
                onChange={(e) => handleInputChange('pages', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="350"
                min="1"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4" />
                Genre
              </label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => handleInputChange('genre', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Fiction, Mystery..."
              />
            </div>
          </div>

          {/* Cover URL */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Image className="h-4 w-4" />
              Cover Image URL
            </label>
            <input
              type="url"
              value={formData.coverUrl}
              onChange={(e) => handleInputChange('coverUrl', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="https://example.com/book-cover.jpg"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Reading Status</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'want-to-read', label: 'Want to Read', color: 'border-red-200 bg-red-50 text-red-700' },
                { value: 'currently-reading', label: 'Currently Reading', color: 'border-orange-200 bg-orange-50 text-orange-700' },
                { value: 'read', label: 'Read', color: 'border-green-200 bg-green-50 text-green-700' },
              ].map((status) => (
                <label key={status.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status.value}
                    checked={formData.status === status.value}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.status === status.value 
                      ? status.color + ' ring-2 ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="font-medium">{status.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Current Page (for currently reading books) */}
          {formData.status === 'currently-reading' && formData.pages && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Current Page</label>
              <input
                type="number"
                value={formData.currentPage}
                onChange={(e) => handleInputChange('currentPage', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Current page number"
                min="0"
                max={formData.pages}
              />
            </div>
          )}

          {/* Rating (for read books) */}
          {formData.status === 'read' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleInputChange('rating', star)}
                    className={`p-2 rounded-lg transition-colors ${
                      star <= formData.rating
                        ? 'text-yellow-400 bg-yellow-50'
                        : 'text-gray-300 hover:text-yellow-300 hover:bg-gray-50'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Thoughts & Notes */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Thoughts</label>
              <textarea
                value={formData.thoughts}
                onChange={(e) => handleInputChange('thoughts', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="What did you think about this book?"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Any additional notes or quotes..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Add Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 