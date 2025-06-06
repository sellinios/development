"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroSection from './HeroSection';
import 'leaflet/dist/leaflet.css';
import type { Map } from 'leaflet';

export default function OdessaEmetcCourses() {
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

        // Define the coordinates for Odessa, Ukraine
        const odessa: [number, number] = [46.4825, 30.7233]; // [latitude, longitude]

        // Initialize the map
        const map = L.map('mapPopup', {
          center: odessa,
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
        const marker = L.marker(odessa, { icon: customIcon }).addTo(map);
        marker.bindPopup("EPSILON MARITIME TRAINING AND EDUCATIONAL CENTER<br>Frantsuz'ky Blvd, 54/23 Odesa, Ukraine").openPopup();

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
                  <td className="p-4">Bridge Team and Resource Management</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Bridge Resource Management – operational level</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">on request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Crew Resource Management</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">on request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Electronic Chart Display & Information System</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      ECDIS – <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">JRC</span> Type Specific
                    </div>
                    <span className="text-gray-600">Model: JAN- 901B / 701B / 2000 / 901M / 901 / 701</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      ECDIS – <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">JRC</span>  Type Specific
                    </div>
                    <span className="text-gray-600">New Model: JAN- 7201/ 9201</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">TH – F</td>
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
                         ECDIS – <span className="text-red-700 font-bold ">TRANSAS</span> Type Specific
                      </span>
                    </div>
                    <span className="text-gray-600">Model: Navi-Sailor 4000 / 3000</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">TH – F</td>
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
                  <td className="p-4">TH – F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>TRAINING on BOARD ECDIS – <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">JRC</span> Type Specific</span>
                    </div>
                    <span className="text-gray-600">Model: JAN- 901B / 701B / 2000 / 901M / 901 / 701</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">On request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Steering Course</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">TH to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Radar navigation, Radar plotting and use of ARPA (operational level)</td>
                  <td className="p-4 text-center">10 days</td>
                  <td className="p-4">On request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Radar navigation – management level, radar, ARPA, bridge teamwork, search and rescue</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">On request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Training for Masters and Chief Mates of large ships and ships with unusual maneuvering characteristics (CV 13300 TEU)</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">On request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Ship Handling and Maneuvering</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M to W</td>
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
                  <td className="p-4">Engine Room Resource Management</td>
                  <td className="p-4 text-center">10 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Engine Room Resource Management – operational level</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">On request</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* HEALTH, SAFETY AND SECURITY COURSES */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 relative font-montserrat uppercase">
            <span className="bg-white px-4 relative z-10">HEALTH, SAFETY AND SECURITY COURSES</span>
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
                  <td className="p-4">Security related training and instruction for all seafarers</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">T/TH</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Designated Security Duties of shipboard personnel</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">T/TH</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Ship Safety Officer</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M to W</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Ship Security Officer</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Risk Assessment & Incident Investigation</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M to W</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Container safety course</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Training for passenger ships personnel</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">On request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Basic training for liquefied gas tanker cargo operations</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">On request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Basic training for oil and chemical tanker cargo operations</td>
                  <td className="p-4 text-center">10 days</td>
                  <td className="p-4">On request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Bulk Carrier Safety</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M to T</td>
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
                  <td className="p-4">Shipboard Environmental Management Systems</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">TH to F</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* COMMUNICATION COURSES */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-center mb-6 relative font-montserrat uppercase">
            <span className="bg-white px-4 relative z-10">COMMUNICATION COURSES</span>
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
                  <td className="p-4">Marine Language Course</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">as per request</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CONTACT INFORMATION - Updated with Card Style */}
        <div className="mt-16" id="contact">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10 font-montserrat">LET'S MEET UP</h2>

          <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 font-montserrat">EPSILON MARITIME TRAINING AND EDUCATIONAL CENTER</h3>
            <p className="mb-2 font-raleway">
              Frantsuz'ky Blvd, 54/23<br />
              Odesa, Odes'ka oblast<br />
              Ukraine, 65000
            </p>
            <p className="mb-1 font-raleway">
              <strong>Tel:</strong> +380 48 728 00 62
            </p>
            <p className="mb-4 font-raleway">
              <strong>Email:</strong> <a href="mailto:training@epsilonhellas.com.ua" className="text-blue-600 hover:underline font-bold">training@epsilonhellas.com.ua</a>
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
              <h3 className="text-xl font-semibold">EPSILON MARITIME TRAINING CENTER - Odessa, Ukraine</h3>
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
                <strong>Address:</strong> Frantsuz'ky Blvd, 54/23 Odesa, Odes'ka oblast, Ukraine, 65000<br />
                <strong>Tel:</strong> +380 48 728 00 62<br />
                <strong>Email:</strong> training@epsilonhellas.com.ua
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}