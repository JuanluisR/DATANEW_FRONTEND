import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';

export const useFormFields = (defaultValues = {}) => {
  const formMethods = useForm({
    defaultValues,
    mode: 'onChange',
  });

  const { register, handleSubmit, control, watch, setValue, reset, setError, clearErrors, formState } = formMethods;
  const { errors, isSubmitting, isValid } = formState;

  const watchAll = watch();

  return {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    watchAll,
    errors,
    isSubmitting,
    isValid,
    formState,
    formMethods,
  };
};

export const useZodForm = (defaultValues = {}, zodSchema) => {
  const formMethods = useForm({
    defaultValues,
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
  });

  const { register, handleSubmit, control, watch, setValue, reset, setError, clearErrors, formState } = formMethods;
  const { errors, isSubmitting, isValid } = formState;

  const watchAll = watch();

  return {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    clearErrors,
    watchAll,
    errors,
    isSubmitting,
    isValid,
    formState,
    formMethods,
  };
};

export { z };

export const FormField = ({ 
  label, 
  error, 
  required = false, 
  icon: Icon,
  helpText,
  className = '',
  children 
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {Icon && <Icon className="h-4 w-4 inline mr-2" />}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helpText && !error && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
};

export const InputField = ({ 
  label, 
  name, 
  register, 
  error, 
  type = 'text',
  placeholder,
  required = false,
  icon: Icon,
  helpText,
  disabled = false,
  className = '',
  onChange,
  ...props 
}) => {
  return (
    <FormField 
      label={label} 
      error={error} 
      required={required}
      icon={Icon}
      helpText={helpText}
      className={className}
    >
      <input
        type={type}
        className={`input-field ${error ? 'border-red-500 focus:border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name, { 
          onChange: (e) => {
            if (onChange) onChange(e);
          }
        })}
        {...props}
      />
    </FormField>
  );
};

export const SelectField = ({ 
  label, 
  name, 
  register, 
  error, 
  options = [],
  required = false,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
  onChange,
  ...props 
}) => {
  return (
    <FormField 
      label={label} 
      name={name} 
      error={error} 
      required={required}
      className={className}
    >
      <select
        className={`input-field ${error ? 'border-red-500 focus:border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        disabled={disabled}
        {...register(name, {
          onChange: (e) => {
            if (onChange) onChange(e);
          }
        })}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export const CheckboxField = ({ 
  label, 
  name, 
  register, 
  error, 
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${error ? 'border-red-500' : ''}`}
        {...register(name)}
        {...props}
      />
      {label && (
        <label className="ml-2 text-sm text-gray-700">
          {label}
        </label>
      )}
      {error && (
        <p className="text-xs text-red-500 ml-2">{error.message}</p>
      )}
    </div>
  );
};

export const FormButtons = ({ 
  submitLabel = 'Guardar',
  submitDisabled = false,
  submitLoading = false,
  onCancel,
  cancelLabel = 'Cancelar',
  className = '',
}) => {
  return (
    <div className={`flex space-x-3 pt-4 ${className}`}>
      <button
        type="submit"
        disabled={submitDisabled || submitLoading}
        className="btn-primary flex-1 flex items-center justify-center gap-2"
      >
        {submitLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {submitLabel}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          {cancelLabel}
        </button>
      )}
    </div>
  );
};

export const TextAreaField = ({ 
  label, 
  name, 
  register, 
  error, 
  placeholder,
  required = false,
  rows = 3,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <FormField 
      label={label} 
      name={name} 
      error={error} 
      required={required}
      className={className}
    >
      <textarea
        className={`input-field ${error ? 'border-red-500 focus:border-red-500' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        {...register(name)}
        {...props}
      />
    </FormField>
  );
};

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useFormFields;
