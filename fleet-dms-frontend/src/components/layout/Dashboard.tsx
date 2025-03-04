import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertCircle, Truck, Wrench, Package, Calendar, Clock } from 'lucide-react';

const FleetDashboard = () => {
  // Sample state - in a real app, this would come from API calls
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stats, setStats] = useState({
    totalVehicles: 24,
    activeVehicles: 20,
    outOfServiceVehicles: 4,
    openWorkOrders: 7,
    criticalWorkOrders: 2,
    lowInventoryItems: 5
  });
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [maintenanceDue, setMaintenanceDue] = useState([
    { id: 1, vehicle: 'Truck #1017', vin: '1HTMMAAL57H452177', service: 'Oil Change', dueMiles: 500, priority: 'high' },
    { id: 2, vehicle: 'Truck #1023', vin: '1HTMMAAL21H789012', service: 'Brake Inspection', dueMiles: 750, priority: 'medium' },
    { id: 3, vehicle: 'Truck #1008', vin: '1HTMMAAL46H123456', service: 'Air Filter Replacement', dueMiles: 1200, priority: 'low' },
  ]);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [recentWorkOrders, setRecentWorkOrders] = useState([
    { id: 'WO-2023-156', vehicle: 'Truck #1017', description: 'Engine diagnostic', status: 'In Progress', date: '2023-02-28' },
    { id: 'WO-2023-155', vehicle: 'Truck #1005', description: 'Tire rotation', status: 'Completed', date: '2023-02-27' },
    { id: 'WO-2023-154', vehicle: 'Truck #1023', description: 'Brake pad replacement', status: 'Open', date: '2023-02-26' },
  ]);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Fleet Maintenance Dashboard</h1>
        <div className="flex space-x-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">New Work Order</button>
          <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded">Sync with Samsara</button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Total Vehicles</p>
                <p className="text-2xl font-bold">{stats.totalVehicles}</p>
                <p className="text-sm text-gray-500">{stats.activeVehicles} active, {stats.outOfServiceVehicles} out of service</p>
              </div>
              <Truck className="text-blue-600" size={36} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Open Work Orders</p>
                <p className="text-2xl font-bold">{stats.openWorkOrders}</p>
                <p className="text-sm text-red-500">{stats.criticalWorkOrders} critical priority</p>
              </div>
              <Wrench className="text-orange-500" size={36} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500">Inventory Alerts</p>
                <p className="text-2xl font-bold">{stats.lowInventoryItems}</p>
                <p className="text-sm text-gray-500">parts below minimum</p>
              </div>
              <Package className="text-purple-500" size={36} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 text-blue-600" size={20} />
              Maintenance Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {maintenanceDue.map(item => (
                <div key={item.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{item.vehicle}</p>
                      <p className="text-sm text-gray-500">VIN: {item.vin}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm">{item.service}</p>
                    <p className="text-sm text-gray-600">Due in {item.dueMiles} miles</p>
                  </div>
                </div>
              ))}
              <button className="text-blue-600 text-sm font-medium">View All Scheduled Maintenance</button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 text-orange-500" size={20} />
              Recent Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentWorkOrders.map(order => (
                <div key={order.id} className="border-b pb-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{order.id}: {order.description}</p>
                      <p className="text-sm text-gray-500">{order.vehicle}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'Open' ? 'bg-blue-100 text-blue-800' : 
                        order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm">Created: {order.date}</p>
                    <button className="text-sm text-blue-600">View</button>
                  </div>
                </div>
              ))}
              <button className="text-blue-600 text-sm font-medium">View All Work Orders</button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 text-red-600" size={20} />
              Active Alerts from Samsara
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-3 bg-red-50">
                <div className="flex items-center">
                  <AlertCircle className="text-red-600 mr-2" size={16} />
                  <p className="font-semibold">Check Engine Light - Truck #1017</p>
                </div>
                <p className="text-sm text-gray-700 mt-1">DTC: P0401 - EGR Flow Insufficient</p>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Reported 2 hours ago</p>
                  <button className="text-xs text-blue-600">Create Work Order</button>
                </div>
              </div>
              
              <div className="border rounded p-3 bg-yellow-50">
                <div className="flex items-center">
                  <AlertCircle className="text-yellow-600 mr-2" size={16} />
                  <p className="font-semibold">Low Fuel Pressure - Truck #1008</p>
                </div>
                <p className="text-sm text-gray-700 mt-1">DTC: P0087 - Fuel Rail/System Pressure Too Low</p>
                <div className="flex justify-between mt-2">
                  <p className="text-xs text-gray-500">Reported 1 day ago</p>
                  <button className="text-xs text-blue-600">Create Work Order</button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FleetDashboard;
