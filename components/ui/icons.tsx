import * as React from 'react';
import { SVGProps } from 'react';

// Utility function for className concatenation
function cn(...classes: Array<string | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

type IconProps = SVGProps<SVGSVGElement> & {
  className?: string;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
};

// Individual icon components
const createIcon = (displayName: string, path: React.ReactNode, viewBox = '0 0 24 24') => {
  const IconComponent = React.forwardRef<SVGSVGElement, IconProps>(
    ({ className, ...props }, ref) => (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(className)}
        aria-hidden={!props['aria-label']}
        role={props['aria-label'] ? 'img' : undefined}
        {...props}
      >
        {path}
      </svg>
    )
  );
  
  IconComponent.displayName = displayName;
  return IconComponent;
};

// Export individual icons
export const SpinnerIcon = createIcon('Spinner', (
  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
));

export const ChevronLeftIcon = createIcon('ChevronLeft', (
  <path d="m15 18-6-6 6-6" />
));

export const MenuIcon = createIcon('Menu', (
  <>
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </>
));

export const XIcon = createIcon('X', (
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>
));

// Export all icons as a named export
export const Icons = {
  Spinner: SpinnerIcon,
  ChevronLeft: ChevronLeftIcon,
  Menu: MenuIcon,
  X: XIcon,
} as const;

// Export default the Icons object for backward compatibility
export default Icons;
