import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, AlertTriangle, Edit, Trash } from 'lucide-react';

// Sample vehicle data (to be replaced with API calls)
const sampleVehicles = [
  {
    vehicle_id: 1,
    vin: '1HTMMAAL57H452177',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2021,
    license_plate: 'TR-1017',
    status: 'Active',
    mileage: 56789,
    department: 'Delivery'
  },
  {
    vehicle_id: 2,
    vin: '1HTMMAAL21H789012',
    make: 'Kenworth',
    model: 'T680',
    year: 2020,
    license_plate: 'TR-1023',
    status: 'Active',
    mileage: 87654,
    department: 'Long Haul'
  },
  {
    vehicle_id: 3,
    vin: '1HTMMAAL46H123456',
    make: 'Peterbilt',
    model: '579',
    year: 2019,
    license_plate: 'TR-1008',
    status: 'Out-of-service',
    mileage: 124532,
    department: 'Regional'
  },
];

const VehiclesList: React.FC = () => {
  const [vehicles, setVehicles] = useState(sampleVehicles);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  // Filter vehicles based on status
  const filteredVehicles = filter === 'all'
    ? vehicles
    : vehicles.filter(vehicle => vehicle.status.toLowerCase() === filter);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Link
          to="/vehicles/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Add Vehicle
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${filter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setFilter('all')}
        >
          All Vehicles
        </button>
        <button
          className={`px-4 py-2 ${filter === 'active' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`px-4 py-2 ${filter === 'out-of-service' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setFilter('out-of-service')}
        >
          Out of Service
        </button>
      </div>

      {/* Vehicle cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map(vehicle => (
          <div key={vehicle.vehicle_id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <Truck className="h-6 w-6 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  vehicle.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vehicle.status}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">VIN:</span> {vehicle.vin}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">License:</span> {vehicle.license_plate}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Mileage:</span> {vehicle.mileage.toLocaleString()} mi
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Department:</span> {vehicle.department}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 px-5 py-3 flex justify-between">
              <Link 
                to={`/vehicles/${vehicle.vehicle_id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Details
              </Link>
              <div className="flex space-x-2">
                <Link to={`/vehicles/${vehicle.vehicle_id}/edit`}>
                  <Edit className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                </Link>
                <button>
                  <Trash className="h-5 w-5 text-gray-500 hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredVehicles.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No vehicles found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default VehiclesList;
