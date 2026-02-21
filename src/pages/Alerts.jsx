import { useState, useEffect } from 'react';
import alertService from '../services/alertService';
import stationService from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useZodForm, InputField, SelectField, CheckboxField, FormButtons, z } from '../components/FormFields';
import {
  Plus, Edit2, Trash2, X, Bell, BellOff, Mail,
  Thermometer, Droplets, Wind, Gauge, Sun, CloudRain,
  AlertTriangle, CheckCircle, Clock, Radio
} from 'lucide-react';

const alertSchema = z.object({
  nombreAlerta: z.string().min(1, 'El nombre de la alerta es requerido'),
  idEstacion: z.string().min(1, 'La estación es requerida'),
  nombreEstacion: z.string().optional(),
  variable: z.string().min(1, 'La variable es requerida'),
  operador: z.string().min(1, 'El operador es requerido'),
  valorUmbral: z.string().min(1, 'El valor umbral es requerido'),
  unidad: z.string().optional(),
  notificarEmail: z.boolean().optional(),
  emails: z.string().optional(),
  isActive: z.boolean().optional(),
  username: z.string().optional(),
}).refine((data) => {
  if (data.notificarEmail && data.emails) {
    const emails = data.emails.split(',').map(e => e.trim());
    return emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }
  return true;
}, {
  message: 'Ingresa correos electrónicos válidos',
  path: ['emails'],
});

const CLIMATE_VARIABLES = [
  { key: 'temp', label: 'Temperatura', unit: '°C', icon: Thermometer, color: 'text-red-500' },
  { key: 'humidity', label: 'Humedad', unit: '%', icon: Droplets, color: 'text-blue-500' },
  { key: 'pressure', label: 'Presión', unit: 'hPa', icon: Gauge, color: 'text-purple-500' },
  { key: 'windSpeed', label: 'Velocidad del Viento', unit: 'km/h', icon: Wind, color: 'text-green-500' },
  { key: 'windGust', label: 'Ráfaga de Viento', unit: 'km/h', icon: Wind, color: 'text-teal-500' },
  { key: 'dewpoint', label: 'Punto de Rocío', unit: '°C', icon: Droplets, color: 'text-cyan-500' },
  { key: 'heatIndex', label: 'Índice de Calor', unit: '°C', icon: Thermometer, color: 'text-orange-500' },
  { key: 'windchill', label: 'Sensación Térmica', unit: '°C', icon: Thermometer, color: 'text-indigo-500' },
  { key: 'solarRad', label: 'Radiación Solar', unit: 'W/m²', icon: Sun, color: 'text-yellow-500' },
  { key: 'precip', label: 'Precipitación', unit: 'mm', icon: CloudRain, color: 'text-sky-500' },
  { key: 'eto', label: 'Evapotranspiración (ETO)', unit: 'mm', icon: Droplets, color: 'text-emerald-500' },
];

const OPERATORS = [
  { key: '>', label: 'Mayor que', symbol: '>' },
  { key: '<', label: 'Menor que', symbol: '<' },
  { key: '>=', label: 'Mayor o igual que', symbol: '≥' },
  { key: '<=', label: 'Menor o igual que', symbol: '≤' },
  { key: '==', label: 'Igual a', symbol: '=' },
];

