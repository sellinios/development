"use client";

import React from 'react';
import HeroSection from './HeroSection';
import { User, Award, Ship } from 'lucide-react';
import Link from 'next/link';

const VeritasInstructors = () => {
  const instructors = [
    {
      name: "MR. CENON D. POBLADOR",
      title: "Training Manager",
      bio: "Licensed Second Officer – B.S Marine Transportation Major in Navigation and Seamanship Philippine Merchant Marine Academy Class of 1994. Earned Academic units for Master in Shipping Business and Management. A well experienced educator having served as Instructor, Course and Training Director of a leading Maritime Training Center. Employed as vessel International Auditor, Safety Manager in various reputable shipping company. Accredited instructor of TRANSAS, JRC and FURUNO.",
      certifications: ["TRANSAS", "JRC", "FURUNO"]
    },
    {
      name: "MR. GILBERT M. AMAGUIN",
      title: "Instructor/Assessor",
      bio: "Licensed Master Mariner holding a BS Marine Transportation Major in Navigation and Seamanship from the Philippine Merchant Marine School. He has worked onboard containerships, bulk carriers and multipurpose carriers since 1983.He has previously employed as training instructor and assessor from various training centers since 2012.",
      specialties: ["Containerships", "Bulk Carriers", "Multipurpose Carriers"]
    },
    {
      name: "MR. ARNOLFO G. DIMAUNAHAN",
      title: "PMS Manager/Instructor",
      bio: "Licensed Third Marine Engineer – B.S Marine Engineering Philippine Merchant Marine Academy Class of 1992. A former PMMA instructor, well served on various Planned Maintenance System (PMS) application having served as Database Consultant, PMS Superintendent for the creation of Planned Maintenance Database for new shipbuilding. PMS Superintendent of a Ship Management company.",
      specialties: ["Planned Maintenance System (PMS)", "Database Consulting", "New Shipbuilding"]
    },
    {
      name: "MR. JOSE ROBINSON C. CRUZ",
      title: "Instructor/Assessor",
      bio: "Licensed Chief Officer MAP (MSMT and MSEM) – B.S in Marine Transportation Earned Master units at MAAP and CLSU. Served as officer on board oil tankers, mega yachts, and passenger cruise and passenger RoRo vessels. Served as Simulator Instructor/Assessor/Training Manager/quality assurance manager (QAM)/course developer on various training centers and maritime institutions. Served as ADPA and Safety officer-IQAT Auditor for oil tanker company.",
      specialties: ["Oil Tankers", "Mega Yachts", "Passenger Cruise", "RoRo Vessels"]
    },
    {
      name: "MR. GIL N CATABONA II",
      title: "Instructor/Assessor",
      bio: "Licensed Second Officer – B.S Marine Transportation Major in Navigation and Seamanship Philippine Merchant Marine Academy Class of 1995. Served briefly on oceangoing cargo vessels and joined Philippine Coast Guard on various capacities as officer onboard patrol vessels. Administrative and Personnel Officer at PCG Headquarters. A well experienced instructor on maritime courses from reputable training centers and crewing agencies. Accredited instructor of TRANSAS, JRC and FURUNO.",
      certifications: ["TRANSAS", "JRC", "FURUNO"]
    },
    {
      name: "MR. LLOYD WALLY D. AGUANTA",
      title: "Instructor/Assessor",
      bio: "Licensed Chief Officer – B.S Marine Transportation Major in Navigation and Seamanship University of Cebu – NIS Class of 2003. Graduate Cum Laude with shipboard experience in various capacities as deck officer on oceangoing product and oil tanker vessel. A competent trainer having previously employed as instructor, head of deck department senior manager and lead review instructor of reputable maritime training institution in Visayas region. Accredited instructor of TRANSAS, JRC.",
      certifications: ["TRANSAS", "JRC"]
    },
    {
      name: "MR. EDUARDO R. RANIA",
      title: "Course Developer/Instructor",
      bio: "Licensed Chief Officer – B.S Marine Transportation Major in Navigation and Seamanship Philippine Merchant Marine Academy Class of 1997. Served as chief officer on board various oceangoing Oil/Chem/Gas tanker and offshore vessels. Previously employed as training instructor/assessor/course developer/assistant training manager on various distinguished Maritime Training Institution.Accredited instructor on Type Specific ECDIS by Danelec, JRC Jan 901 and JRC MFD.",
      certifications: ["Danelec", "JRC Jan 901", "JRC MFD"],
      specialties: ["Oil/Chem/Gas Tanker", "Offshore Vessels"]
    },
    {
      name: "MR. RICTORINO M. RESURRECCION",
      title: "Instructor/Assessor",
      bio: "Licensed Chief Officer – B.S Marine Transportation Major in Navigation ans Seamanship. MPCF – Baras Canaman, Cam Sur. Served as NIS Cadet and Deck Officer in Large Car/Truck Carrier for almost 16 years, with wide experience in INS/IBS. Facilitator Simulator Courses. Accredited Instructor and Assessor in Generic type ECDIS. Accredited Deck Officer/Helmsman under Navigation Skills Assessment Program (NSAP). Assisted online Type Specific ECDIS of different maker. Accredited instructor on Type Specific ECDIS by SAM ECDIS Pilot, Danelec and JRC MFD.",
      certifications: ["SAM ECDIS Pilot", "Danelec", "JRC MFD"],
      specialties: ["Large Car/Truck Carrier", "INS/IBS", "Navigation Skills Assessment Program (NSAP)"]
    },
    {
      name: "MR. FLORANTE P. ABENOJAR",
      title: "Engine Instructor/Course Assessor/Course Developer",
      bio: "Chief Engineer of different types of vessel ranging from tankers, bulk carriers and container vessel; mostly with ME-C engines. He is an experienced educator as instructor to different maritime training centers and shipping company's in-house courses. He holds a Master in Business Administration diploma and units for Master in Shipping Management.",
      specialties: ["ME-C Engines", "Tankers", "Bulk Carriers", "Container Vessels"]
    },
    {
      name: "MR. WILLARD P. LAURENA",
      title: "Engine Instructor/Course Assessor/Course Developer",
      bio: "Licensed Chief Engineer and a Maritime Instructor. He is one of the pioneering graduates of the Maritime Academy of Asia and the Pacific in 2003. A marine engineer with experiences on MAN-ME and MAN-MC engines, Wartzila Rtflex Engines and Diesel Electric Propulsion System on-board Oil/Chemical Tankers, different types of offshore vessels and Bulk and Ore carriers.",
      specialties: ["MAN-ME", "MAN-MC Engines", "Wartzila Rtflex Engines", "Diesel Electric Propulsion Systems"]
    },
    {
      name: "MR. JOWEL B. ALCORAN",
      title: "On-Call Instructor",
      bio: "Licensed Master Mariner who served onboard Oil/Chem and Gas Tanker who graduated at the Philippine Merchant Marine Academy holding a BS in Marine Transportation. Mr. Alcoran is an Instructor for Liquid Cargo Handling Simulator.",
      specialties: ["Oil/Chem and Gas Tankers", "Liquid Cargo Handling Simulator"]
    }
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">VERITAS MARITIME TRAINING CENTER INSTRUCTORS</h1>
        <p className="text-xl text-center text-gray-700 mb-12">
          Meet our highly qualified instructors at the Veritas Maritime Training Center in Manila, Philippines
        </p>

        <div className="border-t border-gray-200 pt-10 mb-16">
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-6">
              <User size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800">Our Expert Instructors</h2>
            <p className="text-lg text-center text-gray-600 mt-4 max-w-3xl">
              Our instructors combine academic excellence with extensive practical experience,
              ensuring our training programs meet the highest industry standards and prepare seafarers for real-world challenges.
            </p>
          </div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
};

export default VeritasInstructors;