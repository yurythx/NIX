'use client';

import React, { ReactNode } from 'react';

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

const PageTitle: React.FC<PageTitleProps> = ({ 
  title, 
  description, 
  icon, 
  actions 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4 md:mb-0">
        {icon && (
          <div className="mr-4 text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageTitle;
