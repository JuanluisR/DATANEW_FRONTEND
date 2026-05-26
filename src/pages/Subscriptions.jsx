import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../components/ConfirmDialog';
import subscriptionService from '../services/subscriptionService';
import { useZodForm, InputField, FormButtons, z } from '../components/FormFields';
import {
  Crown,
  Check,
  X,
  Zap,
  Star,
  Sparkles,
  Building2,
  Loader2,
  AlertCircle,
  Radio,
  Bell,
  Database,
  Mail,
  MessageSquare,
  Code,
  Download,
  Activity,
  BarChart3,
  FileText,
  Headphones,
  Palette,
  Calendar,
  Clock,
  Key,
  Copy,
  RefreshCw,
  Shield,
  Lock,
  Upload
} from 'lucide-react';

const companySchema = z.object({
  companyName: z.string().min(1, 'El nombre de la empresa es requerido'),
  companyLogoUrl: z.string().url('Ingresa una URL válida').optional().or(z.literal('')),
});

const Subscriptions = () => {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const logoInputRef = useRef(null);
  const [generatedApiKey, setGeneratedApiKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  const companyDefaultValues = {
    companyName: '',
    companyLogoUrl: ''
  };

  const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting: companySubmitting, errors } } = useZodForm(companyDefaultValues, companySchema);
  const watchCompanyLogo = watch('companyLogoUrl');

  useEffect(() => {
    if (user?.username) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subResponse, plansResponse] = await Promise.all([
        subscriptionService.getByUsername(user.username),
        subscriptionService.getPlans()
      ]);
      setSubscription(subResponse.data);
      setPlans(plansResponse.data);
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Error al cargar los datos de suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType) => {
    if (subscription?.planType === planType) return;

    const confirmed = await confirm(
      `¿Estás seguro de cambiar tu plan a ${planType}? Se actualizarán las fechas de vigencia y los permisos de tu suscripción.`
    );
    if (!confirmed) return;

    try {
      setUpgrading(true);
      setError('');
      const response = await subscriptionService.upgradePlan(user.username, planType);
      // Update state immediately with the response from the server
      setSubscription(response.data);
      setSuccess(`Plan actualizado a ${planType} exitosamente. Fechas y permisos actualizados.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Error upgrading plan:', err);
      setError('Error al actualizar el plan');
    } finally {
      setUpgrading(false);
    }
  };

  const handleUpdateCompany = async (data) => {
    try {
      setError('');
      await subscriptionService.updateCompanyInfo(
        user.username,
        data.companyName,
        data.companyLogoUrl
      );
      setSuccess('Información de empresa actualizada');
      setShowCompanyModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating company info:', err);
      setError('Error al actualizar la información de empresa');
    }
  };

  // Convertir fecha UTC del servidor a hora local del navegador
  const parseLocalDate = (dateString) => {
    if (!dateString) return null;

    // Si ya tiene indicador de timezone (Z o +/-HH:MM), usar directamente
    if (dateString.includes('Z') || dateString.match(/[+-]\d{2}:\d{2}$/)) {
      return new Date(dateString);
    }

    // Si no tiene timezone, asumir que es UTC y convertir a local
    return new Date(dateString + 'Z');
  };

  const getDaysRemaining = () => {
    if (!subscription?.endDate) return null;
    const end = parseLocalDate(subscription.endDate);
    if (!end) return null;
    const now = new Date();
    const diffMs = end - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    const date = parseLocalDate(dateString);
    if (!date) return 'No definida';
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleGenerateApiKey = () => {
    const key = crypto.randomUUID();
    setGeneratedApiKey(key);
    setCopiedKey(false);
  };

  const handleCopyKey = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'FREE': return <Zap className="h-8 w-8" />;
      case 'BASIC': return <Star className="h-8 w-8" />;
      case 'PRO': return <Sparkles className="h-8 w-8" />;
      case 'ULTRA': return <Crown className="h-8 w-8" />;
      default: return <Zap className="h-8 w-8" />;
    }
  };

  const getPlanColors = (planType) => {
    switch (planType) {
      case 'FREE':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          header: 'bg-gray-100',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700',
          badge: 'bg-gray-100 text-gray-700'
        };
      case 'BASIC':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          header: 'bg-gradient-to-r from-blue-500 to-blue-600',
          icon: 'text-white',
          button: 'bg-blue-600 hover:bg-blue-700',
          badge: 'bg-blue-100 text-blue-700'
        };
      case 'PRO':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          header: 'bg-gradient-to-r from-purple-500 to-purple-600',
          icon: 'text-white',
          button: 'bg-purple-600 hover:bg-purple-700',
          badge: 'bg-purple-100 text-purple-700'
        };
      case 'ULTRA':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          header: 'bg-gradient-to-r from-amber-500 to-orange-500',
          icon: 'text-white',
          button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
          badge: 'bg-amber-100 text-amber-700'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          header: 'bg-gray-100',
          icon: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('estacion')) return <Radio className="h-4 w-4" />;
    if (feature.includes('sensor')) return <Database className="h-4 w-4" />;
    if (feature.includes('alerta')) return <Bell className="h-4 w-4" />;
    if (feature.includes('retención')) return <Database className="h-4 w-4" />;
    if (feature.includes('email')) return <Mail className="h-4 w-4" />;
    if (feature.includes('SMS')) return <MessageSquare className="h-4 w-4" />;
    if (feature.includes('API')) return <Code className="h-4 w-4" />;
    if (feature.includes('Exportar')) return <Download className="h-4 w-4" />;
    if (feature.includes('tiempo real')) return <Activity className="h-4 w-4" />;
    if (feature.includes('Análisis')) return <BarChart3 className="h-4 w-4" />;
    if (feature.includes('Reportes')) return <FileText className="h-4 w-4" />;
    if (feature.includes('Soporte')) return <Headphones className="h-4 w-4" />;
    if (feature.includes('Marca')) return <Palette className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Planes y Suscripciones</h1>
        <p className="mt-2 text-gray-600">Elige el plan que mejor se adapte a tus necesidades</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Current Plan Card */}
      {subscription && (
        <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                {getPlanIcon(subscription.planType)}
              </div>
              <div>
                <p className="text-primary-100 text-sm">Tu plan actual</p>
                <h2 className="text-2xl font-bold">{subscription.planType}</h2>
                {subscription.companyName && (
                  <p className="text-primary-100 flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4" />
                    {subscription.companyName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                reset({
                  companyName: subscription.companyName || '',
                  companyLogoUrl: subscription.companyLogoUrl || ''
                });
                setShowCompanyModal(true);
              }}
              className="btn bg-white/20 hover:bg-white/30 text-white"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Configurar Empresa
            </button>

          </div>

          {/* Plan Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {subscription.maxStations === -1 ? '∞' : subscription.maxStations}
              </p>
              <p className="text-primary-100 text-sm">Estaciones</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {subscription.maxSensorsPerStation === -1 ? '∞' : subscription.maxSensorsPerStation}
              </p>
              <p className="text-primary-100 text-sm">Sensores/Estación</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">
                {subscription.maxAlerts === -1 ? '∞' : subscription.maxAlerts}
              </p>
              <p className="text-primary-100 text-sm">Alertas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{subscription.dataRetentionDays}</p>
              <p className="text-primary-100 text-sm">Días de datos</p>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Dates & API Key */}
      {subscription && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dates Table */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              Vigencia del Plan
            </h2>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full">
                <tbody className="divide-y divide-gray-100">
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      Fecha de Inicio
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatDate(subscription.startDate)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-500" />
                      Fecha de Finalización
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {subscription.planType === 'FREE' && !subscription.endDate
                        ? 'Sin vencimiento'
                        : formatDate(subscription.endDate)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      Días Restantes
                    </td>
                    <td className="px-4 py-3 text-right">
                      {subscription.planType === 'FREE' && !subscription.endDate ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          Ilimitado
                        </span>
                      ) : (() => {
                        const days = getDaysRemaining();
                        if (days === null) return <span className="text-sm text-gray-400">No definido</span>;
                        const color = days > 30 ? 'green' : days > 7 ? 'amber' : 'red';
                        return (
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-${color}-100 text-${color}-700`}>
                            {days > 0 ? `${days} días` : 'Expirado'}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {(() => {
              const days = getDaysRemaining();
              if (days !== null && days <= 7 && days > 0) {
                return (
                  <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Tu suscripción está próxima a vencer. Renueva tu plan para no perder acceso.
                  </div>
                );
              }
              if (days !== null && days <= 0) {
                return (
                  <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Tu suscripción ha expirado. Actualiza tu plan para continuar usando el servicio.
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* API Key Section */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-amber-600" />
              Acceso API
            </h2>

            {subscription.apiAccess ? (
              <div className="space-y-4">
                {/* Generar API Key */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">API Key</label>
                  {generatedApiKey ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs font-mono text-green-800 truncate">
                        {generatedApiKey}
                      </div>
                      <button
                        onClick={() => handleCopyKey(generatedApiKey)}
                        className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedKey ? 'Copiado' : 'Copiar'}
                      </button>
                      <button
                        onClick={handleGenerateApiKey}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Regenerar"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateApiKey}
                      className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      <Key className="h-4 w-4" />
                      Generar API Key
                    </button>
                  )}
                </div>

                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium mb-1">Endpoint de consulta de datos:</p>
                  <code className="text-xs text-blue-600 break-all">
                    GET /data/query/&#123;idEstacion&#125;?startDate=...&endDate=...
                  </code>
                </div>

                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-1">Uso de la API:</p>
                  <p className="text-xs text-gray-500">Agrega el header <code className="bg-gray-100 px-1 rounded">X-API-Key: &#123;tu_api_key&#125;</code> a tus peticiones</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Acceso API no disponible</p>
                <p className="text-gray-400 text-sm mt-1">Actualiza a plan PRO o ULTRA para obtener acceso a la API</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Features Grid */}
      {subscription && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-purple-600" />
            Características de tu Plan
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: 'Email', key: 'emailNotifications', icon: Mail },
              { label: 'SMS', key: 'smsNotifications', icon: MessageSquare },
              { label: 'API', key: 'apiAccess', icon: Code },
              { label: 'Exportar', key: 'exportData', icon: Download },
              { label: 'Tiempo Real', key: 'realtimeData', icon: Activity },
              { label: 'Análisis', key: 'advancedAnalytics', icon: BarChart3 },
              { label: 'Reportes', key: 'customReports', icon: FileText },
              { label: 'Soporte', key: 'prioritySupport', icon: Headphones },
              { label: 'Marca Blanca', key: 'whiteLabel', icon: Palette },
            ].map(feature => {
              const enabled = subscription[feature.key];
              const Icon = feature.icon;
              return (
                <div
                  key={feature.key}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    enabled
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Icon className={`h-4 w-4 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${enabled ? 'text-green-700' : 'text-gray-500'}`}>
                      {feature.label}
                    </p>
                    <p className={`text-xs ${enabled ? 'text-green-500' : 'text-gray-400'}`}>
                      {enabled ? 'Activo' : 'No incluido'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const colors = getPlanColors(plan.type);
          const isCurrentPlan = subscription?.planType === plan.type;
          const isPopular = plan.type === 'PRO';

          return (
            <div
              key={plan.type}
              className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col ${
                isCurrentPlan ? 'ring-2 ring-primary-500 ring-offset-2' : ''
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}

              {/* Header */}
              <div className={`${colors.header} p-6 text-center ${plan.type !== 'FREE' ? 'text-white' : 'text-gray-800'}`}>
                <div className={`inline-flex p-3 rounded-xl ${plan.type !== 'FREE' ? 'bg-white/20' : 'bg-gray-200'} mb-3`}>
                  <span className={colors.icon}>{getPlanIcon(plan.type)}</span>
                </div>
                <h3 className="text-xl font-bold">{plan.displayName}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? 'Gratis' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm opacity-80">/mes</span>}
                </div>
              </div>

              {/* Features */}
              <div className="p-6 flex flex-col flex-1">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="flex-shrink-0 text-green-500">
                        {getFeatureIcon(feature)}
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Action Button - always at bottom */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {isCurrentPlan ? (
                    <div className={`w-full py-3 px-4 rounded-lg text-center font-semibold ${colors.badge}`}>
                      Plan Actual
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.type)}
                      disabled={upgrading}
                      className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${colors.button} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {upgrading ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : plan.level > (plans.find(p => p.type === subscription?.planType)?.level || 0) ? (
                        'Actualizar'
                      ) : (
                        'Cambiar'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison Table */}
      <div className="card overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Comparación de características</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-4 font-semibold text-gray-700">Característica</th>
                {plans.map(plan => (
                  <th key={plan.type} className="text-center py-4 px-4 font-semibold text-gray-700">
                    {plan.displayName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-4 px-4 text-gray-600">Estaciones</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4 font-medium">
                    {plan.maxStations === -1 ? 'Ilimitadas' : plan.maxStations}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Sensores por estación</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4 font-medium">
                    {plan.maxSensorsPerStation === -1 ? 'Ilimitados' : plan.maxSensorsPerStation}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Alertas</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4 font-medium">
                    {plan.maxAlerts === -1 ? 'Ilimitadas' : plan.maxAlerts}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Retención de datos</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4 font-medium">
                    {plan.dataRetentionDays} días
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Notificaciones Email</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4">
                    {['BASIC', 'PRO', 'ULTRA'].includes(plan.type) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Notificaciones SMS</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4">
                    {['PRO', 'ULTRA'].includes(plan.type) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Acceso API</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4">
                    {['PRO', 'ULTRA'].includes(plan.type) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Datos en tiempo real</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4">
                    {['PRO', 'ULTRA'].includes(plan.type) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Soporte prioritario</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4">
                    {plan.type === 'ULTRA' ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 px-4 text-gray-600">Marca blanca</td>
                {plans.map(plan => (
                  <td key={plan.type} className="text-center py-4 px-4">
                    {plan.type === 'ULTRA' ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Info Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary-600" />
                Información de Empresa
              </h2>
            </div>
            <form onSubmit={handleSubmit(handleUpdateCompany)} className="p-6 space-y-4">
              <InputField
                label="Nombre de la Empresa"
                name="companyName"
                register={register}
                placeholder="Mi Empresa S.A."
              />
              <div>
                <label className="label">Logo de la Empresa</label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      setError('La imagen no debe superar 2MB');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      setValue('companyLogoUrl', reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer group"
                >
                  {watchCompanyLogo ? (
                    <div className="flex flex-col items-center space-y-2">
                      <img
                        src={watchCompanyLogo}
                        alt="Logo preview"
                        className="max-h-20 object-contain"
                      />
                      <span className="text-sm text-gray-500 group-hover:text-primary-600">Clic para cambiar imagen</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-gray-400 group-hover:text-primary-600">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm font-medium">Clic para subir logo</span>
                      <span className="text-xs text-gray-400">PNG, JPG, SVG o WebP (max 2MB)</span>
                    </div>
                  )}
                </button>
                {watchCompanyLogo && (
                  <button
                    type="button"
                    onClick={() => setValue('companyLogoUrl', '')}
                    className="mt-2 text-xs text-red-500 hover:text-red-700"
                  >
                    Eliminar logo
                  </button>
                )}
              </div>
              <FormButtons
                submitLabel="Guardar"
                submitLoading={companySubmitting}
                onCancel={() => {
                  setShowCompanyModal(false);
                  reset(companyDefaultValues);
                }}
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
