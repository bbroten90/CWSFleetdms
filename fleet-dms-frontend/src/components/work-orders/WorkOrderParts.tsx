// src/components/workorders/WorkOrderParts.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Plus,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import apiService from '../../services/api';

// Interfaces
interface PartInventory {
  part_id: number;
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

interface WorkOrderPart {
  id?: number;
  work_order_id: number;
  part_id: number;
  quantity: number;
  unit_cost: number;
  part?: PartInventory;
}

interface WorkOrderDetails {
  id: number;
  status: string;
  description: string;
  // Other work order properties as needed
}

const WorkOrderParts: React.FC = () => {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const navigate = useNavigate();
  
  // State
  const [workOrder, setWorkOrder] = useState<WorkOrderDetails | null>(null);
  const [parts, setParts] = useState<PartInventory[]>([]);
  const [workOrderParts, setWorkOrderParts] = useState<WorkOrderPart[]>([]);
  const [availableParts, setAvailableParts] = useState<PartInventory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParts, setFilteredParts] = useState<PartInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPart, setNewPart] = useState<WorkOrderPart>({
    work_order_id: parseInt(workOrderId || '0'),
    part_id: 0,
    quantity: 1,
    unit_cost: 0
  });
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Fetch data on load
  useEffect(() => {
    if (!workOrderId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch work order details
        const orderDetails = await apiService.workOrders.getById(parseInt(workOrderId));
        setWorkOrder(orderDetails);
        
        // Fetch all parts for inventory
        const partsData = await apiService.parts.getAll();
        setParts(partsData);
        setAvailableParts(partsData);
        
        // Fetch parts already on this work order
        const workOrderPartsData = await apiService.workOrders.getParts(parseInt(workOrderId));
        setWorkOrderParts(workOrderPartsData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load work order parts data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [workOrderId]);
  
  // Filter available parts when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredParts(availableParts);
      return;
    }
    
    const filtered = availableParts.filter(part => 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredParts(filtered);
  }, [searchTerm, availableParts]);
  
  // Add a part to the work order
  const handleAddPart = async () => {
    if (newPart.part_id === 0) {
      setError('Please select a part to add');
      return;
    }
    
    if (newPart.quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    // Check if we have enough in inventory
    const selectedPart = parts.find(p => p.part_id === newPart.part_id);
    if (selectedPart && newPart.quantity > selectedPart.quantity_on_hand) {
      setError(`Not enough stock. Only ${selectedPart.quantity_on_hand} available.`);
      return;
    }
    
    try {
      setSaving(true);
      
      // Use the unit cost from the part if not specified
      if (!newPart.unit_cost && selectedPart) {
        newPart.unit_cost = selectedPart.unit_cost;
      }
      
      // Add part to work order
      const addedPart = await apiService.workOrders.addPart(parseInt(workOrderId || '0'), {
        part_id: newPart.part_id,
        quantity: newPart.quantity,
        unit_cost: newPart.unit_cost
      });
      
      // Update work order parts list
      setWorkOrderParts([...workOrderParts, {
        ...addedPart,
        part: selectedPart
      }]);
      
      // Reset form
      setNewPart({
        work_order_id: parseInt(workOrderId || '0'),
        part_id: 0,
        quantity: 1,
        unit_cost: 0
      });
      
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error('Error adding part to work order:', err);
      setError('Failed to add part to work order. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Remove a part from the work order
  const handleRemovePart = async (partId: number) => {
    if (!window.confirm('Are you sure you want to remove this part from the work order?')) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Remove part from work order
      await apiService.workOrders.removePart(parseInt(workOrderId || '0'), partId);
      
      // Update work order parts list
      setWorkOrderParts(workOrderParts.filter(p => p.id !== partId));
      
      setError(null);
    } catch (err) {
      console.error('Error removing part from work order:', err);
      setError('Failed to remove part from work order. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Update part quantity
  const handleUpdateQuantity = async (partId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    // Find the work order part
    const workOrderPart = workOrderParts.find(p => p.id === partId);
    if (!workOrderPart) return;
    
    // Check if we have enough in inventory
    const selectedPart = parts.find(p => p.part_id === workOrderPart.part_id);
    const currentQuantity = workOrderPart.quantity;
    const quantityDifference = newQuantity - currentQuantity;
    
    if (selectedPart && quantityDifference > 0 && 
        quantityDifference > selectedPart.quantity_on_hand) {
      setError(`Not enough stock. Only ${selectedPart.quantity_on_hand} additional units available.`);
      return;
    }
    
    try {
      setSaving(true);
      
      // Update part quantity
      await apiService.workOrders.updatePart(parseInt(workOrderId || '0'), partId, {
        quantity: newQuantity
      });
      
      // Update work order parts list
      setWorkOrderParts(workOrderParts.map(p => 
        p.id === partId ? { ...p, quantity: newQuantity } : p
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error updating part quantity:', err);
      setError('Failed to update part quantity. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate total parts cost
  const calculateTotalCost = () => {
    return workOrderParts.reduce(
      (sum, part) => sum + (part.quantity * part.unit_cost), 
      0
    ).toFixed(2);
  };
  
  // Handle completing the work order and finalizing part usage
  const handleCompleteWorkOrder = async () => {
    if (!window.confirm('Are you sure you want to complete this work order? This will deduct all parts from inventory.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Complete work order and finalize part usage
      await apiService.workOrders.complete(parseInt(workOrderId || '0'));
      
      // Redirect to work order details
      navigate(`/work-orders/${workOrderId}`);
      
    } catch (err) {
      console.error('Error completing work order:', err);
      setError('Failed to complete work order. Please try again.');
      setSaving(false);
    }
  };
  
  // Check if any parts have insufficient inventory
  const hasInsufficientInventory = () => {
    return workOrderParts.some(workOrderPart => {
      const inventoryPart = parts.find(p => p.part_id === workOrderPart.part_id);
      return inventoryPart && workOrderPart.quantity > inventoryPart.quantity_on_hand;
    });
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
          Parts for Work Order #{workOrderId}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            {showAddForm ? 'Cancel' : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Work Order Info */}
      {workOrder && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium mb-2">Work Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Work Order ID</p>
              <p className="text-sm font-medium">{workOrder.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-sm font-medium">{workOrder.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm font-medium">{workOrder.description}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* Insufficient inventory warning */}
      {hasInsufficientInventory() && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Insufficient Inventory</p>
            <p>Some parts on this work order have quantities exceeding current inventory levels. 
            You'll need to adjust quantities or restock inventory before completing this work order.</p>
          </div>
        </div>
      )}
      
      {/* Add Part Form */}
      {showAddForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Add Part to Work Order</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Parts */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Parts
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name, part number, or description"
                />
              </div>
            </div>
            
            {/* Part Selection */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Part
              </label>
              <select
                value={newPart.part_id || ''}
                onChange={(e) => {
                  const partId = parseInt(e.target.value);
                  const selectedPart = parts.find(p => p.part_id === partId);
                  
                  setNewPart({
                    ...newPart,
                    part_id: partId,
                    unit_cost: selectedPart ? selectedPart.unit_cost : 0
                  });
                }}
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a part</option>
                {filteredParts.map(part => (
                  <option key={part.part_id} value={part.part_id}>
                    {part.name} ({part.part_number}) - Available: {part.quantity_on_hand}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Selected Part Info */}
            {newPart.part_id > 0 && (
              <div className="md:col-span-3 bg-gray-50 p-3 rounded-md mb-2">
                {(() => {
                  const selectedPart = parts.find(p => p.part_id === newPart.part_id);
                  if (!selectedPart) return null;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Part</p>
                        <p className="text-sm font-medium">{selectedPart.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Available</p>
                        <p className="text-sm font-medium">{selectedPart.quantity_on_hand}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="text-sm font-medium">${selectedPart.unit_cost.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                value={newPart.quantity}
                onChange={(e) => setNewPart({
                  ...newPart,
                  quantity: parseInt(e.target.value) || 0
                })}
                min="1"
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Unit Cost */}
            <div>
              <label htmlFor="unit_cost" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost (if different)
              </label>
              <input
                type="number"
                id="unit_cost"
                value={newPart.unit_cost || ''}
                onChange={(e) => setNewPart({
                  ...newPart,
                  unit_cost: parseFloat(e.target.value) || 0
                })}
                step="0.01"
                className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Add Button */}
            <div className="flex items-end">
              <button
                onClick={handleAddPart}
                disabled={saving || newPart.part_id === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-blue-300"
              >
                {saving ? 'Adding...' : 'Add Part'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Parts List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Parts on this Work Order</h2>
        </div>
        
        {workOrderParts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No parts added to this work order yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Part Details
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrderParts.map((workOrderPart) => {
                  const inventoryPart = parts.find(p => p.part_id === workOrderPart.part_id);
                  const isLowStock = inventoryPart && workOrderPart.quantity > inventoryPart.quantity_on_hand;
                  
                  return (
                    <tr key={workOrderPart.id} className={isLowStock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 mr-3 text-blue-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {workOrderPart.part?.name || `Part #${workOrderPart.part_id}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {workOrderPart.part?.part_number || 'Unknown part number'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            value={workOrderPart.quantity}
                            onChange={(e) => handleUpdateQuantity(
                              workOrderPart.id || 0,
                              parseInt(e.target.value) || 0
                            )}
                            min="1"
                            className="w-20 rounded-md border-gray-300 shadow-sm px-2 py-1 border text-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          
                          {isLowStock && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Insufficient Stock 
                              ({inventoryPart?.quantity_on_hand || 0} available)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${workOrderPart.unit_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(workOrderPart.quantity * workOrderPart.unit_cost).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRemovePart(workOrderPart.id || 0)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {/* Total Row */}
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${calculateTotalCost()}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => navigate(`/work-orders/${workOrderId}`)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Work Order
        </button>
        
        <button
          onClick={handleCompleteWorkOrder}
          disabled={saving || hasInsufficientInventory() || workOrderParts.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:bg-green-300 flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Complete Work Order & Use Parts'}
        </button>
      </div>
    </div>
  );
};

export default WorkOrderParts;
