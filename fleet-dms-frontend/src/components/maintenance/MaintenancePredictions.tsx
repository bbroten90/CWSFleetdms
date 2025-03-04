import React, { useState, useEffect } from 'react';
import { Calendar, Truck, Clock, AlertTriangle } from 'lucide-react';
import apiService from '../../services/api';

interface MaintenancePrediction {
  vehicle_id: number;
  vehicle_name: string;
  maintenance_id: number;
  maintenance_name: string;
  due_type: 'mileage' | 'time' | null;
  current_value: number | string | null;
  due_value: number | string | null;
  percent_remaining: number | null;
  estimated_due_date: string | null;
  days_until_due: number | null;
}

const MaintenancePredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(30);
  
  useEffect(() => {
    fetchPredictions();
  }, [daysAhead]);
  
  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await apiService.maintenance.getPredictions(daysAhead);
      setPredictions(data);
    } catch (error) {
      console.error('Error fetching maintenance predictions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Predicted Maintenance</h2>
        <div className="flex items-center">
          <label htmlFor="days-ahead" className="text-sm mr-2">
            Days ahead:
          </label>
          <select
            id="days-ahead"
            value={daysAhead}
            onChange={(e) => setDaysAhead(parseInt(e.target.value))}
            className="rounded border-gray-300 text-sm"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : predictions.length > 0 ? (
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Truck className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="font-medium">{prediction.vehicle_name}</p>
                    <p className="text-sm text-gray-500">
                      {prediction.maintenance_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    prediction.days_until_due !== null && prediction.days_until_due <= 7 ? 'text-red-600' :
                    prediction.days_until_due !== null && prediction.days_until_due <= 14 ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {prediction.days_until_due === 0 ? 'Due Today' :
                     prediction.days_until_due !== null && prediction.days_until_due < 0 ? 
                       `Overdue by ${Math.abs(prediction.days_until_due)} days` :
                     prediction.days_until_due !== null ? 
                       `Due in ${prediction.days_until_due} days` : 
                       'Due date unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {prediction.estimated_due_date || 'No date available'}
                  </p>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div
                    className={`h-2.5 rounded-full ${
                      prediction.percent_remaining !== null && prediction.percent_remaining <= 20 ? 'bg-red-600' :
                      prediction.percent_remaining !== null && prediction.percent_remaining <= 50 ? 'bg-orange-500' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${100 - (prediction.percent_remaining || 0)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {prediction.due_type === 'mileage' && prediction.current_value !== null ? 
                      `${typeof prediction.current_value === 'number' ? prediction.current_value.toLocaleString() : prediction.current_value} miles` :
                      prediction.due_type === 'time' ? 'Current' : 'Current'}
                  </span>
                  <span>
                    {prediction.due_type === 'mileage' && prediction.due_value !== null ? 
                      `${typeof prediction.due_value === 'number' ? prediction.due_value.toLocaleString() : prediction.due_value} miles` :
                      prediction.due_type === 'time' ? 'Due Date' : 'Due'}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 flex justify-end">
                <button
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => {/* Add function to create work order */}}
                >
                  Create Work Order
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">
          No maintenance due in the next {daysAhead} days.
        </p>
      )}
    </div>
  );
};

export default MaintenancePredictions;
