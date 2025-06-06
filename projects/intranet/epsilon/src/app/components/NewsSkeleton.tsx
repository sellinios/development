'use client';

import React from 'react';

export default function NewsSkeleton() {
  // Create an array of 6 items (same as ITEMS_PER_PAGE)
  const skeletonItems = Array.from({ length: 6 });

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {skeletonItems.map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-video bg-gray-200"></div>
            
            <div className="p-6">
              {/* Date skeleton */}
              <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
              
              {/* Title skeleton - two lines */}
              <div className="h-6 w-full bg-gray-300 rounded mb-2"></div>
              <div className="h-6 w-3/4 bg-gray-300 rounded mb-3"></div>
              
              {/* Content skeleton - three lines */}
              <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
              <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded mb-4"></div>
              
              {/* Read more skeleton */}
              <div className="h-4 w-24 bg-blue-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}