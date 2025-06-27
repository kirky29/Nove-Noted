'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Camera, AlertCircle, BookOpen, Plus, Loader2 } from 'lucide-react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { googleBooksAPI, BookSearchResult } from '@/utils/googleBooks';
import { Book, ReadingStatus } from '@/types/book';
import Image from 'next/image';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Omit<Book, 'id' | 'dateAdded'>) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onAddBook }: BarcodeScannerModalProps) {
  const [scannedBook, setScannedBook] = useState<BookSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ReadingStatus>('want-to-read');
  const [hasCamera, setHasCamera] = useState(true);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerId = 'qr-code-scanner';

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setScannedBook(null);
      setError('');
      setScanning(true);
      setIsLoading(false);
      setHasCamera(true);
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const startScanning = () => {
    // Clean up any existing scanner
    stopScanning();

    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      };

      const scanner = new Html5QrcodeScanner(
        scannerId,
        config,
        false // verbose logging disabled
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          console.log('Barcode detected:', decodedText);
          handleBarcodeScan(decodedText);
        },
        (errorMessage) => {
          // This gets called for every failed scan attempt, which is normal
          // Only log real errors, not the constant "No QR code found" messages
          if (!errorMessage.includes('No') && !errorMessage.includes('not found')) {
            console.error('Scanner error:', errorMessage);
          }
        }
      );
    } catch (err) {
      console.error('Scanner initialization error:', err);
      handleScanError(err instanceof Error ? err.message : String(err));
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.log('Scanner cleanup error (ignored):', err);
      }
    }
  };

  const handleBarcodeScan = async (result: string) => {
    if (!result || isLoading) return;
    
    setIsLoading(true);
    setScanning(false);
    setError('');

    try {
      // Clean the scanned result (remove any extra characters)
      const isbn = result.replace(/[^\d]/g, '');
      
      if (isbn.length < 10) {
        setError('Invalid barcode. Please try scanning again.');
        setScanning(true);
        setIsLoading(false);
        setTimeout(() => {
          if (!scannedBook) startScanning();
        }, 1000);
        return;
      }

      // Search for book by ISBN
      const books = await googleBooksAPI.searchBooks(`isbn:${isbn}`, 1);
      
      if (books.length > 0) {
        setScannedBook(books[0]);
        // Stop scanning when book is found
        await stopScanning();
      } else {
        setError('Book not found. Try scanning again or search manually.');
        setScanning(true);
        setTimeout(() => {
          if (!scannedBook) startScanning();
        }, 1000);
      }
    } catch (error) {
      console.error('Error searching for book:', error);
      setError('Error searching for book. Please try again.');
      setScanning(true);
      setTimeout(() => {
        if (!scannedBook) startScanning();
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToLibrary = () => {
    if (!scannedBook) return;

    const bookData: Omit<Book, 'id' | 'dateAdded'> = {
      title: scannedBook.title,
      author: scannedBook.author,
      isbn: scannedBook.isbn,
      coverUrl: scannedBook.coverUrl,
      pages: scannedBook.pages,
      genre: scannedBook.genre,
      status: status,
      dateStarted: status === 'currently-reading' ? new Date() : undefined,
      dateFinished: status === 'read' ? new Date() : undefined,
    };

    onAddBook(bookData);
    onClose();
  };

  const handleScanAgain = () => {
    setScannedBook(null);
    setError('');
    setScanning(true);
    setIsLoading(false);
    startScanning();
  };

  const handleScanError = (error: string) => {
    console.error('Scanner error details:', error);
    if (error.includes('camera') || error.includes('permission') || error.includes('NotAllowedError')) {
      setHasCamera(false);
      setError('Camera access denied. Please enable camera permissions and try again.');
    } else if (error.includes('NotFoundError') || error.includes('No camera')) {
      setHasCamera(false);
      setError('No camera found. Please make sure your device has a camera.');
    } else {
      setError(`Scanner error: ${error}. Please try again.`);
    }
    setScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Scan Book Barcode</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Scanner or Results */}
          {!scannedBook && scanning && hasCamera && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Point your camera at the book&apos;s barcode
                </p>
              </div>

              {/* Scanner Container */}
              <div id={scannerId} className="w-full"></div>

              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                  <span className="text-gray-600">Searching for book...</span>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-800">Error</span>
                </div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleScanAgain}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* No Camera Access */}
          {!hasCamera && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-yellow-800">Camera Access Required</span>
                </div>
                <p className="text-yellow-700 text-sm">
                  Please enable camera permissions in your browser settings to use the barcode scanner.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Book Found */}
          {scannedBook && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-800">Book Found!</span>
                </div>
                <p className="text-green-700 text-sm">
                  We found a match for the scanned barcode.
                </p>
              </div>

              {/* Book Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex gap-4">
                  {scannedBook.coverUrl ? (
                    <Image
                      src={scannedBook.coverUrl}
                      alt={`${scannedBook.title} cover`}
                      width={80}
                      height={120}
                      className="rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-30 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                      {scannedBook.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      by {scannedBook.author}
                    </p>
                    
                    {scannedBook.pages && (
                      <p className="text-xs text-gray-500">
                        {scannedBook.pages} pages
                      </p>
                    )}
                    {scannedBook.isbn && (
                      <p className="text-xs text-gray-500">
                        ISBN: {scannedBook.isbn}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reading Status
                </label>
                <div className="grid grid-cols-3 gap-2">
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
                      <div className={`p-2 rounded-lg border-2 text-center text-xs font-medium transition-all ${
                        status === statusOption.value 
                          ? statusOption.color + ' ring-2 ring-offset-2'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        {statusOption.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAddToLibrary}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add to Library
                </button>
                <button
                  onClick={handleScanAgain}
                  className="px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Scan Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 