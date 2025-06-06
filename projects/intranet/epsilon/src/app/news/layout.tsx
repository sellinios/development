// app/news/layout.tsx
import React from 'react';

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {children}
    </div>
  );
}