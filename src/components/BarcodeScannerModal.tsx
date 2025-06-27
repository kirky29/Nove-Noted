'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Camera, AlertCircle, BookOpen, Plus, Loader2, FlipHorizontal } from 'lucide-react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/browser';
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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment'); // Back camera by default
  const [lastScanTime, setLastScanTime] = useState(0);
  
  const webcamRef = useRef<Webcam>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize barcode reader
  useEffect(() => {
    if (isOpen) {
      readerRef.current = new BrowserMultiFormatReader();
      setHasCamera(true);
      setScanning(true);
      setError('');
      setScannedBook(null);
      setIsLoading(false);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isOpen]);

  const scanFrame = useCallback(() => {
    if (!webcamRef.current || !readerRef.current || !scanning || scannedBook || isLoading) {
      return;
    }

    try {
      const canvas = webcamRef.current.getCanvas();
      if (!canvas) return;

      // Prevent too frequent scans
      const now = Date.now();
      if (now - lastScanTime < 1000) return;

      try {
        const result = readerRef.current.decodeFromCanvas(canvas);
        if (result && result.getText()) {
          setLastScanTime(now);
          handleBarcodeScan(result.getText());
        }
      } catch (err: unknown) {
        // Ignore common "not found" errors - they're normal when no barcode is found
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (!errorMessage.includes('not found') && !errorMessage.includes('No QR')) {
          console.warn('Scan error:', err);
        }
      }
    } catch (err) {
      console.warn('Frame capture error:', err);
    }
  }, [scanning, scannedBook, isLoading, lastScanTime]);

  // Start scanning when camera is ready
  useEffect(() => {
    if (isOpen && scanning && !scannedBook && !error && hasCamera) {
      // Clear any existing interval
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }

      // Start scanning every 500ms
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 500);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isOpen, scanning, scannedBook, error, hasCamera, scanFrame]);

  const handleBarcodeScan = useCallback(async (result: string) => {
    if (!result || isLoading || scannedBook) return;
    
    console.log('✅ Barcode detected:', result);
    
    // Stop scanning
    setScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Clean the scanned result (remove any extra characters)
      const isbn = result.replace(/[^\d]/g, '');
      
      if (isbn.length < 10) {
        setError('Invalid barcode. Please try scanning again.');
        setTimeout(() => {
          setScanning(true);
          setIsLoading(false);
        }, 2000);
        return;
      }

      // Search for book by ISBN
      const books = await googleBooksAPI.searchBooks(`isbn:${isbn}`, 1);
      
      if (books.length > 0) {
        setScannedBook(books[0]);
      } else {
        setError('Book not found. Try scanning again or search manually.');
        setTimeout(() => {
          setScanning(true);
          setIsLoading(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error searching for book:', error);
      setError('Error searching for book. Please try again.');
      setTimeout(() => {
        setScanning(true);
        setIsLoading(false);
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, scannedBook]);

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
    setLastScanTime(0);
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
  };

  const handleCameraError = (error: string | DOMException) => {
    console.error('Camera error:', error);
    setHasCamera(false);
    setError('Unable to access camera. Please check permissions and try again.');
  };

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
    aspectRatio: { ideal: 16/9 }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - Fixed at top */}
      <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold">Scan Book Barcode</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Camera Toggle */}
          {scanning && hasCamera && (
            <button
              onClick={toggleCamera}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              title={`Switch to ${facingMode === 'environment' ? 'front' : 'back'} camera`}
            >
              <FlipHorizontal className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Camera Feed */}
        {!scannedBook && scanning && hasCamera && (
          <div className="h-full flex flex-col">
            <div className="text-center p-4 bg-black/60 text-white relative z-10">
              <p className="text-sm">
                Point your camera at the book&apos;s barcode
              </p>
              <p className="text-xs opacity-75 mt-1">
                Using {facingMode === 'environment' ? 'back' : 'front'} camera
              </p>
            </div>

            {/* Webcam Container */}
            <div className="flex-1 relative bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                onUserMediaError={handleCameraError}
                className="w-full h-full object-cover"
              />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/70 rounded-lg w-64 h-40 relative">
                  <div className="absolute inset-0 border-2 border-green-400/80 rounded-lg animate-pulse"></div>
                  <div className="absolute top-2 left-2 right-2 text-center">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                      {scanning ? 'Scanning...' : 'Processing...'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-6 flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="text-gray-900 font-medium">Searching for book...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error State - Full screen overlay */}
        {error && (
          <div className="h-full bg-black flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
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
                  className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Camera Access - Full screen overlay */}
        {!hasCamera && (
          <div className="h-full bg-black flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
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
                className="w-full px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Book Found - Overlay with scroll */}
        {scannedBook && (
          <div className="h-full bg-black/90 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-medium"
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}