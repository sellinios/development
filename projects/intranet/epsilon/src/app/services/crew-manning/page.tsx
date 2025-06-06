import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import HeroSection from './HeroSection';

export const metadata = {
  title: 'Crew Manning | Epsilon',
  description: 'Professional crew manning solutions with high retention rates for vessel operators',
};

export default function CrewManning() {
  const originalContent = (
    <>
      <div className="max-w-7xl mx-auto px-4 py-16 content-container">
        <div className="mb-16">
          {/* Title Removed because it's handled by HeroSection */}

          <div className="grid md:grid-cols-2 gap-12 text-lg">
            <div>
              <p className="text-gray-700 leading-relaxed mb-6">
                Out of a pool of several thousands of seafarers of various nationalities, experience and skill base, we can provide clients with the manning scheme that they desire. Ranging from a single seafarer up to a full crew synthesis, we man vessels of all types across all ranks, carefully attending to the idiosyncratic requirements of discerning Managers. We apply strict selection criteria and we recruit the most fitting seafarers according to clients' policies and budgetary concerns.
              </p>
            </div>
            <div>
              <p className="text-gray-700 leading-relaxed mb-6">
                Through our manning scheme, Epsilon has earned an enviable reputation in our field for one of the highest retention and loyalty levels in the industry worldwide. Our care & support for our seafarers, their families and their wellbeing, our training centers that enhance the quality and sophistication of our seafarers, as well as the continuous improvement of our management system, guarantee the smooth supply of skilled labour onboard.
              </p>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed text-center mt-12 text-xl">
            Epsilon Hellas can also arrange for the deployment of Repair Teams or Gas Free Teams.<br />
            These teams of well-trained professionals can tackle specific jobs on a short or medium term contract period.
          </p>
        </div>
      </div>
    </>
  );

  return (
    <PageTemplate
      heroSection={<HeroSection />}
      content={originalContent}
    />
  );
}