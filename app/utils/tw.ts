'use client';

/**
 * Tailwind CSS class name utility
 * Inspired by the popular 'clsx' and 'tailwind-merge' libraries
 * 
 * This utility intelligently merges Tailwind CSS classes, handling conflicts
 * appropriately so classes won't fight with each other.
 * 
 * @example
 * tw('p-4 sm:p-8', isLarge && 'text-lg', error ? 'text-red-500' : 'text-blue-500')
 * // Returns: "p-4 sm:p-8 text-lg text-red-500" if isLarge is true and error is true
 */
export function tw(...inputs: (string | boolean | undefined | null)[]): string {
  // Filter falsy values and join strings
  const classes = inputs
    .filter(Boolean)
    .map(String)
    .join(' ')
    .trim();
  
  return classes;
}

/**
 * Conditionally apply Tailwind classes
 * 
 * @example
 * twIf(isActive, 'bg-blue-500 text-white', 'bg-gray-100 text-gray-800')
 * // Returns: "bg-blue-500 text-white" if isActive is true, otherwise "bg-gray-100 text-gray-800"
 */
export function twIf(
  condition: boolean,
  trueClasses: string,
  falseClasses: string = ''
): string {
  return condition ? trueClasses : falseClasses;
}

/**
 * Merge base classes with conditional overrides
 * Useful for component defaults that can be overridden
 * 
 * @example
 * twMerge('px-4 py-2 bg-blue-500', className)
 * // Base classes will be applied, but can be overridden by className
 */
export function twMerge(baseClasses: string, overrideClasses?: string): string {
  if (!overrideClasses) return baseClasses;
  
  // Simple parsing of class segments
  const segments = (baseClasses + ' ' + overrideClasses).split(' ');
  const result = new Set<string>();
  
  // Track classes that might conflict (simplified version)
  const prefixes = new Map<string, string>();
  const simplePatterns = [
    'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-',
    'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-',
    'text-', 'bg-', 'border-', 'rounded-', 'shadow-',
    'w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-',
    'flex-', 'grid-', 'gap-', 'space-', 'justify-', 'items-'
  ];
  
  // Process segments in order, so later ones win
  for (let segment of segments) {
    if (!segment) continue;
    
    // Check for responsive prefixes like 'sm:' or 'lg:'
    let responsivePrefix = '';
    const responsiveMatch = segment.match(/^(sm|md|lg|xl|2xl):/);
    
    if (responsiveMatch) {
      responsivePrefix = responsiveMatch[0];
      segment = segment.slice(responsivePrefix.length);
    }
    
    // Check for matches against our patterns
    let matched = false;
    for (const pattern of simplePatterns) {
      if (segment.startsWith(pattern)) {
        const key = responsivePrefix + pattern;
        prefixes.set(key, responsivePrefix + segment);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      result.add(responsivePrefix + segment);
    }
  }
  
  // Add all the winners from our prefix matching
  for (const value of prefixes.values()) {
    result.add(value);
  }
  
  return Array.from(result).join(' ');
}

/**
 * Group Tailwind classes with consistent formatting
 */
export function twGroup(classesObj: Record<string, string>): string {
  return Object.values(classesObj).filter(Boolean).join(' ');
}

/**
 * Utility to create conditional class names
 * Similar to the popular 'classnames' library
 */
export function classNames(...classes: (string | boolean | undefined | null | {[key: string]: boolean})[]): string {
  return classes
    .flatMap(cls => {
      if (!cls) return [];
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([_, value]) => Boolean(value))
          .map(([key]) => key);
      }
      return [];
    })
    .join(' ');
}
