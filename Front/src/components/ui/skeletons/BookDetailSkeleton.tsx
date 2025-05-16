'use client';

export default function BookDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-5 w-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
        <div className="relative h-64 md:h-96 bg-gray-300 dark:bg-gray-700"></div>
        
        <div className="p-6">
          <div className="h-8 w-3/4 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="h-5 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-5 w-32 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-5 w-40 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          
          <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-6"></div>
          
          <div className="space-y-4">
            <div className="h-6 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
