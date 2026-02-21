// Balance Hídrico Component
import { useState, useEffect } from 'react';
import cultivoService from '../services/cultivoService';
import stationService from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useZodForm, InputField, SelectField, TextAreaField, CheckboxField, FormButtons, z } from '../components/FormFields';
import {
  Plus, Edit2, Trash2, X, Droplets, Calendar, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Activity, Sprout, Sun, CloudRain, MapPin
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const cultivoSchema = z.object({
  nombreCultivo: z.string().min(1, 'El nombre del cultivo es requerido'),
  tipoCultivo: z.string().min(1, 'El tipo de cultivo es requerido'),
  idEstacion: z.string().min(1, 'La estación es requerida'),
  nombreEstacion: z.string().optional(),
  fechaSiembra: z.string().min(1, 'La fecha de siembra es requerida'),
  fechaCosechaEstimada: z.string().optional(),
  areaHectareas: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'El área debe ser un número mayor a 0'),
  tipoSuelo: z.string().min(1, 'El tipo de suelo es requerido'),
  capacidadCampo: z.number().optional(),
  puntoMarchitez: z.number().optional(),
  profundidadRaices: z.number().optional(),
  isActive: z.boolean().optional(),
  notas: z.string().optional(),
  username: z.string().optional(),
});

// Tipos de cultivo disponibles
const TIPOS_CULTIVO = [
  { key: 'papa', label: 'Papa', icon: '🥔', duracion: '120 días' },
  { key: 'aguacate', label: 'Aguacate', icon: '🥑', duracion: '365 días' },
  { key: 'arroz', label: 'Arroz', icon: '🌾', duracion: '150 días' },
  { key: 'flores', label: 'Flores', icon: '🌸', duracion: '110 días' },
  { key: 'mariguana', label: 'Cannabis', icon: '🌿', duracion: '105 días' },
];

// Tipos de suelo
const TIPOS_SUELO = [
  { key: 'arenoso', label: 'Arenoso', cc: 80, pm: 30 },
  { key: 'franco', label: 'Franco', cc: 150, pm: 70 },
  { key: 'arcilloso', label: 'Arcilloso', cc: 200, pm: 100 },
];

