"use client";
import React from 'react';
import Link from 'next/link';
import { Phone, Mail, Building, MapPin, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#2F3E50] text-white">
      {/* Main content section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Locations Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase">Locations</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <p><Link href="/locations/the-philippines" className="hover:text-blue-300 transition-colors">The Philippines</Link></p>
                <p><Link href="/locations/russia" className="hover:text-blue-300 transition-colors">Russia</Link></p>
                <p><Link href="/locations/turkey" className="hover:text-blue-300 transition-colors">Turkey</Link></p>
                <p><Link href="/locations/cyprus" className="hover:text-blue-300 transition-colors">Cyprus</Link></p>
                <p><Link href="/locations/vietnam" className="hover:text-blue-300 transition-colors">Vietnam</Link></p>
              </div>
              <div>
                <p><Link href="/locations/ukraine" className="hover:text-blue-300 transition-colors">Ukraine</Link></p>
                <p><Link href="/locations/romania" className="hover:text-blue-300 transition-colors">Romania</Link></p>
                <p><Link href="/locations/greece" className="hover:text-blue-300 transition-colors">Greece</Link></p>
                <p><Link href="/locations/indonesia" className="hover:text-blue-300 transition-colors">Indonesia</Link></p>
                <p><Link href="/locations/georgia" className="hover:text-blue-300 transition-colors">Georgia</Link></p>
              </div>
            </div>
          </div>

          {/* Training Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase">Training</h3>
            <ul className="space-y-2">
              <li><Link href="/services/training/veritas-courses" className="hover:text-blue-300 transition-colors">Veritas Manila – Veritas Maritime Training Center, Inc.</Link></li>
              <li><Link href="/services/training/odessa-emetc-courses" className="hover:text-blue-300 transition-colors">Veritas Odessa – Epsilon Maritime Educational & Training Center</Link></li>
              <li><Link href="/services/training/constanta-courses" className="hover:text-blue-300 transition-colors">Veritas Constanta – Veritas Maritime Training Center</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 uppercase">Contact us</h3>

            {/* Cyprus Office */}
            <div className="mb-6">
              <p className="font-bold flex items-center gap-2">
                <Building size={16} />
                Epsilon Hellas Head Office
              </p>
              <address className="not-italic ml-6 text-sm">
                <div className="flex items-start gap-2 mt-1">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <div>
                    <p>Vasileos Konstantinou, 113-115, Limassol, 3080, Cyprus</p>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-2">
                  <Phone size={16} />
                  <a href="tel:+35725266050" className="hover:text-blue-300 transition-colors">+357 25266050</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href="mailto:crew@epsilonhellas.com" className="hover:text-blue-300 transition-colors">crew@epsilonhellas.com</a>
                </p>
              </address>
            </div>

            {/* Greece Office */}
            <div>
              <p className="font-bold flex items-center gap-2">
                <Building size={16} />
                Epsilon Hellas
              </p>
              <address className="not-italic ml-6 text-sm">
                <div className="flex items-start gap-2 mt-1">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <div>
                    <p>Leoforos Vouliagmenis, 120-122, Glyfada, 16674, Greece</p>
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-2">
                  <Phone size={16} />
                  <a href="tel:+302104551500" className="hover:text-blue-300 transition-colors">+30 210 45 51 500</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={16} />
                  <a href="mailto:crew@epsilonhellas.com" className="hover:text-blue-300 transition-colors">crew@epsilonhellas.com</a>
                </p>
              </address>
            </div>

            {/* Social Media */}
            <div className="mt-4">
              <a href="https://www.facebook.com/epsiloncrew" target="_blank" rel="noopener noreferrer" className="bg-[#0A3B7C] hover:bg-blue-800 p-2 rounded-none transition-colors inline-block">
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="border-t border-slate-600 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-2 md:mb-0">
            Copyright All Rights Reserved © {new Date().getFullYear()}
          </div>
          <div>
            Designed by <span className="font-bold">Epsilon RND</span>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;