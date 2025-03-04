// src/components/samsara/SamsaraIntegration.tsx
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
  Database,
  MapPin,
  Fuel,
  Gauge,
  Thermometer,
  Activity
} from 'lucide-react';
import apiService from '../../services/api';

// Define minimal interfaces for TypeScript
interface SyncStatus {
  status?: string;
  latest_sync?: string;
  created?: number;
  updated?: number;
  details?: string;
}

interface SamsaraVehicle {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  odometerMeters?: number;
  engineHours?: number;
}

interface VehicleStats {
  engineStates?: { value: string } | string;
  obdOdometerMeters?: number;
  fuelPercents?: { value: number } | number;
  gps?: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    reverseGeo?: {
      formattedLocation: string;
    };
  };
  faultCodes?: any[];
  engineRpm?: { value: number } | number;
  engineLoadPercent?: { value: number } | number;
  engineCoolantTemperatureMilliC?: number;
}

const SamsaraIntegration: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncInProgress, setSyncInProgress] = useState<boolean>(false);
  const [samsaraVehicles, setSamsaraVehicles] = useState<SamsaraVehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Vehicle stats state
  const [selectedVehicle, setSelectedVehicle] = useState<SamsaraVehicle | null>(null);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

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

  const resetSync = async () => {
    setError(null);
    
    try {
      // Call the reset endpoint using the API service
      const response = await apiService.samsara.resetSync();
      
      // Update UI state immediately
      setSyncInProgress(false);
      
      // Update the sync status with the completed status
      setSyncStatus(prevStatus => ({
        ...prevStatus,
        status: "completed",
        details: "Manually reset sync status"
      }));
      
      // Show success message (not as an error)
      const successMessage = document.createElement('div');
      successMessage.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6';
      successMessage.innerHTML = `
        <div class="flex items-center">
          <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p>Sync status reset successfully. You can now use the sync functionality again.</p>
        </div>
      `;
      
      // Find the container to insert the message
      const container = document.querySelector('.p-6');
      if (container) {
        // Insert after the header section
        const header = container.querySelector('div:first-child');
        if (header) {
          header.insertAdjacentElement('afterend', successMessage);
          
          // Remove the message after 5 seconds
          setTimeout(() => {
            successMessage.remove();
          }, 5000);
        }
      }
      
      // Don't fetch the status again, as we've already updated the UI state
      // This prevents the UI from getting stuck in the "in_progress" state
      // setTimeout(() => {
      //   fetchSyncStatus();
      // }, 500);
      
    } catch (err) {
      console.error("Error resetting sync:", err);
      setError("Failed to reset sync status. Please try again later.");
    }
  };

  const fetchVehicleStats = async (vehicle: SamsaraVehicle) => {
    setSelectedVehicle(vehicle);
    setLoadingStats(true);
    setVehicleStats(null);
    setShowStatsModal(true);
    
    try {
      // Samsara API restricts to 3 types per request
      // Split the types into batches of 3
      const allTypes = [
        "gps", 
        "engineStates", 
        "obdOdometerMeters", 
        "fuelPercents", 
        "faultCodes", 
        "engineRpm", 
        "engineLoadPercent", 
        "engineCoolantTemperatureMilliC"
      ];
      
      // Our backend now handles batching, so we can just pass all types
      const types = allTypes.join(",");
      console.log("Fetching vehicle stats for vehicle ID:", vehicle.id);
      console.log("Requesting types:", types);
      
      const stats = await apiService.samsara.getVehicleStats(vehicle.id, types);
      console.log("Received vehicle stats:", stats);
      
      // Ensure we have a valid stats object
      if (!stats) {
        throw new Error("No stats data received from API");
      }
      
      // Initialize default values for any missing properties
      const processedStats: VehicleStats = {
        ...stats,
        engineStates: stats.engineStates || 'unknown',
        obdOdometerMeters: stats.obdOdometerMeters || 0,
        fuelPercents: stats.fuelPercents || 0,
        engineRpm: stats.engineRpm || 0,
        engineLoadPercent: stats.engineLoadPercent || 0,
        engineCoolantTemperatureMilliC: stats.engineCoolantTemperatureMilliC || 0,
        faultCodes: stats.faultCodes || [],
        gps: stats.gps || null
      };
      
      setVehicleStats(processedStats);
    } catch (err) {
      console.error("Error fetching vehicle stats:", err);
      setError("Failed to fetch vehicle telematics data. Please try again later.");
    } finally {
      setLoadingStats(false);
    }
  };
  
  const createWorkOrderFromDiagnostic = async (code: any) => {
    try {
      const response = await apiService.samsara.createWorkOrderFromDiagnostic(code.code_id, {
        description: `Repair for ${code.code} - ${code.description}`,
        priority: code.severity === 'Critical' ? 'High' : 'Medium',
        create_initial_task: true
      });
      
      // Show success message
      // You may want to use a toast notification library like react-toastify
      alert(`Work order created: #${response.work_order_id}`);
      
      // Refresh the list of diagnostic codes
      fetchVehicleStats(selectedVehicle!);
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Failed to create work order');
    }
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
    setSelectedVehicle(null);
    setVehicleStats(null);
  };

  const formatDate = (dateString?: string): string => {
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
  
  // Helper function to convert Celsius to Fahrenheit
  const celsiusToFahrenheit = (celsius: number): number => {
    return (celsius / 1000) * 9/5 + 32;
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
          
          {syncInProgress && (
            <button
              className="flex items-center px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
              onClick={resetSync}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Reset Sync
            </button>
          )}
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
                  {(syncStatus.created || 0) + (syncStatus.updated || 0)} vehicles 
                  ({syncStatus.created || 0} created, {syncStatus.updated || 0} updated)
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
          Last checked: {lastUpdated ? formatDate(lastUpdated.toISOString()) : 'Never'}
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
                  const miles = Math.round((vehicle.odometerMeters || 0) / 1609.34);
                  
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
                          onClick={() => fetchVehicleStats(vehicle)}
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
      
      {/* Vehicle Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedVehicle?.make} {selectedVehicle?.model} {selectedVehicle?.year} Telematics Data
                </h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeStatsModal}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {loadingStats ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : vehicleStats ? (
                <div className="space-y-6">
                  {/* Basic Vehicle Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">VIN</span>
                        <p className="font-medium">{selectedVehicle?.vin || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Odometer</span>
                        <p className="font-medium">
                          {vehicleStats.obdOdometerMeters 
                            ? `${Math.round(vehicleStats.obdOdometerMeters / 1609.34).toLocaleString()} mi` 
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Engine Status</span>
                        <p className="font-medium">
                          {vehicleStats.engineStates 
                            ? (typeof vehicleStats.engineStates === 'object' 
                                ? (vehicleStats.engineStates.value === 'on' 
                                    ? 'Running' 
                                    : vehicleStats.engineStates.value === 'off' 
                                      ? 'Off' 
                                      : 'Idle')
                                : (vehicleStats.engineStates === 'on' 
                                    ? 'Running' 
                                    : vehicleStats.engineStates === 'off' 
                                      ? 'Off' 
                                      : 'Idle'))
                            : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* GPS Location */}
                  {vehicleStats.gps ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                        Location
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Coordinates</span>
                          <p className="font-medium">
                            {typeof vehicleStats.gps.latitude === 'number' && typeof vehicleStats.gps.longitude === 'number'
                              ? `${vehicleStats.gps.latitude.toFixed(6)}, ${vehicleStats.gps.longitude.toFixed(6)}`
                              : 'Coordinates not available'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Address</span>
                          <p className="font-medium">
                            {vehicleStats.gps.reverseGeo?.formattedLocation || 'No address available'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Speed</span>
                          <p className="font-medium">
                            {typeof vehicleStats.gps.speed === 'number'
                              ? `${Math.round(vehicleStats.gps.speed * 2.237).toLocaleString()} mph`
                              : '0 mph'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Heading</span>
                          <p className="font-medium">
                            {typeof vehicleStats.gps.heading === 'number'
                              ? `${vehicleStats.gps.heading}°`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                        Location
                      </h3>
                      <p className="text-center text-gray-500 py-4">GPS data not available for this vehicle</p>
                    </div>
                  )}
                  
                  {/* Fuel Level */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Fuel className="h-5 w-5 mr-2 text-green-600" />
                      Fuel
                    </h3>
                    {vehicleStats.fuelPercents ? (
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Fuel Level</span>
                          <div className="mt-1">
                            {/* Get fuel percentage value based on type */}
                            {(() => {
                              const fuelLevel = typeof vehicleStats.fuelPercents === 'object' 
                                ? vehicleStats.fuelPercents.value 
                                : vehicleStats.fuelPercents;
                              
                              return (
                                <>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                      className="bg-green-600 h-2.5 rounded-full" 
                                      style={{ width: `${fuelLevel}%` }}
                                    ></div>
                                  </div>
                                  <p className="mt-1 font-medium">{fuelLevel}%</p>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">Fuel data not available for this vehicle</p>
                    )}
                  </div>
                  
                  {/* Engine Data */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Gauge className="h-5 w-5 mr-2 text-yellow-600" />
                      Engine Data
                    </h3>
                    {(typeof vehicleStats.engineRpm === 'number' || 
                      typeof vehicleStats.engineLoadPercent === 'number' || 
                      typeof vehicleStats.engineCoolantTemperatureMilliC === 'number') ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {typeof vehicleStats.engineRpm === 'number' && (
                          <div>
                            <span className="text-sm text-gray-500">RPM</span>
                            <p className="font-medium">{vehicleStats.engineRpm.toLocaleString()}</p>
                          </div>
                        )}
                        {typeof vehicleStats.engineLoadPercent === 'number' && (
                          <div>
                            <span className="text-sm text-gray-500">Engine Load</span>
                            <p className="font-medium">{vehicleStats.engineLoadPercent}%</p>
                          </div>
                        )}
                        {typeof vehicleStats.engineCoolantTemperatureMilliC === 'number' && (
                          <div>
                            <span className="text-sm text-gray-500">Coolant Temperature</span>
                            <p className="font-medium">
                              {celsiusToFahrenheit(vehicleStats.engineCoolantTemperatureMilliC).toFixed(1)}°F
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">Engine data not available for this vehicle</p>
                    )}
                  </div>
                  
                  {/* Fault Codes */}
                  {vehicleStats.faultCodes && vehicleStats.faultCodes.length > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        Fault Codes
                      </h3>
                      <div className="space-y-2">
                        {vehicleStats.faultCodes.map((code: any, index: number) => (
                          <div key={index} className="flex items-start p-2 bg-white rounded mb-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500 mr-1 mt-0.5" />
                            <div className="flex-1">
                              <p className="font-medium">{code.code || 'Unknown Code'}</p>
                              <p className="text-gray-600">{code.description || 'No description available'}</p>
                              {code.severity && (
                                <p className="text-xs mt-1">
                                  <span className={`px-1.5 py-0.5 rounded ${
                                    code.severity === 'Critical' ? 'bg-red-100 text-red-800' :
                                    code.severity === 'High' ? 'bg-orange-100 text-orange-800' :
                                    code.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {code.severity}
                                  </span>
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => createWorkOrderFromDiagnostic(code)}
                              className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Create Work Order
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No telematics data available for this vehicle.</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={closeStatsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SamsaraIntegration;