const BalanceHidrico = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [cultivos, setCultivos] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCultivo, setEditingCultivo] = useState(null);
  const [selectedCultivo, setSelectedCultivo] = useState(null);
  const [balanceActual, setBalanceActual] = useState(null);
  const [balanceHistorico, setBalanceHistorico] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const defaultValues = {
    nombreCultivo: '',
    tipoCultivo: 'papa',
    idEstacion: '',
    nombreEstacion: '',
    fechaSiembra: '',
    fechaCosechaEstimada: '',
    areaHectareas: '',
    tipoSuelo: 'franco',
    capacidadCampo: 150,
    puntoMarchitez: 70,
    profundidadRaices: 0.4,
    isActive: true,
    notas: '',
    username: user?.username || ''
  };

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useZodForm(defaultValues, cultivoSchema);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedCultivo) {
      fetchBalanceActual(selectedCultivo.id);
      // Cargar últimos 7 días por defecto
      const hoy = new Date();
      const hace7dias = new Date();
      hace7dias.setDate(hoy.getDate() - 7);
      setFechaInicio(hace7dias.toISOString().split('T')[0]);
      setFechaFin(hoy.toISOString().split('T')[0]);
      fetchBalanceHistorico(selectedCultivo.id, hace7dias.toISOString().split('T')[0], hoy.toISOString().split('T')[0]);
    }
  }, [selectedCultivo]);

  const fetchData = async () => {
    try {
      if (!user?.username) return;
      const [cultivosRes, stationsRes] = await Promise.all([
        cultivoService.getByUsername(user.username),
        stationService.getByUsername(user.username)
      ]);
      setCultivos(cultivosRes.data);
      setStations(stationsRes.data);
      if (cultivosRes.data.length > 0 && !selectedCultivo) {
        setSelectedCultivo(cultivosRes.data[0]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los cultivos');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalanceActual = async (id) => {
    try {
      setLoadingBalance(true);
      const res = await cultivoService.getBalanceHoy(id);
      setBalanceActual(res.data);
    } catch (error) {
      console.error('Error al cargar balance:', error);
      toast.error('Error al cargar el balance hídrico');
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchBalanceHistorico = async (id, inicio, fin) => {
    try {
      setLoadingBalance(true);
      const res = await cultivoService.getBalanceRango(id, inicio, fin);
      setBalanceHistorico(res.data);
    } catch (error) {
      console.error('Error al cargar histórico:', error);
      toast.error('Error al cargar el histórico');
    } finally {
      setLoadingBalance(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const cultivoData = {
        ...data,
        username: user?.username,
        fechaCosechaEstimada: data.fechaCosechaEstimada || null,
        areaHectareas: data.areaHectareas ? parseFloat(data.areaHectareas) : null,
        capacidadCampo: data.capacidadCampo ? parseFloat(data.capacidadCampo) : null,
        puntoMarchitez: data.puntoMarchitez ? parseFloat(data.puntoMarchitez) : null,
        profundidadRaices: data.profundidadRaices ? parseFloat(data.profundidadRaices) : null,
        notas: data.notas || null,
      };

      if (editingCultivo) {
        await cultivoService.update(editingCultivo.id, cultivoData);
        toast.success('Cultivo actualizado correctamente');
      } else {
        await cultivoService.create(cultivoData);
        toast.success('Cultivo creado correctamente');
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Error al guardar cultivo:', error);
      toast.error('Error al guardar el cultivo');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm('¿Estás seguro de eliminar este cultivo?');
    if (confirmed) {
      try {
        await cultivoService.delete(id);
        fetchData();
        if (selectedCultivo?.id === id) {
          setSelectedCultivo(null);
        }
        toast.success('Cultivo eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar:', error);
        toast.error('Error al eliminar el cultivo');
      }
    }
  };

  const openModal = (cultivo = null) => {
    setEditingCultivo(cultivo);
    if (cultivo) {
      reset({
        nombreCultivo: cultivo.nombreCultivo || '',
        tipoCultivo: cultivo.tipoCultivo || 'papa',
        idEstacion: cultivo.idEstacion || '',
        nombreEstacion: cultivo.nombreEstacion || '',
        fechaSiembra: cultivo.fechaSiembra || '',
        fechaCosechaEstimada: cultivo.fechaCosechaEstimada || '',
        areaHectareas: cultivo.areaHectareas || '',
        tipoSuelo: cultivo.tipoSuelo || 'franco',
        capacidadCampo: cultivo.capacidadCampo || 150,
        puntoMarchitez: cultivo.puntoMarchitez || 70,
        profundidadRaices: cultivo.profundidadRaices || 0.4,
        isActive: cultivo.isActive ?? true,
        notas: cultivo.notas || '',
        username: cultivo.username || user?.username || ''
      });
    } else {
      reset(defaultValues);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCultivo(null);
  };

  const handleStationChange = (e) => {
    const station = stations.find(s => s.id_estacion === e.target.value);
    setValue('idEstacion', e.target.value);
    setValue('nombreEstacion', station?.nombre_estacion || '');
  };

  const handleTipoSueloChange = (e) => {
    const suelo = TIPOS_SUELO.find(s => s.key === e.target.value);
    setValue('tipoSuelo', e.target.value);
    if (suelo) {
      setValue('capacidadCampo', suelo.cc);
      setValue('puntoMarchitez', suelo.pm);
    }
  };

  const handleBuscarHistorico = () => {
    if (selectedCultivo && fechaInicio && fechaFin) {
      fetchBalanceHistorico(selectedCultivo.id, fechaInicio, fechaFin);
    }
  };

  // Filtrar entradas válidas (sin error) para el gráfico
  const datosValidos = balanceHistorico.filter(b => !b.error);

  // Formatear fecha: puede venir como string "2024-01-15" o array [2024,1,15]
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    if (Array.isArray(fecha)) {
      const [y, m, d] = fecha;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return String(fecha);
  };

  // Preparar datos para el gráfico
  const chartData = {
    labels: datosValidos.map(b => formatFecha(b.fecha)),
    datasets: [
      {
        label: 'Precipitación (mm)',
        data: datosValidos.map(b => b.precipitacion || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
      },
      {
        label: 'ETc (mm)',
        data: datosValidos.map(b => b.etc || 0),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
      },
      {
        label: 'Balance Diario (mm)',
        data: datosValidos.map(b => b.balanceDiario || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Balance Hídrico - Evolución',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const getEstresColor = (nivel) => {
    switch (nivel) {
      case 'Sin estrés': return 'text-green-600 bg-green-50';
      case 'Estrés leve': return 'text-yellow-600 bg-yellow-50';
      case 'Estrés moderado': return 'text-orange-600 bg-orange-50';
      case 'Estrés severo': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Balance Hídrico</h1>
          <p className="text-gray-600 mt-1">Gestión de riego basada en datos meteorológicos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Nuevo Cultivo
        </button>
      </div>

      {cultivos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Sprout size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No hay cultivos registrados</h3>
          <p className="text-gray-600 mb-4">Crea tu primer cultivo para comenzar a monitorear el balance hídrico</p>
          <button
            onClick={() => openModal()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Crear Cultivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Cultivos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Mis Cultivos</h2>
              </div>
              <div className="divide-y max-h-[calc(100vh-200px)] overflow-y-auto">
                {cultivos.map((cultivo) => {
                  const tipoCultivo = TIPOS_CULTIVO.find(t => t.key === cultivo.tipoCultivo);
                  return (
                    <div
                      key={cultivo.id}
                      onClick={() => setSelectedCultivo(cultivo)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition ${
                        selectedCultivo?.id === cultivo.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{tipoCultivo?.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900">{cultivo.nombreCultivo}</h3>
                            <p className="text-sm text-gray-600">{tipoCultivo?.label}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(cultivo);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(cultivo.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{cultivo.nombreEstacion}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar size={14} />
                        <span>Siembra: {cultivo.fechaSiembra}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          cultivo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cultivo.isActive ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                          {cultivo.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Panel de Balance Hídrico */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCultivo && (
              <>
                {/* Balance Actual */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Droplets className="text-blue-600" />
                    Balance Hídrico Actual - {selectedCultivo.nombreCultivo}
                  </h2>

                  {loadingBalance ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : balanceActual?.error ? (
                    <div className="text-center py-8 text-red-600">
                      <AlertCircle size={48} className="mx-auto mb-2" />
                      <p>{balanceActual.error}</p>
                    </div>
                  ) : balanceActual ? (
                    <>
                      {/* Información del Cultivo */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Calendar size={18} />
                            <span className="text-sm font-medium">Días desde siembra</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-900">{balanceActual.diasDesdeSiembra}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-green-600 mb-1">
                            <Sprout size={18} />
                            <span className="text-sm font-medium">Etapa</span>
                          </div>
                          <p className="text-xl font-bold text-green-900 capitalize">{balanceActual.etapaActual}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-purple-600 mb-1">
                            <Activity size={18} />
                            <span className="text-sm font-medium">Kc</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-900">{balanceActual.kc}</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-600 mb-1">
                            <Sun size={18} />
                            <span className="text-sm font-medium">ET0</span>
                          </div>
                          <p className="text-2xl font-bold text-yellow-900">{balanceActual.et0} mm</p>
                        </div>
                      </div>

                      {/* Balance Hídrico */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="border-2 border-blue-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <CloudRain size={20} />
                            <span className="font-medium">Precipitación</span>
                          </div>
                          <p className="text-3xl font-bold text-blue-900">{balanceActual.precipitacion} mm</p>
                        </div>
                        <div className="border-2 border-red-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-red-600 mb-2">
                            <TrendingUp size={20} />
                            <span className="font-medium">ETc (Consumo)</span>
                          </div>
                          <p className="text-3xl font-bold text-red-900">{balanceActual.etc} mm</p>
                        </div>
                        <div className={`border-2 p-4 rounded-lg ${
                          balanceActual.balanceDiario >= 0 ? 'border-green-200' : 'border-orange-200'
                        }`}>
                          <div className={`flex items-center gap-2 mb-2 ${
                            balanceActual.balanceDiario >= 0 ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            {balanceActual.balanceDiario >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            <span className="font-medium">Balance</span>
                          </div>
                          <p className={`text-3xl font-bold ${
                            balanceActual.balanceDiario >= 0 ? 'text-green-900' : 'text-orange-900'
                          }`}>
                            {balanceActual.balanceDiario} mm
                          </p>
                        </div>
                      </div>

                      {/* Nivel de Estrés y Recomendación */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Agua Disponible</h3>
                            <div className="flex items-end gap-2 mb-2">
                              <p className="text-3xl font-bold text-gray-900">{balanceActual.porcentajeAgua}%</p>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstresColor(balanceActual.nivelEstres)}`}>
                                {balanceActual.nivelEstres}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div
                                className={`h-4 rounded-full transition-all ${
                                  balanceActual.porcentajeAgua >= 70 ? 'bg-green-500' :
                                  balanceActual.porcentajeAgua >= 50 ? 'bg-yellow-500' :
                                  balanceActual.porcentajeAgua >= 30 ? 'bg-orange-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(Math.max(balanceActual.porcentajeAgua, 0), 100)}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Recomendación de Riego</h3>
                            <p className="text-lg font-semibold text-gray-900 mb-2">{balanceActual.recomendacion}</p>
                            {balanceActual.riegoNecesario_mm > 0 && (
                              <div className="space-y-1 text-sm text-gray-600">
                                <p>• Lámina de riego: <span className="font-bold">{balanceActual.riegoNecesario_mm} mm</span></p>
                                <p>• Volumen total: <span className="font-bold">{balanceActual.volumenRiego_m3} m³</span></p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-600 py-8">No hay datos disponibles</p>
                  )}
                </div>

                {/* Histórico */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Histórico de Balance Hídrico</h2>

                  <div className="flex gap-4 mb-4 flex-wrap">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleBuscarHistorico}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Buscar
                      </button>
                    </div>
                  </div>

                  {datosValidos.length > 0 ? (
                    <div className="mt-4">
                      <Line data={chartData} options={chartOptions} />
                    </div>
                  ) : (
                    <p className="text-center text-gray-600 py-8">
                      {balanceHistorico.length > 0
                        ? 'No hay datos meteorológicos para el rango seleccionado'
                        : 'Selecciona un rango de fechas para ver el histórico'}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Crear/Editar Cultivo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`.modal-scroll::-webkit-scrollbar { display: none; }`}</style>
            <div className="modal-scroll">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCultivo ? 'Editar Cultivo' : 'Nuevo Cultivo'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Nombre del Cultivo"
                  name="nombreCultivo"
                  register={register}
                  error={errors.nombreCultivo}
                  placeholder="Ej: Cultivo de Papa - Lote 1"
                  required
                />

                <SelectField
                  label="Tipo de Cultivo"
                  name="tipoCultivo"
                  register={register}
                  error={errors.tipoCultivo}
                  options={TIPOS_CULTIVO.map(t => ({ value: t.key, label: `${t.icon} ${t.label} (${t.duracion})` }))}
                  required
                />

                <SelectField
                  label="Estación Meteorológica"
                  name="idEstacion"
                  register={register}
                  error={errors.idEstacion}
                  options={stations.map(s => ({ value: s.id_estacion, label: s.nombre_estacion }))}
                  placeholder="Seleccionar estación"
                  required
                  onChange={handleStationChange}
                />

                <InputField
                  label="Fecha de Siembra"
                  name="fechaSiembra"
                  register={register}
                  error={errors.fechaSiembra}
                  type="date"
                  required
                />

                <InputField
                  label="Fecha Cosecha Estimada"
                  name="fechaCosechaEstimada"
                  register={register}
                  error={errors.fechaCosechaEstimada}
                  type="date"
                />

                <InputField
                  label="Área (hectáreas)"
                  name="areaHectareas"
                  register={register}
                  error={errors.areaHectareas}
                  type="number"
                  step="0.01"
                  placeholder="Ej: 2.5"
                  required
                />

                <SelectField
                  label="Tipo de Suelo"
                  name="tipoSuelo"
                  register={register}
                  error={errors.tipoSuelo}
                  options={TIPOS_SUELO.map(s => ({ value: s.key, label: s.label }))}
                  required
                  onChange={handleTipoSueloChange}
                />

                <InputField
                  label="Capacidad de Campo (mm)"
                  name="capacidadCampo"
                  register={register}
                  error={errors.capacidadCampo}
                  type="number"
                  step="0.1"
                />

                <InputField
                  label="Punto de Marchitez (mm)"
                  name="puntoMarchitez"
                  register={register}
                  error={errors.puntoMarchitez}
                  type="number"
                  step="0.1"
                />

                <InputField
                  label="Profundidad de Raíces (m)"
                  name="profundidadRaices"
                  register={register}
                  error={errors.profundidadRaices}
                  type="number"
                  step="0.1"
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Notas"
                    name="notas"
                    register={register}
                    error={errors.notas}
                    placeholder="Observaciones, variedades, sistemas de riego, etc."
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <CheckboxField
                    label="Cultivo activo"
                    name="isActive"
                    register={register}
                  />
                </div>
              </div>

              <FormButtons
                submitLabel={editingCultivo ? 'Actualizar' : 'Crear Cultivo'}
                submitLoading={isSubmitting}
                onCancel={closeModal}
              />
            </form>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceHidrico;
