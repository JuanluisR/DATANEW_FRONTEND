import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmDialog';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Users from './pages/Users';
import Stations from './pages/Stations';
import Sensors from './pages/Sensors';
import DataQuery from './pages/DataQuery';
import Alerts from './pages/Alerts';
import Subscriptions from './pages/Subscriptions';
import Forecasts from './pages/Forecasts';
import BalanceHidrico from './pages/BalanceHidrico';
import DataUpload from './pages/DataUpload';

function App() {
  return (
    <Router>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas protegidas */}
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<Home />} />
                <Route path="users" element={<Users />} />
                <Route path="stations" element={<Stations />} />
                <Route path="sensors" element={<Sensors />} />
                <Route path="data-query" element={<DataQuery />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="balance-hidrico" element={<BalanceHidrico />} />
                <Route path="data-upload" element={<DataUpload />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="forecasts" element={<Forecasts />} />
              </Route>

              {/* Redirigir cualquier ruta no encontrada al login */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
