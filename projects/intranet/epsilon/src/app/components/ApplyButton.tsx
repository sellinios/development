'use client';
import React from 'react';
import Link from 'next/link';

const ApplyButton = () => {
  return (
    <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-50">
      <Link
        href="/careers-at-sea"
        className="bg-[#003070] hover:bg-blue-800 text-white py-2 px-3 sm:px-4 rounded-md font-semibold flex items-center shadow-lg transition-all duration-300 text-sm sm:text-base"
      >
        <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 7.5a.75.75 0 01.75.75v3h3a.75.75 0 010 1.5h-3v3a.75.75 0 01-1.5 0v-3h-3a.75.75 0 010-1.5h3v-3A.75.75 0 0112 7.5z" />
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5z" clipRule="evenodd" />
        </svg>
        APPLY FOR A JOB
      </Link>
    </div>
  );
};

export default ApplyButton;