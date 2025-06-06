'use client';
import React from 'react';
import Image from 'next/image';

// Partners in exact order as shown in the image
const partners = [
  { name: 'Bureau Veritas', src: '/partners/BureauVeritas.png' },
  { name: 'Imec', src: '/partners/Imec.png' },
  { name: 'Bimco', src: '/partners/Bimco.png' },
  { name: 'Fame', src: '/partners/Fame.png' },
  { name: 'Furuno', src: '/partners/Furuno.png' },
  { name: 'Transas', src: '/partners/Transas.png' },
  { name: 'Jrc', src: '/partners/Jrc.png' },
  { name: 'Nautical', src: '/partners/Nautical.png' },
  { name: 'Liberian Registry', src: '/partners/LiberianRegistry.png' },
  { name: 'Pamtci', src: '/partners/Pamtci.png' },
  { name: 'Marshall Islands', src: '/partners/MarshallIslands.png' },
  { name: 'Dnv', src: '/partners/DNV.png' },
  { name: 'Mitsui', src: '/partners/Mitsui.png' },
  { name: 'Intertanko', src: '/partners/Intertanko.png' }, // Last logo as indicated by your arrow
];

const PartnerLogos: React.FC = () => {
  return (
    <div className="flex flex-wrap justify-center items-center gap-6 py-2">
      {partners.map((partner, index) => (
        <div key={index} className="relative w-20 h-14 md:w-24 md:h-16">
          <Image
            src={partner.src}
            alt={`${partner.name}`}
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
      ))}
    </div>
  );
};

export default PartnerLogos;