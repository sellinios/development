'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from "next/image";

export default function HeroSection() {
  // Define carousel images
  const carouselImages = [
    { src: "/Home1.jpg", alt: "Home image 1" },
    { src: "/Home2.jpg", alt: "Home image 2" },
    { src: "/Home3.jpg", alt: "Home image 3" },
  ];

  // Define carousel content based on index
  const getSlideContent = (index: number) => {
    if (index === 0) {
      return (
        <>
          <h1 className="text-5xl font-bold mb-8 tracking-wider font-montserrat text-center">ALL ABOUT CREW</h1>
          <div className="flex gap-10 mb-20">
            {['MANAGEMENT', 'MANNING', 'TRAINING'].map((category, idx) => (
              <div
                key={idx}
                className="text-2xl font-semibold tracking-wide py-2.5 border-b-2 border-transparent hover:border-white cursor-pointer transition-colors font-montserrat"
              >
                {category}
              </div>
            ))}
          </div>
        </>
      );
    } else if (index === 1) {
      return (
        <h1 className="text-5xl font-bold mb-20 tracking-wider font-montserrat text-center">
          WE CO-CREATE LONG-LASTING VALUE<br />
          THROUGH GLOBALLY ELITE CREWING<br />
          OPERATIONS
        </h1>
      );
    } else {
      return (
        <h1 className="text-5xl font-bold mb-20 tracking-wider font-montserrat text-center">
          WE ARE THE PARTNER OF CHOICE FOR<br />
          SEVERAL OF THE WORLD'S LEADING<br />
          TRADITIONAL SHIPPING HOUSES
        </h1>
      );
    }
  };

  const [currentIndex, setCurrentIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    let newIndex = index;
    if (index < 0) newIndex = carouselImages.length - 1;
    else if (index >= carouselImages.length) newIndex = 0;
    setCurrentIndex(newIndex);
  }, [carouselImages.length]);

  // Auto rotation
  useEffect(() => {
    const intervalId = setInterval(() => {
      goToSlide((currentIndex + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [currentIndex, goToSlide, carouselImages.length]);

  // Function to handle the scroll down click
  const handleScrollDown = () => {
    // Scroll to the next section - you can use window.scrollTo as an alternative
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative h-[600px] flex flex-col justify-center items-center text-white text-center overflow-hidden">
      {/* Carousel background images */}
      {carouselImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            priority={index === 0}
          />
          {/* Grey overlay to maintain readability */}
          <div className="absolute inset-0 bg-gray-500/60"></div>
        </div>
      ))}
      <div className="relative z-10">
        {getSlideContent(currentIndex)}
        {/* Carousel indicators */}
        <div className="flex space-x-2 mb-8 justify-center">
          {carouselImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-10 h-10 border-2 border-white rounded-full flex justify-center items-center cursor-pointer hover:bg-white/20 transition-colors"
        onClick={handleScrollDown}
        role="button"
        tabIndex={0}
        aria-label="Scroll down"
      >
        ▼
      </div>
    </section>
  );
}