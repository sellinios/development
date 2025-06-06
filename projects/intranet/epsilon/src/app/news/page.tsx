import React, { Suspense } from 'react';
import NewsSkeleton from '../components/NewsSkeleton';
import InfiniteScrollNews from '../components/InfiniteScrollNews';

interface Article {
  id: number;
  title: string;
  author: number;
  content: string;
  slug: string;
  created_at: string;
  published_date: string;
  category: number;
  image: string | null;
  meta_title: string | null;
  meta_description: string;
  meta_keywords: string | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
}

// Set up pagination parameters
const ITEMS_PER_PAGE = 6;

async function getInitialArticles(): Promise<{
  articles: Article[];
  totalCount: number;
  nextPageUrl: string | null;
}> {
  try {
    // Use pagination parameters to fetch only the first page
    const API_URL = `https://site.epsilonhellas.com/api/news/?page=1&per_page=${ITEMS_PER_PAGE}`;
    console.log(`Fetching initial articles from: ${API_URL}`);

    const res = await fetch(API_URL, {
      cache: 'no-store', // Don't cache to ensure fresh data
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      return { articles: [], totalCount: 0, nextPageUrl: null };
    }

    try {
      // Parse the response with pagination metadata
      const paginatedData = await res.json() as PaginatedResponse;

      return {
        articles: paginatedData.results || [],
        totalCount: paginatedData.count || 0,
        nextPageUrl: paginatedData.next
      };
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      return { articles: [], totalCount: 0, nextPageUrl: null };
    }
  } catch (error) {
    console.error('Error loading articles:', error);
    return { articles: [], totalCount: 0, nextPageUrl: null };
  }
}

// Use Next.js 15 metadata API for proper caching
export const dynamic = 'force-dynamic';

// Main page component
export default async function Page() {
  // Fetch only the first page of articles
  const { articles: initialArticles, totalCount, nextPageUrl } = await getInitialArticles();

  return (
    <main className="content-container">
      {/* Page Header */}
      <div className="flex flex-col items-center justify-center text-center mb-12 mt-8">
        <h1 className="text-4xl font-bold mb-3 pt-8 inline-block">News & Events</h1>
        <div className="w-20 h-1 bg-blue-600 mb-6"></div>
        <p className="text-gray-600 max-w-3xl">
          Stay informed with the latest news and updates from Epsilon Hellas
        </p>
      </div>

      {/* News Content with Infinite Scrolling */}
      <Suspense fallback={<NewsSkeleton />}>
        <InfiniteScrollNews
          initialArticles={initialArticles}
          totalCount={totalCount}
          nextPageUrl={nextPageUrl}
        />
      </Suspense>
    </main>
  );
}