'use client';

import React, { ButtonHTMLAttributes, memo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

/**
 * A reusable button component with various styles and states
 */
const Button = memo(({
  children,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  loadingText,
  fullWidth = false,
  className = '',
  disabled = false,
  iconLeft,
  iconRight,
  ...rest
}: ButtonProps) => {
  // Base classes
  const baseClasses = 'font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg'
  };
  
  // Variant classes (when not disabled)
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-dark text-white focus:ring-primary/50',
    secondary: 'bg-secondary hover:bg-secondary-dark text-white focus:ring-secondary/50',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 focus:ring-gray-300',
    text: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-300'
  };
  
  // Disabled classes override variant classes
  const disabledClasses = 'opacity-50 cursor-not-allowed';
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = [
    baseClasses,
    sizeClasses[size],
    disabled || isLoading ? disabledClasses : variantClasses[variant],
    widthClass,
    className
  ].join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...rest}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {isLoading && <LoadingSpinner size="small" color="neutral" />}
        {iconLeft && !isLoading && iconLeft}
        {isLoading && loadingText ? loadingText : children}
        {iconRight && !isLoading && iconRight}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
