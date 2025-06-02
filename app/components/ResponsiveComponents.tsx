import React from 'react';
import { useResponsive, BreakpointKey, DeviceType } from '@/app/hooks/useResponsive';

interface ResponsiveProps {
  children: React.ReactNode;
}

interface BreakpointProps extends ResponsiveProps {
  breakpoint: BreakpointKey;
  direction?: 'up' | 'down';
}

interface DeviceProps extends ResponsiveProps {
  device: DeviceType | DeviceType[];
}

/**
 * Component that conditionally renders children based on breakpoint
 * 
 * @example
 * <ShowOn breakpoint="md" direction="up">
 *   <DesktopNavigation />
 * </ShowOn>
 */
export const ShowOn: React.FC<BreakpointProps> = ({ 
  children, 
  breakpoint, 
  direction = 'up' 
}) => {
  const { isBreakpointUp, isBreakpointDown } = useResponsive();
  
  const shouldShow = direction === 'up' 
    ? isBreakpointUp(breakpoint)
    : isBreakpointDown(breakpoint);
    
  return shouldShow ? <>{children}</> : null;
};

/**
 * Component that conditionally hides children based on breakpoint
 * 
 * @example
 * <HideOn breakpoint="md" direction="down">
 *   <MobileOnlyComponent />
 * </HideOn>
 */
export const HideOn: React.FC<BreakpointProps> = ({ 
  children, 
  breakpoint, 
  direction = 'up' 
}) => {
  const { isBreakpointUp, isBreakpointDown } = useResponsive();
  
  const shouldHide = direction === 'up' 
    ? isBreakpointUp(breakpoint)
    : isBreakpointDown(breakpoint);
    
  return !shouldHide ? <>{children}</> : null;
};

/**
 * Component that renders children only on specific device types
 * 
 * @example
 * <ShowOnDevice device="mobile">
 *   <MobileHeader />
 * </ShowOnDevice>
 * 
 * <ShowOnDevice device={["tablet", "desktop"]}>
 *   <DesktopTabletView />
 * </ShowOnDevice>
 */
export const ShowOnDevice: React.FC<DeviceProps> = ({ children, device }) => {
  const { deviceType } = useResponsive();
  
  const devices = Array.isArray(device) ? device : [device];
  const shouldShow = devices.includes(deviceType);
  
  return shouldShow ? <>{children}</> : null;
};

/**
 * Component that hides children on specific device types
 */
export const HideOnDevice: React.FC<DeviceProps> = ({ children, device }) => {
  const { deviceType } = useResponsive();
  
  const devices = Array.isArray(device) ? device : [device];
  const shouldHide = devices.includes(deviceType);
  
  return !shouldHide ? <>{children}</> : null;
};

/**
 * Mobile-only component wrapper
 */
export const MobileOnly: React.FC<ResponsiveProps> = ({ children }) => (
  <ShowOnDevice device={["mobile", "mobile-large"]}>{children}</ShowOnDevice>
);

/**
 * Tablet-only component wrapper
 */
export const TabletOnly: React.FC<ResponsiveProps> = ({ children }) => (
  <ShowOnDevice device="tablet">{children}</ShowOnDevice>
);

/**
 * Desktop-only component wrapper (includes all desktop sizes)
 */
export const DesktopOnly: React.FC<ResponsiveProps> = ({ children }) => (
  <ShowOnDevice device={["desktop", "desktop-large", "desktop-xl"]}>{children}</ShowOnDevice>
);

/**
 * Mobile and tablet wrapper
 */
export const MobileTablet: React.FC<ResponsiveProps> = ({ children }) => (
  <ShowOnDevice device={["mobile", "mobile-large", "tablet"]}>{children}</ShowOnDevice>
);

/**
 * Tablet and desktop wrapper
 */
export const TabletDesktop: React.FC<ResponsiveProps> = ({ children }) => (
  <ShowOnDevice device={["tablet", "desktop", "desktop-large", "desktop-xl"]}>{children}</ShowOnDevice>
);

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  mobileSrc?: string;
  tabletSrc?: string;
  desktopSrc?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Responsive image component with device-specific sources
 * 
 * @example
 * <ResponsiveImage
 *   src="/images/hero-desktop.jpg"
 *   mobileSrc="/images/hero-mobile.jpg"
 *   tabletSrc="/images/hero-tablet.jpg"
 *   alt="Hero image"
 *   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 * />
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  className = '',
  mobileSrc,
  tabletSrc,
  desktopSrc,
  sizes = '100vw',
  priority = false,
}) => {
  const { deviceType } = useResponsive();
  
  const getImageSrc = () => {
    switch (deviceType) {
      case 'mobile':
      case 'mobile-large':
        return mobileSrc || src;
      case 'tablet':
        return tabletSrc || src;
      case 'desktop':
      case 'desktop-large':
      case 'desktop-xl':
        return desktopSrc || src;
      default:
        return src;
    }
  };

  return (
    <img
      src={getImageSrc()}
      alt={alt}
      className={`responsive-image ${className}`}
      sizes={sizes}
      loading={priority ? undefined : 'lazy'}
    />
  );
};

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClass?: string;
  tabletClass?: string;
  desktopClass?: string;
}

/**
 * Container component with device-specific styling
 * 
 * @example
 * <ResponsiveContainer
 *   className="base-styles"
 *   mobileClass="px-4 py-2"
 *   tabletClass="px-6 py-4"
 *   desktopClass="px-8 py-6"
 * >
 *   <Content />
 * </ResponsiveContainer>
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  mobileClass = '',
  tabletClass = '',
  desktopClass = '',
}) => {
  const { getResponsiveClasses } = useResponsive();
  
  const responsiveClasses = getResponsiveClasses({
    mobile: mobileClass,
    'mobile-large': mobileClass,
    tablet: tabletClass,
    desktop: desktopClass,
    'desktop-large': desktopClass,
    'desktop-xl': desktopClass,
  });
  
  return (
    <div className={`${className} ${responsiveClasses}`}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  mobileCols?: number;
  tabletCols?: number;
  desktopCols?: number;
  gap?: string;
}

/**
 * Responsive grid component with device-specific column counts
 * 
 * @example
 * <ResponsiveGrid
 *   mobileCols={1}
 *   tabletCols={2}
 *   desktopCols={3}
 *   gap="gap-4"
 * >
 *   {items.map(item => <GridItem key={item.id} {...item} />)}
 * </ResponsiveGrid>
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 3,
  gap = 'gap-4',
}) => {
  const { getResponsiveClasses } = useResponsive();
  
  const gridClasses = getResponsiveClasses({
    mobile: `grid-cols-${mobileCols}`,
    'mobile-large': `grid-cols-${mobileCols}`,
    tablet: `grid-cols-${tabletCols}`,
    desktop: `grid-cols-${desktopCols}`,
    'desktop-large': `grid-cols-${desktopCols}`,
    'desktop-xl': `grid-cols-${desktopCols}`,
  });
  
  return (
    <div className={`grid ${gridClasses} ${gap} ${className}`}>
      {children}
    </div>
  );
};

export default {
  ShowOn,
  HideOn,
  ShowOnDevice,
  HideOnDevice,
  MobileOnly,
  TabletOnly,
  DesktopOnly,
  MobileTablet,
  TabletDesktop,
  ResponsiveImage,
  ResponsiveContainer,
  ResponsiveGrid,
};
