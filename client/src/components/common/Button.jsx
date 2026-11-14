import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'accent',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050606]';

  const variants = {
    // Primary #C8FF00 action
    accent:
      'bg-[#C8FF00] hover:bg-[#B5E600] text-[#050606] font-semibold shadow-sm focus:ring-[#C8FF00]',
    // Light secondary surface
    secondary:
      'bg-[#F5F3EF] hover:bg-[#ECE9E2] text-[#050606] border border-[#DDD8CE] shadow-sm focus:ring-[#C8FF00]',
    // Dark surface
    dark:
      'bg-[#131616] hover:bg-[#1C2020] text-[#F5F3EF] border border-[#272D2D] focus:ring-[#C8FF00]',
    // Outline
    outline:
      'bg-transparent hover:bg-white/5 text-[#F5F3EF] border border-[#272D2D] hover:border-[#3B4242] focus:ring-[#C8FF00]',
    // Danger / Cancel
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 focus:ring-rose-500',
    // Danger Solid
    dangerSolid:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500',
    // Ghost
    ghost:
      'bg-transparent hover:bg-white/5 text-[#8E9393] hover:text-[#F5F3EF] focus:ring-[#C8FF00]',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs gap-1.5',
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.accent} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
