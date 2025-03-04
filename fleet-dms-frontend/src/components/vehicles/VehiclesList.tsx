// src/components/vehicles/VehiclesList.tsx
import apiService from '../../services/api';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  Search, 
  Plus, 
  RefreshCw, 
  Link as LinkIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  Filter
} from 'lucide-react';

interface Vehicle {
  vehicle_id?: number;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  license_plate?: string;
  status?: string;
  mileage?: number;
  last_service_date?: string;
  samsara_id?: string;
}

interface SyncStatus {
  status?: string;
  latest_sync?: string;
  created?: number;
  updated?: number;
  message?: string;
}

const VehiclesList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingWithSamsara, setSyncingWithSamsara] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [samsaraFilter, setSamsaraFilter] = useState<string>('');

  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
    fetchSyncStatus();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await apiService.vehicles.getAll();
      setVehicles(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load vehicles. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const status = await apiService.samsara.getSyncStatus();
      setSyncStatus(status);
      setSyncingWithSamsara(status?.status === "in_progress");
    } catch (err) {
      console.error('Error fetching sync status:', err);
    }
  };

  // Function to sync with Samsara
  const syncWithSamsara = async () => {
    setSyncingWithSamsara(true);
    setSyncStatus({
      ...syncStatus,
      status: 'in_progress',
      message: 'Syncing with Samsara...'
    });

    try {
      // Call the Samsara sync endpoint
      const response = await apiService.samsara.sync();

      // Start checking for updates
      checkSyncStatus();

    } catch (err) {
      console.error('Error syncing with Samsara:', err);
      setSyncStatus({
        status: 'error',
        message: 'Error syncing with Samsara. Please try again.'
      });
      setSyncingWithSamsara(false);
    }
  };

  // Check sync status periodically
  const checkSyncStatus = async () => {
    try {
      const status = await apiService.samsara.getSyncStatus();
      setSyncStatus(status);

      if (status.status === "in_progress") {
        // Check again in 3 seconds
        setTimeout(checkSyncStatus, 3000);
      } else {
        // Sync completed or failed
        setSyncingWithSamsara(false);

        // Refresh vehicle list
        fetchVehicles();
      }
    } catch (err) {
      console.error('Error checking sync status:', err);
      setSyncingWithSamsara(false);
    }
  };

  // Filter vehicles based on status, search term, and Samsara connection
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesStatus = statusFilter ? vehicle.status === statusFilter : true;

    const matchesSearch = searchTerm
      ? vehicle.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;

    const matchesSamsara = samsaraFilter
      ? (samsaraFilter === 'connected' && vehicle.samsara_id) ||
      (samsaraFilter === 'not-connected' && !vehicle.samsara_id)
      : true;

    return matchesStatus && matchesSearch && matchesSamsara;
  });

  // Get status badge style
  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Out-of-service':
        return 'bg-red-100 text-red-800';
      case 'In-repair':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fleet Vehicles</h1>
        <div className="flex space-x-2">
          <button
            onClick={syncWithSamsara}
            disabled={syncingWithSamsara}
            className={`flex items-center px-4 py-2 rounded ${syncingWithSamsara
                ? 'bg-gray-300 text-gray-600'
                : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            <RefreshCw size={18} className={`mr-1 ${syncingWithSamsara ? 'animate-spin' : ''}`} />
            Sync with Samsara
          </button>
          <Link
            to="/vehicles/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Add Vehicle
          </Link>
        </div>
      </div>

      {/* Sync status message */}
      {syncStatus && (
        <div className={`border-l-4 p-4 mb-4 ${syncStatus.status === 'error'
            ? 'bg-red-50 border-red-500 text-red-700'
            : syncStatus.status === 'in_progress'
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-green-50 border-green-500 text-green-700'}`}>
          <div className="flex items-center">
            {syncStatus.status === 'error' && <AlertTriangle className="mr-2" size={20} />}
            {syncStatus.status === 'in_progress' && <RefreshCw className="mr-2 animate-spin" size={20} />}
            {syncStatus.status === 'completed' && <CheckCircle className="mr-2" size={20} />}
            <p>
              {syncStatus.message ||
                (syncStatus.status === 'completed'
                  ? `Last sync: ${new Date(syncStatus.latest_sync || '').toLocaleString()}. ${syncStatus.created} vehicles created, ${syncStatus.updated} vehicles updated.`
                  : syncStatus.status === 'in_progress'
                    ? 'Syncing with Samsara...'
                    : 'Unknown status')}
            </p>
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search vehicles..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Out-of-service">Out of Service</option>
              <option value="In-repair">In Repair</option>
            </select>

            <select
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={samsaraFilter}
              onChange={(e) => setSamsaraFilter(e.target.value)}
            >
              <option value="">All Vehicles</option>
              <option value="connected">Samsara Connected</option>
              <option value="not-connected">Not Connected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Vehicles list */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VIN
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mileage
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Samsara
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No vehicles found. Try adjusting your search filters.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <Truck className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.year} • {vehicle.license_plate || 'No Plate'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.vin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.mileage?.toLocaleString() || 'N/A'} mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.last_service_date
                          ? new Date(vehicle.last_service_date).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {vehicle.samsara_id ? (
                          <span className="text-green-600 flex items-center">
                            <LinkIcon size={14} className="mr-1" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-gray-400">Not connected</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/vehicles/${vehicle.vehicle_id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          to={`/vehicles/${vehicle.vehicle_id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default VehiclesList;
