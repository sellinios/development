import React from 'react';
import { PageTemplate, PageHeader } from '../components/templates';

const Sales: React.FC = () => {
  return (
    <PageTemplate variant="tight">
      <PageHeader 
        title="Sales"
        subtitle="Monitor sales performance and opportunities"
      />
      <div className="py-4">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <p className="text-gray-500">Sales management coming soon</p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Sales;