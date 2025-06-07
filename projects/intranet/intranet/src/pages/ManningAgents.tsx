import React from 'react';
import { PageTemplate, PageHeader } from '../components/templates';

const ManningAgents: React.FC = () => {
  return (
    <PageTemplate variant="tight">
      <PageHeader 
        title="Manning Agents"
        subtitle="Manage manning agent relationships and contracts"
      />
      <div className="py-4">
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
          <p className="text-gray-500">Manning Agents management coming soon</p>
        </div>
      </div>
    </PageTemplate>
  );
};

export default ManningAgents;