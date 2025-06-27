import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface LocalSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function LocalSearchBar({ 
  onSearch, 
  placeholder = "Search your books by title, author, or genre..." 
}: LocalSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
        placeholder={placeholder}
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
      )}
    </div>
  );
} 