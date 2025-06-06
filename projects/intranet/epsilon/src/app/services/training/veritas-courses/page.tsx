"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroSection from './HeroSection';
import 'leaflet/dist/leaflet.css';
import type { Map, LatLngTuple, LatLngExpression } from 'leaflet';

export default function ManilaVeritasCourses() {
  // State to control map popup visibility
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    coordinates: [number, number];
    tel: string;
    email: string;
  } | null>(null);

  // Properly type the map ref
  const mapRef = useRef<Map | null>(null);
  const mapInitializedRef = useRef(false);

  const locations = {
    vmtc: {
      name: "VMTC Electronic Engine ME-C site",
      address: "Ground Floor Atlantis Beacon Tower Corp., Zone 079, 2315, Leon Guinto St, Malate, Manila, 1004 Metro Manila",
      coordinates: [14.5755, 120.9850] as [number, number], // Manila coordinates
      tel: "+63 2 85534709",
      email: "info@veritasmtc.com.ph"
    },
    veritas: {
      name: "Veritas Maritime Training Center",
      address: "Atlantis Beacon Tower Corp., Zone 079, 2315, Leon Guinto St, Malate, Manila, 1004 Metro Manila",
      coordinates: [14.5755, 120.9850] as [number, number], // Manila coordinates
      tel: "+63 2 85534709",
      email: "info@veritasmtc.com.ph"
    }
  };

  // Function to open map popup
  const openMapPopup = (locationType: 'vmtc' | 'veritas') => {
    setSelectedLocation(locations[locationType]);
    setShowMapPopup(true);
  };

  // Function to close map popup
  const closeMapPopup = () => {
    setShowMapPopup(false);
  };

  // Initialize map when popup is shown
  useEffect(() => {
    if (showMapPopup && selectedLocation && !mapInitializedRef.current) {
      // Dynamically import Leaflet only when map popup is shown
      import('leaflet').then(L => {
        // Check if the map container element exists
        const mapContainer = document.getElementById('mapPopup');
        if (!mapContainer) return;

        // Initialize the map
        const map = L.map('mapPopup', {
          center: selectedLocation.coordinates,
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
        const marker = L.marker(selectedLocation.coordinates, { icon: customIcon }).addTo(map);
        marker.bindPopup(`${selectedLocation.name}<br>${selectedLocation.address}`).openPopup();

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
  }, [showMapPopup, selectedLocation]);

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
                  <td className="p-4">Ship Simulator & Bridge Teamwork</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Bridge Team Management</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Bridge Resource Management</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Ship Simulator & Bridge Teamwork w/ Bridge Team Management</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Ship Simulator & Bridge Teamwork w/ Bridge Resource Management</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
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
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      ECDIS – <span className="bg-red-600 text-white px-2 py-0.5 text-xs font-bold rounded">JRC</span>  Type Specific
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
                    <span className="text-gray-600">Model: FEA 2107 / FEA 2807 / FMD 3200 / FMD 3300</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>
                         ECDIS – <span className="text-red-700 font-bold ">TRANSAS</span> Type Specific
                      </span>
                    </div>
                    <span className="text-gray-600">Model: Navi-Sailor 4000</span>
                  </td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M-T / W-TH / F-S</td>
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
                  <td className="p-4 text-center">2 to 3 days<br/><span className="text-gray-600">max. 3 Officers</span></td>
                  <td className="p-4">as per request</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Steering Course</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">TH to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Passage Planning</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Ship Handling and Maneuvering</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
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
                  <td className="p-4">Engine Room Simulator with ERM</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Engine Resource Management</td>
                  <td className="p-4 text-center">3 days</td>
                  <td className="p-4">W to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C Standard Operation</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C Advanced Troubleshooting</td>
                  <td className="p-4 text-center">5 days</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C Electrician Standard Maintenance</td>
                  <td className="p-4 text-center">4 days</td>
                  <td className="p-4">M to Th</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">ME-C Generic Familiarization</td>
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
                  <td className="p-4">Ship Security Awareness Training and Seafarer with Designated Security Duties</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">M to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Safety Officer Training Course</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Anti-Piracy Awareness Seminar</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4">W</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Risk Assessment & Incident Investigation</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">Th to F</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">Hazardous Materials</td>
                  <td className="p-4 text-center">4 days</td>
                  <td className="p-4">M to Th</td>
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
                  <td className="p-4">Shipboard Environmental Management System</td>
                  <td className="p-4 text-center">2 days</td>
                  <td className="p-4">M to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">MARPOL V</td>
                  <td className="p-4 text-center">6 days</td>
                  <td className="p-4">M to T</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="p-4">IMO 2020</td>
                  <td className="p-4 text-center">1 day</td>
                  <td className="p-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Map Popup */}
      {showMapPopup && selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 max-w-4xl mx-auto overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selectedLocation.name} - Manila, Philippines</h3>
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
                <strong>Address:</strong> {selectedLocation.address}<br />
                <strong>Tel:</strong> {selectedLocation.tel}<br />
                <strong>Email:</strong> {selectedLocation.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}