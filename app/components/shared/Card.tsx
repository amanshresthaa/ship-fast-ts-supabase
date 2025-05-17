'use client';

import React, { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  padding?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
  rounded?: boolean;
  onClick?: () => void;
}

/**
 * A reusable card component with configurable styling options
 */
const Card = memo(({
  children,
  title,
  className = '',
  elevation = 'low',
  padding = 'medium',
  border = true,
  rounded = true,
  onClick
}: CardProps) => {
  const elevationClasses = {
    none: '',
    low: 'shadow-sm',
    medium: 'shadow',
    high: 'shadow-lg'
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'p-2',
    medium: 'p-4',
    large: 'p-6'
  };

  const borderClass = border ? 'border border-gray-200' : '';
  const roundedClass = rounded ? 'rounded-lg' : '';
  const cursorClass = onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : '';

  const classes = [
    elevationClasses[elevation],
    paddingClasses[padding],
    borderClass,
    roundedClass,
    cursorClass,
    'bg-white',
    className
  ].join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
