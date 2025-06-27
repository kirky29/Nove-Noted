import { useState, useEffect, useRef } from 'react';
import { Book, ReadingStatus, WishListBook } from '@/types/book';
import { googleBooksAPI, BookSearchResult } from '@/utils/googleBooks';
import { X, Search, BookOpen, Calendar, Hash, Loader2, Plus, Star } from 'lucide-react';
import Image from 'next/image';

interface BookSearchModalProps {
  onClose: () => void;
  onAdd: (book: Omit<Book, 'id' | 'dateAdded'>) => void;
  onAddToWishList: (book: Omit<WishListBook, 'id' | 'dateAdded'>) => void;
}

export default function BookSearchModal({ onClose, onAdd, onAddToWishList }: BookSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
  const [status, setStatus] = useState<ReadingStatus>('want-to-read');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await googleBooksAPI.searchBooks(searchQuery, 20);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleBookSelect = (book: BookSearchResult) => {
    setSelectedBook(book);
  };

  const handleAddBook = () => {
    if (!selectedBook) return;

    const bookData: Omit<Book, 'id' | 'dateAdded'> = {
      title: selectedBook.title,
      author: selectedBook.author,
      isbn: selectedBook.isbn,
      coverUrl: selectedBook.coverUrl,
      pages: selectedBook.pages,
      genre: selectedBook.genre,
      status: status,
      dateStarted: status === 'currently-reading' ? new Date() : undefined,
      dateFinished: status === 'read' ? new Date() : undefined,
    };

    onAdd(bookData);
  };

  const handleAddToWishList = () => {
    if (!selectedBook) return;

    const wishListBookData: Omit<WishListBook, 'id' | 'dateAdded'> = {
      title: selectedBook.title,
      author: selectedBook.author,
      isbn: selectedBook.isbn,
      coverUrl: selectedBook.coverUrl,
      pages: selectedBook.pages,
      genre: selectedBook.genre,
      publisher: selectedBook.publisher,
      publishedYear: selectedBook.publishedYear,
      description: selectedBook.description,
    };

    onAddToWishList(wishListBookData);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg">
              <Search className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Search & Add Books</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Search Input */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Search for books by title, author, or ISBN..."
              autoFocus
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Results */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Search Results
                {searchResults.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({searchResults.length} found)
                  </span>
                )}
              </h3>

              {searchQuery.trim().length < 2 ? (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Start typing to search for books...</p>
                </div>
              ) : searchResults.length === 0 && !isSearching ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No books found. Try a different search term.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.map((book) => (
                    <div
                      key={book.id}
                      onClick={() => handleBookSelect(book)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        selectedBook?.id === book.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Book Cover */}
                        <div className="flex-shrink-0">
                          {book.thumbnail ? (
                            <Image
                              src={book.thumbnail}
                              alt={`${book.title} cover`}
                              width={60}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-15 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                            {book.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-1">
                            by {book.author}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                            {book.publishedYear && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {book.publishedYear}
                              </span>
                            )}
                            {book.pages && (
                              <span>{book.pages} pages</span>
                            )}
                            {book.genre && (
                              <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                {truncateText(book.genre, 20)}
                              </span>
                            )}
                          </div>

                          {book.description && (
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {truncateText(stripHtml(book.description), 120)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Book Preview */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected Book
              </h3>

              {selectedBook ? (
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex gap-4">
                    {selectedBook.coverUrl ? (
                      <Image
                        src={selectedBook.coverUrl}
                        alt={`${selectedBook.title} cover`}
                        width={100}
                        height={140}
                        className="rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-25 h-35 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-2">
                        {selectedBook.title}
                      </h4>
                      <p className="text-gray-700 mb-2">by {selectedBook.author}</p>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {selectedBook.publishedYear && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Published: {selectedBook.publishedYear}
                          </div>
                        )}
                        {selectedBook.isbn && (
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            ISBN: {selectedBook.isbn}
                          </div>
                        )}
                        {selectedBook.pages && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {selectedBook.pages} pages
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedBook.description && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Description</h5>
                      <p className="text-sm text-gray-600 line-clamp-4">
                        {stripHtml(selectedBook.description)}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {/* Add to Wish List Button */}
                    <button
                      onClick={handleAddToWishList}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      <Star className="h-5 w-5" />
                      Add to Wish List
                    </button>

                    {/* Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-50 text-gray-500">or</span>
                      </div>
                    </div>

                    {/* Status Selection for Library */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">Add to Library with Status</h5>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { value: 'want-to-read', label: 'Want to Read', color: 'border-red-200 bg-red-50 text-red-700' },
                          { value: 'currently-reading', label: 'Currently Reading', color: 'border-orange-200 bg-orange-50 text-orange-700' },
                          { value: 'read', label: 'Read', color: 'border-green-200 bg-green-50 text-green-700' },
                        ].map((statusOption) => (
                          <label key={statusOption.value} className="cursor-pointer">
                            <input
                              type="radio"
                              name="status"
                              value={statusOption.value}
                              checked={status === statusOption.value}
                              onChange={(e) => setStatus(e.target.value as ReadingStatus)}
                              className="sr-only"
                            />
                            <div className={`p-3 rounded-lg border-2 text-center text-xs font-medium transition-all ${
                              status === statusOption.value 
                                ? statusOption.color + ' ring-2 ring-offset-2'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              {statusOption.label}
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Add to Library Button */}
                      <button
                        onClick={handleAddBook}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                      >
                        <Plus className="h-5 w-5" />
                        Add to My Library
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">Select a book from the search results to preview and add it to your library or wish list.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 