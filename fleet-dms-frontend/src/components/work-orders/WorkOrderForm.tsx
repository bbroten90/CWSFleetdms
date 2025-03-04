import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash, Search, Truck, Clock, AlertTriangle, ChevronDown, ChevronUp, MapPin, Gauge } from 'lucide-react';
import apiService from '../../services/api';

// Interface for vehicle data
interface Vehicle {
  vehicle_id: number;
  make: string;
  model: string;
  year: number;
  vin: string;
  license_plate?: string;
  unit_number?: string;
  status: string;
  mileage?: number;
  engine_hours?: number;
  samsara_id?: string;
}

// Interface for parts inventory
interface PartInventory {
  part_id: number;
  part_number: string;
  name: string;
  category?: string;
  description?: string;
  quantity_on_hand: number;
  unit_cost: number;
  location?: string;
}

// Interface for vehicle stats from Samsara
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

// Interface for work order history
interface WorkOrderHistory {
  work_order_id: number;
  description: string;
  status: string;
  created_at: string;
  completed_date?: string;
}

const technicians = [
  { id: 1, name: 'John Smith' },
  { id: 2, name: 'Mike Johnson' },
  { id: 3, name: 'Sarah Lee' }
];

// Sample parts inventory data (will be replaced with API call)
const partsInventory: PartInventory[] = [
  { part_id: 1, part_number: 'EGR-123', name: 'EGR Valve', quantity_on_hand: 5, unit_cost: 120.99 },
  { part_id: 2, part_number: 'BELT-456', name: 'Serpentine Belt', quantity_on_hand: 12, unit_cost: 45.50 },
  { part_id: 3, part_number: 'FIL-789', name: 'Oil Filter', quantity_on_hand: 24, unit_cost: 12.99 },
  { part_id: 4, part_number: 'BRK-101', name: 'Brake Pad Set', quantity_on_hand: 8, unit_cost: 85.75 }
];

// Sample data for editing
const sampleWorkOrder = {
  id: 'WO-2023-156',
  vehicle_id: 1,
  description: 'Engine diagnostic and maintenance',
  reported_issue: 'Check engine light is on and engine is making a knocking sound',
  diagnosis: 'EGR valve malfunction and loose belt',
  resolution: '',
  status: 'In Progress',
  priority: 'High',
  assigned_to: 1,
  tasks: [
    { id: 1, description: 'Diagnose check engine light', status: 'Completed', estimated_hours: 1, technician_id: 1 },
    { id: 2, description: 'Replace EGR valve', status: 'In Progress', estimated_hours: 2, technician_id: 1 },
    { id: 3, description: 'Check and tighten belts', status: 'In Progress', estimated_hours: 0.5, technician_id: 1 },
    { id: 4, description: 'Road test', status: 'Pending', estimated_hours: 1, technician_id: 1 }
  ],
  parts: [
    { id: 1, part_id: 1, quantity: 1, unit_cost: 120.99 },
    { id: 2, part_id: 2, quantity: 1, unit_cost: 45.50 }
  ]
};

interface Task {
  id?: number;
  description: string;
  status: string;
  estimated_hours: number;
  technician_id: number | null;
}

interface Part {
  id?: number;
  part_id: number;
  quantity: number;
  unit_cost: number;
}

interface WorkOrderFormProps {
  isEditing?: boolean;
}

