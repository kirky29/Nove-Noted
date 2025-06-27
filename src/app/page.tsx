'use client';

import { useState, useEffect } from 'react';
import { Book, ReadingStatus } from '@/types/book';
import { storage } from '@/utils/storage';
import { BookOpen, Plus, Clock, CheckCircle2, Heart } from 'lucide-react';
import BookCard from '@/components/BookCard';
import AddBookModal from '@/components/AddBookModal';
import StatsCard from '@/components/StatsCard';

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReadingStatus | 'all'>('all');
  const [stats, setStats] = useState({
    total: 0,
    read: 0,
    currentlyReading: 0,
    wantToRead: 0,
  });

  // Load books on component mount
  useEffect(() => {
    const loadedBooks = storage.getBooks();
    setBooks(loadedBooks);
    setStats(storage.getReadingStats());
  }, []);

  // Handle adding a new book
  const handleAddBook = (bookData: Omit<Book, 'id' | 'dateAdded'>) => {
    const newBook = storage.addBook(bookData);
    setBooks(prev => [...prev, newBook]);
    setStats(storage.getReadingStats());
    setIsAddModalOpen(false);
  };

  // Handle updating a book
  const handleUpdateBook = (id: string, updates: Partial<Book>) => {
    const updatedBook = storage.updateBook(id, updates);
    if (updatedBook) {
      setBooks(prev => prev.map(book => book.id === id ? updatedBook : book));
      setStats(storage.getReadingStats());
    }
  };

  // Handle deleting a book
  const handleDeleteBook = (id: string) => {
    if (storage.deleteBook(id)) {
      setBooks(prev => prev.filter(book => book.id !== id));
      setStats(storage.getReadingStats());
    }
  };

  // Filter books based on active tab
  const filteredBooks = activeTab === 'all' 
    ? books 
    : books.filter(book => book.status === activeTab);

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
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Add Book
            </button>
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
                  {activeTab === 'all' ? 'No books yet' : `No books in "${tabs.find(t => t.key === activeTab)?.label}"`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'all' 
                    ? 'Start building your personal library by adding your first book!'
                    : 'Books you add to this category will appear here.'
                  }
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Book
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onUpdate={handleUpdateBook}
                    onDelete={handleDeleteBook}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <AddBookModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddBook}
        />
      )}
    </div>
  );
}
