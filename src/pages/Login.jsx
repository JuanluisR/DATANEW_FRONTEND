import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useZodForm, InputField, FormButtons, FormField, z } from '../components/FormFields';
import { useAuth } from '../context/AuthContext';
import { Cloud, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useZodForm({
    username: '',
    password: '',
  }, loginSchema);

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);

    const result = await login(data.username, data.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <InputField
              label="Usuario"
              name="username"
              register={register}
              error={errors.username}
              icon={null}
              placeholder="Ingresa tu usuario"
              required
              autoFocus
            />

            <InputField
              label="Contraseña"
              name="password"
              register={register}
              error={errors.password}
              type="password"
              placeholder="Ingresa tu contraseña"
              required
            />

            <FormButtons
              submitLabel="Iniciar Sesión"
              submitLoading={loading}
              submitDisabled={loading}
            />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                Regístrate aquí
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

export default Login;
