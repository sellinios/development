'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';

// Import Map type from leaflet
import type { Map } from 'leaflet';

interface OfficeLocation {
  name: string;
  coordinates: LatLngTuple;
  address: string;
  tel: string;
  email: string;
}

interface OfficeLocations {
  [key: string]: OfficeLocation;
}

interface FormData {
  name: string;
  email: string;
  message: string;
  captcha: string;
}

export default function PhilippinesPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
    captcha: ''
  });

  // State to control map popup visibility
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [currentOffice, setCurrentOffice] = useState<OfficeLocation>({
    name: '',
    address: '',
    coordinates: [0, 0],
    tel: '',
    email: ''
  });

  // Properly type the map ref
  const mapRef = useRef<Map | null>(null);
  const mapInitializedRef = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    // Reset form or show success message
    setFormData({
      name: '',
      email: '',
      message: '',
      captcha: ''
    });
    // Show success message
    alert('Thank you for your message. We will get back to you soon.');
  };

  // Define office locations with their coordinates
  const officeLocations: OfficeLocations = {
    "EPSILON MARITIME SERVICES INC.": {
      name: "EPSILON MARITIME SERVICES INC.",
      coordinates: [14.5995, 120.9842],
      address: "Vernida IV Bldg. 126, L.P Leviste Str. Salcedo Village, Makati City Manila 1227 – Philippines",
      tel: "+63 2 8138000",
      email: "recruitment@epsilonmaritime.com.ph"
    },
    "KJCM MARITIME CORPORATION": {
      name: "KJCM MARITIME CORPORATION",
      coordinates: [14.5995, 120.9842],
      address: "11th Floor, Vernida IV Bldg. 128 L.P. Leviste St. Salcedo Village, Makati City Manila 1227 – Philippines",
      tel: "+63 2 8299967 or +63 2 8299963",
      email: "recruitment@kjcm.com.ph or art@kjcm.com.ph"
    },
    "EPSILON MARITIME SERVICES CEBU BRANCH": {
      name: "EPSILON MARITIME SERVICES CEBU BRANCH",
      coordinates: [10.3156, 123.8854],
      address: "G07 Don Alfredo D.Gothong Centre, Serging Osmena, North Reclamation Area, Cebu – Philippines",
      tel: "+63 998844079",
      email: "recruitment@epsilonmaritime.com.ph"
    },
    "KJCM MARITIME CORPORATION ILOILO BRANCH": {
      name: "KJCM MARITIME CORPORATION ILOILO BRANCH",
      coordinates: [10.7202, 122.5621],
      address: "Unit C, 2nd Floor, G&R Bldg, 33 M.H. Del Pilar, Brgy. Taal Molo, Iloilo City, 50000 – Philippines",
      tel: "+639 688620579",
      email: "iloilorecruitment@kjcm.com.ph"
    },
    "EPSILON MARITIME SERVICES DAVAO BRANCH": {
      name: "EPSILON MARITIME SERVICES DAVAO BRANCH",
      coordinates: [7.0707, 125.6087],
      address: "Door 2. Ground Flr, M.L.C Crome Commercial Building, 129, Dacudao Avenue Brgy. 20B, Poblacion District 8000, Davao, Philippines",
      tel: "+63 9088943427",
      email: "epsilondavao@epsilonmaritime.com.ph"
    },
    "VERITAS MARITIME TRAINING CENTER": {
      name: "VERITAS MARITIME TRAINING CENTER",
      coordinates: [14.5800, 120.9822],
      address: "Atlantis Beacon Tower Corp., Zone 079, 2315, Leon Guinto St, Malate, Manila, 1004 Metro Manila",
      tel: "+63 2 85534709",
      email: "info@veritasmtc.com.ph"
    },
    "VMTC ELECTRONIC ENGINE ME-C SITE": {
      name: "VMTC ELECTRONIC ENGINE ME-C SITE",
      coordinates: [14.5800, 120.9822],
      address: "Ground Floor Atlantis Beacon Tower Corp., Zone 079, 2315, Leon Guinto St, Malate, Manila, 1004 Metro Manila",
      tel: "+63 2 85534709",
      email: "info@veritasmtc.com.ph"
    },
  };

  // Function to open map popup for a specific office
  const openMapPopup = (officeName: string) => {
    const office = officeLocations[officeName];
    if (office) {
      setCurrentOffice(office);
      setShowMapPopup(true);
    }
  };

  // Function to close map popup
  const closeMapPopup = () => {
    setShowMapPopup(false);
  };

  // Initialize map when popup is shown
  useEffect(() => {
    if (showMapPopup) {
      // Reset the initialization flag when showing a new popup
      mapInitializedRef.current = false;

      // Clean up previous map instance if it exists
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Dynamically import Leaflet only when map popup is shown
      import('leaflet').then(L => {
        // Check if the map container element exists
        const mapContainer = document.getElementById('mapPopup');
        if (!mapContainer) return;

        // Initialize the map with the current office coordinates
        const map = L.map('mapPopup', {
          center: currentOffice.coordinates,
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
        const marker = L.marker(currentOffice.coordinates, { icon: customIcon }).addTo(map);
        marker.bindPopup(`${currentOffice.name}<br>${currentOffice.address.split(',')[0]}`).openPopup();

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
  }, [showMapPopup, currentOffice]);

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
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-96 w-full bg-gradient-to-r from-blue-800 to-blue-600 flex items-center">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/Home2.jpg"
            alt="Philippines maritime background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className="container mx-auto px-4 z-10">
          <h1 className="text-5xl font-bold text-white mb-4">The Philippines</h1>
          <p className="text-xl text-white">Maritime Excellence & Training Centers</p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-center text-blue-800 mb-6">Our Presence in the Philippines</h2>
          </div>

          {/* Vision Mission Section */}
          <div className="mb-12">
            <p className="text-lg mb-8">
              The Philippines is a prime maritime nation that produces outstanding seafaring talent. Filipino seafarers are hard-working, loyal,
              and highly experienced in a diversified range of vessels. Their advanced skills have proven valuable for many Western and
              Japanese Principals alike making the country one of the most trustworthy sources of human capital in the shipping sector.
              Epsilon is proud for its unique, solid presence in the country.
            </p>

            <div className="flex justify-center mb-8">
              <Link
                href="https://site.epsilonhellas.com/locations/the-philippines/vision-mission-quality-policy/"
                className="bg-blue-900 hover:bg-blue-800 text-white py-3 px-8 font-semibold uppercase"
              >
                VISION, MISSION, QUALITY POLICY
              </Link>
            </div>

            <p className="text-center text-lg mb-8">
              Our objective of recruiting and nurturing highly competent Filipino crew to man our principals' vessels is
              realized through the following fully-controlled establishments:
            </p>
          </div>

          {/* Let's Meet Up Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">LET'S MEET UP</h2>
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1 bg-blue-800"></div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-12">
              {/* Office Locations */}
              {Object.keys(officeLocations).map((office, index) => (
                <div key={index} className="bg-blue-50 p-6 rounded-lg shadow-md">
                  <div className="flex items-start mb-3">
                    <div className="text-blue-800 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-800 uppercase">{office}</h3>
                  </div>

                  <div className="ml-8 mb-4">
                    <p className="mb-3">
                      {officeLocations[office].address.split(',').map((line, i) => (
                        <React.Fragment key={i}>
                          {line.trim()}<br />
                        </React.Fragment>
                      ))}
                    </p>

                    <p className="mb-3">
                      <strong>Tel:</strong> {officeLocations[office].tel}<br />
                      <strong>Email:</strong> {officeLocations[office].email.includes(' or ') ? (
                        <>
                          {officeLocations[office].email.split(' or ').map((email, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && ' or '}
                              <a href={`mailto:${email.trim()}`} className="text-blue-800 hover:underline">{email.trim()}</a>
                            </React.Fragment>
                          ))}
                        </>
                      ) : (
                        <a href={`mailto:${officeLocations[office].email}`} className="text-blue-800 hover:underline">{officeLocations[office].email}</a>
                      )}
                    </p>

                    <button
                      onClick={() => openMapPopup(office)}
                      className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      View on Map
                    </button>

                    {office === "VMTC ELECTRONIC ENGINE ME-C SITE" && (
                      <div className="mt-4">
                        <Link
                          href="https://site.epsilonhellas.com/services/training/"
                          className="inline-block bg-blue-900 hover:bg-blue-800 text-white py-2 px-4 rounded-none font-medium text-sm"
                        >
                          VIEW TRAINING SERVICES
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jobs Section */}
          <div className="bg-gray-50 p-6 rounded-lg shadow-md mb-8 text-center">
            <h3 className="text-2xl font-semibold mb-4 text-blue-800">Careers at Sea</h3>
            <p className="text-lg mb-6">Looking for maritime job opportunities? Join our global network of seafarers.</p>
            <Link
              href="/careers-at-sea"
              className="inline-block bg-[#003070] hover:bg-blue-800 text-white py-3 px-6 rounded-md font-semibold flex items-center shadow-lg transition-all duration-300 mx-auto w-fit"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 7.5a.75.75 0 01.75.75v3h3a.75.75 0 010 1.5h-3v3a.75.75 0 01-1.5 0v-3h-3a.75.75 0 010-1.5h3v-3A.75.75 0 0112 7.5z" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5z" clipRule="evenodd" />
              </svg>
              APPLY FOR A JOB
            </Link>
          </div>

          {/* Contact Form */}
          <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4 text-blue-800">Contact Us</h3>
            <p className="mb-6">Send us a message and our team in the Philippines will get back to you as soon as possible.</p>

            <form onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block mb-2 font-medium">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 font-medium">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="message" className="block mb-2 font-medium">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                ></textarea>
              </div>

              <div className="mb-6">
                <div className="flex items-center bg-gray-50 p-3 rounded-md">
                  <div className="mr-4 bg-gray-200 px-3 py-2 rounded text-gray-700">
                    CAPTCHA
                  </div>
                  <div>
                    <label htmlFor="captcha" className="block mb-1 text-sm">Type the characters you see:</label>
                    <input
                      type="text"
                      id="captcha"
                      name="captcha"
                      value={formData.captcha}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
              >
                SUBMIT
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Map Popup */}
      {showMapPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 max-w-4xl mx-auto overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">{currentOffice.name} - Philippines</h3>
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
                <strong>Address:</strong> {currentOffice.address}<br />
                <strong>Tel:</strong> {currentOffice.tel}<br />
                <strong>Email:</strong> {currentOffice.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}