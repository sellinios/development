import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Atom, Map, BarChart2 } from 'lucide-react';
import HeroSection from "@/src/app/components/HeroSection";

// Define metadata for the page
export const metadata: Metadata = {
  title: "Epsilon Hellas | Dedicated, Quality Crew Management & Training",
  description: "Epsilon Hellas provides dedicated quality crew management, manning and training services to enhance operational efficiency for shipping companies worldwide.",
  keywords: ["crew management", "maritime training", "crew manning", "shipping services", "seafaring", "maritime education"],
  openGraph: {
    title: "Epsilon Hellas | Dedicated, Quality Crew Management & Training",
    description: "Enhancing operational efficiency through exceptional maritime crew management, manning and training services.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Epsilon Hellas - Maritime Crew Management"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Epsilon Hellas | Crew Management & Training",
    description: "Dedicated maritime crew management and training services"
  }
};

// Main content section
const MainContent = () => {
  return (
    <>
      {/* Crew Management Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#0a2559] mb-4 font-montserrat">
            DEDICATED, QUALITY CREW MANAGEMENT & TRAINING
          </h2>
          <div className="w-12 h-1 bg-blue-500 mx-auto mb-12"></div>
          <p className="text-lg text-center max-w-4xl mx-auto mb-16">
            We are crew managers, driven by a sole commitment: to enhance the operational efficiency of our
            Principal&apos;s fleet by managing an exceptional talent pool of human resources at sea
          </p>
        </div>
      </section>

      {/* Navigation Section with background image */}
      <section className="py-16 bg-slate-600 relative">
        <div className="absolute inset-0 z-0">
          <Image
            src="/ship-background.jpg"
            alt="Ship background"
            fill
            style={{ objectFit: 'cover' }}
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-slate-600/70"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center text-white mb-4 font-montserrat">
            NAVIGATE THROUGH OUR SITE
          </h2>
          <div className="w-12 h-1 bg-blue-500 mx-auto mb-16"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">

            {/* Services Card */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-6 bg-white/10">
                <Atom className="w-12 h-12 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-montserrat">SERVICES</h3>
              <p className="text-white text-center mb-6">
                Our service provision includes three basic schemes: <br />
                Crew Management,
                Crew Manning and Training.
              </p>
              <Link
                href="/services"
                className="px-6 py-3 bg-[#003070] text-white font-bold hover:bg-[#002560] transition-colors font-montserrat"
                aria-label="View our maritime services"
              >
                VIEW SERVICES
              </Link>
            </div>

            {/* Locations Card */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-6 bg-white/10">
                <Map className="w-12 h-12 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-montserrat">LOCATIONS</h3>
              <p className="text-white text-center mb-6">
                We are present in locations whose seafaring heritage, maritime education and
                human skills can support our common objective for a customized service provision.
              </p>
              <Link
                href="/locations"
                className="px-6 py-3 bg-[#003070] text-white font-bold hover:bg-[#002560] transition-colors font-montserrat"
                aria-label="View our global locations"
              >
                VIEW LOCATIONS
              </Link>
            </div>

            {/* Facts & Figures Card */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-6 bg-white/10">
                <BarChart2 className="w-12 h-12 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-montserrat">FACTS & FIGURES</h3>
              <p className="text-white text-center mb-6">
                Facts & Figures that translate into benefits for all parties concerned.
              </p>
              <Link
                href="/facts"
                className="px-6 py-3 bg-[#003070] text-white font-bold hover:bg-[#002560] transition-colors font-montserrat"
                aria-label="View our facts and figures"
              >
                VIEW FACTS & FIGURES
              </Link>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

// Main Home Page Component
export default function Home() {
  return (
    <main>
      <HeroSection />
      <MainContent />
    </main>
  );
}