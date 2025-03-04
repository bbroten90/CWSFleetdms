import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, ArrowLeft, Edit, Wrench, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import apiService from '../../services/api';

interface Vehicle {
  vehicle_id: number;
  vin: string;
  samsara_id?: string;
  unit_number?: string;
  make: string;
  model: string;
  year: number;
  license_plate?: string;
  status: string;
  mileage?: number;
  engine_hours?: number;
  last_service_date?: string;
  purchase_date?: string;
  department?: string;
  assigned_driver_id?: number;
  assigned_driver_name?: string; // Added this field
  created_at: string;
  updated_at: string;
}

interface MaintenanceSchedule {
  id: number;
  name: string;
  interval_miles?: number;
  next_due_miles?: number;
  priority: string;
}

interface WorkOrder {
  work_order_id: number;
  description: string;
  status: string;
  created_at: string;
}

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchVehicleData = async () => {
      setLoading(true);
      try {
        if (!id) {
          throw new Error('Vehicle ID is missing');
        }
        
        // Fetch vehicle details
        const vehicleData = await apiService.vehicles.getById(id);
        setVehicle(vehicleData);
        
        // Fetch maintenance schedules
        try {
          const maintenanceData = await apiService.vehicles.getMaintenance(id);
          setMaintenanceSchedules(maintenanceData);
        } catch (err) {
          console.error('Error fetching maintenance schedules:', err);
          setMaintenanceSchedules([]);
        }
        
        // Fetch work orders
        try {
          const workOrdersData = await apiService.vehicles.getWorkOrders(id);
          setWorkOrders(workOrdersData);
        } catch (err) {
          console.error('Error fetching work orders:', err);
          setWorkOrders([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching vehicle details:', err);
        setError('Failed to load vehicle details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchVehicleData();
    }
  }, [id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading vehicle details...</span>
      </div>
    );
  }
  
  if (error || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error || 'Vehicle not found'}</p>
        </div>
        <Link to="/vehicles" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Vehicles
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/vehicles" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Vehicles
        </Link>
      </div>
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div className="flex items-center">
          <Truck className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
            <p className="text-gray-500">VIN: {vehicle.vin}</p>
          </div>
        </div>
        
        <div className="mt-4 lg:mt-0 flex space-x-3">
          <Link 
            to={`/vehicles/${id}/edit`}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Vehicle
          </Link>
          <Link 
            to={`/work-orders/new?vehicleId=${id}`}
            className="flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            <Wrench className="h-4 w-4 mr-2" />
            Create Work Order
          </Link>
        </div>
      </div>
      
      {/* Status badge */}
      <div className="mb-6">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          vehicle.status === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {vehicle.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Make</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.make}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Year</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.year}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">VIN</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.vin}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">License Plate</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.license_plate}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Department</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.department}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned Driver</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicle.assigned_driver_name || (vehicle.assigned_driver_id ? `Driver ID: ${vehicle.assigned_driver_id}` : 'None')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.purchase_date}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Service Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.last_service_date}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Current Mileage</h4>
                              <p className="mt-1 text-2xl font-semibold text-gray-900">{vehicle.mileage ? vehicle.mileage.toLocaleString() : 'N/A'} mi</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Engine Hours</h4>
                              <p className="mt-1 text-2xl font-semibold text-gray-900">{vehicle.engine_hours ? vehicle.engine_hours.toLocaleString() : 'N/A'} hrs</p>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-500">Last Service</h4>
                              <p className="mt-1 text-sm text-gray-900">{vehicle.last_service_date ? new Date(vehicle.last_service_date).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Maintenance Schedules */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Maintenance Schedules</CardTitle>
            <Link 
              to={`/maintenance?vehicleId=${id}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {maintenanceSchedules.length > 0 ? (
              <div className="space-y-4">
                {maintenanceSchedules.map(schedule => (
                  <div key={schedule.id} className="pb-4 border-b last:border-0">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{schedule.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        schedule.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        schedule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {schedule.priority.toUpperCase()}
                      </span>
                    </div>
                    {schedule.interval_miles && schedule.next_due_miles && vehicle.mileage && (
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-sm text-gray-500">Every {schedule.interval_miles.toLocaleString()} miles</p>
                        <p className="text-sm">
                          Next due at {schedule.next_due_miles.toLocaleString()} miles 
                          <span className="text-gray-500 ml-1">
                            ({(schedule.next_due_miles - vehicle.mileage).toLocaleString()} miles remaining)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No maintenance schedules found for this vehicle.</p>
            )}
          </CardContent>
        </Card>
        
        {/* Work Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Work Orders</CardTitle>
            <Link 
              to={`/work-orders?vehicleId=${id}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {workOrders.length > 0 ? (
              <div className="space-y-4">
                {workOrders.map(order => (
                  <div key={order.work_order_id} className="pb-4 border-b last:border-0">
                    <div className="flex justify-between">
                      <h4 className="font-medium">WO-{order.work_order_id}: {order.description}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                      <Link 
                        to={`/work-orders/${order.work_order_id}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No work orders found for this vehicle.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleDetail;
