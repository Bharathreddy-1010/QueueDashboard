import React from 'react';

export const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  wrapperClassName = '',
  id,
  required = false,
  helperText,
  variant = 'dark', // 'dark' or 'light'
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const styleVariants = {
    dark:
      'bg-[#0D0F0F] border-[#272D2D] text-[#F5F3EF] placeholder-[#656B6B] focus:border-[#C8FF00] focus:ring-[#C8FF00]/20',
    light:
      'bg-white border-[#DDD8CE] text-[#050606] placeholder-[#8E9393] focus:border-[#050606] focus:ring-black/10',
  };

  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-xs font-semibold mb-1.5 uppercase tracking-wider ${
            variant === 'light' ? 'text-[#3E4343]' : 'text-[#8E9393]'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E9393]">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          required={required}
          className={`w-full px-3.5 py-2.5 rounded-xl text-sm border transition-colors outline-none focus:ring-2 ${
            Icon ? 'pl-10' : ''
          } ${styleVariants[variant]} ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-500">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#8E9393]">{helperText}</p>
      ) : null}
    </div>
  );
};
