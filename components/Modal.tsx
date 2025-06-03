"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import React from "react";
import { useResponsive } from "@/app/hooks/useResponsive";
import { ResponsiveContainer } from "@/app/components/ResponsiveComponents";

interface ModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';
  className?: string;
}

// Enhanced responsive modal component with mobile-first design
// Features device-specific sizing, touch-friendly interactions, and accessibility improvements
const Modal = ({ 
  isModalOpen, 
  setIsModalOpen, 
  title = "Modal",
  children,
  size = 'md',
  position = 'center',
  className = ""
}: ModalProps) => {
  const { isMobile, isTablet, deviceType, isTouchDevice } = useResponsive();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Get responsive modal size classes
  const getModalSizeClasses = () => {
    if (isMobile) {
      // Mobile-first approach: full width with small margins
      switch (size) {
        case 'sm': return 'w-full max-w-sm mx-4';
        case 'md': return 'w-full max-w-md mx-4';
        case 'lg': return 'w-full max-w-lg mx-4';
        case 'xl': return 'w-full max-w-xl mx-4';
        case 'full': return 'w-full mx-2 h-full max-h-[calc(100vh-1rem)]';
        default: return 'w-full max-w-md mx-4';
      }
    } else if (isTablet) {
      // Tablet-specific sizing
      switch (size) {
        case 'sm': return 'w-full max-w-md';
        case 'md': return 'w-full max-w-lg';
        case 'lg': return 'w-full max-w-xl';
        case 'xl': return 'w-full max-w-2xl';
        case 'full': return 'w-full mx-8 h-full max-h-[calc(100vh-4rem)]';
        default: return 'w-full max-w-lg';
      }
    } else {
      // Desktop sizing
      switch (size) {
        case 'sm': return 'w-full max-w-lg';
        case 'md': return 'w-full max-w-xl';
        case 'lg': return 'w-full max-w-2xl';
        case 'xl': return 'w-full max-w-4xl';
        case 'full': return 'w-full mx-8 h-full max-h-[calc(100vh-4rem)]';
        default: return 'w-full max-w-xl';
      }
    }
  };

  // Get positioning classes
  const getPositionClasses = () => {
    if (isMobile && size === 'full') {
      return 'flex min-h-full items-stretch justify-center';
    }

    switch (position) {
      case 'top': return 'flex min-h-full items-start justify-center pt-4 md:pt-8';
      case 'bottom': return 'flex min-h-full items-end justify-center pb-4 md:pb-8';
      case 'center': 
      default: return 'flex min-h-full items-center justify-center p-4';
    }
  };

  // Get device-specific padding
  const getModalPadding = () => {
    if (isMobile) {
      return size === 'full' ? 'p-4' : 'p-4 md:p-6';
    } else if (isTablet) {
      return 'p-6 md:p-8';
    }
    return 'p-6 md:p-8 lg:p-10';
  };

  // Get close button classes
  const getCloseButtonClasses = () => {
    const baseClasses = "btn btn-square btn-ghost";
    
    if (isTouchDevice) {
      return `${baseClasses} btn-md min-h-[44px] min-w-[44px]`;
    }
    
    return `${baseClasses} btn-sm`;
  };
  return (
    <Transition appear show={isModalOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => setIsModalOpen(false)}
      >
        {/* Enhanced backdrop with device-specific blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className={`
            fixed inset-0 bg-black/60
            ${isMobile ? 'backdrop-blur-sm' : 'backdrop-blur-md'}
          `} />
        </Transition.Child>

        {/* Modal container with responsive positioning */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className={getPositionClasses()}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom={`opacity-0 ${isMobile ? 'scale-95 translate-y-4' : 'scale-95'}`}
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo={`opacity-0 ${isMobile ? 'scale-95 translate-y-4' : 'scale-95'}`}
            >
              <ResponsiveContainer>
                <Dialog.Panel className={`
                  relative transform text-left align-middle shadow-2xl 
                  transition-all bg-base-100 rounded-xl overflow-hidden
                  ${getModalSizeClasses()}
                  ${getModalPadding()}
                  ${className}
                `}>
                  {/* Modal header with responsive spacing */}
                  <div className={`
                    flex justify-between items-start gap-4
                    ${isMobile ? 'mb-4' : 'mb-6'}
                  `}>
                    <Dialog.Title 
                      as="h2" 
                      className={`
                        font-semibold text-base-content pr-4
                        ${isMobile ? 'text-lg leading-tight' : 'text-xl md:text-2xl'}
                      `}
                    >
                      {title}
                    </Dialog.Title>
                    
                    {/* Enhanced close button with touch-friendly sizing */}
                    <button
                      className={`
                        ${getCloseButtonClasses()}
                        hover:bg-base-200 focus:outline-none focus:ring-2 
                        focus:ring-primary focus:ring-offset-2 transition-colors duration-200
                        flex-shrink-0
                      `}
                      onClick={() => setIsModalOpen(false)}
                      aria-label="Close modal"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={isMobile ? "w-5 h-5" : "w-4 h-4"}
                        aria-hidden="true"
                      >
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                  </div>

                  {/* Modal content with responsive spacing */}
                  <section className={`
                    text-base-content
                    ${isMobile ? 'text-sm leading-relaxed' : 'text-base'}
                  `}>
                    {children || (
                      <div>
                        <p className="mb-4">
                          This is a responsive modal that adapts to different screen sizes.
                        </p>
                        <p className="text-base-content/70">
                          Current device: <span className="font-medium">{deviceType}</span>
                          {isTouchDevice && <span className="ml-2">(Touch enabled)</span>}
                        </p>
                      </div>
                    )}
                  </section>

                  {/* Debug info in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-6 pt-4 border-t border-base-300 text-xs text-base-content/60">
                      Size: {size} • Position: {position} • Device: {deviceType}
                    </div>
                  )}
                </Dialog.Panel>
              </ResponsiveContainer>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
