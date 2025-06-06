"use client";

import React from 'react';
import HeroSection from './HeroSection';
import { User, Award, Ship, Briefcase, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function OdessaEmetcInstructors() {
  // Placeholder data for Odessa instructors
  // This would be replaced with actual instructor data
  const instructors = [
    {
      name: "CAPT. OLEKSANDR SHEVCHENKO",
      title: "Training Manager",
      bio: "Licensed Master Mariner with over 20 years of experience on various vessel types. Graduated from Odessa Maritime Academy. Extensive experience in maritime education and training development. Certified instructor for navigation simulators and safety courses.",
      certifications: ["Bridge Simulator", "ECDIS", "Safety Courses"],
      specialties: ["Container Ships", "Bulk Carriers", "Ship Handling"]
    },
    {
      name: "CHIEF ENG. IGOR KOVALENKO",
      title: "Chief Engine Instructor",
      bio: "Licensed Chief Engineer with 15 years of experience on merchant vessels. Graduate of Odessa National Maritime University with specialization in Marine Engineering. Expert in engine room operations and maintenance procedures for various engine types.",
      certifications: ["Engine Room Simulator", "ME-C Operations"],
      specialties: ["ME-C Engines", "Diesel Electric Propulsion", "Engine Troubleshooting"]
    },
    {
      name: "CAPT. DMITRI IVANOV",
      title: "Navigation Instructor",
      bio: "Licensed Master Mariner specialized in navigation and ship handling. Graduate of Odessa Maritime Academy with 12 years of experience on container vessels and bulk carriers. Certified instructor for bridge simulator training and ECDIS courses.",
      certifications: ["ECDIS", "Bridge Management"],
      specialties: ["Ship Handling", "Passage Planning", "Bridge Resource Management"]
    },
    {
      name: "ENG. SERGEI KUZNETSOV",
      title: "Technical Instructor",
      bio: "Licensed Second Engineer with expertise in ship maintenance systems. Graduate of Odessa National Maritime University with 10 years of experience on various vessel types. Specializes in planned maintenance system implementation and training.",
      certifications: ["Planned Maintenance Systems", "Engine Operations"],
      specialties: ["System Diagnostics", "Maintenance Planning", "Technical Documentation"]
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">ODESSA EMETC INSTRUCTORS</h1>
        <p className="text-xl text-center text-gray-700 mb-12">
          Meet our experienced instructors at the Epsilon Maritime Educational and Training Center in Odessa, Ukraine
        </p>

        <div className="border-t border-gray-200 pt-10 mb-16">
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-6">
              <User size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800">Our Expert Instructors</h2>
            <p className="text-lg text-center text-gray-600 mt-4 max-w-3xl">
              Our Odessa EMETC instructors combine theoretical knowledge with extensive practical experience,
              delivering high-quality maritime education and training programs tailored to industry requirements.
            </p>
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {instructors.map((instructor, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-900 p-6 text-white">
                <h3 className="text-xl font-bold">{instructor.name}</h3>
                <p className="text-blue-200 mt-1">{instructor.title}</p>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">{instructor.bio}</p>

                {instructor.certifications && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                      <Award size={16} className="mr-2" /> Certifications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {instructor.certifications.map((cert, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {instructor.specialties && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                      <Ship size={16} className="mr-2" /> Specialties
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {instructor.specialties.map((specialty, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-[#003070] py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-xl mb-4 text-center">Contact us for a quotation for Training packages at:</p>
          <a href="mailto:training@epsilonhellas.com" className="block text-center text-2xl font-bold hover:underline">
            training@epsilonhellas.com
          </a>
        </div>
      </div>
    </div>
  );
}