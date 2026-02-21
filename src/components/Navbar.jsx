import { Link, useNavigate } from "react-router-dom";
import {
  Cloud,
  Users,
  Radio,
  Database,
  Menu,
  X,
  LogOut,
  BarChart3,
  User,
  Mail,
  Shield,
  ChevronDown,
  Settings,
  Bell,
  Crown,
  CloudSun,
  Droplets,
  Upload,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import axios from "axios";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmEmail: '',
    password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    email: false
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const { user, logout, isFreePlan, subscription } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const toast = useToast();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setChangingPassword(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8080/auth/change-password',
        {
          username: user.username,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Contraseña cambiada exitosamente');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    
    if (emailData.newEmail !== emailData.confirmEmail) {
      toast.error('Los correos no coinciden');
      return;
    }

    if (!emailData.newEmail.includes('@')) {
      toast.error('Ingresa un correo electrónico válido');
      return;
    }

    if (!emailData.password) {
      toast.error('Ingresa tu contraseña para confirmar');
      return;
    }

    setChangingEmail(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8080/auth/change-email',
        {
          username: user.username,
          newEmail: emailData.newEmail,
          password: emailData.password
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Correo cambiado exitosamente');
      
      // Actualizar el usuario en el contexto
      const updatedUser = { ...user, email: emailData.newEmail };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
      
      setShowEmailModal(false);
      setEmailData({ newEmail: '', confirmEmail: '', password: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar el correo');
    } finally {
      setChangingEmail(false);
    }
  };

  const navItems = [
    { name: "Estaciones", path: "/stations", icon: Radio },
    { name: "Carga Datos", path: "/data-upload", icon: Upload },
    { name: "Pronóstico", path: "/forecasts", icon: CloudSun },
    { name: "Sensores", path: "/sensors", icon: Database },
    { name: "Consulta", path: "/data-query", icon: BarChart3 },
    { name: "Alertas", path: "/alerts", icon: Bell },
    { name: "Balance Hídrico", path: "/balance-hidrico", icon: Droplets },
  ];

  // Para plan FREE, solo mostrar Home (no hay items de nav)
  const displayNavItems = isFreePlan ? [] : navItems;

  return (
    <nav className="bg-gradient-to-r from-primary-500 to-primary-600 shadow-md sticky top-0 z-50">
      <div className="w-full px-6 sm:px-19 lg:px-22">
        <div className="flex items-center justify-center h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group mr-4">
            <div className="bg-white p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Cloud className="h-8 w-8 text-primary-600" />
            </div>
            <span className="text-white font-bold text-2xl tracking-wide">
              DataNew Weather
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-0">
            {displayNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-white hover:bg-white/20 transition-all duration-200 group"
              >
                <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-[15px]">{item.name}</span>
              </Link>
            ))}

            {/* User Info & Dropdown */}
            <div
              className="relative ml-auto pl-4 border-l border-white/30"
              ref={dropdownRef}
            >
<button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
              >
                {user?.imagen ? (
                  <img 
                    src={user.imagen} 
                    alt="Perfil" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
<div className="text-right">
                  <p className="text-white font-semibold text-[15px]">
                    {user?.username}
                  </p>
                  <p className="text-primary-100 text-xs">{user?.email}</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isUserDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Dropdown Panel */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[9000] animate-fadeIn">
{/* Header del dropdown */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-4 text-white">
                    <div className="flex items-center space-x-3">
                      {user?.imagen ? (
                        <img 
                          src={user.imagen} 
                          alt="Perfil" 
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                          {user?.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-lg">{user?.username}</p>
                        <p className="text-blue-100 text-sm">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                    {/* Información del usuario */}
                  <div className="p-4 space-y-3">
                    {/* Plan */}
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Crown className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="text-xs text-gray-400">Plan Actual</p>
                        <p className="font-medium">{subscription?.planType || 'FREE'}</p>
                      </div>
                    </div>

                    {/* Nombre completo */}
                    <div className="flex items-center space-x-3 text-gray-700">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Nombre completo</p>
                        <p className="font-medium">
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : "No especificado"}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">
                          Correo electrónico
                        </p>
                        <p className="font-medium text-sm">
                          {user?.email || "No especificado"}
                        </p>
                      </div>
                    </div>

                    {/* Cambiar correo */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setShowEmailModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      ¿Quieres cambiar tu correo?
                    </button>

                    {/* Cambiar contraseña */}
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        setShowPasswordModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      ¿Quieres cambiar tu contraseña?
                    </button>

                    {/* Permisos */}
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Permisos</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {user?.is_superuser && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              Superusuario
                            </span>
                          )}
                          {user?.is_staff && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                              Staff
                            </span>
                          )}
                          {user?.is_active && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Activo
                            </span>
                          )}
                          {!user?.is_superuser && !user?.is_staff && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                              Usuario
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="border-t border-gray-200 p-2">
                    <Link
                      to="/users"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Gestionar Usuarios</span>
                    </Link>
<Link
                      to="/subscriptions"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <Crown className="h-5 w-5" />
                      <span className="font-medium">Planes</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-all w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="font-medium">Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-white p-2 rounded-lg hover:bg-white/20"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4 space-y-2">
            <div className="px-4 py-3 bg-white/10 rounded-lg mb-2">
              <p className="text-white font-semibold">{user?.username}</p>
              <p className="text-primary-100 text-sm">{user?.email}</p>
            </div>
            {displayNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-white/20 transition-all duration-200"
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-white hover:bg-red-500 transition-all duration-200 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Lock className="h-6 w-6 mr-2 text-primary-600" />
                Cambiar Contraseña
              </h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="label">Contraseña Actual</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    className="input-field pr-10"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    className="input-field pr-10"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label className="label">Confirmar Nueva Contraseña</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    className="input-field pr-10"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Correo */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Mail className="h-6 w-6 mr-2 text-primary-600" />
                Cambiar Correo
              </h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="label">Nuevo Correo</label>
                <div className="relative">
                  <input
                    type={showPasswords.email ? "text" : "email"}
                    className="input-field pr-10"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, email: !showPasswords.email })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.email ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Confirmar Nuevo Correo</label>
                <input
                  type="email"
                  className="input-field"
                  value={emailData.confirmEmail}
                  onChange={(e) => setEmailData({ ...emailData, confirmEmail: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Tu Contraseña Actual</label>
                <input
                  type="password"
                  className="input-field"
                  value={emailData.password}
                  onChange={(e) => setEmailData({ ...emailData, password: e.target.value })}
                  required
                  placeholder="Ingresa tu contraseña para confirmar"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={changingEmail}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {changingEmail ? 'Cambiando...' : 'Cambiar Correo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
