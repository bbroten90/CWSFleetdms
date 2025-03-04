import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

// Sample part data for editing form
const samplePart = {
  id: 1,
  part_number: 'EGR-123',
  name: 'EGR Valve',
  description: 'Exhaust Gas Recirculation valve for diesel engines',
  category: 'Engine',
  manufacturer: 'OEM Parts',
  location: 'Shelf A1',
  quantity: 5,
  unit_cost: 120.99,
  reorder_level: 2,
  notes: 'Compatible with Freightliner Cascadia 2018-2023 models'
};

interface PartFormProps {
  isEditing?: boolean;
}

const PartForm: React.FC<PartFormProps> = ({ isEditing = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(
    isEditing ? samplePart : {
      part_number: '',
      name: '',
      description: '',
      category: '',
      manufacturer: '',
      location: '',
      quantity: 0,
      unit_cost: 0,
      reorder_level: 0,
      notes: ''
    }
  );
  
  // Categories for dropdown
  const categories = [
    'Engine',
    'Transmission',
    'Brakes',
    'Suspension',
    'Electrical',
    'Cooling',
    'Filters',
    'Belts',
    'Other'
  ];
  
  // Shelf locations for dropdown
  const locations = [
    'Shelf A1', 'Shelf A2', 'Shelf A3', 'Shelf A4',
    'Shelf B1', 'Shelf B2', 'Shelf B3', 'Shelf B4',
    'Shelf C1', 'Shelf C2', 'Shelf C3', 'Shelf C4',
    'Shelf D1', 'Shelf D2', 'Shelf D3', 'Shelf D4',
    'Shelf E1', 'Shelf E2', 'Shelf E3', 'Shelf E4',
    'Shelf F1', 'Shelf F2', 'Shelf F3', 'Shelf F4'
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to actual numbers
    const numberFields = ['quantity', 'unit_cost', 'reorder_level'];
    const parsedValue = numberFields.includes(name) && type === 'number'
      ? parseFloat(value) || 0
      : value;
    
    setFormData({
      ...formData,
      [name]: parsedValue
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate basic required fields
    if (!formData.part_number || !formData.name || !formData.category) {
      alert('Please fill in all required fields (Part Number, Name, and Category)');
      return;
    }
    
    // In a real app, send data to API here
    console.log('Saving part:', formData);
    
    // Redirect back to parts list or detail
    navigate('/parts');
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to="/parts" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Parts Inventory
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Part' : 'Add New Part'}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Part Identification */}
          <div>
            <label htmlFor="part_number" className="block text-sm font-medium text-gray-700 mb-1">
              Part Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="part_number"
              name="part_number"
              value={formData.part_number}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Part number or SKU"
              required
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Part name"
              required
            />
          </div>
          
          {/* Category and Manufacturer */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brand or manufacturer"
            />
          </div>
          
          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the part"
            />
          </div>
          
          {/* Inventory Information */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Storage Location
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Location</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity in Stock
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost ($)
            </label>
            <input
              type="number"
              id="unit_cost"
              name="unit_cost"
              value={formData.unit_cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700 mb-1">
              Reorder Level
            </label>
            <input
              type="number"
              id="reorder_level"
              name="reorder_level"
              value={formData.reorder_level}
              onChange={handleChange}
              min="0"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Minimum stock level before reordering"
            />
          </div>
          
          {/* Additional Notes */}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional information about the part (compatibility, etc.)"
            />
          </div>
        </div>
        
        {/* Low stock warning */}
        {formData.quantity <= formData.reorder_level && formData.quantity > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Warning:</strong> Current quantity is at or below the reorder level.
            </p>
          </div>
        )}
        
        {/* Out of stock warning */}
        {formData.quantity === 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              <strong>Alert:</strong> This part is currently out of stock.
            </p>
          </div>
        )}
        
        {/* Submit Buttons */}
        <div className="mt-8 flex justify-end space-x-4">
          <Link 
            to="/parts"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <Save className="h-4 w-4 mr-2" />
            {isEditing ? 'Update Part' : 'Add Part'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartForm;
