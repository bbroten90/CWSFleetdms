import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Wrench, Clock, User, Truck, Tag, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

// Sample work order data
const sampleWorkOrder = {
  id: 'WO-2023-156',
  vehicle_id: 1,
  vehicle: {
    id: 1,
    name: 'Freightliner Cascadia',
    license_plate: 'TR-1017',
    vin: '1HTMMAAL57H452177'
  },
  description: 'Engine diagnostic and maintenance',
  reported_issue: 'Check engine light is on and engine is making a knocking sound',
  diagnosis: 'EGR valve malfunction and loose belt',
  resolution: 'Replaced EGR valve and tightened belt',
  status: 'In Progress',
  priority: 'High',
  created_at: '2023-02-28',
  start_date: '2023-03-01',
  completed_date: null,
  assigned_to: 'John Smith',
  created_by: 'Mike Manager',
  tasks: [
    { id: 1, description: 'Diagnose check engine light', status: 'Completed', estimated_hours: 1, actual_hours: 1.5, technician: 'John Smith' },
    { id: 2, description: 'Replace EGR valve', status: 'In Progress', estimated_hours: 2, actual_hours: null, technician: 'John Smith' },
    { id: 3, description: 'Check and tighten belts', status: 'In Progress', estimated_hours: 0.5, actual_hours: null, technician: 'John Smith' },
    { id: 4, description: 'Road test', status: 'Pending', estimated_hours: 1, actual_hours: null, technician: 'John Smith' }
  ],
  parts: [
    { id: 1, part_number: 'EGR-123', name: 'EGR Valve', quantity: 1, unit_cost: 120.99, total_cost: 120.99 },
    { id: 2, part_number: 'BELT-456', name: 'Serpentine Belt', quantity: 1, unit_cost: 45.50, total_cost: 45.50 }
  ]
};

const WorkOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // In a real app, fetch work order data based on ID
  const workOrder = sampleWorkOrder;
  
  // Calculate totals
  const totalParts = workOrder.parts.reduce((sum, part) => sum + part.total_cost, 0).toFixed(2);
  const totalEstimatedHours = workOrder.tasks.reduce((sum, task) => sum + task.estimated_hours, 0);
  const totalActualHours = workOrder.tasks
    .filter(task => task.actual_hours !== null)
    .reduce((sum, task) => sum + (task.actual_hours || 0), 0);
  const completedTasks = workOrder.tasks.filter(task => task.status === 'Completed').length;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/work-orders" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Work Orders
        </Link>
      </div>
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{workOrder.id}</h1>
          <p className="text-gray-500">{workOrder.description}</p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex space-x-3">
          {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
            <Link 
              to={`/work-orders/${id}/edit`}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Work Order
            </Link>
          )}
          
          <Link 
            to={`/vehicles/${workOrder.vehicle_id}`}
            className="flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            <Truck className="h-4 w-4 mr-2" />
            View Vehicle
          </Link>
        </div>
      </div>
      
      {/* Status and priority badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          workOrder.status === 'Completed' ? 'bg-green-100 text-green-800' : 
          workOrder.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
          workOrder.status === 'Open' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          <CheckCircle className={`h-4 w-4 mr-1 ${
            workOrder.status === 'Completed' ? 'text-green-600' : 
            workOrder.status === 'In Progress' ? 'text-yellow-600' :
            workOrder.status === 'Open' ? 'text-blue-600' :
            'text-gray-600'
          }`} />
          {workOrder.status}
        </span>
        
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          workOrder.priority === 'High' ? 'bg-red-100 text-red-800' : 
          workOrder.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          <AlertTriangle className={`h-4 w-4 mr-1 ${
            workOrder.priority === 'High' ? 'text-red-600' : 
            workOrder.priority === 'Medium' ? 'text-yellow-600' :
            'text-green-600'
          }`} />
          {workOrder.priority} Priority
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Vehicle</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link to={`/vehicles/${workOrder.vehicle_id}`} className="text-blue-600 hover:text-blue-800">
                    {workOrder.vehicle.name} ({workOrder.vehicle.license_plate})
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">VIN</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.vehicle.vin}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Reported Issue</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.reported_issue}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Diagnosis</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.diagnosis || 'Pending'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Resolution</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.resolution || 'Pending'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.assigned_to || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900">{workOrder.created_by}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-500">Created</h4>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm font-medium mt-1">{workOrder.created_at}</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-500">Started</h4>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm font-medium mt-1">{workOrder.start_date || 'Not started'}</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-500">Completed</h4>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm font-medium mt-1">{workOrder.completed_date || 'In progress'}</p>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-500">Tasks Progress</h4>
                <div className="mt-1">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(completedTasks / workOrder.tasks.length) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-right">
                    {completedTasks} of {workOrder.tasks.length} tasks completed
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-500">Time</h4>
                <p className="text-sm mt-1">
                  <span className="font-medium">{totalActualHours}</span> / {totalEstimatedHours} estimated hours
                </p>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-500">Parts</h4>
                <p className="text-sm mt-1">
                  <span className="font-medium">${totalParts}</span> total cost
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tasks Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Add Task
            </button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                    Technician
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Hours
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual Hours
                  </th>
                  {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrder.tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'Pending' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-400" />
                        {task.technician || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.estimated_hours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.actual_hours || '-'}
                    </td>
                    {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          Edit
                        </button>
                        {task.status !== 'Completed' && (
                          <button className="text-green-600 hover:text-green-900">
                            Complete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Parts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Parts Used</CardTitle>
          {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Add Part
            </button>
          )}
        </CardHeader>
        <CardContent>
          {workOrder.parts.length > 0 ? (
            <div className="overflow-x-auto">
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
                    {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workOrder.parts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-gray-400" />
                          {part.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {part.part_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {part.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${part.unit_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${part.total_cost.toFixed(2)}
                      </td>
                      {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${totalParts}
                    </td>
                    {workOrder.status !== 'Completed' && workOrder.status !== 'Cancelled' && (
                      <td></td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No parts have been added to this work order.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkOrderDetail;
