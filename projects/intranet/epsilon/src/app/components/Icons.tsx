import React from 'react';

interface IconProps {
  className?: string;
}

export const IconCrew: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-4.41 0-8 3.59-8 8h16c0-4.41-3.59-8-8-8z"/>
  </svg>
);

export const IconAnchor: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 15l1.55 1.55c-0.96 1.69-3.33 3.04-5.55 3.37V11h3V9h-3V7.82C14.16 7.4 15 6.3 15 5c0-1.65-1.35-3-3-3S9 3.35 9 5c0 1.3 0.84 2.4 2 2.82V9H8v2h3v8.92c-2.22-0.33-4.59-1.68-5.55-3.37L7 15l-1-1L3 17c0 3.3 4.03 6 9 6s9-2.7 9-6l-3-3-1 1zm-5-10c0.55 0 1 0.45 1 1s-0.45 1-1 1-1-0.45-1-1 0.45-1 1-1z"/>
  </svg>
);

export const IconAnchorAlt: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 15l1.55 1.55c-0.96 1.69-3.33 3.04-5.55 3.37V11h3V9h-3V7.82C14.16 7.4 15 6.3 15 5c0-1.65-1.35-3-3-3S9 3.35 9 5c0 1.3 0.84 2.4 2 2.82V9H8v2h3v8.92c-2.22-0.33-4.59-1.68-5.55-3.37L7 15l-1-1L3 17c0 3.3 4.03 6 9 6s9-2.7 9-6l-3-3-1 1zm-5-10c0.55 0 1 0.45 1 1s-0.45 1-1 1-1-0.45-1-1 0.45-1 1-1z"/>
  </svg>
);

export const IconVessel: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21c-1.39 0-2.78-0.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-0.35 4-0.99 2.52 1.29 5.48 1.29 8 0 1.26 0.65 2.62 0.99 4 0.99h2v-2h-2zM3.95 19H4c1.6 0 3.02-0.88 4-2 0.98 1.12 2.4 2 4 2s3.02-0.88 4-2c0.98 1.12 2.4 2 4 2h0.05l1.89-6.68c0.08-0.26 0.06-0.54-0.06-0.78s-0.34-0.42-0.6-0.5L20 10.62V6c0-1.1-0.9-2-2-2h-3V1H9v3H6c-1.1 0-2 0.9-2 2v4.62l-1.29 0.42c-0.26 0.08-0.48 0.26-0.6 0.5s-0.15 0.52-0.06 0.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
  </svg>
);

export const IconPersonnel: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>
);

export const IconClient: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

export const IconClientAlt: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5.9c1.16 0 2.1.94 2.1 2.1s-.94 2.1-2.1 2.1S9.9 9.16 9.9 8s.94-2.1 2.1-2.1m0 9c2.97 0 6.1 1.46 6.1 2.1v1.1H5.9V17c0-.64 3.13-2.1 6.1-2.1M12 4C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 9c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z"/>
  </svg>
);

export const IconOffice: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>
  </svg>
);

export const IconLogo: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.93 2.3c-5.05 0-9.15 4.1-9.15 9.15 0 2.16.75 4.14 2 5.7l.03-.11c.36-1.53 1.58-2.77 3.07-3.25.48-.15.97-.24 1.48-.24h.34c-.11-.25-.17-.54-.17-.85 0-.94.58-1.75 1.4-2.08-.3-1.34-.96-2.6-1.62-2.93-.18-.09-.32-.27-.32-.49 0-.3.24-.54.54-.54.08 0 .16.02.23.05 1.07.53 2 2.26 2.35 4.04.41-.17.87-.26 1.34-.26.47 0 .93.09 1.34.26.35-1.78 1.28-3.5 2.34-4.03.08-.04.16-.06.24-.06.3 0 .54.24.54.54 0 .22-.14.41-.32.5-.67.32-1.32 1.58-1.63 2.92.83.33 1.41 1.14 1.41 2.08 0 .32-.06.6-.17.85h.34c.5 0 .99.09 1.48.24 1.49.47 2.71 1.72 3.07 3.25l.03.11c1.26-1.56 2-3.54 2-5.7 0-5.05-4.1-9.15-9.15-9.15z"/>
    <path d="M15.93 16.17h-8c-.61 0-1.1.49-1.1 1.1 0 .61.49 1.1 1.1 1.1h8c.61 0 1.1-.49 1.1-1.1 0-.61-.49-1.1-1.1-1.1z"/>
  </svg>
);