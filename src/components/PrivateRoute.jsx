import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, isFreePlan } = useAuth();
  const location = useLocation();

  // Rutas permitidas para plan FREE
  const freePlanAllowedRoutes = ['/home', '/'];
  const currentPath = location.pathname;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Si es plan FREE, solo permitir acceso a Home
  if (isFreePlan && !freePlanAllowedRoutes.includes(currentPath)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PrivateRoute;
