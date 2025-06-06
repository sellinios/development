'use client';
import React from 'react';
import Image from 'next/image';

const AboutHeroSection = () => {
  return (
    <section className="relative h-[600px] flex flex-col justify-center items-center text-white text-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/AboutUs.jpg" // Updated path to point to public/images directory
          alt="About Us"
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          priority
        />
        {/* Grey overlay */}
        <div className="absolute inset-0 bg-gray-500/60"></div>
      </div>
      <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-8 tracking-wider text-center">
              WE ARE AN ELITE PROVIDER OF CREWING <br/>
              SOLUTIONS
      </h1>
    </div>
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-10 h-10 border-2 border-white rounded-full flex justify-center items-center cursor-pointer hover:bg-white/20 transition-colors"
        onClick={() => {
          document.getElementById('about-content')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        ▼
      </div>
    </section>
  );
};

export default AboutHeroSection;