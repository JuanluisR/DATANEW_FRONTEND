import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Info, Loader2 } from 'lucide-react';
import dataStationService from '../services/dataStationService';
import { useFormFields, SelectField, FormButtons } from '../components/FormFields';

const MARCAS = [
  { value: 'Meteoragro', label: 'Meteoragro' },
  { value: 'Ecowitt', label: 'Ecowitt' },
  { value: 'Davis', label: 'Davis' }
];

const MODELOS = {
  Meteoragro: [
    { value: 'MA1000', label: 'MA1000' },
    { value: 'MA1000 Sensor', label: 'MA1000 Sensor' },
    { value: 'MA2000', label: 'MA2000' },
    { value: 'MA3000', label: 'MA3000' },
    { value: 'MA2300', label: 'MA2300' },
    { value: 'MA6000', label: 'MA6000' },
    { value: 'MA6200', label: 'MA6200' }
  ],
  Ecowitt: [],
  Davis: [
    { value: 'Davis Vantage Plus 6162', label: 'Davis Vantage Plus 6162' },
    { value: 'Davis Vantage Plus 6163', label: 'Davis Vantage Plus 6163' },
    { value: 'Davis Vantage Plus 6165', label: 'Davis Vantage Plus 6165' }
  ]
};

const TIPOS_SENSOR = [
  { value: 'Temperatura', label: 'Temperatura' },
  { value: 'Humedad', label: 'Humedad' },
  { value: 'Presión', label: 'Presión' },
  { value: 'Viento', label: 'Viento' },
  { value: 'Lluvia', label: 'Lluvia' },
  { value: 'Radiación Solar', label: 'Radiación Solar' },
  { value: 'UV', label: 'UV' },
  { value: 'Todos', label: 'Todos' }
];

const DataUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [template, setTemplate] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const defaultValues = {
    marca: '',
    modelo: '',
    tipoSensor: ''
  };

  const { register, watch, setValue, reset, formState: { errors } } = useFormFields(defaultValues);

  const watchMarca = watch('marca');

  useEffect(() => {
    fetchTemplate();
  }, []);

  useEffect(() => {
    if (!watchMarca) {
      setValue('modelo', '');
    }
  }, [watchMarca]);

  const fetchTemplate = async () => {
    try {
      const res = await dataStationService.getTemplate();
      setTemplate(res.data);
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const extension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
    
    if (!validTypes.includes(extension)) {
      setResult({
        success: false,
        message: 'El archivo debe ser de tipo Excel (.xlsx, .xls) o CSV (.csv)'
      });
      return;
    }
    
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await dataStationService.uploadExcel(formData);
      setResult(response.data);
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Error al subir el archivo'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    reset(defaultValues);
  };

  const modeloOptions = watchMarca ? MODELOS[watchMarca] || [] : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carga de Datos</h1>
            <p className="text-gray-500">Sube archivos Excel con datos de estaciones meteorológicas</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <SelectField
            label="Marca"
            name="marca"
            register={register}
            error={errors.marca}
            options={MARCAS}
            placeholder="Seleccionar marca"
          />
          <SelectField
            label="Modelo"
            name="modelo"
            register={register}
            error={errors.modelo}
            options={modeloOptions}
            placeholder="Seleccionar modelo"
            disabled={!watchMarca}
          />
          <SelectField
            label="Tipo de Sensor"
            name="tipoSensor"
            register={register}
            error={errors.tipoSensor}
            options={TIPOS_SENSOR}
            placeholder="Seleccionar tipo"
          />
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : file 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {file ? (
            <div className="flex flex-col items-center">
              <FileSpreadsheet className="h-12 w-12 text-green-600 mb-3" />
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              <button onClick={handleReset} className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium">
                Cambiar archivo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400 mb-3" />
              <p className="font-medium text-gray-700">
                Arrastra y suelta tu archivo Excel aquí
              </p>
              <p className="text-sm text-gray-500 mb-4">o</p>
              <label className="btn-primary cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                Seleccionar archivo
              </label>
              <p className="text-xs text-gray-400 mt-3">
                Formatos aceptados: .xlsx, .xls, .csv
              </p>
            </div>
          )}
        </div>

        {file && !result && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary flex items-center gap-2 px-8 py-3"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Subir y procesar
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className={`mt-6 rounded-xl p-4 ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message || (result.success ? 'Archivo procesado correctamente' : 'Error al procesar')}
                </p>
                
                {result.success && result.totalRows !== undefined && (
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500">Total filas</p>
                      <p className="font-bold text-gray-900">{result.totalRows}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Exitosas</p>
                      <p className="font-bold text-green-600">{result.successCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Errores</p>
                      <p className="font-bold text-red-600">{result.errorCount}</p>
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 mb-2">Errores encontrados:</p>
                    <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                      {result.errors.slice(0, 10).map((err, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 flex-shrink-0" />
                          <span>{err}</span>
                        </li>
                      ))}
                      {result.errors.length > 10 && (
                        <li className="text-gray-500 italic">
                          ...y {result.errors.length - 10} errores más
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Subir otro archivo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {template && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Estructura del archivo</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Columnas requeridas
              </h3>
              <ul className="space-y-1">
                {template.required?.map((col) => (
                  <li key={col} className="text-sm text-gray-600 font-mono bg-red-50 px-3 py-1.5 rounded">
                    {col}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Columnas opcionales
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {template.optional?.map((col) => (
                  <li key={col} className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-1.5 rounded">
                    {col}
                  </li>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">Formatos de fecha aceptados</h3>
            <div className="flex flex-wrap gap-2">
              {template.dateFormats?.map((format) => (
                <span 
                  key={format} 
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataUpload;
