import React from 'react';
import { PageTemplate, PageHeader } from '../components/templates';

const Visits: React.FC = () => {
  return (
    <PageTemplate>
      <PageHeader 
        title="Visits" 
        subtitle="Track port visits and inspections"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500">Visits management coming soon</p>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Visits;