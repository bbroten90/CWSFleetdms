import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle, Truck, Plus, Edit, ChevronRight } from 'lucide-react';

// Sample maintenance data
const sampleMaintenance = [
  { 
    id: 1,
    title: 'Regular Oil Change',
    vehicle_id: 1,
    vehicle_name: 'Freightliner Cascadia (TR-1017)',
    maintenance_type: 'Preventive',
    status: 'Scheduled',
    priority: 'Medium',
    due_date: '2023-03-15',
    last_performed: '2022-12-15',
    interval_miles: 25000,
    current_mileage: 52789,
    due_mileage: 60000,
    assigned_to: 'John Smith',
    notes: 'Use synthetic oil as specified in the manual'
  },
  { 
    id: 2,
    title: 'Brake Inspection',
    vehicle_id: 1,
    vehicle_name: 'Freightliner Cascadia (TR-1017)',
    maintenance_type: 'Preventive',
    status: 'Overdue',
    priority: 'High',
    due_date: '2023-02-20',
    last_performed: '2022-11-01',
    interval_miles: 50000,
    current_mileage: 52789,
    due_mileage: 51000,
    assigned_to: 'Mike Johnson',
    notes: 'Check brake pads and rotors'
  },
  { 
    id: 3,
    title: 'Annual DOT Inspection',
    vehicle_id: 2,
    vehicle_name: 'Kenworth T680 (TR-1023)',
    maintenance_type: 'Regulatory',
    status: 'Completed',
    priority: 'Critical',
    due_date: '2023-01-31',
    last_performed: '2023-01-25',
    interval_miles: null,
    current_mileage: 87654,
    due_mileage: null,
    assigned_to: 'John Smith',
    notes: 'Required for regulatory compliance'
  },
  { 
    id: 4,
    title: 'Tire Rotation',
    vehicle_id: 3,
    vehicle_name: 'Peterbilt 579 (TR-1008)',
    maintenance_type: 'Preventive',
    status: 'Scheduled',
    priority: 'Medium',
    due_date: '2023-04-01',
    last_performed: '2022-10-01',
    interval_miles: 20000,
    current_mileage: 124532,
    due_mileage: 144532,
    assigned_to: 'Sarah Lee',
    notes: ''
  },
  { 
    id: 5,
    title: 'A/C System Service',
    vehicle_id: 4,
    vehicle_name: 'Volvo VNL (TR-1042)',
    maintenance_type: 'Preventive',
    status: 'Scheduled',
    priority: 'Low',
    due_date: '2023-05-15',
    last_performed: '2022-05-15',
    interval_miles: null,
    current_mileage: 65432,
    due_mileage: null,
    assigned_to: 'Mike Johnson',
    notes: 'Annual A/C service before summer'
  }
];

const MaintenanceList: React.FC = () => {
  const [maintenance, setMaintenance] = useState(sampleMaintenance);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Filter maintenance based on status and type
  const filteredMaintenance = maintenance.filter(item => {
    const statusMatch = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    const typeMatch = typeFilter === 'all' || item.maintenance_type.toLowerCase() === typeFilter.toLowerCase();
    
    return statusMatch && typeMatch;
  });
  
  // Sort by overdue first, then by due date
  const sortedMaintenance = [...filteredMaintenance].sort((a, b) => {
    // Overdue items come first
    if (a.status === 'Overdue' && b.status !== 'Overdue') return -1;
    if (a.status !== 'Overdue' && b.status === 'Overdue') return 1;
    
    // Then sort by due date, with closer dates first
    const dateA = new Date(a.due_date).getTime();
    const dateB = new Date(b.due_date).getTime();
    
    return dateA - dateB;
  });

  // Get counts for the status summary cards
  const overdueCount = maintenance.filter(item => item.status === 'Overdue').length;
  const scheduledCount = maintenance.filter(item => item.status === 'Scheduled').length;
  const completedCount = maintenance.filter(item => item.status === 'Completed').length;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Maintenance Schedule</h1>
        <Link
          to="/maintenance/new"
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Link>
      </div>
      
      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Maintenance</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{maintenance.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
          <p className="mt-1 text-2xl font-semibold text-red-600">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Scheduled</h3>
          <p className="mt-1 text-2xl font-semibold text-blue-600">{scheduledCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="mt-1 text-2xl font-semibold text-green-600">{completedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="overdue">Overdue</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Type
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="preventive">Preventive</option>
            <option value="corrective">Corrective</option>
            <option value="regulatory">Regulatory</option>
            <option value="predictive">Predictive</option>
          </select>
        </div>
      </div>

      {/* Maintenance List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMaintenance.map((item) => {
                const isOverdue = item.status === 'Overdue';
                const dueDate = new Date(item.due_date);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
                const isComingSoon = !isOverdue && daysUntilDue <= 7 && daysUntilDue > 0;
                
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : (isComingSoon ? 'bg-yellow-50' : '')}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className={`h-5 w-5 mr-3 ${isOverdue ? 'text-red-500' : (isComingSoon ? 'text-yellow-500' : 'text-blue-500')}`} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          <div className="text-sm text-gray-500">
                            {item.maintenance_type}
                            {item.interval_miles && ` | Every ${item.interval_miles.toLocaleString()} miles`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/vehicles/${item.vehicle_id}`} className="text-sm text-blue-600 hover:text-blue-800">
                        <div className="flex items-center">
                          <Truck className="h-4 w-4 mr-1 text-gray-400" />
                          {item.vehicle_name}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                        item.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        item.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                      {item.priority && (
                        <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                          item.priority === 'High' ? 'bg-orange-100 text-orange-800' : 
                          item.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                          item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className={`h-4 w-4 mr-1 ${isOverdue ? 'text-red-500' : (isComingSoon ? 'text-yellow-500' : 'text-gray-400')}`} />
                        <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : (isComingSoon ? 'text-yellow-600' : 'text-gray-500')}`}>
                          {item.due_date}
                          {isOverdue && ' (Overdue)'}
                          {isComingSoon && !isOverdue && ' (Coming soon)'}
                        </span>
                      </div>
                      {item.interval_miles && item.due_mileage && (
                        <div className="mt-1 text-xs text-gray-500">
                          Due at {item.due_mileage.toLocaleString()} miles
                          {item.current_mileage > item.due_mileage && 
                            <span className="text-red-600"> (Overdue by {(item.current_mileage - item.due_mileage).toLocaleString()} miles)</span>
                          }
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.assigned_to || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link to={`/maintenance/${item.id}`} className="text-blue-600 hover:text-blue-900">
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                        {item.status !== 'Completed' && (
                          <Link to={`/maintenance/${item.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                            <Edit className="h-5 w-5" />
                          </Link>
                        )}
                        {item.status !== 'Completed' && (
                          <Link 
                            to={`/work-orders/new?maintenanceId=${item.id}`} 
                            className="text-green-600 hover:text-green-900"
                            title="Create Work Order"
                          >
                            <AlertTriangle className="h-5 w-5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {sortedMaintenance.length === 0 && (
        <div className="mt-6 bg-white p-6 text-center rounded-lg shadow">
          <p className="text-gray-500">No maintenance tasks found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
