import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './components/Login';
import Dashboard from './components/layout/Dashboard';
import VehiclesList from './components/vehicles/VehiclesList';
import VehicleDetail from './components/vehicles/VehicleDetail';
import VehicleForm from './components/vehicles/VehicleForm';
import WorkOrdersList from './components/work-orders/WorkOrdersList';
import WorkOrderDetail from './components/work-orders/WorkOrderDetail';
import WorkOrderForm from './components/work-orders/WorkOrderForm';
import PartsList from './components/parts/PartsList';
import PartForm from './components/parts/PartForm';
import MaintenanceList from './components/maintenance/MaintenanceList';
import MaintenanceForm from './components/maintenance/MaintenanceForm';
import SamsaraIntegration from './components/samsara/SamsaraIntegration';
import NotFound from './components/layout/NotFound';

// Create auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (userData: any) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {}
});

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const auth = useContext(AuthContext);
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  
  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('token');
    if (token) {
      // In a real app, you would validate the token with the server
      setAuthState({
        isAuthenticated: true,
        user: null, // Would be populated with user data from token
        loading: false
      });
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  }, []);
  
  const login = (userData: any) => {
    localStorage.setItem('token', userData.access_token);
    localStorage.setItem('token_type', userData.token_type);
    setAuthState({
      isAuthenticated: true,
      user: userData.user,
      loading: false
    });
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('token_type');
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };
  
  // Show loading spinner while checking authentication
  if (authState.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      login,
      logout
    }}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            authState.isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Vehicles routes */}
            <Route path="vehicles">
              <Route index element={<VehiclesList />} />
              <Route path=":id" element={<VehicleDetail />} />
              <Route path="new" element={<VehicleForm />} />
              <Route path=":id/edit" element={<VehicleForm isEditing />} />
            </Route>
            
            {/* Work Orders routes */}
            <Route path="work-orders">
              <Route index element={<WorkOrdersList />} />
              <Route path=":id" element={<WorkOrderDetail />} />
              <Route path="new" element={<WorkOrderForm />} />
              <Route path=":id/edit" element={<WorkOrderForm isEditing />} />
            </Route>
            
            {/* Parts routes */}
            <Route path="parts">
              <Route index element={<PartsList />} />
              <Route path=":id" element={<PartForm isEditing />} />
              <Route path="new" element={<PartForm />} />
            </Route>
            
            {/* Maintenance routes */}
            <Route path="maintenance">
              <Route index element={<MaintenanceList />} />
              <Route path=":id" element={<MaintenanceForm isEditing />} />
              <Route path="new" element={<MaintenanceForm />} />
            </Route>
            
            {/* Samsara Integration */}
            <Route path="samsara" element={<SamsaraIntegration />} />
          </Route>
          
          {/* Catch all other routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
