import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import HeroSection from './HeroSection';

export const metadata = {
  title: 'Our Services | Epsilon Hellas',
  description: 'Explore our comprehensive maritime services including crew management, crew manning, training, technical services, pre-vetting inspections, and maritime consulting.',
};

export default function ServicesPage() {
  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Training",
        "url": "https://epsilonhellas.com/services/training",
        "description": "Maritime training programs and educational services"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Crew Manning",
        "url": "https://epsilonhellas.com/services/crew-manning",
        "description": "Professional crew manning solutions with high retention rates"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Crew Management",
        "url": "https://epsilonhellas.com/services/crew-management",
        "description": "Comprehensive crew management solutions for vessel operators"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Pre-Vetting for RightShip Inspection",
        "url": "https://epsilonhellas.com/services/pre-vetting-inspections",
        "description": "Professional pre-vetting services for RightShip inspections"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Technical Services",
        "url": "https://epsilonhellas.com/services/technical-services",
        "description": "Onboard repairs and riding teams services"
      }
    ]
  };

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section - Using the new component */}
      <HeroSection
        title="WE OFFER SERVICES THAT ARE TAILOR-MADE TO PRINCIPALS’ REQUIREMENTS"
        backgroundImage="/services/Services-Top.jpg"
        imageAlt="Epsilon Services"
      />

      {/* Spacer div for additional padding */}
      <div className="h-24"></div>

      {/* Service Provision Section */}
      <div className="py-12 text-center max-w-6xl mx-auto content-container">
        <h2 className="text-3xl text-center font-bold mb-3">OUR SERVICE PROVISION INCLUDES FOUR BASIC SCHEMES</h2>
        <div className="w-16 h-1 bg-slate-700 mx-auto mb-8" aria-hidden="true"></div>
      </div>

      {/* Five Services - Clean Full-Width Layout */}
      <div className="max-w-7xl mx-auto px-4 mb-20 content-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Training */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/services/Training.png"
                alt="Training Services"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-start mb-4">
                <h3 className="text-slate-700 text-sm font-medium mb-2">Training Services</h3>
                <h4 className="text-gray-900 text-xl font-bold">TRAINING</h4>
                <div className="w-12 h-1 bg-[#003070] mt-2" aria-hidden="true"></div>
              </div>

              <p className="text-gray-600 mb-5 text-sm">An integral part of our crewing business</p>

              <Link
                href="/services/training"
                className="inline-flex items-center text-[#003070] font-medium hover:text-blue-800 transition-colors group"
              >
                LEARN MORE
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Crew Manning */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/services/Crew_Manning.jpg"
                alt="Crew Manning Services"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-start mb-4">
                <h3 className="text-slate-700 text-sm font-medium mb-2">Crew Manning Services</h3>
                <h4 className="text-gray-900 text-xl font-bold">CREW MANNING</h4>
                <div className="w-12 h-1 bg-[#003070] mt-2" aria-hidden="true"></div>
              </div>

              <p className="text-gray-600 mb-5 text-sm">An exceptional manning pool of 15,000 seafarers</p>

              <Link
                href="/services/crew-manning"
                className="inline-flex items-center text-[#003070] font-medium hover:text-blue-800 transition-colors group"
              >
                LEARN MORE
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Crew Management */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/services/Crew_Management.jpg"
                alt="Crew Management Services"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-start mb-4">
                <h3 className="text-slate-700 text-sm font-medium mb-2">Crew Management Services</h3>
                <h4 className="text-gray-900 text-xl font-bold">CREW MANAGEMENT</h4>
                <div className="w-12 h-1 bg-[#003070] mt-2" aria-hidden="true"></div>
              </div>

              <p className="text-gray-600 mb-5 text-sm">Our all-inclusive solution for your crewing needs</p>

              <Link
                href="/services/crew-management"
                className="inline-flex items-center text-[#003070] font-medium hover:text-blue-800 transition-colors group"
              >
                LEARN MORE
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Pre Vetting */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/services/Prevetting.jpg"
                alt="Pre-Vetting Inspection Services"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-start mb-4">
                <h3 className="text-slate-700 text-sm font-medium mb-2">Pre-Vetting Inspection Services</h3>
                <h4 className="text-gray-900 text-xl font-bold">PRE VETTING</h4>
                <div className="w-12 h-1 bg-[#003070] mt-2" aria-hidden="true"></div>
              </div>

              <p className="text-gray-600 mb-5 text-sm">Professional pre-vetting inspections</p>

              <Link
                href="/services/pre-vetting-inspections"
                className="inline-flex items-center text-[#003070] font-medium hover:text-blue-800 transition-colors group"
              >
                LEARN MORE
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Technical Services */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-64 overflow-hidden">
              <Image
                src="/services/Tech_Services.png"
                alt="Technical Services"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{ objectFit: 'cover' }}
                className="group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-start mb-4">
                <h3 className="text-slate-700 text-sm font-medium mb-2">Technical Services</h3>
                <h4 className="text-gray-900 text-xl font-bold">TECHNICAL SERVICES</h4>
                <div className="w-12 h-1 bg-[#003070] mt-2" aria-hidden="true"></div>
              </div>

              <p className="text-gray-600 mb-5 text-sm">Onboard repairs - Riding teams</p>

              <Link
                href="/services/technical-services"
                className="inline-flex items-center text-[#003070] font-medium hover:text-blue-800 transition-colors group"
              >
                LEARN MORE
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* View All Services Button */}
      <div className="flex justify-center mt-12 mb-8">
        <Link
          href="https://site.epsilonhellas.com/services"
          className="inline-flex items-center justify-center px-8 py-3 bg-[#003070] text-white font-medium rounded-md hover:bg-[#00235a] transition-colors duration-300 shadow-sm"
        >
          VIEW ALL SERVICES
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </>
  );
}