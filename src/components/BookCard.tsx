import { Book } from '@/types/book';
import { Star, Clock, CheckCircle2, Heart } from 'lucide-react';
import Image from 'next/image';

interface BookCardProps {
  book: Book;
  onUpdate: (id: string, updates: Partial<Book>) => void;
}

export default function BookCard({ book, onUpdate }: BookCardProps) {
  const handleRatingChange = (rating: number) => {
    onUpdate(book.id, { rating });
  };

  return (
    <div className="bg-white rounded-lg p-2 flex flex-col items-center border border-gray-100">
      {/* Book Cover */}
      <div className="w-full flex justify-center">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={`${book.title} cover`}
            width={80}
            height={120}
            className="rounded-md object-cover w-[80px] h-[120px]"
          />
        ) : (
          <div className="w-[80px] h-[120px] bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-lg text-gray-400">📚</span>
          </div>
        )}
      </div>
      {/* Book Info */}
      <div className="w-full flex flex-col items-center mt-2 space-y-0.5">
        <h3 className="font-semibold text-gray-900 text-xs text-center leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-gray-600 text-xs text-center line-clamp-1">{book.author}</p>
        {book.genre && (
          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full mt-0.5">{book.genre}</span>
        )}
        {/* Status/Progress */}
        {book.status === 'currently-reading' && book.pages && (
          <div className="w-full mt-1">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(((book.currentPage || 0) / book.pages) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
              <span>Progress</span>
              <span>{book.currentPage || 0}/{book.pages}</span>
            </div>
          </div>
        )}
        {/* Rating */}
        {book.status === 'read' && (
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => handleRatingChange(star)}
                className={`h-3 w-3 cursor-pointer ${star <= (book.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 