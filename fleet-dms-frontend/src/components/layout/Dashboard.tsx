import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertCircle, Truck, Wrench, Package, Calendar, Clock, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';

// Define interfaces for the data
interface DashboardStats {
  totalVehicles: number;
  activeVehicles: number;
  outOfServiceVehicles: number;
  openWorkOrders: number;
  criticalWorkOrders: number;
  lowInventoryItems: number;
  maintenance_due_count?: number;
}

interface MaintenanceItem {
  id?: number;
  vehicle_id?: number;
  vehicle_name: string;
  vin: string;
  service: string;
  due_miles?: number;
  due_date?: string;
  due_engine_hours?: number;
  priority: string;
}

interface WorkOrder {
  work_order_id?: number;
  id?: string;
  vehicle_id?: number;
  vehicle_name: string;
  vehicle?: string;
  description: string;
  status: string;
  date?: string;
}

interface Alert {
  type: string;
  code?: string;
  description?: string;
  vehicle?: string;
  vehicle_id?: number;
  vehicle_name?: string;
  reported_date?: string;
  severity: string;
  part_id?: number;
  part_name?: string;
  part_number?: string;
  quantity?: number;
  minimum?: number;
  service?: string;
  due_date?: string;
  due_mileage?: number;
}

const FleetDashboard = () => {
  // State for dashboard data
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    activeVehicles: 0,
    outOfServiceVehicles: 0,
    openWorkOrders: 0,
    criticalWorkOrders: 0,
    lowInventoryItems: 0
  });
  
  const [maintenanceDue, setMaintenanceDue] = useState<MaintenanceItem[]>([]);
  const [recentWorkOrders, setRecentWorkOrders] = useState<WorkOrder[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch summary stats
        const summaryData = await apiService.dashboard.getSummary();
        setStats({
          totalVehicles: summaryData.total_vehicles || 0,
          activeVehicles: summaryData.active_vehicles || 0,
          outOfServiceVehicles: summaryData.out_of_service_vehicles || 0,
          openWorkOrders: summaryData.open_work_orders || 0,
          criticalWorkOrders: summaryData.critical_work_orders || 0,
          lowInventoryItems: summaryData.low_inventory_items || 0,
          maintenance_due_count: summaryData.maintenance_due_count || 0
        });
        
        // Fetch maintenance due items
        const maintenanceData = await apiService.dashboard.getMaintenanceDue(3); // Limit to 3 items
        setMaintenanceDue(maintenanceData);
        
        // Fetch recent work orders
        const workOrdersData = await apiService.dashboard.getRecentWorkOrders(3); // Limit to 3 items
        setRecentWorkOrders(workOrdersData);
        
        // Fetch alerts (including Samsara diagnostic codes)
        const alertsData = await apiService.dashboard.getAlerts();
        setAlerts(alertsData.alerts || []);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

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
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : maintenanceDue.length > 0 ? (
                maintenanceDue.map(item => (
                  <div key={item.id || item.vehicle_id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{item.vehicle_name}</p>
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
                      <p className="text-sm text-gray-600">
                        {item.due_miles ? `Due in ${item.due_miles} miles` : 
                         item.due_date ? `Due on ${new Date(item.due_date).toLocaleDateString()}` :
                         item.due_engine_hours ? `Due in ${item.due_engine_hours} engine hours` :
                         'Maintenance due soon'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No maintenance due at this time.</p>
              )}
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
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : recentWorkOrders.length > 0 ? (
                recentWorkOrders.map(order => (
                  <div key={order.work_order_id || order.id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">
                          {order.work_order_id ? `WO-${order.work_order_id}` : order.id}: {order.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.vehicle_name || order.vehicle}
                        </p>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'Open' ? 'bg-blue-100 text-blue-800' : 
                          order.status === 'In-progress' || order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <p className="text-sm">
                        Created: {order.date ? new Date(order.date).toLocaleDateString() : 'Unknown'}
                      </p>
                      <button className="text-sm text-blue-600">View</button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent work orders.</p>
              )}
              <button className="text-blue-600 text-sm font-medium">View All Work Orders</button>
            </div>
          </CardContent>
        </Card>
        
        {/* Error message */}
        {error && (
          <div className="col-span-1 lg:col-span-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}
        
        <Card className="bg-white shadow col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 text-red-600" size={20} />
              Active Alerts from Samsara
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filter for diagnostic code alerts from Samsara */}
                {alerts.filter(alert => alert.type === 'diagnostic_code').length > 0 ? (
                  alerts
                    .filter(alert => alert.type === 'diagnostic_code')
                    .slice(0, 4) // Limit to 4 alerts
                    .map((alert, index) => (
                      <div 
                        key={index} 
                        className={`border rounded p-3 ${
                          alert.severity === 'Critical' || alert.severity === 'High' 
                            ? 'bg-red-50' 
                            : alert.severity === 'Medium' 
                              ? 'bg-yellow-50' 
                              : 'bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <AlertCircle 
                            className={`mr-2 ${
                              alert.severity === 'Critical' || alert.severity === 'High' 
                                ? 'text-red-600' 
                                : alert.severity === 'Medium' 
                                  ? 'text-yellow-600' 
                                  : 'text-blue-600'
                            }`} 
                            size={16} 
                          />
                          <p className="font-semibold">
                            {alert.description || 'Diagnostic Code'} - {alert.vehicle_name || alert.vehicle || 'Unknown Vehicle'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          DTC: {alert.code || 'Unknown Code'}
                        </p>
                        <div className="flex justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {alert.reported_date 
                              ? `Reported ${new Date(alert.reported_date).toLocaleDateString()}`
                              : 'Recently reported'}
                          </p>
                          <button className="text-xs text-blue-600">Create Work Order</button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="col-span-1 md:col-span-2 text-center py-6 text-gray-500">
                    No active Samsara alerts at this time.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FleetDashboard;
