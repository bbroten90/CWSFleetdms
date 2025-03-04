import React, { useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Calendar } from 'lucide-react';

// Sample maintenance data for editing form
const sampleMaintenance = {
  id: 1,
  title: 'Regular Oil Change',
  vehicle_id: 1,
  maintenance_type: 'Preventive',
  status: 'Scheduled',
  priority: 'Medium',
  due_date: '2023-03-15',
  last_performed: '2022-12-15',
  interval_miles: 25000,
  interval_days: 90,
  current_mileage: 52789,
  due_mileage: 60000,
  assigned_to: 'John Smith',
  notes: 'Use synthetic oil as specified in the manual'
};

// Sample vehicles for dropdown
const vehicles = [
  { id: 1, name: 'Freightliner Cascadia (TR-1017)' },
  { id: 2, name: 'Kenworth T680 (TR-1023)' },
  { id: 3, name: 'Peterbilt 579 (TR-1008)' },
  { id: 4, name: 'Volvo VNL (TR-1042)' }
];

// Sample technicians for dropdown
const technicians = [
  { id: 1, name: 'John Smith' },
  { id: 2, name: 'Mike Johnson' },
  { id: 3, name: 'Sarah Lee' }
];

interface MaintenanceFormProps {
  isEditing?: boolean;
}

const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get vehicleId from query param (for creating maintenance from vehicle page)
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromQuery = queryParams.get('vehicleId');
  
  const [formData, setFormData] = useState(
    isEditing ? sampleMaintenance : {
      title: '',
      vehicle_id: vehicleIdFromQuery ? parseInt(vehicleIdFromQuery) : 0,
      maintenance_type: 'Preventive',
      status: 'Scheduled',
      priority: 'Medium',
      due_date: new Date().toISOString().split('T')[0], // Default to today
      last_performed: '',
      interval_miles: 0,
      interval_days: 0,
      current_mileage: 0,
      due_mileage: 0,
      assigned_to: '',
      notes: ''
    }
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to actual numbers
    const numberFields = ['vehicle_id', 'interval_miles', 'interval_days', 'current_mileage', 'due_mileage'];
    const parsedValue = numberFields.includes(name) && type === 'number'
      ? parseFloat(value) || 0
      : value;
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };
  
  const calculateDueMileage = () => {
    if (formData.interval_miles && formData.current_mileage) {
      const newDueMileage = formData.current_mileage + formData.interval_miles;
      setFormData({
        ...formData,
        due_mileage: newDueMileage
      });
    }
  };
  
  const calculateDueDate = () => {
    if (formData.interval_days) {
      const today = new Date();
      const dueDate = new Date();
      dueDate.setDate(today.getDate() + formData.interval_days);
      
      setFormData({
        ...formData,
        due_date: dueDate.toISOString().split('T')[0]
      });
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate basic required fields
    if (!formData.title || !formData.vehicle_id || !formData.due_date) {
      alert('Please fill in all required fields (Title, Vehicle, and Due Date)');
      return;
    }
    
    // In a real app, send data to API here
    console.log('Saving maintenance:', formData);
    
    // Redirect back to maintenance list
    navigate('/maintenance');
  };
  
  const getVehicleNameById = (id: number) => {
    const vehicle = vehicles.find(v => v.id === id);
    return vehicle ? vehicle.name : '';
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/maintenance" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Maintenance Schedule
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Maintenance Task' : 'Schedule New Maintenance'}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Oil Change, Brake Inspection, etc."
              required
            />
          </div>
          
          {/* Vehicle */}
          <div>
            <label htmlFor="vehicle_id" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              id="vehicle_id"
              name="vehicle_id"
              value={formData.vehicle_id || ''}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>{vehicle.name}</option>
              ))}
            </select>
          </div>
          
          {/* Current Mileage */}
          <div>
            <label htmlFor="current_mileage" className="block text-sm font-medium text-gray-700 mb-1">
              Current Mileage
            </label>
            <input
              type="number"
              id="current_mileage"
              name="current_mileage"
              value={formData.current_mileage}
              onChange={handleChange}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Current odometer reading"
            />
            <p className="mt-1 text-xs text-gray-500">
              Last known: {formData.current_mileage.toLocaleString()} miles
              {formData.vehicle_id > 0 && ` for ${getVehicleNameById(formData.vehicle_id)}`}
            </p>
          </div>
          
          {/* Maintenance Type and Priority */}
          <div>
            <label htmlFor="maintenance_type" className="block text-sm font-medium text-gray-700 mb-1">
              Maintenance Type
            </label>
            <select
              id="maintenance_type"
              name="maintenance_type"
              value={formData.maintenance_type}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Preventive">Preventive</option>
              <option value="Corrective">Corrective</option>
              <option value="Regulatory">Regulatory</option>
              <option value="Predictive">Predictive</option>
            </select>
          </div>
          
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
          
          {/* Maintenance Interval */}
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Maintenance Interval</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="interval_miles" className="block text-xs font-medium text-gray-700 mb-1">
                  Miles Interval
                </label>
                <div className="flex">
                  <input
                    type="number"
                    id="interval_miles"
                    name="interval_miles"
                    value={formData.interval_miles}
                    onChange={handleChange}
                    min="0"
                    className="flex-1 rounded-l-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 5000"
                  />
                  <button
                    type="button"
                    onClick={calculateDueMileage}
                    className="bg-gray-100 px-4 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                  >
                    Calculate
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="interval_days" className="block text-xs font-medium text-gray-700 mb-1">
                  Days Interval
                </label>
                <div className="flex">
                  <input
                    type="number"
                    id="interval_days"
                    name="interval_days"
                    value={formData.interval_days}
                    onChange={handleChange}
                    min="0"
                    className="flex-1 rounded-l-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 90"
                  />
                  <button
                    type="button"
                    onClick={calculateDueDate}
                    className="bg-gray-100 px-4 py-2 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                  >
                    Calculate
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Last Performed Date */}
          <div>
            <label htmlFor="last_performed" className="block text-sm font-medium text-gray-700 mb-1">
              Last Performed
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="last_performed"
                name="last_performed"
                value={formData.last_performed}
                onChange={handleChange}
                className="w-full pl-10 rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Due Date and Due Mileage */}
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full pl-10 rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="due_mileage" className="block text-sm font-medium text-gray-700 mb-1">
              Due Mileage
            </label>
            <input
              type="number"
              id="due_mileage"
              name="due_mileage"
              value={formData.due_mileage}
              onChange={handleChange}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mileage when maintenance is due"
            />
          </div>
          
          {/* Status and Assignment */}
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
              <option value="Scheduled">Scheduled</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-1">
              Assign To
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Unassigned</option>
              {technicians.map(tech => (
                <option key={tech.id} value={tech.name}>{tech.name}</option>
              ))}
            </select>
          </div>
          
          {/* Notes */}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional instructions or information"
            />
          </div>
        </div>
        
        {/* Submit Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <Link 
            to="/maintenance"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Maintenance' : 'Schedule Maintenance'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MaintenanceForm;
