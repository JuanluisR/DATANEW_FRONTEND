import { useState, useEffect } from 'react';
import cultivoService from '../services/cultivoService';
import stationService from '../services/stationService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useZodForm, InputField, SelectField, TextAreaField, CheckboxField, FormButtons, z } from '../components/FormFields';
import {
  Plus, Edit2, Trash2, X, Droplets, Calendar, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, Activity, Sprout, Sun, CloudRain, MapPin, ChevronRight
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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

const TIPOS_CULTIVO = [
  { key: 'papa', label: 'Papa', icon: '🥔', duracion: '120 días' },
  { key: 'aguacate', label: 'Aguacate', icon: '🥑', duracion: '365 días' },
  { key: 'arroz', label: 'Arroz', icon: '🌾', duracion: '150 días' },
  { key: 'flores', label: 'Flores', icon: '🌸', duracion: '110 días' },
  { key: 'mariguana', label: 'Cannabis', icon: '🌿', duracion: '105 días' },
];

const TIPOS_SUELO = [
  { key: 'arenoso', label: 'Arenoso', cc: 80, pm: 30 },
  { key: 'franco', label: 'Franco', cc: 150, pm: 70 },
  { key: 'arcilloso', label: 'Arcilloso', cc: 200, pm: 100 },
];

const getEstresConfig = (nivel) => {
  switch (nivel) {
    case 'Sin estrés':      return { text: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'from-emerald-400 to-emerald-500', dot: 'bg-emerald-500' };
    case 'Estrés leve':     return { text: 'text-amber-700',   bg: 'bg-amber-50',   bar: 'from-amber-400 to-amber-500',   dot: 'bg-amber-500' };
    case 'Estrés moderado': return { text: 'text-orange-700',  bg: 'bg-orange-50',  bar: 'from-orange-400 to-orange-500', dot: 'bg-orange-500' };
    case 'Estrés severo':   return { text: 'text-red-700',     bg: 'bg-red-50',     bar: 'from-red-400 to-red-500',       dot: 'bg-red-500' };
    default:                return { text: 'text-slate-600',   bg: 'bg-slate-50',   bar: 'from-slate-400 to-slate-500',   dot: 'bg-slate-400' };
  }
};

const StatCard = ({ icon: Icon, label, value, unit, colorClass, bgClass }) => (
  <div className={`${bgClass} rounded-2xl p-4 flex flex-col gap-2`}>
    <div className={`flex items-center gap-1.5 ${colorClass}`}>
      <Icon size={16} strokeWidth={2.5} />
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <p className="text-2xl font-bold text-slate-800 leading-none">
      {value}<span className="text-sm font-medium text-slate-500 ml-1">{unit}</span>
    </p>
  </div>
);

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
    nombreCultivo: '', tipoCultivo: 'papa', idEstacion: '', nombreEstacion: '',
    fechaSiembra: '', fechaCosechaEstimada: '', areaHectareas: '', tipoSuelo: 'franco',
    capacidadCampo: 150, puntoMarchitez: 70, profundidadRaices: 0.4,
    isActive: true, notas: '', username: user?.username || ''
  };

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useZodForm(defaultValues, cultivoSchema);

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (selectedCultivo) {
      fetchBalanceActual(selectedCultivo.id);
      const hoy = new Date();
      const hace7dias = new Date();
      hace7dias.setDate(hoy.getDate() - 7);
      const ini = hace7dias.toISOString().split('T')[0];
      const fin = hoy.toISOString().split('T')[0];
      setFechaInicio(ini);
      setFechaFin(fin);
      fetchBalanceHistorico(selectedCultivo.id, ini, fin);
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
      if (cultivosRes.data.length > 0 && !selectedCultivo) setSelectedCultivo(cultivosRes.data[0]);
    } catch {
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
    } catch {
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
    } catch {
      toast.error('Error al cargar el histórico');
    } finally {
      setLoadingBalance(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const cultivoData = {
        ...data, username: user?.username,
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
    } catch {
      toast.error('Error al guardar el cultivo');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm('¿Estás seguro de eliminar este cultivo?');
    if (confirmed) {
      try {
        await cultivoService.delete(id);
        if (selectedCultivo?.id === id) setSelectedCultivo(null);
        fetchData();
        toast.success('Cultivo eliminado correctamente');
      } catch {
        toast.error('Error al eliminar el cultivo');
      }
    }
  };

  const openModal = (cultivo = null) => {
    setEditingCultivo(cultivo);
    if (cultivo) {
      reset({
        nombreCultivo: cultivo.nombreCultivo || '', tipoCultivo: cultivo.tipoCultivo || 'papa',
        idEstacion: cultivo.idEstacion || '', nombreEstacion: cultivo.nombreEstacion || '',
        fechaSiembra: cultivo.fechaSiembra || '', fechaCosechaEstimada: cultivo.fechaCosechaEstimada || '',
        areaHectareas: cultivo.areaHectareas || '', tipoSuelo: cultivo.tipoSuelo || 'franco',
        capacidadCampo: cultivo.capacidadCampo || 150, puntoMarchitez: cultivo.puntoMarchitez || 70,
        profundidadRaices: cultivo.profundidadRaices || 0.4, isActive: cultivo.isActive ?? true,
        notas: cultivo.notas || '', username: cultivo.username || user?.username || ''
      });
    } else {
      reset(defaultValues);
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingCultivo(null); };

  const handleStationChange = (e) => {
    const station = stations.find(s => s.id_estacion === e.target.value);
    setValue('idEstacion', e.target.value);
    setValue('nombreEstacion', station?.nombre_estacion || '');
  };

  const handleTipoSueloChange = (e) => {
    const suelo = TIPOS_SUELO.find(s => s.key === e.target.value);
    setValue('tipoSuelo', e.target.value);
    if (suelo) { setValue('capacidadCampo', suelo.cc); setValue('puntoMarchitez', suelo.pm); }
  };

  const datosValidos = balanceHistorico.filter(b => !b.error);

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    if (Array.isArray(fecha)) {
      const [y, m, d] = fecha;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return String(fecha);
  };

  const chartData = {
    labels: datosValidos.map(b => formatFecha(b.fecha)),
    datasets: [
      { label: 'Precipitación (mm)', data: datosValidos.map(b => b.precipitacion || 0), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#3b82f6' },
      { label: 'ETc (mm)',           data: datosValidos.map(b => b.etc || 0),            borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.08)',   fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#f43f5e' },
      { label: 'Balance (mm)',       data: datosValidos.map(b => b.balanceDiario || 0),  borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)',  fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#10b981' },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 8, font: { size: 12 }, color: '#64748b' } },
      title: { display: false },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.85)', titleColor: '#f8fafc', bodyColor: '#cbd5e1', cornerRadius: 12, padding: 12 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-lg animate-pulse">
            <Droplets className="text-white" size={28} />
          </div>
          <p className="text-slate-500 text-sm font-medium">Cargando balance hídrico…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
              <Droplets className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Balance Hídrico</h1>
              <p className="text-sm text-slate-500 mt-0.5">Gestión de riego basada en datos meteorológicos</p>
            </div>
          </div>
          {cultivos.length > 0 && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-95 transition-all duration-150 shadow-sm shadow-primary-200"
            >
              <Plus size={18} strokeWidth={2.5} />
              Nuevo Cultivo
            </button>
          )}
        </div>

        {/* ── Empty State ── */}
        {cultivos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-100 to-primary-100 flex items-center justify-center mb-6 shadow-inner">
              <Sprout size={44} className="text-emerald-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Sin cultivos registrados</h3>
            <p className="text-slate-500 text-sm text-center max-w-xs mb-8 leading-relaxed">
              Registra tu primer cultivo para comenzar a monitorear el balance hídrico y optimizar el riego.
            </p>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:scale-95 transition-all duration-150 shadow-md shadow-primary-200"
            >
              <Plus size={18} strokeWidth={2.5} />
              Crear primer cultivo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Lista de Cultivos ── */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Mis Cultivos</h2>
                </div>
                <div className="divide-y divide-slate-50 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {cultivos.map((cultivo) => {
                    const tipo = TIPOS_CULTIVO.find(t => t.key === cultivo.tipoCultivo);
                    const isSelected = selectedCultivo?.id === cultivo.id;
                    return (
                      <div
                        key={cultivo.id}
                        onClick={() => setSelectedCultivo(cultivo)}
                        className={`px-5 py-4 cursor-pointer transition-all duration-150 group relative ${
                          isSelected
                            ? 'bg-primary-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full" />
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${isSelected ? 'bg-primary-100' : 'bg-slate-100 group-hover:bg-slate-200'} transition-colors`}>
                              {tipo?.icon}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm truncate ${isSelected ? 'text-primary-900' : 'text-slate-800'}`}>
                                {cultivo.nombreCultivo}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">{tipo?.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); openModal(cultivo); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(cultivo.id); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                            {isSelected && <ChevronRight size={16} className="text-primary-400 ml-1" />}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><MapPin size={11} />{cultivo.nombreEstacion || '—'}</span>
                            <span className="flex items-center gap-1"><Calendar size={11} />{cultivo.fechaSiembra}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            cultivo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {cultivo.isActive ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                            {cultivo.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Panel Principal ── */}
            <div className="lg:col-span-2 space-y-5">
              {selectedCultivo && (
                <>
                  {/* Balance Actual */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-primary-600 to-primary-500">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                          <Droplets className="text-white" size={20} />
                        </div>
                        <div>
                          <h2 className="text-white font-semibold text-base leading-tight">Balance Hídrico · Hoy</h2>
                          <p className="text-primary-200 text-xs mt-0.5">{selectedCultivo.nombreCultivo}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {loadingBalance ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-primary-500" />
                          <p className="text-slate-400 text-sm">Calculando balance…</p>
                        </div>
                      ) : balanceActual?.error ? (
                        <div className="flex flex-col items-center py-10 gap-3 text-slate-500">
                          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                            <AlertCircle size={28} className="text-red-400" />
                          </div>
                          <p className="text-sm text-center">{balanceActual.error}</p>
                        </div>
                      ) : balanceActual ? (
                        <>
                          {/* Métricas del cultivo */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                            <StatCard icon={Calendar}  label="Días"   value={balanceActual.diasDesdeSiembra} unit=""     colorClass="text-primary-600" bgClass="bg-primary-50" />
                            <StatCard icon={Sprout}    label="Etapa"  value={balanceActual.etapaActual}      unit=""     colorClass="text-emerald-600" bgClass="bg-emerald-50" />
                            <StatCard icon={Activity}  label="Kc"     value={balanceActual.kc}               unit=""     colorClass="text-violet-600"  bgClass="bg-violet-50" />
                            <StatCard icon={Sun}       label="ET₀"    value={balanceActual.et0}              unit="mm"   colorClass="text-amber-600"   bgClass="bg-amber-50" />
                          </div>

                          {/* Balance del día */}
                          <div className="grid grid-cols-3 gap-3 mb-5">
                            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                              <div className="flex items-center gap-1.5 text-blue-600 mb-2">
                                <CloudRain size={16} />
                                <span className="text-xs font-semibold">Precipitación</span>
                              </div>
                              <p className="text-3xl font-bold text-blue-900">{balanceActual.precipitacion}<span className="text-sm font-normal text-blue-400 ml-1">mm</span></p>
                            </div>
                            <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                              <div className="flex items-center gap-1.5 text-rose-600 mb-2">
                                <TrendingUp size={16} />
                                <span className="text-xs font-semibold">ETc Consumo</span>
                              </div>
                              <p className="text-3xl font-bold text-rose-900">{balanceActual.etc}<span className="text-sm font-normal text-rose-400 ml-1">mm</span></p>
                            </div>
                            <div className={`rounded-2xl border p-4 ${balanceActual.balanceDiario >= 0 ? 'border-emerald-100 bg-emerald-50/50' : 'border-orange-100 bg-orange-50/50'}`}>
                              <div className={`flex items-center gap-1.5 mb-2 ${balanceActual.balanceDiario >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                {balanceActual.balanceDiario >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span className="text-xs font-semibold">Balance</span>
                              </div>
                              <p className={`text-3xl font-bold ${balanceActual.balanceDiario >= 0 ? 'text-emerald-900' : 'text-orange-900'}`}>
                                {balanceActual.balanceDiario}<span className="text-sm font-normal ml-1 opacity-50">mm</span>
                              </p>
                            </div>
                          </div>

                          {/* Agua disponible + Recomendación */}
                          <div className="bg-slate-50 rounded-2xl p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Agua disponible</p>
                                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getEstresConfig(balanceActual.nivelEstres).bg} ${getEstresConfig(balanceActual.nivelEstres).text}`}>
                                    {balanceActual.nivelEstres}
                                  </span>
                                </div>
                                <p className="text-3xl font-bold text-slate-900 mb-3">{balanceActual.porcentajeAgua}<span className="text-lg text-slate-400">%</span></p>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className={`h-2.5 rounded-full bg-gradient-to-r transition-all duration-700 ${getEstresConfig(balanceActual.nivelEstres).bar}`}
                                    style={{ width: `${Math.min(Math.max(balanceActual.porcentajeAgua, 0), 100)}%` }}
                                  />
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recomendación de riego</p>
                                <p className="text-sm font-semibold text-slate-800 mb-3 leading-snug">{balanceActual.recomendacion}</p>
                                {balanceActual.riegoNecesario_mm > 0 && (
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-500">Lámina de riego</span>
                                      <span className="font-bold text-slate-700">{balanceActual.riegoNecesario_mm} mm</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                      <span className="text-slate-500">Volumen total</span>
                                      <span className="font-bold text-slate-700">{balanceActual.volumenRiego_m3} m³</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-slate-400 py-10 text-sm">No hay datos disponibles</p>
                      )}
                    </div>
                  </div>

                  {/* Histórico */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">Evolución histórica</h2>
                    <div className="flex flex-wrap gap-3 mb-5">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Desde</label>
                        <input
                          type="date" value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-slate-50 text-slate-700"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-500">Hasta</label>
                        <input
                          type="date" value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-slate-50 text-slate-700"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => selectedCultivo && fechaInicio && fechaFin && fetchBalanceHistorico(selectedCultivo.id, fechaInicio, fechaFin)}
                          className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-95 transition-all duration-150"
                        >
                          Consultar
                        </button>
                      </div>
                    </div>

                    {datosValidos.length > 0 ? (
                      <div className="mt-2">
                        <Line data={chartData} options={chartOptions} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
                        <TrendingUp size={32} strokeWidth={1.5} />
                        <p className="text-sm">
                          {balanceHistorico.length > 0
                            ? 'Sin datos meteorológicos en el rango seleccionado'
                            : 'Selecciona un rango de fechas para ver la evolución'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Modal Crear / Editar ── */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Sprout size={18} className="text-primary-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editingCultivo ? 'Editar Cultivo' : 'Nuevo Cultivo'}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto flex-1 px-6 py-5" style={{ scrollbarWidth: 'none' }}>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Nombre del Cultivo" name="nombreCultivo" register={register} error={errors.nombreCultivo} placeholder="Ej: Papa - Lote 1" required />
                    <SelectField label="Tipo de Cultivo" name="tipoCultivo" register={register} error={errors.tipoCultivo} options={TIPOS_CULTIVO.map(t => ({ value: t.key, label: `${t.icon} ${t.label} (${t.duracion})` }))} required />
                    <SelectField label="Estación Meteorológica" name="idEstacion" register={register} error={errors.idEstacion} options={stations.map(s => ({ value: s.id_estacion, label: s.nombre_estacion }))} placeholder="Seleccionar estación" required onChange={handleStationChange} />
                    <InputField label="Fecha de Siembra" name="fechaSiembra" register={register} error={errors.fechaSiembra} type="date" required />
                    <InputField label="Fecha Cosecha Estimada" name="fechaCosechaEstimada" register={register} error={errors.fechaCosechaEstimada} type="date" />
                    <InputField label="Área (hectáreas)" name="areaHectareas" register={register} error={errors.areaHectareas} type="number" step="0.01" placeholder="Ej: 2.5" required />
                    <SelectField label="Tipo de Suelo" name="tipoSuelo" register={register} error={errors.tipoSuelo} options={TIPOS_SUELO.map(s => ({ value: s.key, label: s.label }))} required onChange={handleTipoSueloChange} />
                    <InputField label="Capacidad de Campo (mm)" name="capacidadCampo" register={register} error={errors.capacidadCampo} type="number" step="0.1" />
                    <InputField label="Punto de Marchitez (mm)" name="puntoMarchitez" register={register} error={errors.puntoMarchitez} type="number" step="0.1" />
                    <InputField label="Profundidad de Raíces (m)" name="profundidadRaices" register={register} error={errors.profundidadRaices} type="number" step="0.1" />
                    <div className="sm:col-span-2">
                      <TextAreaField label="Notas" name="notas" register={register} error={errors.notas} placeholder="Observaciones, variedades, sistemas de riego…" rows={3} />
                    </div>
                    <div className="sm:col-span-2">
                      <CheckboxField label="Cultivo activo" name="isActive" register={register} />
                    </div>
                  </div>
                  <div className="mt-6">
                    <FormButtons submitLabel={editingCultivo ? 'Guardar cambios' : 'Crear Cultivo'} submitLoading={isSubmitting} onCancel={closeModal} />
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceHidrico;
