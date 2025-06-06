import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export interface Column {
  key: string;
  label: string;
  visible: boolean;
  required?: boolean;
}

interface ColumnManagerProps {
  columns: Column[];
  onColumnsChange: (columns: Column[]) => void;
  storageKey: string;
}

const ColumnManager: React.FC<ColumnManagerProps> = ({ columns, onColumnsChange, storageKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState(columns);
  const [loading, setLoading] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await api.get(`preferences/${storageKey}`);
        if (response.data && response.data.preference_value) {
          const savedColumns = response.data.preference_value;
          const mergedColumns = columns.map(col => {
            const savedCol = savedColumns.find((s: Column) => s.key === col.key);
            return savedCol ? { ...col, visible: savedCol.visible } : col;
          });
          setLocalColumns(mergedColumns);
          onColumnsChange(mergedColumns);
        }
      } catch (error: any) {
        // If preferences not found (404), use defaults - this is normal for first time users
        if (error.response && error.response.status === 404) {
          console.log('No saved preferences found, using defaults');
        } else {
          console.error('Error loading preferences:', error);
        }
      }
    };

    loadPreferences();
  }, []);

  const handleToggleColumn = (key: string) => {
    const updated = localColumns.map(col =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put(`preferences/${storageKey}`, {
        value: localColumns
      });
      onColumnsChange(localColumns);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save column preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const reset = columns.map(col => ({ ...col, visible: true }));
    setLocalColumns(reset);
    
    setLoading(true);
    try {
      await api.put(`preferences/${storageKey}`, {
        value: reset
      });
      onColumnsChange(reset);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Manage Columns ({visibleCount}/{localColumns.length})
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Manage Table Columns
                      </h3>
                      <div className="mt-2 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          {localColumns.map((column) => (
                            <label
                              key={column.key}
                              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={column.visible}
                                onChange={() => handleToggleColumn(column.key)}
                                disabled={column.required || loading}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className={`ml-3 text-sm ${column.required ? 'text-gray-500' : 'text-gray-900'}`}>
                                {column.label}
                                {column.required && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        {visibleCount} of {localColumns.length} columns visible
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={loading}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ColumnManager;