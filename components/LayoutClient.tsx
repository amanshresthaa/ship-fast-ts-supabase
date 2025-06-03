"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import { useResponsive } from "@/app/hooks/useResponsive";
import config from "@/config";

// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = (): null => {
  const pathname = usePathname();

  const supabase = createClientComponentClient();
  const [data, setData] = useState(null);

  // This is used to get the user data from Supabase Auth (if logged in) => user ID is used to identify users in Crisp
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setData(session.user);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (config?.crisp?.id) {
      // Set up Crisp
      Crisp.configure(config.crisp.id);

      // (Optional) If onlyShowOnRoutes array is not empty in config.js file, Crisp will be hidden on the routes in the array.
      // Use <AppButtonSupport> instead to show it (user clicks on the button to show Crisp—it cleans the UI)
      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (data?.user && config?.crisp?.id) {
      Crisp.session.setData({ userId: data.user?.id });
    }
  }, [data]);

  return null;
};

// All the client wrappers are here (they can't be in server components)
// Enhanced with responsive design features and device-specific optimizations
// 1. NextTopLoader: Show a progress bar at the top when navigating between pages
// 2. Toaster: Show Success/Error messages anywhere from the app with toast()
// 3. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 4. CrispChat: Set Crisp customer chat support (see above)
// 5. ResponsiveProvider: Provides responsive context and device-specific optimizations
const ClientLayout = ({ children }: { children: ReactNode }) => {
  const { isMobile, deviceType, isTouchDevice } = useResponsive();

  // Device-specific toast configuration
  const getToasterConfig = () => {
    if (isMobile) {
      return {
        duration: 4000, // Longer duration on mobile for easier reading
        position: 'top-center' as const,
        toastOptions: {
          style: {
            fontSize: '14px',
            padding: '12px 16px',
            maxWidth: '90vw',
          },
        },
      };
    }
    
    return {
      duration: 3000,
      position: 'top-right' as const,
      toastOptions: {
        style: {
          fontSize: '16px',
          padding: '16px 20px',
        },
      },
    };
  };

  // Device-specific tooltip configuration
  const getTooltipConfig = () => {
    if (isTouchDevice) {
      return {
        clickable: true,
        openOnClick: true,
        closeOnClick: true,
        delayShow: 0,
        delayHide: 0,
      };
    }
    
    return {
      delayShow: 500,
      delayHide: 100,
    };
  };

  const toasterConfig = getToasterConfig();
  const tooltipConfig = getTooltipConfig();

  return (
    <>
      {/* Progressive loading bar - thinner on mobile for less visual interference */}
      <NextTopLoader 
        color={config.colors.main} 
        showSpinner={false}
        height={isMobile ? 2 : 3}
        speed={isMobile ? 150 : 200}
        easing="ease"
      />

      {/* Add responsive meta info to document head for debugging in development */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed bottom-4 left-4 z-[100] bg-black/80 text-white text-xs p-2 rounded-lg font-mono pointer-events-none"
          style={{ display: 'block' }}
        >
          {deviceType} | Touch: {isTouchDevice ? 'Y' : 'N'}
        </div>
      )}

      {/* Content inside app/page.js files with responsive wrapper */}
      <div className="min-h-screen flex flex-col">
        {children}
      </div>

      {/* Responsive toast notifications */}
      <Toaster
        position={toasterConfig.position}
        toastOptions={{
          duration: toasterConfig.duration,
          ...toasterConfig.toastOptions,
          success: {
            iconTheme: {
              primary: config.colors.main,
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Enhanced tooltips with device-specific behavior */}
      <Tooltip
        id="tooltip"
        className={`z-[60] !opacity-100 shadow-lg ${isMobile ? 'max-w-xs text-sm' : 'max-w-sm'}`}
        {...tooltipConfig}
      />

      {/* Customer chat support with responsive positioning */}
      <CrispChat />
      
      {/* Add responsive styles to document head for global responsive behavior */}
      {typeof window !== 'undefined' && (
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              ${isMobile ? 'touch-action: manipulation;' : ''}
              ${isMobile ? '-webkit-font-smoothing: antialiased;' : ''}
              ${isMobile ? '-moz-osx-font-smoothing: grayscale;' : ''}
            }
            
            /* Enhanced tap targets for mobile */
            ${isTouchDevice ? `
              button:not(.no-min-size), a:not(.no-min-size), [role="button"]:not(.no-min-size) {
                min-height: 44px;
                min-width: 44px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
              }
            ` : ''}
            
            /* Optimize scrolling on mobile */
            ${isMobile ? `
              * {
                -webkit-overflow-scrolling: touch;
              }
              
              html {
                -webkit-text-size-adjust: 100%;
              }
            ` : ''}
          `
        }} />
      )}
    </>
  );
};

export default ClientLayout;
