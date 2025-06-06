import React from 'react';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="relative h-96 flex items-center justify-center overflow-hidden">
      {/* Background image with proper Next.js Image for optimization */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/facts.jpg"
          alt="Training Services background"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          className="brightness-50"
        />
      </div>
      
      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase" id="page-title">
          Epsilon is proud of the following plus one thing:
          <br />
          our unparalleled passion for what we do
        </h1>
        <div className="w-16 h-1 bg-[#003070] mx-auto" aria-hidden="true"></div>
      </div>
    </div>
  );
}