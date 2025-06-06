'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

interface InfiniteScrollNewsProps {
  initialArticles: Article[];
  totalCount: number;
  nextPageUrl: string | null;
}

export default function InfiniteScrollNews({
  initialArticles,
  totalCount,
  nextPageUrl
}: InfiniteScrollNewsProps) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nextUrl, setNextUrl] = useState<string | null>(nextPageUrl);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextUrl && !isLoading) {
          loadMoreArticles();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [nextUrl, isLoading]);

  const loadMoreArticles = async () => {
    if (isLoading || !nextUrl) return;

    setIsLoading(true);

    try {
      const response = await fetch(nextUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch more articles: ${response.status}`);
      }

      const paginatedData = await response.json() as PaginatedResponse;

      if (paginatedData.results && paginatedData.results.length > 0) {
        setArticles((prevArticles) => [...prevArticles, ...paginatedData.results]);
        setNextUrl(paginatedData.next);
      } else {
        setNextUrl(null);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
      setNextUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Function to truncate content for preview
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Remove HTML tags for safer display
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  if (articles.length === 0) {
    return <div className="text-center py-10">No articles found.</div>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {articles.map((article) => (
          <div key={article.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1">
            <Link href={`/news/${article.slug}`}>
              <div className="aspect-video relative overflow-hidden">
                {article.image ? (
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-blue-600 text-sm mb-2">
                  {formatDate(article.published_date)}
                </p>
                <h2 className="font-bold text-xl mb-3 text-gray-800 line-clamp-2">
                  {article.title}
                </h2>
                <div className="text-gray-600 mb-4 line-clamp-3">
                  {stripHtml(truncateContent(article.content))}
                </div>
                <div className="text-blue-600 font-medium hover:underline">
                  Read More
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Show loading indicator and observer target */}
      <div ref={observerTarget} className="w-full py-8 flex justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">Loading more articles...</span>
          </div>
        ) : nextUrl ? (
          <div className="h-10"></div> // Invisible element to trigger the observer
        ) : (
          <p className="text-gray-500 text-center">
            {articles.length > 0 ? (
              articles.length >= totalCount
                ? "You've reached the end of our articles"
                : "Loading more articles failed"
            ) : (
              "No articles found"
            )}
          </p>
        )}
      </div>
    </div>
  );
}