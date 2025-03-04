import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Clock, Edit, ChevronRight } from 'lucide-react';

// Sample work order data
const sampleWorkOrders = [
  {
    id: 'WO-2023-156',
    vehicle_id: 1,
    vehicle_name: 'Freightliner Cascadia (TR-1017)',
    description: 'Engine diagnostic and maintenance',
    status: 'In Progress',
    priority: 'High',
    created_at: '2023-02-28',
    assigned_to: 'John Smith'
  },
  {
    id: 'WO-2023-155',
    vehicle_id: 2,
    vehicle_name: 'Kenworth T680 (TR-1023)',
    description: 'Tire rotation and brake check',
    status: 'Open',
    priority: 'Medium',
    created_at: '2023-02-27',
    assigned_to: 'Unassigned'
  },
  {
    id: 'WO-2023-154',
    vehicle_id: 3,
    vehicle_name: 'Peterbilt 579 (TR-1008)',
    description: 'Brake pad replacement',
    status: 'Completed',
    priority: 'Medium',
    created_at: '2023-02-26',
    assigned_to: 'Mike Johnson'
  },
  {
    id: 'WO-2023-153',
    vehicle_id: 1,
    vehicle_name: 'Freightliner Cascadia (TR-1017)',
    description: 'Oil change and filter replacement',
    status: 'Completed',
    priority: 'Low',
    created_at: '2023-02-20',
    assigned_to: 'John Smith'
  },
  {
    id: 'WO-2023-152',
    vehicle_id: 4,
    vehicle_name: 'Volvo VNL (TR-1042)',
    description: 'Check engine light diagnostics',
    status: 'Cancelled',
    priority: 'High',
    created_at: '2023-02-18',
    assigned_to: 'Sarah Lee'
  }
];

const WorkOrdersList: React.FC = () => {
  const [workOrders, setWorkOrders] = useState(sampleWorkOrders);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Filter work orders based on status and priority
  const filteredWorkOrders = workOrders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    const priorityMatch = priorityFilter === 'all' || order.priority.toLowerCase() === priorityFilter.toLowerCase();
    return statusMatch && priorityMatch;
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Work Orders</h1>
        <Link
          to="/work-orders/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create Work Order
        </Link>
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
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Work Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Order
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
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
              {filteredWorkOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Wrench className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.id}</div>
                        <div className="text-sm text-gray-500">{order.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/vehicles/${order.vehicle_id}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {order.vehicle_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.priority === 'High' ? 'bg-red-100 text-red-800' : 
                        order.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {order.created_at}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.assigned_to}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link to={`/work-orders/${order.id.split('-').pop()}`} className="text-blue-600 hover:text-blue-900">
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                      {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                        <Link to={`/work-orders/${order.id.split('-').pop()}/edit`} className="text-indigo-600 hover:text-indigo-900">
                          <Edit className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filteredWorkOrders.length === 0 && (
        <div className="mt-6 bg-white p-6 text-center rounded-lg shadow">
          <p className="text-gray-500">No work orders found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default WorkOrdersList;
