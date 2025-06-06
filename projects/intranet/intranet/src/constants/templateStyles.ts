// Standardized template values for consistent styling across all pages

export const TEMPLATE_STYLES = {
  // Layout containers
  containers: {
    page: 'min-h-screen bg-gray-50',
    pageWithPadding: 'min-h-screen bg-gray-50 py-4 sm:py-8',
    pageWithTightPadding: 'min-h-screen bg-gray-50 py-4 sm:py-6',
    contentWrapper: 'w-full px-4 sm:px-6 lg:px-8',
    maxWidthNormal: 'max-w-6xl mx-auto',
    maxWidthWide: 'max-w-7xl mx-auto',
  },

  // Typography
  typography: {
    pageTitle: 'text-2xl sm:text-3xl font-bold text-gray-900',
    pageSubtitle: 'mt-1 sm:mt-2 text-sm sm:text-base text-gray-600',
    sectionTitle: 'text-lg sm:text-xl font-semibold text-gray-900',
    sectionSubtitle: 'text-sm text-gray-600',
    label: 'block text-sm font-medium text-gray-700',
    error: 'mt-1 text-sm text-red-600',
  },

  // Headers
  headers: {
    container: 'mb-6 sm:mb-8',
    flexContainer: 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4',
    titleSection: 'flex-1',
  },

  // Cards
  cards: {
    base: 'bg-white rounded-lg shadow-sm',
    withPadding: 'bg-white rounded-lg shadow-sm p-4 sm:p-6',
    interactive: 'bg-white rounded-lg shadow-lg p-4 sm:p-6 cursor-pointer transform transition-all duration-200 hover:scale-105',
    colored: (bgColor: string, hoverColor: string) => 
      `${bgColor} ${hoverColor} rounded-lg shadow-lg p-4 sm:p-6 cursor-pointer transform transition-all duration-200 hover:scale-105`,
  },

  // Tables
  tables: {
    container: 'bg-white shadow-sm rounded-lg overflow-hidden',
    table: 'min-w-full divide-y divide-gray-200',
    header: 'bg-gray-50',
    headerCell: 'px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap',
    body: 'bg-white divide-y divide-gray-200',
    cell: 'px-4 sm:px-6 py-4 whitespace-nowrap text-sm',
    cellText: 'text-gray-900',
  },

  // Buttons
  buttons: {
    primary: 'px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150',
    secondary: 'px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150',
    danger: 'px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150',
    icon: 'p-2 rounded-full hover:bg-gray-100 transition-colors duration-150',
  },

  // Forms
  forms: {
    input: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150',
    select: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150',
    textarea: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150',
    checkbox: 'h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded',
    fieldContainer: 'space-y-1',
  },

  // Grids
  grids: {
    twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6',
    threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
    fourColumn: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
    autoFit: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6',
  },

  // Spacing
  spacing: {
    sectionGap: 'mb-6 sm:mb-8',
    elementGap: 'mb-4 sm:mb-6',
    tightGap: 'mb-2 sm:mb-4',
    horizontalPadding: 'px-4 sm:px-6',
    verticalPadding: 'py-4 sm:py-6',
  },

  // Icons
  icons: {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6',
    xlarge: 'h-8 w-8',
    dashboard: 'h-10 sm:h-12 w-10 sm:w-12',
  },

  // States
  states: {
    loading: 'flex justify-center items-center py-8',
    empty: 'text-center py-8 text-gray-500',
    error: 'text-center py-8 text-red-600',
  },

  // Modals
  modals: {
    overlay: 'fixed inset-0 z-50 overflow-y-auto',
    backdrop: 'fixed inset-0 bg-black bg-opacity-50 transition-opacity',
    container: 'flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0',
    content: 'inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6',
  },

  // Filters
  filters: {
    container: 'bg-white rounded-lg shadow-sm p-4 mb-6',
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    searchInput: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
  },
} as const;

// Helper function to combine classes
export const combineClasses = (...classes: string[]): string => {
  return classes.filter(Boolean).join(' ');
};