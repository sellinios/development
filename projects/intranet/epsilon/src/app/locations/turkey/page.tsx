'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';

// Import Map type from leaflet
import type { Map } from 'leaflet';

export default function TurkeyPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    captcha: ''
  });

  // State to control map popup visibility
  const [showMapPopup, setShowMapPopup] = useState(false);

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

        // Define the coordinates for Istanbul, Turkey
        const istanbul: LatLngTuple = [41.0082, 28.9784]; // [latitude, longitude]

        // Initialize the map
        const map = L.map('mapPopup', {
          center: istanbul,
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
        const marker = L.marker(istanbul, { icon: customIcon }).addTo(map);
        marker.bindPopup("OMIKRON CREW MANAGEMENT<br>Bağdat Caddesi No:244, Kadıköy İstanbul").openPopup();

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
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-96 w-full bg-gradient-to-r from-blue-700 to-blue-900 flex items-center">
        <div className="absolute inset-0 opacity-30">
          <Image
            src="/Home2.jpg"
            alt="Turkey maritime background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        <div className="container mx-auto px-4 z-10">
          <h1 className="text-5xl font-bold text-white mb-4">Turkey</h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-center text-blue-800 mb-6">Our Presence in Turkey</h2>

            <div className="mb-8">
              <p className="text-lg mb-4">
                Numbers do not lie and Turkey is undoubtedly one of the main “producers” of qualified officers for ocean-going vessels. Turkish officers have a long experience working onboard Western European vessels and their performance is increasingly acknowledged as being of superior quality.
              </p>
              <p className="text-lg mb-6">
                Epsilon is present in the country through Omikron, located in the Asian side of Istanbul and can provide access to a unique pool of high-quality Turkish officers to discerning Principals.
              </p>

            </div>
          </div>

          {/* Contact Section with Cards */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">LET'S MEET UP</h2>
             <div className="flex justify-center mb-6">
              <div className="w-12 h-1 bg-blue-800"></div>
            </div>

            {/* Office Information Card */}
            <div className="bg-blue-50 p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">OMIKRON CREW MANAGEMENT</h3>
              <div>
                <p className="mb-2">
                  Bağdat Caddesi No:244<br />
                  Ergun Apt. Daire: 5 Caddebostan<br />
                  Kadıköy İstanbul 34728 – TURKEY
                </p>
                <p className="mb-1">
                  <strong>Tel:</strong> +90 216 801 64 84
                </p>
                <p className="mb-1">
                  <strong>Tel2:</strong> +90 216 747 34 74
                </p>
                <p className="mb-4">
                  <strong>Email:</strong> crew@omikroncrew.com
                </p>
                <button
                  onClick={openMapPopup}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  View on Map
                </button>
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
              <p className="mb-6">Send us a message and our team in Turkey will get back to you as soon as possible.</p>

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
        </div>
      </section>

      {/* Map Popup */}
      {showMapPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-2/3 max-w-4xl mx-auto overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">OMIKRON CREW MANAGEMENT - Istanbul, Turkey</h3>
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
                <strong>Address:</strong> Bağdat Caddesi No:244, Ergun Apt. Daire: 5 Caddebostan, Kadıköy İstanbul 34728<br />
                <strong>Tel:</strong> +90 216 801 64 84<br />
                <strong>Email:</strong> crew@omikroncrew.com
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}