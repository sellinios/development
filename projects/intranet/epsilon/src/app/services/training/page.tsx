import React from 'react';
import { Anchor, Ship, MapPin, BookOpen, Award, LifeBuoy, Navigation, Users, FileText, Mail } from 'lucide-react';
import HeroSection from './HeroSection';
import Link from 'next/link';

const TrainingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <HeroSection />

      {/* Introduction and Equipment Section - 2 columns */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Introduction */}
          <div>
            <p className="text-lg text-gray-700 mb-6">
              People matter – this is our fundamental belief. Thus, we consider their training as an integral part of our crewing business.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              It is of utmost importance for the safety and smooth sailing of our vessels and this attracts our unconditional attention.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              In that respect, we operate a dedicated In-House Training & Q.A. department and we make extensive use of Bridge & Engine Simulators and CB training in all our offices.
            </p>
          </div>

          {/* Right Column - Equipment */}
          <div>
            <p className="text-lg text-gray-700 mb-6">
              Our training centers are equipped with state-of-the-art equipment, featuring:
            </p>
            <ul className="space-y-4 mb-6 text-lg">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <p className="text-gray-700">Full mission dual Bridge and Engine simulators which can work in integration</p>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <p className="text-gray-700">2-stroke, 6-cylinder Electronic Engine Room System (ME-C)</p>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <p className="text-gray-700">ECDIS Specific training programs by Transas, JRC, FURUNO, DANELEC and INTERMARINE</p>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <p className="text-gray-700">A comprehensive list of courses taught by highly experienced instructors</p>
              </li>
            </ul>
            <p className="text-lg text-gray-700 mb-6">
              Additionally, the Veritas Maritime Training Center offers Planned Maintenance System (PMS) Training based on Microsoft NAVDynamics, Benefit, Kapa and Danaos.
            </p>
          </div>
        </div>

        {/* Full width message */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-700 text-xl">
            Please see below for the full suite of offered Courses and our Instructors in our Training Centers or visit our training services dedicated site.
          </p>
        </div>
      </div>

      {/* Training Centers */}
      <div className="bg-gray-900 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">
            Our Training Centers
          </h2>

          <p className="text-xl text-center mb-12">Currently, Epsilon operates three main Training Centers:</p>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Manila Center */}
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-center">MANILA</h3>
              <div className="flex justify-center mb-6">
                <div className="p-3 rounded-full bg-blue-600">
                  <MapPin size={28} />
                </div>
              </div>
              <p className="text-gray-300 mb-6 text-center">
                Veritas Maritime Training Center in Manila, The Philippines
              </p>
              <div className="flex flex-col space-y-3">
                <Link href="/services/training/veritas-courses" className="py-2 px-4 bg-[#003070] rounded text-center font-medium hover:bg-blue-800 transition-colors">
                  VERITAS COURSES
                </Link>
                <Link href="/services/training/veritas-instructors" className="py-2 px-4 bg-gray-700 rounded text-center font-medium hover:bg-gray-600 transition-colors">
                  VERITAS INSTRUCTORS
                </Link>
              </div>
            </div>

            {/* Odessa Center */}
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-center">ODESSA</h3>
              <div className="flex justify-center mb-6">
                <div className="p-3 rounded-full bg-blue-600">
                  <MapPin size={28} />
                </div>
              </div>
              <p className="text-gray-300 mb-6 text-center">
                Epsilon Maritime Educational and Training Center in Odessa, Ukraine
              </p>
              <div className="flex flex-col space-y-3">
                <Link href="/services/training/odessa-emetc-courses" className="py-2 px-4 bg-[#003070] rounded text-center font-medium hover:bg-blue-800 transition-colors">
                  ODESSA EMETC COURSES
                </Link>
                <Link href="/services/training/odessa-emetc-instructors" className="py-2 px-4 bg-gray-700 rounded text-center font-medium hover:bg-gray-600 transition-colors">
                  ODESSA INSTRUCTORS
                </Link>
              </div>
            </div>

            {/* Constanta Center */}
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-center">CONSTANTA</h3>
              <div className="flex justify-center mb-6">
                <div className="p-3 rounded-full bg-blue-600">
                  <MapPin size={28} />
                </div>
              </div>
              <p className="text-gray-300 mb-6 text-center">
                Epsilon Maritime Training Center in Constanta, Romania
              </p>
              <div className="flex flex-col space-y-3">
                <Link href="/services/training/constanta-courses" className="py-2 px-4 bg-[#003070] rounded text-center font-medium hover:bg-blue-800 transition-colors">
                  VERITAS DANUBE COURSES
                </Link>
                <Link href="/services/training/constanta-instructors" className="py-2 px-4 bg-gray-700 rounded text-center font-medium hover:bg-gray-600 transition-colors">
                  VERITAS DANUBE INSTRUCTORS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Powered By Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-8 text-center">
            TRAINING PROGRAMS POWERED BY:
          </h2>
          <div className="w-16 h-1 bg-[#003070] mx-auto mb-12"></div>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-8 items-center justify-items-center">
            <div className="transition-all">
              <img src="/partners/Transas.png" alt="TRANSAS" className="h-8" />
            </div>
            <div className="transition-all">
              <img src="/partners/WinGD.png" alt="Win GD" className="h-8" />
            </div>
            <div className="transition-all">
              <img src="/partners/Danelec.png" alt="Danelec" className="h-8" />
            </div>
            <div className="transition-all">
              <img src="/partners/Ime.png" alt="Ime" className="h-8" />
            </div>
            <div className="transition-all">
              <img src="/partners/Jrc.png" alt="Jrc" className="h-8" />
            </div>
            <div className="transition-all">
              <img src="/partners/Furuno.png" alt="Furuno" className="h-8" />
            </div>
             <div className="transition-all">
              <img src="/partners/Mintra.png" alt="Mitra" className="h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Cadets & Cadet Training */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">CADETS & CADET TRAINING</h2>
          <div className="w-16 h-1 bg-[#003070] mx-auto mb-12"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-lg text-gray-700">
                We have invested in a visionary Cadetship program through exclusive contracts with the most reputable Maritime Academies in the Philippines (PMMA, MAAP, UC) and elsewhere (e.g. Novorossiysk). Hence, we are in a privileged position to "produce" our own Officers utilizing advanced long term employment contracts.
              </p>
            </div>
            <div>
              <p className="text-lg text-gray-700">
                This translates into something vital for our clients: by employing Deck & Engine Cadets at very favorable terms, they safeguard the maintenance of their vessels, they increase retention rates and actively participate in the shaping up of the future generation of seafarers to the benefit of their fleet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;