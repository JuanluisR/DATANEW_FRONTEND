import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
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
      // Configurar el token en axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
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
      const response = await axios.post('http://localhost:8080/auth/login', {
        username,
        password
      });

const { token, id, firstName, lastName, active, staff, superuser, imagen, empresa, ...rest } = response.data;

      // Mapear campos al formato esperado por el frontend
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

      // Guardar token y usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);

      // Configurar token en axios para futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Cargar suscripción
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
    // Limpiar todo
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setSubscription(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser) => {
    const newUser = { ...user, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const isFreePlan = subscription?.planType === 'FREE';

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
