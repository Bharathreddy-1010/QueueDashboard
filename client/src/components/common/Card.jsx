import React from 'react';

export const Card = ({
  children,
  variant = 'light',
  className = '',
  onClick,
  ...props
}) => {
  const variants = {
    // 20% Secondary light surface
    light:
      'bg-[#F5F3EF] text-[#050606] border border-[#DDD8CE] shadow-sm',
    // Dark surface
    dark:
      'bg-[#131616] text-[#F5F3EF] border border-[#272D2D] shadow-soft',
    // Deep dark surface
    darker:
      'bg-[#0D0F0F] text-[#F5F3EF] border border-[#222727]',
    // Accent bordered
    accent:
      'bg-[#131616] text-[#F5F3EF] border-2 border-[#C8FF00] shadow-accent',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl transition-all duration-200 ${variants[variant] || variants.light} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
