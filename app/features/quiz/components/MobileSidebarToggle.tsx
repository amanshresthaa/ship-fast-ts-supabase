'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import Icons from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

export type MobileSidebarToggleProps = {
  /** Content to be displayed inside the sidebar */
  children: React.ReactNode;
  /** Title to display in the mobile header */
  quizTitle?: string;
  /** Additional class names */
  className?: string;
  /** Whether the sidebar is currently open */
  isOpen?: boolean;
  /** Callback when the toggle button is clicked */
  onToggle?: (isOpen: boolean) => void;
  /** Whether to show the back button */
  showBackButton?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Whether to show the close button in the sidebar */
  showCloseButton?: boolean;
};

/**
 * MobileSidebarToggle component for toggling the sidebar on mobile devices.
 * Handles touch events and keyboard navigation for better accessibility.
 */
const MobileSidebarToggle = ({
  children,
  quizTitle = 'Quiz',
  className,
  isOpen: controlledIsOpen,
  onToggle,
  showBackButton = true,
  onBack,
  showCloseButton = true,
}: MobileSidebarToggleProps) => {
  const isControlled = typeof controlledIsOpen !== 'undefined';
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Handle toggle state
  const toggleSidebar = () => {
    const newState = !isOpen;
    if (onToggle) {
      onToggle(newState);
    } else {
      setInternalIsOpen(newState);
    }
    
    // Toggle body scroll lock
    if (newState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  // Handle back button click
  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  // Close sidebar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target as Node) &&
        toggleButtonRef.current &&
        !toggleButtonRef.current.contains(event.target as Node)
      ) {
        toggleSidebar();
      }
    };

    // Handle keyboard events
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        toggleSidebar();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Reset on unmount
    };
  }, [isOpen]);

  // Handle focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = sidebarRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header */}
      <div 
        className={cn(
          'md:hidden w-full bg-card/80 backdrop-blur-sm border-b border-border/40',
          'sticky top-0 z-50',
          className
        )}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            {showBackButton && (
              <Button
                ref={toggleButtonRef}
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-9 w-9 p-0"
                aria-label="Go back"
              >
                <Icons.ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Go back</span>
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground truncate max-w-[180px]">
              {quizTitle}
            </h1>
          </div>
          
          <Button
            ref={toggleButtonRef}
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-9 w-9 p-0"
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={isOpen}
            aria-controls="mobile-sidebar"
          >
            {isOpen ? (
              <Icons.X className="h-6 w-6" aria-hidden={true} />
            ) : (
              <Icons.Menu className="h-6 w-6" aria-hidden={true} />
            )}
          </Button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleSidebar}
          role="presentation"
          aria-hidden={!isOpen}
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        id="mobile-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col',
          'border-r border-border/40',
          'md:hidden', // Hide on desktop
          {
            'translate-x-0': isOpen,
            '-translate-x-full': !isOpen,
          },
          'focus:outline-none' // Remove outline since we handle focus manually
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
        tabIndex={-1}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h2 id="sidebar-title" className="font-semibold text-foreground">
            Navigation
          </h2>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
              aria-label="Close sidebar"
            >
              <Icons.X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {children}
        </div>
      </div>
    </>
  );
};

export { MobileSidebarToggle };
