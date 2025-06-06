"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroSection from './HeroSection';
import 'leaflet/dist/leaflet.css';
import type { Map, LatLngTuple, LatLngExpression } from 'leaflet';

export default function ConstantaCourses() {
  // State to control map popup visibility
  const [showMapPopup, setShowMapPopup] = useState(false);

  // Properly type the map ref
  const mapRef = useRef<Map | null>(null);
  const mapInitializedRef = useRef(false);

  // Function to open map popup
  const openMapPopup = () => {
    setShowMapPopup(true);
  };

  // Function to close map popup
  const closeMapPopup = () => {
    setShowMapPopup(false);
  };

  // Initialize map when popup is shown
  useEffect(() => {
    if (showMapPopup && !mapInitializedRef.current) {
      // Dynamically import Leaflet only when map popup is shown
      import('leaflet').then(L => {
        // Check if the map container element exists
        const mapContainer = document.getElementById('mapPopup');
        if (!mapContainer) return;

        // Define the coordinates for Constanta, Romania
        const constanta: [number, number] = [44.1814, 28.6339]; // [latitude, longitude]

        // Initialize the map
        const map = L.map('mapPopup', {
          center: constanta,
          zoom: 15,
          zoomControl: true,
          attributionControl: true
        });

        // Store the map instance in the ref
        mapRef.current = map;

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Create a custom icon
        const customIcon = L.icon({
          iconUrl: '/images/location-pin.svg',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        // Add a marker for the office location with custom icon
        const marker = L.marker(constanta, { icon: customIcon }).addTo(map);
        marker.bindPopup("Veritas Maritime Training Center<br>111 Ion Lahovari Street, 900588, Constanta Romania").openPopup();

        // Mark as initialized
        mapInitializedRef.current = true;

        // Force map to recalculate its size after rendering in popup
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize();
          }
        }, 100);
      });
    }

    // Reset initialization when popup is closed
    if (!showMapPopup && mapInitializedRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      mapInitializedRef.current = false;
    }
  }, [showMapPopup]);

  // Cleanup map when component unmounts
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitializedRef.current = false;
      }
    };
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8" id="courses">

        {/* DECK COURSES */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 relative font-montserrat uppercase">
            <span className="bg-white px-4 relative z-10">DECK COURSES</span>
            <div className="absolute top-1/2 w-full h-px bg-gray-300 -z-0"></div>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-blue-900 text-white font-montserrat">
                  <th className="p-4 text-left w-1/2">COURSE NAME</th>
                  <th className="p-4 text-center w-1/4">DURATION</th>
                  <th className="p-4 text-left w-1/4">SCHEDULE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-raleway">
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      ECDIS – <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">JRC</span> Type Specific
                    </div>
                    <span className="text-gray-600">Model: JAN- 901B / 701B / 2000 / 901M / 901 / 701</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      ECDIS – <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">JRC</span> Type Specific
                    </div>
                    <span className="text-gray-600">New Model: JAN- 7201/ 9201</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>
                          ECDIS – <span className="text-blue-800 font-bold uppercase">FURUNO</span> Type Specific
                     </span>
                    </div>
                    <span className="text-gray-600">Model: FMD 3100 / FMD 3200 / FMD 3300 (CBT)</span>
                  </td>
                  <td className="p-4 text-center"></td>
                  <td className="p-4">M-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>
                          ECDIS – <span className="text-blue-800 font-bold uppercase">FURUNO</span> Type Specific
                     </span>
                    </div>
                    <span className="text-gray-600">Model: FEA 2107 / FEA 2807 (CAT)</span>
                  </td>
                  <td className="p-4 text-center"></td>
                  <td className="p-4">M-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>
                         ECDIS – <span className="text-teal-600 font-bold uppercase">DANELEC</span> Type Specific
                     </span>
                    </div>
                    <span className="text-gray-600">Model: DM800 ECDIS G1 ver. 1.5x and G2 ver. 2.xx</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>
                          ECDIS – <span className="text-blue-900 font-bold">IME</span> Intermarine Type Specific
                    </span>
                    </div>
                    <span className="text-gray-600">Model: Navigator 6.0</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ECDIS SIMRAD MARIS 900</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ECDIS SIMRAD E5024</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">CHARTWORLD EGLOBE-EGLOBE G2</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">SAM ELECTRONICS ECDISPILOT PLATINUM-CHARTPILOT</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">NG SPERRY MARINEVISIONMASTER FT</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>SAFEBRIDGE PLATFORM ECDIS</span>
                    </div>
                    <span className="text-gray-600">KELVIN HUGHES MANTA DIGITAL ECDIS</span>
                    <br />
                    <span className="text-gray-600">NORTHROP GRUMMAN SPERRY MARINE VISIONMASTER</span>
                    <br />
                    <span className="text-gray-600">IMTECH SEAGUIDE</span>
                    <br />
                    <span className="text-gray-600">RAYTHEON ANSCHUTZ ECDIS</span>
                    <br />
                    <span className="text-gray-600">CONSILIUM S-ECDIS-SELESMAR ECDIS</span>
                    <br />
                    <span className="text-gray-600">MARTEK MARINE IECDIS</span>
                    <br />
                    <span className="text-gray-600">TOKYO KEIKI EC-8100/8600</span>
                    <br />
                    <span className="text-gray-600">TRANSAS NAVI SAILOR 4000</span>
                    <br />
                    <span className="text-gray-600">IMTECH SEAGUIDE</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">SHIP SIMULATOR WITH BRIDGE TEAM AND RESOURCE MANAGEMENT</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">SHIP SIMULATOR WITH BRIDGE TEAM AND RESOURCE MANAGEMENT(Refresher)</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M-W</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">SHIP'S HANDLING AND MANEUVERING</td>
                  <td className="p-4 text-center">4 days</td>
                  <td className="p-4">T-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">SHIP'S HANDLING AND MANEUVERING (Refresher)</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">T-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ICE NAVIGATOR</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">W-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">OIL/CHEMICAL TANKER CARGO AND BALLAST HANDLING SIMULATOR</td>
                  <td className="p-4 text-center">4 days</td>
                  <td className="p-4">T-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">OIL/CHEMICAL TANKER CARGO AND BALLAST HANDLING SIMULATOR(Refresher)</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">T-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">OPERATIONAL USE OF INTEGRATED BRIDGE SYSTEMS</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">RADAR ARPA BRIDGE TEAMWORK AND SEARCH AND RESCUE</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M-W</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">RADAR ARPA BRIDGE TEAMWORK AND SEARCH AND RESCUE(Refresher)</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M-W</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ENGINE COURSES */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 relative font-montserrat uppercase">
            <span className="bg-white px-4 relative z-10">ENGINE COURSES</span>
            <div className="absolute top-1/2 w-full h-px bg-gray-300 -z-0"></div>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-blue-900 text-white font-montserrat">
                  <th className="p-4 text-left w-1/2">COURSE NAME</th>
                  <th className="p-4 text-center w-1/4">DURATION</th>
                  <th className="p-4 text-left w-1/4">SCHEDULE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-raleway">
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ENERGY EFFICIENT OPERATION OF SHIPS</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">W-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ENGINE ROOM SIMULATOR WITH ENGINE TEAM AND RESOURSE MANEGEMENT</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ENGINE ROOM SIMULATOR WITH ENGINE TEAM AND RESOURSE MANEGEMENT(Refresher)</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M-W</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C STANDARD OPERATION</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C ADVANCED TROUBLESHOOTING</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M-F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C ELECTRICIAN STANDARD MAINTENANCE</td>
                  <td className="p-4 text-center">4 days</td>
                  <td className="p-4">M-T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C GENERIC FAMILIARIZATION</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* HEALTH, SAFETY AND SECURITY COURSES */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 relative font-montserrat uppercase">
            <span className="bg-white px-4 relative z-10">HEALTH, SAFETY & SECURITY COURSES</span>
            <div className="absolute top-1/2 w-full h-px bg-gray-300 -z-0"></div>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-blue-900 text-white font-montserrat">
                  <th className="p-4 text-left w-1/2">COURSE NAME</th>
                  <th className="p-4 text-center w-1/4">DURATION</th>
                  <th className="p-4 text-left w-1/4">SCHEDULE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-raleway">
                <tr className="hover:bg-gray-50">
                  <td className="p-4">SAFETY OFFICER COURSE</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M-W / TH-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">SAFETY OFFICER COURSE(Refresher)</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / FR-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">INCIDENT INVESTIGATION & RISK ASSESSMENT COURSE</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M-W / TH-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">INCIDENT INVESTIGATION & RISK ASSESSMENT COURSE(Refresher)</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / FR-S</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ENVIRONMENTAL PROTECTION COURSES */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 relative font-montserrat uppercase">
            <span className="bg-white px-4 relative z-10">ENVIRONMENTAL PROTECTION COURSES</span>
            <div className="absolute top-1/2 w-full h-px bg-gray-300 -z-0"></div>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-blue-900 text-white font-montserrat">
                  <th className="p-4 text-left w-1/2">COURSE NAME</th>
                  <th className="p-4 text-center w-1/4">DURATION</th>
                  <th className="p-4 text-left w-1/4">SCHEDULE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-raleway">
                <tr className="hover:bg-gray-50">
                  <td className="p-4">MARPOL COURSE</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M-W / TH-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">MARPOL COURSE(Refresher)</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / FR-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">HAZMAT COURSE</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M-W / TH-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">HAZMAT COURSE(Refresher)</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T/ W-TH / FR-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">BALLAST MANAGEMENT PLAN</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">M / T / W / TH / F / S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">BALLAST MANAGEMENT PLAN(Refresher)</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / FR-S</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* OTHER COURSES */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 relative font-montserrat uppercase">
            <span className="bg-white px-4 relative z-10">OTHER COURSES</span>
            <div className="absolute top-1/2 w-full h-px bg-gray-300 -z-0"></div>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-blue-900 text-white font-montserrat">
                  <th className="p-4 text-left w-1/2">COURSE NAME</th>
                  <th className="p-4 text-center w-1/4">DURATION</th>
                  <th className="p-4 text-left w-1/4">SCHEDULE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-raleway">
                <tr className="hover:bg-gray-50">
                  <td className="p-4">MARINE LANGUAGE COURSE</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">M / T / W / TH / F / S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">CREW EVALUATION SYSTEM TEST</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">M / T / W / TH / F / S</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CONTACT INFORMATION - Updated with Card Style */}
        <div className="mt-16" id="contact">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10 font-montserrat">LET'S MEET UP</h2>

          <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 font-montserrat">VERITAS MARITIME TRAINING CENTER</h3>
            <p className="mb-2 font-raleway">
              111 Ion Lahovari Street<br />
              900588, Constanta<br />
              Romania
            </p>
            <p className="mb-1 font-raleway">
              <strong>Tel:</strong> +40 372727141-2
            </p>
            <p className="mb-4 font-raleway">
              <strong>Email:</strong> <a href="mailto:info@vmtc.ro" className="text-blue-600 hover:underline font-bold">info@vmtc.ro</a>
            </p>
            <button
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
              onClick={() => openMapPopup()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              View on Map
            </button>
          </div>
        </div>
      </main>

      {/* Map Popup */}
      {showMapPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 max-w-4xl mx-auto overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Veritas Maritime Training Center - Constanta, Romania</h3>
              <button
                onClick={closeMapPopup}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div id="mapPopup" className="h-96 w-full"></div>
            <div className="p-4 bg-blue-50">
              <p>
                <strong>Address:</strong> 111 Ion Lahovari Street, 900588, Constanta Romania<br />
                <strong>Tel:</strong> +40 372727141-2<br />
                <strong>Email:</strong> info@vmtc.ro
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}