const WorkOrderForm: React.FC<WorkOrderFormProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get vehicleId from query param (for creating work order from vehicle page)
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromQuery = queryParams.get('vehicleId');
  
  // State for vehicles, vehicle stats, and work order history
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [unitNumberSearch, setUnitNumberSearch] = useState('');
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [workOrderHistory, setWorkOrderHistory] = useState<WorkOrderHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showVehicleStats, setShowVehicleStats] = useState(false);
  const [showWorkOrderHistory, setShowWorkOrderHistory] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    vehicle_id: vehicleIdFromQuery ? parseInt(vehicleIdFromQuery) : (isEditing ? sampleWorkOrder.vehicle_id : 0),
    description: isEditing ? sampleWorkOrder.description : '',
    reported_issue: isEditing ? sampleWorkOrder.reported_issue : '',
    diagnosis: isEditing ? sampleWorkOrder.diagnosis : '',
    resolution: isEditing ? sampleWorkOrder.resolution : '',
    status: isEditing ? sampleWorkOrder.status : 'Open',
    priority: isEditing ? sampleWorkOrder.priority : 'Medium',
    assigned_to: isEditing ? sampleWorkOrder.assigned_to : null
  });
  
  // Fetch vehicles on component mount
  useEffect(() => {
    fetchVehicles();
  }, []);
  
  // Filter vehicles when unit number search changes
  useEffect(() => {
    if (unitNumberSearch.trim() === '') {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle => 
        vehicle.unit_number?.toLowerCase().includes(unitNumberSearch.toLowerCase()) ||
        vehicle.make.toLowerCase().includes(unitNumberSearch.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(unitNumberSearch.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(unitNumberSearch.toLowerCase())
      );
      setFilteredVehicles(filtered);
    }
  }, [unitNumberSearch, vehicles]);
  
  // Fetch vehicles from API
  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const response = await apiService.vehicles.getAll();
      setVehicles(response);
      setFilteredVehicles(response);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoadingVehicles(false);
    }
  };
  
  // Fetch vehicle stats from Samsara when vehicle is selected
  const fetchVehicleStats = async (vehicleId: number) => {
    const selectedVehicle = vehicles.find(v => v.vehicle_id === vehicleId);
    if (!selectedVehicle || !selectedVehicle.samsara_id) return;
    
    setLoadingStats(true);
    try {
      // Request all available stat types for comprehensive data
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
      
      // Join types with commas for the API request
      const types = allTypes.join(",");
      console.log("Fetching vehicle stats for Samsara ID:", selectedVehicle.samsara_id);
      console.log("Requesting types:", types);
      
      const stats = await apiService.samsara.getVehicleStats(selectedVehicle.samsara_id, types);
      console.log("Received vehicle stats:", stats);
      
      // Process the stats to handle different data formats
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
      
      // Update mileage in form if available from Samsara
      if (stats.obdOdometerMeters) {
        const mileage = Math.round(stats.obdOdometerMeters / 1609.34);
        // Update the vehicle's mileage in the form data
        setFormData(prev => ({
          ...prev,
          mileage: mileage
        }));
        
        // Also update the selected vehicle's mileage in the vehicles array
        const updatedVehicles = [...vehicles];
        const vehicleIndex = updatedVehicles.findIndex(v => v.vehicle_id === vehicleId);
        if (vehicleIndex >= 0) {
          updatedVehicles[vehicleIndex] = {
            ...updatedVehicles[vehicleIndex],
            mileage: mileage
          };
          setVehicles(updatedVehicles);
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };
  
  // Add effect to refresh telematics data when the section is expanded
  useEffect(() => {
    if (showVehicleStats && formData.vehicle_id) {
      fetchVehicleStats(formData.vehicle_id);
    }
  }, [showVehicleStats, formData.vehicle_id]);
  
  // Fetch work order history for selected vehicle
  const fetchWorkOrderHistory = async (vehicleId: number) => {
    setLoadingHistory(true);
    try {
      const history = await apiService.vehicles.getWorkOrders(vehicleId);
      setWorkOrderHistory(history);
    } catch (error) {
      console.error('Error fetching work order history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };
  
  // Add effect to refresh telematics data when the section is expanded
  useEffect(() => {
    if (showVehicleStats && formData.vehicle_id) {
      fetchVehicleStats(formData.vehicle_id);
    }
  }, [showVehicleStats, formData.vehicle_id]);
  
  // Handle vehicle selection
  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vehicleId = parseInt(e.target.value);
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      vehicle_id: vehicleId
    }));
    
    // Reset telematics data when changing vehicles
    setVehicleStats(null);
    
    // Fetch vehicle stats and history if a vehicle is selected
    if (vehicleId) {
      fetchVehicleStats(vehicleId);
      fetchWorkOrderHistory(vehicleId);
    } else {
      setVehicleStats(null);
      setWorkOrderHistory([]);
    }
  };
  
  const [tasks, setTasks] = useState<Task[]>(
    isEditing ? sampleWorkOrder.tasks : []
  );
  
  const [parts, setParts] = useState<Part[]>(
    isEditing ? sampleWorkOrder.parts : []
  );
  
  // New task/part state
  const [newTask, setNewTask] = useState<Task>({
    description: '',
    status: 'Pending',
    estimated_hours: 1,
    technician_id: null
  });
  
  const [newPart, setNewPart] = useState<Part>({
    part_id: 0,
    quantity: 1,
    unit_cost: 0
  });
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle task field changes
  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: name === 'estimated_hours' || name === 'technician_id' 
        ? parseFloat(value) || (name === 'technician_id' ? null : 0)
        : value
    }));
  };
  
  // Handle part field changes
  const handlePartChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If part_id changed, update unit cost from parts catalog
    if (name === 'part_id') {
      const partId = parseInt(value);
      const selectedPart = parts.find(p => p.id === partId);
      const unitCost = selectedPart ? selectedPart.unit_cost : 0;
      
      setNewPart(prev => ({
        ...prev,
        part_id: partId,
        unit_cost: unitCost
      }));
    } else {
      setNewPart(prev => ({
        ...prev,
        [name]: name === 'quantity' ? parseInt(value) || 1 : parseFloat(value) || 0
      }));
    }
  };
  
  // Add a new task
  const addTask = () => {
    if (!newTask.description) return;
    
    setTasks(prev => [
      ...prev,
      { 
        ...newTask, 
        id: prev.length > 0 ? Math.max(...prev.map(t => t.id || 0)) + 1 : 1 
      }
    ]);
    
    // Reset new task form
    setNewTask({
      description: '',
      status: 'Pending',
      estimated_hours: 1,
      technician_id: null
    });
  };
  
  // Remove a task
  const removeTask = (taskId: number | undefined) => {
    if (!taskId) return;
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };
  
  // Add a new part
  const addPart = () => {
    if (newPart.part_id === 0) return;
    
    // Check if part already exists in work order
    const existingPartIndex = parts.findIndex(p => p.part_id === newPart.part_id);
    
    if (existingPartIndex >= 0) {
      // Update existing part quantity
      const updatedParts = [...parts];
      updatedParts[existingPartIndex].quantity += newPart.quantity;
      setParts(updatedParts);
    } else {
      // Add new part
      setParts(prev => [
        ...prev,
        { 
          ...newPart, 
          id: prev.length > 0 ? Math.max(...prev.map(p => p.id || 0)) + 1 : 1 
        }
      ]);
    }
    
    // Reset new part form
    setNewPart({
      part_id: 0,
      quantity: 1,
      unit_cost: 0
    });
  };
  
  // Remove a part
  const removePart = (partId: number | undefined) => {
    if (!partId) return;
    setParts(prev => prev.filter(part => part.id !== partId));
  };
  
  // Calculate total part cost
  const totalPartsCost = parts.reduce((sum, part) => sum + (part.quantity * part.unit_cost), 0).toFixed(2);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form (basic validation)
    if (!formData.vehicle_id || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }
    
    // In a real app, would submit the work order to the API
    console.log('Submitting work order:', {
      ...formData,
      tasks,
      parts
    });
    
    // Redirect to work order list or detail page
    if (isEditing) {
      navigate(`/work-orders/${id}`);
    } else {
      navigate('/work-orders');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/work-orders" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Work Orders
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Work Order' : 'Create Work Order'}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Work Order Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle */}
            <div>
              <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle <span className="text-red-500">*</span>
              </label>
              {/* Unit Number Search */}
              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by unit #, make, model, or VIN"
                  value={unitNumberSearch}
                  onChange={(e) => setUnitNumberSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                id="vehicle_id"
                name="vehicle_id"
                value={formData.vehicle_id}
                onChange={handleVehicleChange}
                required
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Vehicle</option>
                {filteredVehicles.map(vehicle => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.unit_number ? `${vehicle.unit_number} - ` : ''}{vehicle.make} {vehicle.model} ({vehicle.year})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the work order"
              />
            </div>
            
            {/* Reported Issue */}
            <div className="md:col-span-2">
              <label htmlFor="reported_issue" className="block text-sm font-medium text-gray-700 mb-1">
                Reported Issue
              </label>
              <textarea
                id="reported_issue"
                name="reported_issue"
                value={formData.reported_issue}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                placeholder="Details of the issue reported by driver or detected during inspection"
              />
            </div>
            
            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            
            {/* Assigned Technician */}
            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Technician
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                value={formData.assigned_to || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.id}>{tech.name}</option>
                ))}
              </select>
            </div>
            
            {/* Diagnosis (show only in edit mode or progress) */}
            {(isEditing || formData.status === 'In Progress' || formData.status === 'Completed') && (
              <div className="md:col-span-2">
                <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis
                </label>
                <textarea
                  id="diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Technical diagnosis of the issue"
                />
              </div>
            )}
            
            {/* Resolution (show only when completed or in progress) */}
            {(formData.status === 'Completed' || formData.status === 'In Progress') && (
              <div className="md:col-span-2">
                <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution
                </label>
                <textarea
                  id="resolution"
                  name="resolution"
                  value={formData.resolution}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description of repairs and resolution"
                />
              </div>
            )}
            
            {/* Vehicle Telematics Data from Samsara */}
            {formData.vehicle_id > 0 && (
              <div className="md:col-span-2 mt-4">
                <div className="border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowVehicleStats(!showVehicleStats)}
                    className="flex justify-between items-center w-full px-4 py-2 bg-gray-50 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-2 text-blue-500" />
                      Vehicle Telematics Data
                      {loadingStats && <span className="ml-2 text-xs text-gray-500">(Loading...)</span>}
                    </div>
                    {showVehicleStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showVehicleStats && (
                    <div className="p-4 bg-white">
                      {vehicleStats ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* GPS Data */}
                          {vehicleStats.gps && (
                            <div className="border rounded p-3 bg-blue-50">
                              <h4 className="text-sm font-medium mb-2 flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-blue-600" />
                                GPS Data
                              </h4>
                              <div className="text-xs space-y-1">
                                <p>
                                  <span className="font-medium">Location: </span>
                                  {vehicleStats.gps.reverseGeo?.formattedLocation || 'Unknown'}
                                </p>
                                <p>
                                  <span className="font-medium">Coordinates: </span>
                                  {typeof vehicleStats.gps.latitude === 'number' && typeof vehicleStats.gps.longitude === 'number'
                                    ? `${vehicleStats.gps.latitude.toFixed(6)}, ${vehicleStats.gps.longitude.toFixed(6)}`
                                    : 'Unknown'}
                                </p>
                                <p>
                                  <span className="font-medium">Speed: </span>
                                  {typeof vehicleStats.gps.speed === 'number'
                                    ? `${Math.round(vehicleStats.gps.speed * 2.23694)} mph`
                                    : '0 mph'}
                                </p>
                                <p>
                                  <span className="font-medium">Heading: </span>
                                  {typeof vehicleStats.gps.heading === 'number'
                                    ? `${vehicleStats.gps.heading}°`
                                    : 'Unknown'}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Engine Data */}
                          <div className="border rounded p-3 bg-yellow-50">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <Gauge className="h-4 w-4 mr-1 text-yellow-600" />
                              Engine Data
                            </h4>
                            <div className="text-xs space-y-1">
                              <p>
                                <span className="font-medium">Engine State: </span>
                                {typeof vehicleStats?.engineStates === 'object' 
                                  ? (vehicleStats?.engineStates?.value === 'on' 
                                      ? 'Running' 
                                      : vehicleStats?.engineStates?.value === 'off' 
                                        ? 'Off' 
                                        : 'Idle')
                                  : (vehicleStats?.engineStates === 'on' 
                                      ? 'Running' 
                                      : vehicleStats?.engineStates === 'off' 
                                        ? 'Off' 
                                        : vehicleStats?.engineStates || 'Unknown')}
                              </p>
                              <p>
                                <span className="font-medium">Odometer: </span>
                                {vehicleStats?.obdOdometerMeters 
                                  ? `${Math.round(vehicleStats.obdOdometerMeters / 1609.34).toLocaleString()} miles` 
                                  : 'Unknown'}
                              </p>
                              <p>
                                <span className="font-medium">Fuel Level: </span>
                                {vehicleStats?.fuelPercents 
                                  ? `${Math.round(typeof vehicleStats.fuelPercents === 'object' 
                                      ? vehicleStats.fuelPercents.value 
                                      : vehicleStats.fuelPercents)}%` 
                                  : 'Unknown'}
                              </p>
                              {(typeof vehicleStats?.engineRpm === 'number' || 
                                (vehicleStats?.engineRpm && typeof vehicleStats.engineRpm === 'object')) && (
                                <p>
                                  <span className="font-medium">RPM: </span>
                                  {typeof vehicleStats.engineRpm === 'object' 
                                    ? vehicleStats.engineRpm.value 
                                    : vehicleStats.engineRpm}
                                </p>
                              )}
                              {(typeof vehicleStats?.engineLoadPercent === 'number' || 
                                (vehicleStats?.engineLoadPercent && typeof vehicleStats.engineLoadPercent === 'object')) && (
                                <p>
                                  <span className="font-medium">Engine Load: </span>
                                  {typeof vehicleStats.engineLoadPercent === 'object' 
                                    ? `${vehicleStats.engineLoadPercent.value}%` 
                                    : `${vehicleStats.engineLoadPercent}%`}
                                </p>
                              )}
                              {typeof vehicleStats?.engineCoolantTemperatureMilliC === 'number' && (
                                <p>
                                  <span className="font-medium">Coolant Temp: </span>
                                  {`${((vehicleStats.engineCoolantTemperatureMilliC / 1000) * 9/5 + 32).toFixed(1)}°F`}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Fault Codes */}
                          {vehicleStats?.faultCodes && vehicleStats.faultCodes.length > 0 && (
                            <div className="border rounded p-3 md:col-span-2 bg-red-50">
                              <h4 className="text-sm font-medium mb-2 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1 text-red-600" />
                                Fault Codes
                              </h4>
                              <div className="text-xs space-y-1">
                                {vehicleStats.faultCodes.map((code, index) => (
                                  <div key={index} className="flex items-start p-2 bg-white rounded mb-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-500 mr-1 mt-0.5" />
                                    <div>
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
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {loadingStats 
                            ? 'Loading telematics data...' 
                            : 'No telematics data available for this vehicle.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Vehicle Work Order History */}
            {formData.vehicle_id > 0 && (
              <div className="md:col-span-2 mt-2">
                <div className="border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowWorkOrderHistory(!showWorkOrderHistory)}
                    className="flex justify-between items-center w-full px-4 py-2 bg-gray-50 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      Work Order History
                      {loadingHistory && <span className="ml-2 text-xs text-gray-500">(Loading...)</span>}
                    </div>
                    {showWorkOrderHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {showWorkOrderHistory && (
                    <div className="p-4 bg-white">
                      {workOrderHistory.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ID
                                </th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {workOrderHistory.map((wo) => (
                                <tr key={wo.work_order_id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {wo.work_order_id}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                                    {wo.description}
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      wo.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                                      wo.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {wo.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                                    {new Date(wo.created_at).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          {loadingHistory 
                            ? 'Loading work order history...' 
                            : 'No previous work orders found for this vehicle.'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Tasks</h2>
          </div>
          
          {/* Task List */}
          {tasks.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Est. Hours
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.estimated_hours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.technician_id 
                          ? technicians.find(t => t.id === task.technician_id)?.name 
                          : 'Unassigned'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          type="button"
                          onClick={() => removeTask(task.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Add Task Form */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Add Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="task-description" className="block text-xs font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="task-description"
                  name="description"
                  value={newTask.description}
                  onChange={handleTaskChange}
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Task description"
                />
              </div>
              
              <div>
                <label htmlFor="task-status" className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="task-status"
                  name="status"
                  value={newTask.status}
                  onChange={handleTaskChange}
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="task-hours" className="block text-xs font-medium text-gray-700 mb-1">
                  Est. Hours
                </label>
                <input
                  type="number"
                  id="task-hours"
                  name="estimated_hours"
                  value={newTask.estimated_hours}
                  onChange={handleTaskChange}
                  min="0.25"
                  step="0.25"
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="task-technician" className="block text-xs font-medium text-gray-700 mb-1">
                  Technician
                </label>
                <select
                  id="task-technician"
                  name="technician_id"
                  value={newTask.technician_id || ''}
                  onChange={handleTaskChange}
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Unassigned</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={addTask}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Parts Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Parts</h2>
            <div className="text-sm text-gray-700">
              Total cost: <span className="font-medium">${totalPartsCost}</span>
            </div>
          </div>
          
          {/* Parts List */}
          {parts.length > 0 && (
            <div className="mb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parts.map((part) => {
                    const partInfo = partsInventory.find(p => p.part_id === part.part_id);
                    return (
                      <tr key={part.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {partInfo?.name || `Part #${part.part_id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {partInfo?.part_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {part.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${part.unit_cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${(part.quantity * part.unit_cost).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            type="button"
                            onClick={() => removePart(part.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Add Part Form */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Add Part</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="part-id" className="block text-xs font-medium text-gray-700 mb-1">
                  Part
                </label>
                <select
                  id="part-id"
                  name="part_id"
                  value={newPart.part_id}
                  onChange={handlePartChange}
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">Select Part</option>
                  {partsInventory.map(part => (
                    <option key={part.part_id} value={part.part_id}>
                      {part.name} ({part.part_number}) - {part.quantity_on_hand} in stock
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="part-quantity" className="block text-xs font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="part-quantity"
                  name="quantity"
                  value={newPart.quantity}
                  onChange={handlePartChange}
                  min="1"
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="part-cost" className="block text-xs font-medium text-gray-700 mb-1">
                  Unit Cost
                </label>
                <input
                  type="number"
                  id="part-cost"
                  name="unit_cost"
                  value={newPart.unit_cost}
                  onChange={handlePartChange}
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={addPart}
                  className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Link 
            to={isEditing ? `/work-orders/${id}` : '/work-orders'}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Work Order' : 'Create Work Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkOrderForm;
