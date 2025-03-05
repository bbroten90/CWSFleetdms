// src/components/parts/PartForm.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import apiService from '../../services/api';

// Interface for part data
interface PartFormData {
  part_number: string;
  name: string;
  category?: string;
  description?: string;
  quantity_on_hand: number;
  minimum_quantity: number;
  unit_cost: number;
  location?: string;
  manufacturer?: string;
}

const PartForm: React.FC = () => {
  const { partId } = useParams<{ partId: string }>();
  const navigate = useNavigate();
  const isEditMode = !!partId;
  
  // State
  const [formData, setFormData] = useState<PartFormData>({
    part_number: '',
    name: '',
    category: '',
    description: '',
    quantity_on_hand: 0,
    minimum_quantity: 0,
    unit_cost: 0,
    location: '',
    manufacturer: ''
  });
  
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      if (isEditMode) {
        try {
          const part = await apiService.parts.getById(parseInt(partId as string));
          setFormData(part);
        } catch (err) {
          console.error('Error fetching part:', err);
          setError('Failed to load part data. Please try again later.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    fetchCategories();
  }, [isEditMode, partId]);
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await apiService.parts.getCategories();
      setCategories(response);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Parse numeric values
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.part_number.trim()) {
      setError('Part number is required');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Part name is required');
      return;
    }
    
    if (formData.quantity_on_hand < 0) {
      setError('Quantity on hand cannot be negative');
      return;
    }
    
    if (formData.minimum_quantity < 0) {
      setError('Minimum quantity cannot be negative');
      return;
    }
    
    if (formData.unit_cost < 0) {
      setError('Unit cost cannot be negative');
      return;
    }
    
    setSaving(true);
    
    try {
      if (isEditMode) {
        // Update existing part
        await apiService.parts.update(parseInt(partId as string), formData);
      } else {
        // Create new part
        await apiService.parts.create(formData);
      }
      
      // Navigate back to parts list
      navigate('/parts');
    } catch (err) {
      console.error('Error saving part:', err);
      setError('Failed to save part. Please try again.');
      setSaving(false);
    }
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!isEditMode) return;
    
    if (!window.confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      await apiService.parts.delete(parseInt(partId as string));
      navigate('/parts');
    } catch (err) {
      console.error('Error deleting part:', err);
      setError('Failed to delete part. It may be in use in work orders or have inventory transactions.');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEditMode ? `Edit Part: ${formData.name}` : 'Add New Part'}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/parts')}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Parts
          </button>
          
          {isEditMode && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Part
            </button>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Part Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Part Number */}
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
              required
            />
          </div>
          
          {/* Part Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Part Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="relative">
              <select
                id="category"
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          {/* Manufacturer */}
          <div>
            <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer
            </label>
            <input
              type="text"
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer || ''}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Quantity on Hand */}
          <div>
            <label htmlFor="quantity_on_hand" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity on Hand <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantity_on_hand"
              name="quantity_on_hand"
              value={formData.quantity_on_hand}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Minimum Quantity */}
          <div>
            <label htmlFor="minimum_quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="minimum_quantity"
              name="minimum_quantity"
              value={formData.minimum_quantity}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Unit Cost */}
          <div>
            <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700 mb-1">
              Unit Cost ($) <span className="text-red-500">*</span>
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
              required
            />
          </div>
          
          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Storage Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Shelf A-12, Bin 3, Warehouse B"
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
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Part'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartForm;
