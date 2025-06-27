export interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: {
      type: string;
      identifier: string;
    }[];
    pageCount?: number;
    categories?: string[];
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    averageRating?: number;
    ratingsCount?: number;
    publisher?: string;
    language?: string;
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBookItem[];
}

export interface BookSearchResult {
  id: string;
  title: string;
  author: string;
  publishedYear?: string;
  description?: string;
  isbn?: string;
  pages?: number;
  genre?: string;
  coverUrl?: string;
  thumbnail?: string;
  publisher?: string;
  rating?: number;
}

export const googleBooksAPI = {
  // Search for books by query
  searchBooks: async (query: string, maxResults: number = 10): Promise<BookSearchResult[]> => {
    if (!query.trim()) return [];

    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${maxResults}&orderBy=relevance`
      );

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const data: GoogleBooksResponse = await response.json();

      if (!data.items) return [];

      return data.items.map(item => {
        const { volumeInfo } = item;
        
        // Extract ISBN
        const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
        const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
        const isbn = isbn13 || isbn10;

        // Extract publication year
        const publishedYear = volumeInfo.publishedDate ? 
          new Date(volumeInfo.publishedDate).getFullYear().toString() : 
          undefined;

        // Get the best available cover image
        const coverUrl = volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                        volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:');

        return {
          id: item.id,
          title: volumeInfo.title || 'Unknown Title',
          author: volumeInfo.authors?.join(', ') || 'Unknown Author',
          publishedYear,
          description: volumeInfo.description,
          isbn,
          pages: volumeInfo.pageCount,
          genre: volumeInfo.categories?.join(', '),
          coverUrl,
          thumbnail: volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:'),
          publisher: volumeInfo.publisher,
          rating: volumeInfo.averageRating,
        };
      });
    } catch (error) {
      console.error('Error searching Google Books:', error);
      return [];
    }
  },

  // Get detailed book information by Google Books ID
  getBookDetails: async (googleBooksId: string): Promise<BookSearchResult | null> => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes/${googleBooksId}`
      );

      if (!response.ok) {
        throw new Error(`Google Books API error: ${response.status}`);
      }

      const item: GoogleBookItem = await response.json();
      const { volumeInfo } = item;

      // Extract ISBN
      const isbn13 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
      const isbn10 = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
      const isbn = isbn13 || isbn10;

      // Extract publication year
      const publishedYear = volumeInfo.publishedDate ? 
        new Date(volumeInfo.publishedDate).getFullYear().toString() : 
        undefined;

      // Get the best available cover image
      const coverUrl = volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || 
                      volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:');

      return {
        id: item.id,
        title: volumeInfo.title || 'Unknown Title',
        author: volumeInfo.authors?.join(', ') || 'Unknown Author',
        publishedYear,
        description: volumeInfo.description,
        isbn,
        pages: volumeInfo.pageCount,
        genre: volumeInfo.categories?.join(', '),
        coverUrl,
        thumbnail: volumeInfo.imageLinks?.smallThumbnail?.replace('http:', 'https:'),
        publisher: volumeInfo.publisher,
        rating: volumeInfo.averageRating,
      };
    } catch (error) {
      console.error('Error fetching book details:', error);
      return null;
    }
  },

  // Extract series information from book title
  extractSeriesInfo: (title: string): { cleanTitle: string; series?: string; seriesNumber?: number } => {
    // Common patterns for series detection
    const patterns = [
      // "Title (Series Name #1)"
      /^(.+?)\s*\(([^)]+?)\s*#(\d+)\)$/,
      // "Title (Series Name Book 1)"
      /^(.+?)\s*\(([^)]+?)\s*Book\s*(\d+)\)$/i,
      // "Series Name #1: Title"
      /^([^:]+?)\s*#(\d+):\s*(.+)$/,
      // "Series Name Book 1: Title"
      /^([^:]+?)\s*Book\s*(\d+):\s*(.+)$/i,
      // "Title: Series Name #1"
      /^(.+?):\s*([^:]+?)\s*#(\d+)$/,
      // "Title - Series Name #1"
      /^(.+?)\s*-\s*([^-]+?)\s*#(\d+)$/,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        if (pattern.source.includes('#(\\d+):')) {
          // For patterns like "Series Name #1: Title"
          return {
            cleanTitle: match[3].trim(),
            series: match[1].trim(),
            seriesNumber: parseInt(match[2], 10),
          };
        } else if (pattern.source.includes('Book\\s*(\\d+):')) {
          // For patterns like "Series Name Book 1: Title"
          return {
            cleanTitle: match[3].trim(),
            series: match[1].trim(),
            seriesNumber: parseInt(match[2], 10),
          };
        } else {
          // For patterns like "Title (Series Name #1)"
          return {
            cleanTitle: match[1].trim(),
            series: match[2].trim(),
            seriesNumber: parseInt(match[3], 10),
          };
        }
      }
    }

    return { cleanTitle: title };
  },

  // Search for books in the same series
  searchSeriesBooks: async (author: string, title: string, maxResults: number = 20): Promise<import('@/types/book').SeriesBook[]> => {
    try {
      const { series } = googleBooksAPI.extractSeriesInfo(title);
      
      // If we detected a series, search for it specifically
      if (series) {
        const seriesQuery = `inauthor:"${author}" "${series}"`;
        const books = await googleBooksAPI.searchBooks(seriesQuery, maxResults);
        
        return books.map(book => {
          const bookSeriesInfo = googleBooksAPI.extractSeriesInfo(book.title);
          return {
            id: book.id,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            publishedYear: book.publishedYear,
            description: book.description,
            seriesNumber: bookSeriesInfo.seriesNumber,
            inLibrary: false, // Will be updated when checking against user's library
          };
        }).sort((a, b) => {
          // Sort by series number if available, otherwise by title
          if (a.seriesNumber && b.seriesNumber) {
            return a.seriesNumber - b.seriesNumber;
          }
          if (a.seriesNumber && !b.seriesNumber) return -1;
          if (!a.seriesNumber && b.seriesNumber) return 1;
          return a.title.localeCompare(b.title);
        });
      }

      // If no series detected, try searching for similar books by the author
      const authorQuery = `inauthor:"${author}"`;
      const books = await googleBooksAPI.searchBooks(authorQuery, maxResults);
      
      // Filter and find potentially related books
      const potentialSeriesBooks = books.filter(book => {
        const bookSeriesInfo = googleBooksAPI.extractSeriesInfo(book.title);
        const currentBookInfo = googleBooksAPI.extractSeriesInfo(title);
        
        // Check if books might be in the same series
        if (bookSeriesInfo.series && currentBookInfo.series) {
          return bookSeriesInfo.series.toLowerCase().includes(currentBookInfo.series.toLowerCase()) ||
                 currentBookInfo.series.toLowerCase().includes(bookSeriesInfo.series.toLowerCase());
        }
        
        // Look for similar title patterns
        const cleanCurrentTitle = currentBookInfo.cleanTitle.toLowerCase();
        const cleanBookTitle = bookSeriesInfo.cleanTitle.toLowerCase();
        
        // Check for common words or patterns
        const currentWords = cleanCurrentTitle.split(' ').filter(word => word.length > 3);
        const bookWords = cleanBookTitle.split(' ').filter(word => word.length > 3);
        
        const commonWords = currentWords.filter(word => 
          bookWords.some(bookWord => bookWord.includes(word) || word.includes(bookWord))
        );
        
        return commonWords.length >= 1;
      });

      return potentialSeriesBooks.map(book => {
        const bookSeriesInfo = googleBooksAPI.extractSeriesInfo(book.title);
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          publishedYear: book.publishedYear,
          description: book.description,
          seriesNumber: bookSeriesInfo.seriesNumber,
          inLibrary: false,
        };
      }).sort((a, b) => {
        if (a.seriesNumber && b.seriesNumber) {
          return a.seriesNumber - b.seriesNumber;
        }
        if (a.seriesNumber && !b.seriesNumber) return -1;
        if (!a.seriesNumber && b.seriesNumber) return 1;
        return a.title.localeCompare(b.title);
      });
    } catch (error) {
      console.error('Error searching for series books:', error);
      return [];
    }
  },
}; 