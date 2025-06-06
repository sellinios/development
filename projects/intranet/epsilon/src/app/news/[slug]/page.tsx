import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArticleContent from './ArticleContent';

// Make this a dynamic page to avoid build-time fetch issues
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour

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

async function getArticle(slug: string): Promise<Article | null> {
  try {
    // Updated API endpoint without 'articles' segment
    const API_URL = `https://site.epsilonhellas.com/api/news/${slug}/`;

    // Log the API URL we're using
    console.log(`Fetching article from: ${API_URL}`);

    const res = await fetch(API_URL, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      if (res.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch article: ${res.status}`);
    }

    return res.json();
  } catch (error) {
    console.error(`Error loading article with slug ${slug}:`, error);
    return null;
  }
}

type PageProps = {
  params: {
    slug: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Article Not Found</h1>
        <p className="text-gray-600 mb-8">
          We couldn't find the article you're looking for. It may have been removed or the URL might be incorrect.
        </p>
        <Link
          href="/news"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
        >
          Return to News Page
        </Link>
      </div>
    );
  }

  // Format the publication date
  const formattedDate = new Date(article.published_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button with improved styling */}
      <Link
        href="/news"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8 group transition-colors duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to News
      </Link>

      {/* Article header with improved typography */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800 leading-tight">{article.title}</h1>
        <div className="flex items-center text-gray-600">
          <time
            dateTime={article.published_date}
            className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium"
          >
            {formattedDate}
          </time>
        </div>
      </header>

      {/* Featured image with improved styling */}
      {article.image && (
        <figure className="mb-10 overflow-hidden rounded-xl shadow-lg">
          <img
            src={article.image.startsWith('/') ? `https://site.epsilonhellas.com${article.image}` : article.image}
            alt={article.title}
            className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
          />
        </figure>
      )}

      {/* Article content with enhanced formatting using the client component */}
      <ArticleContent content={article.content} />

      {/* Article footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          href="/news"
          className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-300"
        >
          Browse More News
        </Link>
      </div>
    </article>
  );
}