'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Users, Anchor, Ship, Building, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import HeroSection from './HeroSection';

// Define the stat type for better TypeScript support
interface Stat {
  value: string;
  label: string;
  bgcolor: string;
  textColor: string;
  icon?: LucideIcon;
  logoPath?: string;
  numericValue?: number;
  specialFormat?: boolean; // Flag for special formatting (Epsilon)
}

// Updated stats with unified styling - making Epsilon special format
const stats: Stat[] = [
  {
    value: '21000',
    numericValue: 21000,
    label: 'Officers & Crew in our database',
    bgcolor: '#4d9166', // Green
    textColor: '#FFFFFF',
    icon: Users
  },
  {
    value: '7250',
    numericValue: 7250,
    label: 'Seafarers on board at any time',
    bgcolor: '#5b91c6', // Light blue
    textColor: '#FFFFFF',
    icon: Anchor
  },
  {
    value: '1550',
    numericValue: 1550,
    label: 'Seafarers trained every month',
    bgcolor: '#196891', // Darker blue
    textColor: '#FFFFFF',
    icon: Anchor
  },
  {
    value: '622',
    numericValue: 622,
    label: 'Vessels',
    bgcolor: '#2a3087', // Indigo
    textColor: '#FFFFFF',
    icon: Ship
  },
  {
    value: '430',
    numericValue: 430,
    label: 'Onshore personnel',
    bgcolor: '#b17d4b', // Amber/brown
    textColor: '#FFFFFF',
    icon: Users
  },
  {
    value: '170',
    numericValue: 170,
    label: 'Corporate clients for training',
    bgcolor: '#2c7012', // Dark green
    textColor: '#FFFFFF',
    icon: User
  },
  {
    value: '61',
    numericValue: 61,
    label: 'Clients for crewing',
    bgcolor: '#62a73b', // Green
    textColor: '#FFFFFF',
    icon: User
  },
  {
    value: '14',
    numericValue: 14,
    label: 'Offices worldwide',
    bgcolor: '#5a5a5a', // Gray
    textColor: '#FFFFFF',
    icon: Building
  },
  {
    value: '1',
    numericValue: 1,
    label: 'Crewing partner: Epsilon',
    bgcolor: '#0a2d6d', // Dark blue
    textColor: '#0a2d6d', // Changed to match the dark blue (instead of white)
    icon: Building,
    logoPath: '/LogoSmall.jpg',
    specialFormat: true // Flag to indicate special formatting
  }
];

// Number animation component
const AnimatedNumber = ({ value, duration = 3000 }: { value: string, duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const targetValue = parseInt(value, 10);

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smoother animation
    const easeOutQuad = (t: number) => t * (2 - t);
    const easedProgress = easeOutQuad(progress);

    setDisplayValue(Math.floor(easedProgress * targetValue));

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayValue(targetValue);
    }
  };

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration, targetValue]);

  return <>{displayValue.toLocaleString()}</>;
};

export default function FactsPage() {
  const [widths, setWidths] = useState<number[]>(() => {
    // Initial widths that are already proportional but smaller
    return stats.map((_, index) => {
      if (index === 0) return 25;  // 21000 - starts at 25% of final width
      if (index === 1) return 22;  // 7250 - starts at ~25% of final width
      if (index === 2) return 20;  // 1550 - starts at ~25% of final width
      if (index === 3) return 17;  // 622 - starts at ~25% of final width
      if (index === 4) return 14;  // 430 - starts at ~25% of final width
      if (index === 5) return 11;  // 170 - starts at ~25% of final width
      if (index === 6) return 9;   // 61 - starts at ~25% of final width
      if (index === 7) return 7;   // 14 - starts at ~25% of final width
      return 5;                    // Epsilon - now smaller to match pattern
    });
  });

  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      // Set width percentages to match the design in the image
      // Increased widths with a more gradual change between items
      const finalWidths = stats.map((stat, index) => {
        if (index === 0) return 100;  // 21000 - Full width
        if (index === 1) return 85;   // 7250 - Increased from 82
        if (index === 2) return 75;   // 1550 - Increased from 70
        if (index === 3) return 60;   // 622 - Increased from 55
        if (index === 4) return 48;   // 430 - Increased from 40
        if (index === 5) return 42;   // 170 - Increased from 35
        if (index === 6) return 32;   // 61 - Increased from 25
        if (index === 7) return 25;   // 14 - Increased from 15
        return 15;                    // Epsilon - small width since label is outside
      });

      setWidths(finalWidths);

      // Set animation complete after 3 seconds (matching the duration of the number animation)
      const completeTimer = setTimeout(() => {
        setAnimationComplete(true);
      }, 3000);

      return () => clearTimeout(completeTimer);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Function to render the icon
  const renderIcon = (stat: Stat) => {
    if (!stat.icon) return null;
    const IconComponent = stat.icon;
    return <IconComponent color={stat.bgcolor} size={28} />;
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section with background image and title */}
      <HeroSection />

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="space-y-4">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center mb-4 stats-row animate-fade-in-up">
                {/* Icon */}
                <div className="w-12 h-12 flex items-center justify-center mr-4">
                  {renderIcon(stat)}
                </div>

                {/* Special format for Epsilon */}
                {stat.specialFormat ? (
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div
                        className="flex items-center"
                        style={{
                          color: stat.textColor,
                          fontSize: '22px',
                          fontWeight: 'bold',
                          opacity: animationComplete ? 1 : 0,
                          transition: 'opacity 0.5s ease-in'
                        }}
                      >
                        <span style={{ fontSize: '28px', fontWeight: 'bold', marginRight: '16px' }}>
                          {animationComplete ? stat.value : <AnimatedNumber value={stat.value} duration={3000} />}
                        </span>
                        <span>{stat.label}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular stats bar for other items */
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div
                        className="stats-bar relative"
                        style={{
                          backgroundColor: stat.bgcolor,
                          width: `${widths[index]}%`,
                          minWidth: index < 4 ? (widths[index] > 30 ? '350px' : '150px') : ((9 - index) * 10 + (widths[index] * 0.8)) + 'px',
                          height: '48px',
                          transition: 'width 3s ease-in-out, min-width 3s ease-in-out',
                          overflow: 'visible'
                        }}
                      >
                        <div
                          className="absolute left-4 top-1/2 transform -translate-y-1/2"
                          style={{
                            color: stat.textColor,
                            fontWeight: 'bold',
                            fontSize: '22px',
                            lineHeight: '32px',
                            whiteSpace: 'nowrap',
                            opacity: 1,
                            transition: 'opacity 0.5s ease-in'
                          }}
                        >
                          {animationComplete ? stat.value : <AnimatedNumber value={stat.value} duration={3000} />}
                        </div>
                        <div
                          className="absolute right-4 top-1/2 transform -translate-y-1/2"
                          style={{
                            color: stat.textColor,
                            fontSize: '22px',
                            whiteSpace: 'nowrap',
                            opacity: animationComplete ? 1 : 0,
                            transition: 'opacity 0.5s ease-in'
                          }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}