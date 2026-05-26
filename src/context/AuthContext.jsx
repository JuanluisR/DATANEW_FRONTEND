import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import subscriptionService from '../services/subscriptionService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la aplicación
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  // Cargar suscripción cuando hay usuario
  useEffect(() => {
    const loadSubscription = async () => {
      if (user?.username) {
        try {
          const response = await subscriptionService.getByUsername(user.username);
          setSubscription(response.data);
        } catch (error) {
          console.error('Error loading subscription:', error);
        }
      }
    };
    loadSubscription();
  }, [user]);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });

      const { token, id, firstName, lastName, active, staff, superuser, imagen, empresa, ...rest } = response.data;

      const userData = {
        ...rest,
        id,
        first_name: firstName,
        last_name: lastName,
        is_active: active,
        is_staff: staff,
        is_superuser: superuser,
        imagen: imagen || '',
        empresa: empresa || ''
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);

      try {
        const subResponse = await subscriptionService.getByUsername(username);
        setSubscription(subResponse.data);
      } catch (e) {
        console.error('Error loading subscription:', e);
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const isSubscriptionExpired = subscription?.endDate
    ? new Date(subscription.endDate) < new Date()
    : false;
  const isFreePlan = subscription?.planType === 'FREE' || isSubscriptionExpired;

  const value = {
    user,
    token,
    subscription,
    isFreePlan,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
    loading
  };
 
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
