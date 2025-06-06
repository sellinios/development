import React from 'react';
import PageTemplate from '../../components/PageTemplate';
import HeroSection from './HeroSection';

export const metadata = {
  title: 'Crew Management | Epsilon',
  description: 'Holistic and comprehensive crew management solutions for vessel operators',
};

export default function CrewManagement() {
  // Original content component to preserve all text exactly as it was
  const originalContent = (
    <>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 content-container">
        {/* Introduction */}
        <div className="grid md:grid-cols-2 gap-12 mb-16 text-lg">
          <div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Our crew management package is a holistic and comprehensive solution that takes care of all crewing parameters & issues. Related responsibilities that consume money, time and energy for a Ship Owner/Manager are managed by us and this allows clients to focus on other operational issues. Our Operations, Travel, Agency, Training and Accounts departments coordinate to ensure the seamless deployment of crewing operations for your vessels.
            </p>
          </div>
          <div>
            <p className="text-gray-700 leading-relaxed">
              Given that crewing is a function of high complexity and critical importance for the operational efficiency of one's vessels, Epsilon carefully plans and develops related solutions which offer peace of mind for the Ship Owner/Manager while at the same time retaining full and absolute control from the client's side.
            </p>
          </div>
        </div>

        {/* Management Scheme */}
        <div className="mb-0">
          <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800">
            OUR CREW MANAGEMENT SCHEME WORKS UNDER A FIXED MONTHLY LUMPSUM AMOUNT, AGREED ON AN ANNUAL BASIS, AND IS GENERALLY INCLUSIVE OF THE FOLLOWING ITEMS:
          </h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto mb-12"></div>

          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-lg">
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Crew Wages, in accordance with the cover selected (CBA or not) and the nationality preferred by the Principal</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Advanced Training to include BRM, ERM and ECDIS Specific</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Recruiting expenses, inclusive of Visas, Domestic travel expenses, STCW Documentation, medical examinations, company uniforms, safety shoes, winter and safety gear</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>In-House and Computer Based Training (CBT)</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Joining & repatriation ticket expenses for all crew</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>MGA and accounts control</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Crew Victualing Cost</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Union negotiations (where applicable)</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Primary Insurance cover for up to usual P+I deductible</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Legal expenses</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Communication charges (Epsilon outgoing)</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Attendance expenses, including a number of regular visits annually by our staff (Port Captain or Supt. Engineer) to the ship</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Cash to Master inclusive of Bank charges, insurance costs and exchange difference costs</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Management Fee</p>
            </div>
          </div>
        </div>

        {/* Benefits section */}
        <div className="mt-16 mb-0">
          <h2 className="text-2xl font-semibold text-center mb-2 text-gray-800">
            THE BENEFITS OF THIS ONE-STOP-SHOP APPROACH ARE:
          </h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto mb-8"></div>

          {/* Benefits list formatted exactly like the services list above */}
          <div className="grid grid-cols-1 gap-y-4 text-lg">
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Minimal capital expenditure and a fixed, standard cost per month</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Improved availability and retention ratio of officers and crew alike</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Better control and planning via Epsilon's co-ordination of all activities</p>
            </div>
            <div className="flex">
              <span className="text-blue-600 mr-2 font-bold">›</span>
              <p>Minimization of the risk of a fallout thus ensuring smooth vessels' sailings at all times</p>
            </div>
          </div>
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