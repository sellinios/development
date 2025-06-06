import { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/src/app/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us | Epsilon',
  description: 'Contact Epsilon for general enquiries or reach out to our offices around the world.',
};

// Location data (Russia removed)
const locations = [
  { id: 'cyprus', name: 'CYPRUS' },
  { id: 'the-philippines', name: 'THE PHILIPPINES' },
  { id: 'ukraine', name: 'UKRAINE' },
  { id: 'greece', name: 'GREECE' },
  { id: 'romania', name: 'ROMANIA' },
  { id: 'turkey', name: 'TURKEY' },
  { id: 'indonesia', name: 'INDONESIA' },
  { id: 'vietnam', name: 'VIETNAM' },
  { id: 'georgia', name: 'GEORGIA' }
];

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContactForm />

      <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {locations.map(location => (
          <Link
            href={`/locations/${location.id}`}
            key={location.id}
            className="border rounded-lg p-6 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-blue-900 font-medium text-center">{location.name}</h3>
          </Link>
        ))}
      </div>
    </div>
  );
}