"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavigationMenu from './NavigationMenu';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] flex justify-center bg-white shadow-md">
      <div className="container flex justify-between items-center px-4 sm:px-6 lg:px-12 py-2 md:py-4 max-w-7xl mx-auto">
        <div className="flex items-center">
          <Link href="/">
            <Image
              src="/Logo.png"
              alt="Epsilon Logo"
              width={100}
              height={50}
              priority
              className="h-auto w-auto sm:w-[100px] md:w-[120px]"
            />
          </Link>
        </div>
        <NavigationMenu />
      </div>
    </header>
  );
};

export default Header;