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
}; 