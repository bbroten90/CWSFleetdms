import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

interface VehicleFormProps {
  isEditing?: boolean;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Sample initial state for the form (should be empty or from API for editing)
  const [formData, setFormData] = useState({
    vin: isEditing ? '1HTMMAAL57H452177' : '',
    make: isEditing ? 'Freightliner' : '',
    model: isEditing ? 'Cascadia' : '',
    year: isEditing ? 2021 : new Date().getFullYear(),
    license_plate: isEditing ? 'TR-1017' : '',
    status: isEditing ? 'Active' : 'Active',
    mileage: isEditing ? 56789 : 0,
    engine_hours: isEditing ? 2456.8 : 0,
    department: isEditing ? 'Delivery' : '',
    purchase_date: isEditing ? '2021-03-15' : new Date().toISOString().split('T')[0]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, submit to API here
    console.log('Form submitted:', formData);
    
    // Redirect back to vehicles list or detail page
    if (isEditing) {
      navigate(`/vehicles/${id}`);
    } else {
      navigate('/vehicles');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to={isEditing ? `/vehicles/${id}` : "/vehicles"} className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEditing ? 'Back to Vehicle Details' : 'Back to Vehicles'}
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VIN */}
          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
              VIN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Vehicle Identification Number"
            />
          </div>
          
          {/* License Plate */}
          <div>
            <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-1">
              License Plate
            </label>
            <input
              type="text"
              id="license_plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="License Plate Number"
            />
          </div>
          
          {/* Make */}
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
              Make <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Manufacturer"
            />
          </div>
          
          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Model"
            />
          </div>
          
          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min="1900"
              max="2099"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Out-of-service">Out of Service</option>
              <option value="In-maintenance">In Maintenance</option>
              <option value="Reserved">Reserved</option>
            </select>
          </div>
          
          {/* Department */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Department"
            />
          </div>
          
          {/* Mileage */}
          <div>
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">
              Mileage
            </label>
            <input
              type="number"
              id="mileage"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Current Mileage"
            />
          </div>
          
          {/* Engine Hours */}
          <div>
            <label htmlFor="engine_hours" className="block text-sm font-medium text-gray-700 mb-1">
              Engine Hours
            </label>
            <input
              type="number"
              id="engine_hours"
              name="engine_hours"
              value={formData.engine_hours}
              onChange={handleChange}
              min="0"
              step="0.1"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Engine Hours"
            />
          </div>
          
          {/* Purchase Date */}
          <div>
            <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              id="purchase_date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => navigate(isEditing ? `/vehicles/${id}` : '/vehicles')}
            className="mr-4 bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Vehicle' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
