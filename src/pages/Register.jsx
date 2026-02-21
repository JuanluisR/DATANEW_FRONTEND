import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useZodForm, InputField, FormButtons, z } from '../components/FormFields';
import userService from '../services/userService';
import { Cloud, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(30, 'El usuario no puede tener más de 30 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Debes confirmar tu contraseña'),
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Ingresa un correo electrónico válido'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

const Register = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useZodForm({
    username: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    email: '',
  }, registerSchema);

  const password = watch('password');

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    try {
      const userData = {
        username: data.username,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        is_active: true,
        is_staff: false,
        is_superuser: false,
      };

      await userService.create(userData);
      setSuccess(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Error al registrar:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError('El usuario o email ya existe');
      } else {
        setError('Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block bg-white p-4 rounded-2xl shadow-2xl mb-4">
            <Cloud className="h-16 w-16 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">DataNew Weather</h1>
          <p className="text-primary-100">Sistema de Monitoreo Meteorológico</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
            <UserPlus className="h-6 w-6 mr-2" />
            Crear Cuenta
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800 font-medium">
                  Cuenta creada exitosamente. Redirigiendo al login...
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Nombre"
                name="first_name"
                register={register}
                error={errors.first_name}
                placeholder="Tu nombre"
                required
              />
              <InputField
                label="Apellido"
                name="last_name"
                register={register}
                error={errors.last_name}
                placeholder="Tu apellido"
                required
              />
            </div>

            <InputField
              label="Usuario"
              name="username"
              register={register}
              error={errors.username}
              placeholder="Nombre de usuario"
              required
            />

            <InputField
              label="Email"
              name="email"
              register={register}
              error={errors.email}
              type="email"
              placeholder="tu@email.com"
              required
            />

            <InputField
              label="Contraseña"
              name="password"
              register={register}
              error={errors.password}
              type="password"
              placeholder="Mínimo 6 caracteres"
              required
            />

            <InputField
              label="Confirmar Contraseña"
              name="confirmPassword"
              register={register}
              error={errors.confirmPassword}
              type="password"
              placeholder="Repite tu contraseña"
              required
            />

            <FormButtons
              submitLabel="Crear Cuenta"
              submitLoading={loading}
              submitDisabled={loading || success}
            />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-primary-100 text-sm">
            © 2026 DataNew Weather Station
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
