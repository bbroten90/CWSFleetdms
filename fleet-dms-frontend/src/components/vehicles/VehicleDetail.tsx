import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, ArrowLeft, Edit, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

// Sample vehicle data (should be fetched from API in production)
const sampleVehicleData = {
  vehicle_id: 1,
  vin: '1HTMMAAL57H452177',
  make: 'Freightliner',
  model: 'Cascadia',
  year: 2021,
  license_plate: 'TR-1017',
  status: 'Active',
  mileage: 56789,
  engine_hours: 2456.8,
  department: 'Delivery',
  assigned_driver_id: 5,
  assigned_driver_name: 'John Doe',
  purchase_date: '2021-03-15',
  last_service_date: '2023-01-10',
  maintenance_schedules: [
    { id: 1, name: 'Oil Change', interval_miles: 25000, next_due_miles: 68789, priority: 'medium' },
    { id: 2, name: 'Brake Inspection', interval_miles: 50000, next_due_miles: 93789, priority: 'low' },
    { id: 3, name: 'Transmission Service', interval_miles: 100000, next_due_miles: 156789, priority: 'low' }
  ],
  recent_work_orders: [
    { id: 'WO-2023-156', description: 'Regular maintenance', status: 'Completed', date: '2023-01-10' },
    { id: 'WO-2022-098', description: 'Replace air filter', status: 'Completed', date: '2022-07-22' },
    { id: 'WO-2022-045', description: 'Fix brake lights', status: 'Completed', date: '2022-03-15' }
  ]
};

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // In a real app, fetch vehicle data based on ID
  const vehicle = sampleVehicleData;

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
                <dd className="mt-1 text-sm text-gray-900">{vehicle.assigned_driver_name}</dd>
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
                <p className="mt-1 text-2xl font-semibold text-gray-900">{vehicle.mileage.toLocaleString()} mi</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Engine Hours</h4>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{vehicle.engine_hours.toLocaleString()} hrs</p>
              </div>
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-500">Last Service</h4>
                <p className="mt-1 text-sm text-gray-900">{vehicle.last_service_date}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Upcoming Maintenance */}
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
            <div className="space-y-4">
              {vehicle.maintenance_schedules.map(schedule => (
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
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm text-gray-500">Every {schedule.interval_miles.toLocaleString()} miles</p>
                    <p className="text-sm">
                      Next due at {schedule.next_due_miles.toLocaleString()} miles 
                      <span className="text-gray-500 ml-1">
                        ({(schedule.next_due_miles - vehicle.mileage).toLocaleString()} miles remaining)
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Work Orders */}
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
            <div className="space-y-4">
              {vehicle.recent_work_orders.map(order => (
                <div key={order.id} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{order.id}: {order.description}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm text-gray-500">{order.date}</p>
                    <Link 
                      to={`/work-orders/${order.id.split('-').pop()}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleDetail;
