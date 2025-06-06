import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import HeroSection from './HeroSection';

export const metadata = {
  title: 'Pre-Vetting for RightShip Inspection | Epsilon',
  description: 'Professional pre-vetting services for RightShip inspections by Epsilon',
};

export default function PreVetting() {
  const originalContent = (
    <>
      {/* Added Title Section - Matching the style from Onboard Repairs */}
      <div className="max-w-7xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-6">DESCRIPTION OF SERVICES</h1>
      </div>
       <div className="w-16 h-1 bg-blue-600 mx-auto mb-12"></div>

      {/* Introduction Section - Styled like the Onboard Repairs page */}
      <div className=" text-lg max-w-7xl mx-auto py-12 px-4">
        <div className="max-w-none">
          <p className="text-gray-700 mb-6">
            Our pre-vetting service is a real-life and genuine assessment of the vessel's status considering a forthcoming RightShip inspection. It includes:
          </p>

          <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
            <div className="flex mb-4">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>A confidential inspection, done only for you, under the latest RightShip Inspection requirements.</p>
            </div>
            <div className="flex mb-4">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Thorough onboard assessment of all areas.</p>
            </div>
            <div className="flex mb-4">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Involving all teams for a successful outcome.</p>
            </div>
             <div className="flex mb-4">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>A list of Findings shared immediately, and detailed report following shortly after, to allow you timely adjustments.</p>
            </div>
          </ul>

          <p className="text-gray-700 mb-6">
            In addition, we support you with services of training, system review, audits, and performance consulting. These can be offered as a package or separately, delivered in a highly professional manner to enable your teams to use them for further improvements.
          </p>

          <p className="text-gray-700 mb-6">
            Our services are run by our Athens office and managed by our seasoned industry experts and exclusive inspectors. Our people are well-versed in DRY BMS, RightShip, as well as other quality assurance frameworks and are stationed in key locations – Manila, Qingdao, Jakarta, Constanta.
          </p>
        </div>
      </div>

      {/* Main Outcomes Section - Converted to two-column list like Onboard Repairs */}
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">MAIN OUTCOMES</h2>
        </div>
        <div className="w-16 h-1 bg-blue-600 mx-auto mb-12"></div>

        <div className="text-lg grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <div className="flex mb-4">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <p>Pre-vetting inspection and report in line with current RightShip imperatives.</p>
              </div>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Onboard training solutions across a range of topics.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Review and gap analysis on safety management systems.</span>
              </li>
            </ul>
          </div>
          <div>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Audits and Assessments to ensure issues are addressed over time.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Consulting on profile scoring and RightShip health-checks.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Suggested integration of best industry practices with our actionable insights.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Benefits Section - Converted to two-column list like Onboard Repairs */}
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-6">BENEFITS</h2>
        </div>
         <div className="w-16 h-1 bg-blue-600 mx-auto mb-12"></div>

        <div className="text-lg grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Cost-efficient awareness of imminent inspection risks.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Seamless preparation for inspections via identification of practice gaps.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Suggesting improvements in line with RightShip requirements.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Aid in implementing corrective actions and enhancing compliance.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Signposting upgrades in procedural workflow and teamwork.</span>
              </li>
            </ul>
          </div>
          <div>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Tapping into our collective experience in dry and wet segments.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Fostering an inspection preparedness ethos.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Privileged access to hands-on expertise linked to formal inspections.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2 font-bold">›</span>
                <span>Cultivation of a culture of ongoing learning.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Combined Goal Section and Contact Section - Left aligned */}
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-center text-gray-900">ONE EVENTUAL AIM</h2>
        </div>
        <div className="w-16 h-1 bg-blue-600 mx-auto mb-12"></div>

        <div className="text-lg">
          <p className="mb-8">
            Enhancing the likelihood for <span className="text-blue-600 font-medium">high inspection scores</span> during formal audits and RightShip inspections,
          </p>

          <p className="mb-4">Contact point:</p>

          <p className="mb-2">Lito Vertzini – <span className="font-medium">lvertzini@veritasmtc.com.ph</span></p>
          <p className="mb-2">Land line: +302104551552</p>
          <p className="mb-2">Mobile: +30 69 8173 4990</p>
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