const Alerts = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [alerts, setAlerts] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [newEmail, setNewEmail] = useState('');

  const defaultValues = {
    nombreAlerta: '',
    idEstacion: '',
    nombreEstacion: '',
    variable: 'temp',
    operador: '>',
    valorUmbral: '',
    unidad: '°C',
    notificarEmail: false,
    emails: '',
    isActive: true,
    username: user?.username || ''
  };

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useZodForm(defaultValues, alertSchema);

  const watchVariable = watch('variable');
  const watchOperador = watch('operador');
  const watchValorUmbral = watch('valorUmbral');
  const watchNotificarEmail = watch('notificarEmail');
  const watchEmails = watch('emails');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (user?.username) {
        alertService.getByUsername(user.username).then(res => {
          setAlerts(res.data);
        }).catch(() => {});
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async () => {
    try {
      if (!user?.username) return;
      const [alertsRes, stationsRes] = await Promise.all([
        alertService.getByUsername(user.username),
        stationService.getByUsername(user.username)
      ]);
      setAlerts(alertsRes.data);
      setStations(stationsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const alertData = {
        ...data,
        username: user?.username
      };
      if (editingAlert) {
        await alertService.update(editingAlert.id, alertData);
      } else {
        await alertService.create(alertData);
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error al guardar alerta:', error);
      toast.error('Error al guardar la alerta');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm('¿Estás seguro de eliminar esta alerta?');
    if (confirmed) {
      try {
        await alertService.delete(id);
        fetchData();
        toast.success('Alerta eliminada correctamente');
      } catch (error) {
        console.error('Error al eliminar:', error);
        toast.error('Error al eliminar la alerta');
      }
    }
  };

  const handleToggle = async (id) => {
    try {
      await alertService.toggle(id);
      fetchData();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const openModal = (alert = null) => {
    setEditingAlert(alert);
    setNewEmail('');
    if (alert) {
      reset({
        nombreAlerta: alert.nombreAlerta || '',
        idEstacion: alert.idEstacion || '',
        nombreEstacion: alert.nombreEstacion || '',
        variable: alert.variable || 'temp',
        operador: alert.operador || '>',
        valorUmbral: alert.valorUmbral || '',
        unidad: alert.unidad || '°C',
        notificarEmail: alert.notificarEmail || false,
        emails: alert.emails || '',
        isActive: alert.isActive ?? true,
        username: alert.username || user?.username || ''
      });
    } else {
      reset(defaultValues);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAlert(null);
    setNewEmail('');
  };

  const handleVariableChange = (e) => {
    const variable = e.target.value;
    const varConfig = CLIMATE_VARIABLES.find(v => v.key === variable);
    setValue('variable', variable);
    setValue('unidad', varConfig?.unit || '');
  };

  const handleStationChange = (e) => {
    const idEstacion = e.target.value;
    const station = stations.find(s => s.id_estacion === idEstacion);
    setValue('idEstacion', idEstacion);
    setValue('nombreEstacion', station?.nombre_estacion || '');
  };

  const addEmail = () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    const currentEmails = watchEmails ? watchEmails.split(',').map(e => e.trim()).filter(Boolean) : [];
    if (currentEmails.includes(trimmed)) return;
    currentEmails.push(trimmed);
    setValue('emails', currentEmails.join(','));
    setNewEmail('');
  };

  const removeEmail = (emailToRemove) => {
    const currentEmails = watchEmails.split(',').map(e => e.trim()).filter(e => e && e !== emailToRemove);
    setValue('emails', currentEmails.join(','));
  };

  const getVariableConfig = (varKey) => CLIMATE_VARIABLES.find(v => v.key === varKey) || CLIMATE_VARIABLES[0];
  const getOperatorSymbol = (opKey) => OPERATORS.find(o => o.key === opKey)?.symbol || opKey;

  const isThresholdBreached = (alert) => {
    if (alert.ultimoValorRegistrado === null || alert.ultimoValorRegistrado === undefined) return false;
    const val = alert.ultimoValorRegistrado;
    const umbral = alert.valorUmbral;
    switch (alert.operador) {
      case '>': return val > umbral;
      case '<': return val < umbral;
      case '>=': return val >= umbral;
      case '<=': return val <= umbral;
      case '==': return Math.abs(val - umbral) < 0.01;
      default: return false;
    }
  };

  const variableOptions = CLIMATE_VARIABLES.map(v => ({ value: v.key, label: v.label }));
  const operatorOptions = OPERATORS.map(o => ({ value: o.key, label: `${o.symbol} ${o.label}` }));
  const stationOptions = stations.map(s => ({ value: s.id_estacion, label: `${s.nombre_estacion} (${s.id_estacion})` }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600 mt-1">Configura alertas para tus estaciones meteorológicas</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" /><span>Nueva Alerta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              <p className="text-sm text-gray-500">Total de alertas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{alerts.filter(a => a.isActive).length}</p>
              <p className="text-sm text-gray-500">Alertas activas</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <BellOff className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{alerts.filter(a => !a.isActive).length}</p>
              <p className="text-sm text-gray-500">Alertas inactivas</p>
            </div>
          </div>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
          <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No tienes alertas configuradas</h3>
          <p className="text-gray-500 mb-6">Crea tu primera alerta para monitorear los umbrales de tus estaciones</p>
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="h-5 w-5 inline mr-2" />Crear primera alerta
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => {
            const varConfig = getVariableConfig(alert.variable);
            const IconComponent = varConfig.icon;
            const breached = isThresholdBreached(alert);

            return (
              <div
                key={alert.id}
                className={`rounded-xl shadow-md border-2 overflow-hidden transition-all ${
                  !alert.isActive
                    ? 'bg-white border-gray-200 opacity-75'
                    : breached
                      ? 'bg-red-50 border-red-400 shadow-red-200'
                      : 'bg-white border-green-200 hover:border-green-400'
                }`}
              >
                <div className={`px-4 py-3 ${
                  !alert.isActive
                    ? 'bg-gray-400'
                    : breached
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-green-500 to-blue-500'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-white">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-semibold truncate">{alert.nombreAlerta}</span>
                    </div>
                    <div className="flex space-x-1">
                      <button onClick={() => handleToggle(alert.id)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition">
                        {alert.isActive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      </button>
                      <button onClick={() => openModal(alert)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(alert.id)} className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Radio className="h-4 w-4" />
                    <span className="truncate">{alert.nombreEstacion || alert.idEstacion}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center space-x-2">
                      <IconComponent className={`h-6 w-6 ${varConfig.color}`} />
                      <span className="font-medium text-gray-700">{varConfig.label}</span>
                      <span className="text-2xl font-bold text-gray-900">{getOperatorSymbol(alert.operador)}</span>
                      <span className="text-xl font-bold text-blue-600">{alert.valorUmbral}</span>
                      <span className="text-sm text-gray-500">{alert.unidad}</span>
                    </div>
                  </div>

                  {alert.ultimoValorRegistrado !== null && alert.ultimoValorRegistrado !== undefined && alert.ultimaActivacion && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-pulse">
                      <div className="flex items-center space-x-2 text-red-700">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm font-semibold">Umbral activado</span>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        Último valor: <span className="font-bold text-red-800">{alert.ultimoValorRegistrado} {alert.unidad}</span>
                      </p>
                      <p className="text-xs text-red-400 mt-1">
                        {new Date(alert.ultimaActivacion).toLocaleString('es-ES')}
                      </p>
                    </div>
                  )}

                  {alert.notificarEmail && alert.emails && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                      <Mail className="h-3 w-3" />
                      <span>{alert.emails.split(',').filter(Boolean).length} destinatario(s)</span>
                    </div>
                  )}

                  {alert.vecesActivada > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Activada {alert.vecesActivada} {alert.vecesActivada === 1 ? 'vez' : 'veces'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl z-10">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6" />
                <h2 className="text-xl font-bold">{editingAlert ? 'Editar' : 'Nueva'} Alerta</h2>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-white/20 rounded-lg transition">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              <InputField
                label="Nombre de la Alerta"
                name="nombreAlerta"
                register={register}
                error={errors.nombreAlerta}
                placeholder="Ej: Alerta de temperatura alta"
                required
              />

              <SelectField
                label="Estación"
                name="idEstacion"
                register={register}
                error={errors.idEstacion}
                options={stationOptions}
                placeholder="Seleccionar estación..."
                required
                onChange={handleStationChange}
              />

              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-gray-700">Condición de la Alerta</h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <SelectField
                    label="Variable"
                    name="variable"
                    register={register}
                    error={errors.variable}
                    options={variableOptions}
                    required
                    onChange={handleVariableChange}
                  />
                  <SelectField
                    label="Operador"
                    name="operador"
                    register={register}
                    error={errors.operador}
                    options={operatorOptions}
                    required
                  />
                  <InputField
                    label={`Valor Umbral (${watch('unidad')})`}
                    name="valorUmbral"
                    register={register}
                    error={errors.valorUmbral}
                    type="number"
                    step="any"
                    placeholder="Ej: 30"
                    required
                  />
                </div>

                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Vista previa:</p>
                  <p className="font-medium text-gray-800">
                    Alertar cuando <span className="text-blue-600">{getVariableConfig(watchVariable).label}</span> sea{' '}
                    <span className="text-orange-600">{OPERATORS.find(o => o.key === watchOperador)?.label}</span>{' '}
                    <span className="text-green-600 font-bold">{watchValorUmbral || '?'} {watch('unidad')}</span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-gray-700 flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Notificación por Correo</span>
                </h3>

                <CheckboxField
                  label="Enviar correo al activarse la alerta"
                  name="notificarEmail"
                  register={register}
                />

                {watchNotificarEmail && (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        className="input-field flex-1"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
                        placeholder="correo@ejemplo.com"
                      />
                      <button type="button" onClick={addEmail} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                        Agregar
                      </button>
                    </div>

                    {watchEmails && (
                      <div className="flex flex-wrap gap-2">
                        {watchEmails.split(',').filter(Boolean).map((email) => (
                          <span key={email.trim()} className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            <Mail className="h-3 w-3" />
                            <span>{email.trim()}</span>
                            <button type="button" onClick={() => removeEmail(email.trim())} className="ml-1 hover:text-red-600">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {watchNotificarEmail && !watchEmails && (
                      <p className="text-xs text-amber-600">Agrega al menos un correo para recibir notificaciones</p>
                    )}
                  </div>
                )}
              </div>

              <CheckboxField
                label="Alerta activa"
                name="isActive"
                register={register}
              />

              <FormButtons
                submitLabel={editingAlert ? 'Actualizar Alerta' : 'Crear Alerta'}
                submitLoading={isSubmitting}
                onCancel={closeModal}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;
