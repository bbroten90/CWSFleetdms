// src/components/reports/PartUsageReports.tsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Filter,
  RefreshCcw
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import apiService from '../../services/api';

// Interfaces
interface DateRange {
  startDate: string;
  endDate: string;
}

interface PartsUsageData {
  date: string;
  usage: number;
  workOrderCount: number;
  parts: PartUsageDetail[];
}

interface PartUsageDetail {
  part_id: number;
  part_number: string;
  name: string;
  quantity: number;
  cost: number;
}

interface TopUsedPart {
  part_id: number;
  part_number: string;
  name: string;
  total_quantity: number;
  total_cost: number;
  usage_count: number;
  category?: string;
}

interface CategoryUsage {
  category: string;
  quantity: number;
  cost: number;
}

interface InventoryMovement {
  date: string;
  additions: number;
  removals: number;
  adjustments: number;
  balance: number;
}

const PartUsageReports: React.FC = () => {
  // State for date range
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: getLastMonthStartDate(),
    endDate: getTodayDate()
  });
  
  // State for reports data
  const [usageByDate, setUsageByDate] = useState<PartsUsageData[]>([]);
  const [topUsedParts, setTopUsedParts] = useState<TopUsedPart[]>([]);
  const [categoryUsage, setCategoryUsage] = useState<CategoryUsage[]>([]);
  const [inventoryMovement, setInventoryMovement] = useState<InventoryMovement[]>([]);
  
  // State for loading and error
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('usage-timeline');
  
  // Fetch data initially and when date range changes
  useEffect(() => {
    fetchData();
  }, [dateRange]);
  
  // Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  // Helper function to get the start date of last month in YYYY-MM-DD format
  function getLastMonthStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  }
  
  // Fetch all report data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch usage by date
      await fetchUsageByDate();
      
      // Fetch top used parts
      await fetchTopUsedParts();
      
      // Process category usage from top parts
      processCategoryUsage();
      
      // Fetch inventory movement
      await fetchInventoryMovement();
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch usage by date
  const fetchUsageByDate = async () => {
    try {
      const response = await apiService.reports.getPartUsageByDate({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      setUsageByDate(response.data || []);
    } catch (err) {
      console.error('Error fetching usage by date:', err);
      throw err;
    }
  };
  
  // Fetch top used parts
  const fetchTopUsedParts = async () => {
    try {
      const response = await apiService.reports.getTopUsedParts({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        limit: 10
      });
      
      setTopUsedParts(response.data || []);
    } catch (err) {
      console.error('Error fetching top used parts:', err);
      throw err;
    }
  };
  
  // Process category usage from top parts
  const processCategoryUsage = () => {
    // This would normally come from the API, but we can also process it from the top parts data
    // Simulating the processing here
    const categories: { [key: string]: CategoryUsage } = {};
    
    topUsedParts.forEach(part => {
      // Assuming parts have a category property
      const category = part.category || 'Uncategorized';
      
      if (!categories[category]) {
        categories[category] = {
          category,
          quantity: 0,
          cost: 0
        };
      }
      
      categories[category].quantity += part.total_quantity;
      categories[category].cost += part.total_cost;
    });
    
    setCategoryUsage(Object.values(categories));
  };
  
  // Fetch inventory movement
  const fetchInventoryMovement = async () => {
    try {
      const response = await apiService.reports.getInventoryMovement({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      setInventoryMovement(response.data || []);
    } catch (err) {
      console.error('Error fetching inventory movement:', err);
      throw err;
    }
  };
  
  // Export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    // Get headers from first item
    const headers = Object.keys(data[0]);
    
    // Convert data to CSV
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        
        // Handle special types (like dates, numbers with commas)
        if (value === null || value === undefined) {
          return '';
        } else if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      });
      
      csvRows.push(values.join(','));
    }
    
    // Create CSV content
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temp link element
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Click the link to trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Calculate total usage
  const calculateTotalUsage = (): number => {
    return usageByDate.reduce((sum, item) => sum + item.usage, 0);
  };
  
  // Calculate total cost
  const calculateTotalCost = (): number => {
    return topUsedParts.reduce((sum, item) => sum + item.total_cost, 0);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Parts Usage Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({
                ...dateRange,
                startDate: e.target.value
              })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({
                ...dateRange,
                endDate: e.target.value
              })}
              className="w-full rounded-md border-gray-300 shadow-sm px-4 py-2 border focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Parts Used
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {loading ? '...' : calculateTotalUsage()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Cost
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {loading ? '...' : formatCurrency(calculateTotalCost())}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
              <BarChart2 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Work Orders
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {loading ? '...' : usageByDate.reduce((sum, item) => sum + item.workOrderCount, 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Date Range
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {usageByDate.length} days
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs for different reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="usage-timeline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Usage Timeline
          </TabsTrigger>
          <TabsTrigger value="top-parts">
            <BarChart2 className="h-4 w-4 mr-2" />
            Top Used Parts
          </TabsTrigger>
          <TabsTrigger value="category-breakdown">
            <Package className="h-4 w-4 mr-2" />
            Category Breakdown
          </TabsTrigger>
          <TabsTrigger value="inventory-movement">
            <TrendingUp className="h-4 w-4 mr-2" />
            Inventory Movement
          </TabsTrigger>
        </TabsList>
        
        {/* Usage Timeline Tab */}
        <TabsContent value="usage-timeline" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Parts Usage Over Time</h2>
              <button
                onClick={() => exportToCSV(usageByDate, 'parts-usage-by-date.csv')}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : usageByDate.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No usage data available for the selected date range.
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={usageByDate}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="usage"
                      name="Parts Used"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="workOrderCount"
                      name="Work Orders"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Top Parts Tab */}
        <TabsContent value="top-parts" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Top Used Parts</h2>
              <button
                onClick={() => exportToCSV(topUsedParts, 'top-used-parts.csv')}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : topUsedParts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No usage data available for the selected date range.
              </div>
            ) : (
              <>
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topUsedParts}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total_quantity" name="Quantity Used" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
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
                          Quantity Used
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topUsedParts.map((part, index) => (
                        <tr key={part.part_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {part.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {part.part_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {part.total_quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(part.total_cost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {part.usage_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>
        
        {/* Category Breakdown Tab */}
        <TabsContent value="category-breakdown" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Category Breakdown</h2>
              <button
                onClick={() => exportToCSV(categoryUsage, 'category-usage.csv')}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : categoryUsage.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No category data available for the selected date range.
              </div>
            ) : (
              <>
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryUsage}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="quantity" name="Quantity Used" fill="#8884d8" />
                      <Bar dataKey="cost" name="Cost" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity Used
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryUsage.map((category, index) => (
                        <tr key={category.category} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {category.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {category.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(category.cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>
        
        {/* Inventory Movement Tab */}
        <TabsContent value="inventory-movement" className="mt-4">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Inventory Movement</h2>
              <button
                onClick={() => exportToCSV(inventoryMovement, 'inventory-movement.csv')}
                className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : inventoryMovement.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No inventory movement data available for the selected date range.
              </div>
            ) : (
              <>
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={inventoryMovement}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="additions" name="Additions" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="removals" name="Removals" stroke="#ff7300" />
                      <Line type="monotone" dataKey="adjustments" name="Adjustments" stroke="#8884d8" />
                      <Line type="monotone" dataKey="balance" name="Balance" stroke="#413ea0" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Additions
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Removals
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adjustments
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventoryMovement.map((movement, index) => (
                        <tr key={movement.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {movement.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            +{movement.additions}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            -{movement.removals}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                            {movement.adjustments > 0 ? `+${movement.adjustments}` : movement.adjustments}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {movement.balance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartUsageReports;
