import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ship } from '../types';
import ColumnManager, { Column } from '../components/ColumnManager';
import DynamicTable from '../components/DynamicTable';
import api from '../lib/api';

const Ships: React.FC = () => {
  const [ships, setShips] = useState<Ship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPrincipalId, setFilterPrincipalId] = useState('');

  // Define all columns with visibility settings
  const [columns, setColumns] = useState<Column[]>([
    { key: 'principal_id', label: 'Principal ID', visible: true, required: true },
    { key: 'principal_name', label: 'Principal Name', visible: true },
    { key: 'ship_name', label: 'Ship Name', visible: true },
    { key: 'ship_imo', label: 'Ship IMO', visible: true },
    { key: 'pi_club', label: 'P&I Club', visible: true },
    { key: 'ship_type', label: 'Ship Type', visible: true },
    { key: 'ship_specific_characterization', label: 'Ship Characterization', visible: true },
    { key: 'flags', label: 'Flags of Ships', visible: true },
    { key: 'classification', label: 'Classification', visible: true },
    { key: 'dwt_teu', label: 'DWT / TEU', visible: true },
    { key: 'ship_construction_date', label: "Ship's Constr. Date", visible: true },
    { key: 'cba_coverage', label: 'CBA Coverage', visible: true },
    { key: 'type_of_cba', label: 'Type of CBA', visible: true },
    { key: 'forthcoming_dry_dock_date', label: 'Forthcoming Dry Dock Date', visible: true },
    { key: 'vetting_procedure', label: 'Vetting Procedure', visible: true },
    { key: 'forthcoming_vetting', label: 'Forthcoming Vetting', visible: true },
    { key: 'engines', label: 'Engines', visible: true },
    { key: 'conventional_or_electronic', label: 'Engine Type', visible: true },
    { key: 'engine_tier_category', label: 'Engine Tier Category', visible: true },
    { key: 'dual_fuel', label: 'Dual Fuel (Y/N)', visible: true },
    { key: 'fuel_type', label: 'Fuel Type', visible: true },
    { key: 'cranes_aboard', label: 'Cranes Aboard (Y/N)', visible: true },
    { key: 'ballast_water_mgmt_system', label: 'Ballast Water Management System (BWMS)', visible: true },
    { key: 'ecdis', label: 'ECDIS', visible: true },
    { key: 'scrubber', label: 'Scrubber', visible: true },
    { key: 'scrubber_type', label: 'Scrubber Type', visible: true },
  ]);

  useEffect(() => {
    fetchShips();
  }, []);

  const fetchShips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterPrincipalId) {
        params.append('principal_id', filterPrincipalId);
      }
      
      const response = await api.get(`ships/?${params}`);
      setShips(response.data || []);
    } catch (error) {
      console.error('Failed to fetch ships:', error);
      setShips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this ship?')) return;
    
    try {
      await api.delete(`ships/${id}`);
      setShips(ships.filter(ship => ship.id !== id));
    } catch (error) {
      console.error('Failed to delete ship:', error);
      alert('Failed to delete ship');
    }
  };

  const filteredShips = ships.filter(ship => {
    const matchesSearch = searchTerm === '' || 
      ship.ship_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ship.ship_imo && ship.ship_imo.toString().includes(searchTerm)) ||
      ship.pi_club.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || ship.ship_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const tableData = filteredShips.map(ship => ({
    id: ship.id!,
    principal_id: ship.principal_id,
    principal_name: ship.principal_name || '-',
    ship_name: ship.ship_name,
    ship_imo: ship.ship_imo?.toString() || '-',
    pi_club: ship.pi_club || '-',
    ship_type: (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        ship.ship_type === 'DRY' ? 'bg-yellow-100 text-yellow-800' :
        ship.ship_type === 'WET' ? 'bg-blue-100 text-blue-800' :
        ship.ship_type === 'PASSENGER' ? 'bg-green-100 text-green-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {ship.ship_type}
      </span>
    ),
    ship_specific_characterization: ship.ship_specific_characterization || '-',
    flags: ship.flags || '-',
    classification: ship.classification || '-',
    dwt_teu: ship.dwt_teu || '-',
    ship_construction_date: ship.ship_construction_date ? new Date(ship.ship_construction_date).getFullYear().toString() : '-',
    cba_coverage: ship.cba_coverage ? (
      <span className={ship.cba_coverage === 'YES' ? 'text-green-600 font-semibold' : 'text-gray-400'}>
        {ship.cba_coverage}
      </span>
    ) : '-',
    type_of_cba: ship.type_of_cba || '-',
    forthcoming_dry_dock_date: ship.forthcoming_dry_dock_date ? new Date(ship.forthcoming_dry_dock_date).toLocaleDateString() : '-',
    vetting_procedure: ship.vetting_procedure ? (
      <span className="text-green-600 font-semibold">YES</span>
    ) : (
      <span className="text-gray-400">NO</span>
    ),
    forthcoming_vetting: ship.forthcoming_vetting || '-',
    engines: ship.engines || '-',
    conventional_or_electronic: ship.conventional_or_electronic || '-',
    engine_tier_category: ship.engine_tier_category || '-',
    dual_fuel: ship.dual_fuel ? (
      <span className="text-green-600 font-semibold">YES</span>
    ) : (
      <span className="text-gray-400">NO</span>
    ),
    fuel_type: ship.fuel_type || '-',
    cranes_aboard: ship.cranes_aboard ? (
      <span className="text-green-600 font-semibold">YES</span>
    ) : (
      <span className="text-gray-400">NO</span>
    ),
    ballast_water_mgmt_system: ship.ballast_water_mgmt_system || '-',
    ecdis: ship.ecdis || '-',
    scrubber: ship.scrubber ? (
      <span className="text-green-600 font-semibold">YES</span>
    ) : (
      <span className="text-gray-400">NO</span>
    ),
    scrubber_type: ship.scrubber_type || '-',
    actions: (
      <div className="flex space-x-2">
        <Link
          to={`/crm/ships/${ship.id}`}
          className="text-indigo-600 hover:text-indigo-900"
        >
          Edit
        </Link>
        <button
          onClick={() => handleDelete(ship.id!)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </div>
    ),
  }));

  if (loading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading ships...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900">Ships</h1>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <ColumnManager
              columns={columns}
              onColumnsChange={setColumns}
              storageKey="ships-visible-columns"
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              name="search"
              id="search"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search by name, IMO, or P&I Club"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filterType" className="block text-sm font-medium text-gray-700">
              Ship Type
            </label>
            <select
              id="filterType"
              name="filterType"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="DRY">Dry</option>
              <option value="WET">Wet</option>
              <option value="PASSENGER">Passenger</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterPrincipal" className="block text-sm font-medium text-gray-700">
              Principal ID
            </label>
            <input
              type="text"
              name="filterPrincipal"
              id="filterPrincipal"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Filter by Principal ID"
              value={filterPrincipalId}
              onChange={(e) => setFilterPrincipalId(e.target.value)}
            />
          </div>
        </div>

        {/* Ships Dynamic Table */}
        <DynamicTable
          columns={columns}
          data={tableData}
          renderCell={(row, column) => {
            if (column.key === 'actions') {
              return row.actions;
            }
            return row[column.key];
          }}
        />

        {filteredShips.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No ships found matching your criteria.</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Ships
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {ships.length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Dry Ships
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                {ships.filter(s => s.ship_type === 'DRY').length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Wet Ships
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-blue-600">
                {ships.filter(s => s.ship_type === 'WET').length}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                With Scrubbers
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                {ships.filter(s => s.scrubber).length}
              </dd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ships;