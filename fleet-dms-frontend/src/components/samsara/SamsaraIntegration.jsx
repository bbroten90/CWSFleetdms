// src/components/samsara/SamsaraIntegration.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Truck, 
  Info, 
  X,
  ChevronRight,
  Database
} from 'lucide-react';
import apiService from '@/services/api';

const SamsaraIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [samsaraVehicles, setSamsaraVehicles] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch initial sync status
  useEffect(() => {
    fetchSyncStatus();
    // Set up interval to refresh status every 10 seconds
    const interval = setInterval(fetchSyncStatus, 10000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const status = await apiService.samsara.getSyncStatus();
      setSyncStatus(status);
      
      // If status is "in_progress", we're syncing
      setSyncInProgress(status?.status === "in_progress");
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching sync status:", err);
      setError("Failed to fetch sync status. Please try again later.");
    }
  };

  const fetchSamsaraVehicles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.samsara.getVehicles();
      setSamsaraVehicles(response.vehicles || []);
    } catch (err) {
      console.error("Error fetching Samsara vehicles:", err);
      setError("Failed to fetch vehicles from Samsara. Please check your API key and connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const startSync = async () => {
    if (syncInProgress) return;
    
    setError(null);
    setSyncInProgress(true);
    
    try {
      await apiService.samsara.sync();
      // We don't need to set syncInProgress to false here, as the fetchSyncStatus
      // interval will update it when the sync is complete
    } catch (err) {
      console.error("Error starting sync:", err);
      setError("Failed to start sync with Samsara. Please try again later.");
      setSyncInProgress(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Samsara Integration</h1>
        <div className="flex space-x-3">
          <button
            className={`flex items-center px-3 py-2 rounded ${
              syncInProgress
                ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={fetchSamsaraVehicles}
            disabled={syncInProgress}
          >
            <Truck className="h-4 w-4 mr-2" />
            Fetch Vehicles
          </button>
          
          <button
            className={`flex items-center px-3 py-2 rounded ${
              syncInProgress
                ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            onClick={startSync}
            disabled={syncInProgress}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncInProgress ? 'animate-spin' : ''}`} />
            {syncInProgress ? 'Syncing...' : 'Sync with Samsara'}
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Sync Status Card */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Sync Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Status</span>
            <div className="mt-1 flex items-center">
              {syncStatus?.status === "completed" && (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              )}
              {syncStatus?.status === "in_progress" && (
                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin mr-2" />
              )}
              {syncStatus?.status === "error" && (
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              )}
              {!syncStatus && (
                <Info className="h-5 w-5 text-gray-500 mr-2" />
              )}
              <span className="font-medium">
                {syncStatus?.status === "completed" && "Last sync completed"}
                {syncStatus?.status === "in_progress" && "Sync in progress"}
                {syncStatus?.status === "error" && "Sync failed"}
                {!syncStatus && "Never synced"}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Last Sync</span>
            <div className="mt-1 flex items-center">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <span>{formatDate(syncStatus?.latest_sync)}</span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Results</span>
            <div className="mt-1">
              {syncStatus && (
                <span>
                  {syncStatus.created + syncStatus.updated} vehicles 
                  ({syncStatus.created} created, {syncStatus.updated} updated)
                </span>
              )}
              {!syncStatus && <span>No data</span>}
            </div>
          </div>
        </div>
        
        {/* Sync Details */}
        {syncStatus?.details && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium mb-2">Details</h3>
            <p className="text-sm text-gray-700">{syncStatus.details}</p>
          </div>
        )}
        
        {/* Last Updated */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
          Last checked: {lastUpdated ? formatDate(lastUpdated) : 'Never'}
          <button 
            className="ml-2 text-blue-600 hover:text-blue-800" 
            onClick={fetchSyncStatus}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Vehicles from Samsara */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Vehicles in Samsara</h2>
          <span className="text-sm text-gray-500">
            {samsaraVehicles.length} vehicles
          </span>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : samsaraVehicles.length > 0 ? (
          <div className="overflow-x-auto">
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
                    Odometer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engine Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Samsara ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {samsaraVehicles.map((vehicle) => {
                  // Convert meters to miles
                  const miles = Math.round(vehicle.odometerMeters / 1609.34);
                  
                  return (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Truck className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.make || 'Unknown'} {vehicle.model || 'Vehicle'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {vehicle.year ? vehicle.year : 'No Year'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.vin || 'No VIN'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {miles ? `${miles.toLocaleString()} mi` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.engineHours ? `${vehicle.engineHours} hrs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        <button 
                          className="flex items-center hover:text-blue-800"
                          onClick={() => {
                            // In a real implementation, this would view vehicle details
                            console.log('View vehicle details:', vehicle);
                          }}
                        >
                          <Database className="h-4 w-4 mr-1" />
                          View Data
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-md p-8 text-center">
            <p className="text-gray-500 mb-4">No vehicles fetched from Samsara yet.</p>
            <button
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={fetchSamsaraVehicles}
              disabled={loading}
            >
              <Truck className="h-4 w-4 mr-2" />
              Fetch Vehicles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SamsaraIntegration;