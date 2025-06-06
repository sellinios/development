'use client';
import React from 'react';
import Image from 'next/image';
import AboutHeroSection from './AboutHerosection'; // Fixed import path

// About Content Section Component
const AboutContent = () => {
  return (
    <section id="about-content" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-[#0a2559] mb-4">ABOUT EPSILON</h2>
          <div className="w-12 h-1 bg-blue-500 mx-auto mb-12"></div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto text-xl">
          <div>
            <p className="text-lg text-gray-800 mb-6 leading-relaxed">
              Epsilon is a dedicated provider of quality crewing and training solutions to the most discerning Principals.
            </p>
            <p className="text-lg text-gray-800 leading-relaxed">
              Today, Epsilon is privileged to be the crew and training provider of choice for an elite group of the most demanding shipping companies, as well as being a long-serving member of key maritime organizations. We manage crewing affairs for more than 500 vessels, we deploy approximately 6,100 seafarers at any point in time, and we train more than 1,000 seafarers on a monthly basis.
            </p>
          </div>
          <div>
            <p className="text-lg text-gray-800 leading-relaxed">
              This collective competence is confidently built upon an extended value network that includes the most reputable shipping houses, our fully-controlled offices across nine countries, key institutional affiliations, and the most trustworthy partners. The net result is an unparalleled relational capital and an embedded know-how that are deployed for a sole purpose: to offer customized services and trouble-free solutions and benefits to our clients. We do so in ways that unconditionally meet our ethical standards, respect the well-being of our seafarers and employees and maintain the sustainability and future development of our operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main page component
export default function AboutUsPage() {
  return (
    <main>
      <AboutHeroSection />
      <AboutContent />
    </main>
  );
}