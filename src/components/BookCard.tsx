import { Book } from '@/types/book';
import { Star, Home, Tablet, Eye } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface BookCardProps {
  book: Book;
  onUpdate: (id: string, updates: Partial<Book>) => void;
}

export default function BookCard({ book, onUpdate }: BookCardProps) {
  const router = useRouter();

  const handleRatingChange = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when rating
    onUpdate(book.id, { rating });
  };

  const handleCardClick = () => {
    router.push(`/book/${book.id}`);
  };

  const getOwnershipIcon = () => {
    switch (book.ownershipType || 'physical') {
      case 'physical':
        return <Home className="h-3 w-3" />;
      case 'digital':
        return <Tablet className="h-3 w-3" />;
      case 'interested':
        return <Eye className="h-3 w-3" />;
      default:
        return <Home className="h-3 w-3" />;
    }
  };

  const getOwnershipLabel = () => {
    switch (book.ownershipType || 'physical') {
      case 'physical':
        return 'Physical';
      case 'digital':
        return 'Digital';
      case 'interested':
        return 'Interested';
      default:
        return 'Physical';
    }
  };

  const getOwnershipColor = () => {
    switch (book.ownershipType || 'physical') {
      case 'physical':
        return 'from-green-50 to-emerald-50 text-green-700 border-green-100';
      case 'digital':
        return 'from-blue-50 to-cyan-50 text-blue-700 border-blue-100';
      case 'interested':
        return 'from-amber-50 to-yellow-50 text-amber-700 border-amber-100';
      default:
        return 'from-green-50 to-emerald-50 text-green-700 border-green-100';
    }
  };

  return (
    <div 
      className="book-card bg-white rounded-xl p-3 sm:p-4 flex flex-col items-center border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${book.title} by ${book.author}`}
    >
      {/* Book Cover */}
      <div className="w-full flex justify-center mb-3">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={`${book.title} cover`}
            width={180}
            height={260}
            className="rounded-lg object-cover w-[140px] h-[210px] sm:w-[160px] sm:h-[240px] lg:w-[180px] lg:h-[260px] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-[140px] h-[210px] sm:w-[160px] sm:h-[240px] lg:w-[180px] lg:h-[260px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <span className="text-3xl text-gray-400">📚</span>
          </div>
        )}
      </div>
      
      {/* Book Info */}
      <div className="w-full flex flex-col items-center space-y-2">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base text-center leading-tight line-clamp-2 min-h-[2.5rem] flex items-center">
          {book.title}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm text-center line-clamp-1 mb-1">{book.author}</p>
        
        {/* Genre and Ownership badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {book.genre && (
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
              {book.genre}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getOwnershipColor()} text-xs rounded-full font-medium border`}>
            {getOwnershipIcon()}
            <span>{getOwnershipLabel()}</span>
          </span>
        </div>
        
        {/* Status/Progress */}
        {book.status === 'currently-reading' && book.pages && (
          <div className="w-full mt-2 px-1">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.min(((book.currentPage || 0) / book.pages) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="font-medium">Progress</span>
              <span className="font-mono">{book.currentPage || 0}/{book.pages}</span>
            </div>
          </div>
        )}
        
        {/* Rating */}
        {book.status === 'read' && (
          <div className="flex items-center gap-1 mt-2 p-2 bg-yellow-50 rounded-lg">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={(e) => handleRatingChange(star, e)}
                className={`h-4 w-4 cursor-pointer transition-colors duration-150 ${
                  star <= (book.rating || 0) 
                    ? 'text-yellow-500 fill-current hover:text-yellow-600' 
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 