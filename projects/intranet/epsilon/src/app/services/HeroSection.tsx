'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from "next/image";

// Define the props interface for HeroSection
interface HeroSectionProps {
  title?: string;
  backgroundImage?: string;
  imageAlt?: string;
  showServiceImages?: boolean;
}

export default function HeroSection({ 
  title,
  backgroundImage,
  imageAlt,
  showServiceImages = false
}: HeroSectionProps) {
  // Define service images
  const serviceImages = [
    { src: "/services/Crew_Management.jpg", alt: "Crew Management Services" },
    { src: "/services/Crew_Manning.jpg", alt: "Crew Manning Services" },
    { src: "/services/Prevetting.jpg", alt: "Pre-vetting Inspection Services" },
    { src: "/services/Tech_Services.png", alt: "Technical Services" },
    { src: "/services/Training.png", alt: "Training Services" }
  ];

  // Define carousel images - conditionally use backgroundImage if provided
  const carouselImages = backgroundImage 
    ? [{ src: backgroundImage, alt: imageAlt || "Background image" }]
    : [
        { src: "/Home1.jpg", alt: "Home image 1" },
        { src: "/Home2.jpg", alt: "Home image 2" },
        { src: "/Home3.jpg", alt: "Home image 3" },
      ];

  // Define carousel content based on index
  const getSlideContent = (index: number) => {
    // If title is provided and we're showing services, display that with service images
    if (title && showServiceImages) {
      return (
        <>
          <h1 className="text-5xl font-bold mb-8 tracking-wider font-montserrat text-center">
            {title}
          </h1>
          {/* Service images row */}
          <div className="flex flex-wrap justify-center gap-6 mb-10 max-w-5xl mx-auto">
            {serviceImages.map((img, idx) => (
              <div 
                key={idx}
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-white shadow-lg"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="128px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </>
      );
    }
    // If only title is provided
    else if (title) {
      return (
        <h1 className="text-5xl font-bold mb-20 tracking-wider font-montserrat text-center">
          {title}
        </h1>
      );
    }
    // Use the original slide content if no custom title
    else if (index === 0) {
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
          WE ARE THE MANNING AGENT OF CHOICE FOR<br />
          SEVERAL OF THE WORLD'S LEADING,<br />
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

  // Auto rotation - only if multiple images
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    
    const intervalId = setInterval(() => {
      goToSlide((currentIndex + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [currentIndex, goToSlide, carouselImages.length]);

  // Function to handle the scroll down click
  const handleScrollDown = () => {
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
      <div className="relative z-10 px-4 max-w-7xl mx-auto">
        {getSlideContent(currentIndex)}
        {/* Carousel indicators - only show if multiple images */}
        {carouselImages.length > 1 && (
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
        )}
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