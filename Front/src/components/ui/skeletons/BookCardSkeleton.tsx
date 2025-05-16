'use client';

export default function BookCardSkeleton() {
  return (
    <div className="book-card animate-pulse">
      <div className="book-image-container bg-gray-300 dark:bg-gray-700"></div>
      <div className="book-content">
        <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
        <div className="flex justify-between">
          <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
}
