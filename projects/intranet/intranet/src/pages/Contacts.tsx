import React from 'react';
import { PageTemplate, PageHeader } from '../components/templates';

const Contacts: React.FC = () => {
  return (
    <PageTemplate variant="tight">
      <PageHeader 
        title="Contacts"
        subtitle="Manage contact information and communication details"
      />
      <div className="py-4">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <p className="text-gray-500">Contacts management coming soon</p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default Contacts;