import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, Edit, Trash } from 'lucide-react';

// Sample parts data
const sampleParts = [
  { id: 1, part_number: 'EGR-123', name: 'EGR Valve', category: 'Engine', manufacturer: 'OEM Parts', location: 'Shelf A1', quantity: 5, unit_cost: 120.99, reorder_level: 2 },
  { id: 2, part_number: 'BELT-456', name: 'Serpentine Belt', category: 'Belts', manufacturer: 'Fleetrite', location: 'Shelf B3', quantity: 12, unit_cost: 45.50, reorder_level: 5 },
  { id: 3, part_number: 'FIL-789', name: 'Oil Filter', category: 'Filters', manufacturer: 'Fleetguard', location: 'Shelf C2', quantity: 24, unit_cost: 12.99, reorder_level: 10 },
  { id: 4, part_number: 'BRK-101', name: 'Brake Pad Set', category: 'Brakes', manufacturer: 'Bendix', location: 'Shelf D4', quantity: 8, unit_cost: 85.75, reorder_level: 4 },
  { id: 5, part_number: 'LIGHT-202', name: 'Headlight Bulb', category: 'Electrical', manufacturer: 'Sylvania', location: 'Shelf E1', quantity: 15, unit_cost: 22.50, reorder_level: 6 },
  { id: 6, part_number: 'RAD-303', name: 'Radiator Cap', category: 'Cooling', manufacturer: 'Gates', location: 'Shelf B1', quantity: 7, unit_cost: 14.25, reorder_level: 5 },
  { id: 7, part_number: 'ALT-404', name: 'Alternator', category: 'Electrical', manufacturer: 'Delco', location: 'Shelf F2', quantity: 3, unit_cost: 195.00, reorder_level: 2 },
  { id: 8, part_number: 'HOS-505', name: 'Coolant Hose', category: 'Cooling', manufacturer: 'Gates', location: 'Shelf B2', quantity: 9, unit_cost: 28.75, reorder_level: 4 }
];

const PartsList: React.FC = () => {
  const [parts, setParts] = useState(sampleParts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Get unique categories for filter
  const categories = ['all', ...new Set(parts.map(part => part.category))];
  
  // Filter parts based on search term and category
  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Sort by low stock first, then by name
  const sortedParts = [...filteredParts].sort((a, b) => {
    const aLowStock = a.quantity <= a.reorder_level;
    const bLowStock = b.quantity <= b.reorder_level;
    
    if (aLowStock && !bLowStock) return -1;
    if (!aLowStock && bLowStock) return 1;
    
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parts Inventory</h1>
        <Link
          to="/parts/new"
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Part
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search parts by name, number, or manufacturer"
            />
          </div>
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Parts</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{parts.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Quantity</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {parts.reduce((sum, part) => sum + part.quantity, 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            ${parts.reduce((sum, part) => sum + (part.quantity * part.unit_cost), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {parts.filter(part => part.quantity <= part.reorder_level).length}
          </p>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Part Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedParts.map((part) => {
                const isLowStock = part.quantity <= part.reorder_level;
                
                return (
                  <tr key={part.id} className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Package className={`h-5 w-5 mr-3 ${isLowStock ? 'text-red-500' : 'text-blue-500'}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{part.name}</div>
                          <div className="text-sm text-gray-500">
                            {part.part_number} | {part.manufacturer}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {part.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {part.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm ${isLowStock ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {part.quantity}
                        </span>
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Low Stock
                          </span>
                        )}
                      </div>
                      {isLowStock && (
                        <div className="text-xs text-gray-500">
                          Reorder Level: {part.reorder_level}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${part.unit_cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link to={`/parts/${part.id}`} className="text-blue-600 hover:text-blue-900">
                          View
                        </Link>
                        <Link to={`/parts/${part.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {sortedParts.length === 0 && (
        <div className="mt-6 bg-white p-6 text-center rounded-lg shadow">
          <p className="text-gray-500">No parts found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default PartsList;
