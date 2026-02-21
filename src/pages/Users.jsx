import { useState, useEffect } from 'react';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useZodForm, InputField, TextAreaField, FormButtons, z } from '../components/FormFields';
import { Mail, User, Shield, Building, MapPin, Phone, Globe, Hash, Save, FileText, Link as LinkIcon } from 'lucide-react';

const userSchema = z.object({
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email('Ingresa un correo electrónico válido').or(z.literal('')),
  biografia: z.string().optional(),
  enlace: z.string().url('Ingresa una URL válida').optional().or(z.literal('')),
  empresa: z.string().optional(),
  telefono: z.string().optional(),
  pais: z.string().optional(),
  estado: z.string().optional(),
  ciudad: z.string().optional(),
  codigoPostal: z.string().optional(),
});

const Users = () => {
  const { user: currentUser, updateUser } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);

  const defaultValues = {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    biografia: '',
    enlace: '',
    empresa: '',
    telefono: '',
    pais: '',
    estado: '',
    ciudad: '',
    codigoPostal: '',
  };

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useZodForm(defaultValues, userSchema);

  useEffect(() => {
    if (currentUser) {
      fetchCurrentUser();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      if (currentUser.id) {
        const response = await userService.getById(currentUser.id);
        const userData = response.data;
        reset({
          username: userData.username || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          biografia: userData.biografia || '',
          enlace: userData.enlace || '',
          empresa: userData.empresa || '',
          telefono: userData.telefono || '',
          pais: userData.pais || '',
          estado: userData.estado || '',
          ciudad: userData.ciudad || '',
          codigoPostal: userData.codigoPostal || '',
        });
      } else {
        reset({
          username: currentUser.username || '',
          first_name: currentUser.first_name || '',
          last_name: currentUser.last_name || '',
          email: currentUser.email || '',
          biografia: '',
          enlace: '',
          empresa: '',
          telefono: '',
          pais: '',
          estado: '',
          ciudad: '',
          codigoPostal: '',
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      reset({
        username: currentUser.username || '',
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        biografia: '',
        enlace: '',
        empresa: '',
        telefono: '',
        pais: '',
        estado: '',
        ciudad: '',
        codigoPostal: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    const confirmed = await confirm('¿Estás seguro de que deseas guardar los cambios en tu perfil?');
    if (!confirmed) return;

    try {
      await userService.update(currentUser.id, data);
      updateUser({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        empresa: data.empresa
      });
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Administra tu información personal</p>
      </div>

      {currentUser && (
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <Shield className="h-10 w-10" />
            </div>
            <div>
              <p className="text-sm text-blue-100">Sesión Actual</p>
              <h2 className="text-3xl font-bold">{currentUser.username}</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-blue-100" />
                <p className="text-xs text-blue-100">Nombre Completo</p>
              </div>
              <p className="font-semibold text-lg">
                {currentUser.first_name && currentUser.last_name
                  ? `${currentUser.first_name} ${currentUser.last_name}`
                  : 'No especificado'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="h-4 w-4 text-blue-100" />
                <p className="text-xs text-blue-100">Email</p>
              </div>
              <p className="font-semibold text-sm truncate">{currentUser.email || 'No especificado'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-4 w-4 text-blue-100" />
                <p className="text-xs text-blue-100">Permisos</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {currentUser.is_superuser && (
                  <span className="px-2 py-0.5 bg-purple-300 text-purple-900 rounded-full text-xs font-semibold">Superusuario</span>
                )}
                {currentUser.is_staff && (
                  <span className="px-2 py-0.5 bg-blue-300 text-blue-900 rounded-full text-xs font-semibold">Staff</span>
                )}
                {currentUser.is_active && (
                  <span className="px-2 py-0.5 bg-green-300 text-green-900 rounded-full text-xs font-semibold">Activo</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Información Personal
          </h3>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Nombre de Usuario"
                name="username"
                register={register}
                error={errors.username}
                disabled
              />
              <InputField
                label="Correo Electrónico"
                name="email"
                register={register}
                error={errors.email}
                type="email"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Nombre"
                name="first_name"
                register={register}
                error={errors.first_name}
                placeholder="Tu nombre"
              />
              <InputField
                label="Apellido"
                name="last_name"
                register={register}
                error={errors.last_name}
                placeholder="Tu apellido"
              />
            </div>

            <TextAreaField
              label="Biografía"
              name="biografia"
              register={register}
              error={errors.biografia}
              placeholder="Cuéntanos sobre ti..."
              rows={3}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Enlace / Sitio Web"
                name="enlace"
                register={register}
                error={errors.enlace}
                type="url"
                placeholder="https://tusitio.com"
              />
              <InputField
                label="Teléfono"
                name="telefono"
                register={register}
                error={errors.telefono}
                type="tel"
                placeholder="+52 123 456 7890"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Building className="h-5 w-5 text-primary-600" />
            Empresa
          </h3>

          <InputField
            label="Nombre de la Empresa"
            name="empresa"
            register={register}
            error={errors.empresa}
            placeholder="Mi Empresa S.A."
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-600" />
            Ubicación
          </h3>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="País"
                name="pais"
                register={register}
                error={errors.pais}
                placeholder="México"
              />
              <InputField
                label="Estado / Provincia"
                name="estado"
                register={register}
                error={errors.estado}
                placeholder="Jalisco"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Ciudad"
                name="ciudad"
                register={register}
                error={errors.ciudad}
                placeholder="Guadalajara"
              />
              <InputField
                label="Código Postal"
                name="codigoPostal"
                register={register}
                error={errors.codigoPostal}
                placeholder="44100"
              />
            </div>
          </div>
        </div>

        <FormButtons
          submitLabel="Guardar Cambios"
          submitLoading={isSubmitting}
        />
      </form>
    </div>
  );
};

export default Users;
