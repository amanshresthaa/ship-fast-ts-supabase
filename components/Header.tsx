"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import logo from "@/app/icon.png";
import config from "@/config";
import { useResponsive } from "@/app/hooks/useResponsive";
import { MobileOnly, DesktopOnly } from "@/app/components/ResponsiveComponents";

const links: {
  href: string;
  label: string;
}[] = [
  {
    href: "/#pricing",
    label: "Pricing",
  },
  {
    href: "/quizzes",
    label: "Learning Quizzes",
  },
  {
    href: "/#testimonials",
    label: "Reviews",
  },
  {
    href: "/#faq",
    label: "FAQ",
  },
];

const cta: JSX.Element = <ButtonSignin extraStyle="btn-primary" />;

// Enhanced responsive header with improved UX across all device types
// Features mobile-first design with optimized touch targets and smooth animations
const Header = () => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { isMobile, isTablet, deviceType, isTouchDevice } = useResponsive();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Dynamic classes based on device type
  const getHeaderClasses = () => {
    const baseClasses = "bg-base-200 sticky top-0 z-50 shadow-sm";
    
    if (isMobile) {
      return `${baseClasses} backdrop-blur-sm bg-base-200/95`;
    }
    
    return baseClasses;
  };

  const getNavClasses = () => {
    const baseClasses = "container flex items-center justify-between mx-auto transition-all duration-300";
    
    if (isMobile) {
      return `${baseClasses} px-4 py-3`;
    } else if (isTablet) {
      return `${baseClasses} px-6 py-4`;
    }
    
    return `${baseClasses} px-8 py-4`;
  };

  const getLinkClasses = () => {
    const baseClasses = "link link-hover transition-colors duration-200";
    
    if (isTouchDevice) {
      return `${baseClasses} min-h-[44px] flex items-center px-2 py-2 rounded-lg hover:bg-base-300`;
    }
    
    return `${baseClasses} hover:text-primary`;
  };

  return (
    <header className={getHeaderClasses()}>
      <nav
        className={getNavClasses()}
        aria-label="Global navigation"
        role="navigation"
      >
        {/* Logo section - responsive sizing */}
        <div className="flex lg:flex-1">
          <Link
            className="flex items-center gap-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
            href="/"
            title={`${config.appName} homepage`}
          >
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className={isMobile ? "w-7 h-7" : "w-8 h-8"}
              placeholder="blur"
              priority={true}
              width={32}
              height={32}
            />
            <span className={`font-extrabold ${isMobile ? 'text-base' : 'text-lg'}`}>
              {config.appName}
            </span>
          </Link>
        </div>

        {/* Mobile hamburger button with enhanced accessibility */}
        <MobileOnly>
          <div className="flex lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-3 rounded-lg text-base-content hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200"
              onClick={() => setIsOpen(true)}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              aria-label={isOpen ? "Close main menu" : "Open main menu"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </MobileOnly>

        {/* Desktop navigation with improved spacing */}
        <DesktopOnly>
          <div className="hidden lg:flex lg:justify-center lg:gap-8 xl:gap-12 lg:items-center">
            {links.map((link) => (
              <Link
                href={link.href}
                key={link.href}
                className={getLinkClasses()}
                title={link.label}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </DesktopOnly>

        {/* Desktop CTA */}
        <DesktopOnly>
          <div className="hidden lg:flex lg:justify-end lg:flex-1">
            {cta}
          </div>
        </DesktopOnly>
      </nav>

      {/* Enhanced mobile menu with better UX and accessibility */}
      <div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
        {/* Backdrop overlay with blur effect */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
        
        {/* Mobile menu panel */}
        <div
          id="mobile-menu"
          className={`
            fixed inset-y-0 right-0 z-10 w-full max-w-sm
            px-6 py-6 overflow-y-auto bg-base-100 shadow-2xl
            transform origin-right transition-all duration-300 ease-in-out
            ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          {/* Mobile menu header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              className="flex items-center gap-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
              title={`${config.appName} homepage`}
              href="/"
            >
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                className="w-8 h-8"
                placeholder="blur"
                priority={true}
                width={32}
                height={32}
              />
              <span id="mobile-menu-title" className="font-extrabold text-lg">
                {config.appName}
              </span>
            </Link>
            
            {/* Enhanced close button */}
            <button
              type="button"
              className="p-3 rounded-lg text-base-content hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile navigation links */}
          <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
            {links.map((link, index) => (
              <Link
                href={link.href}
                key={link.href}
                className="block px-4 py-3 text-base font-medium text-base-content hover:bg-base-200 hover:text-primary rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                title={link.label}
                onClick={() => setIsOpen(false)}
                tabIndex={isOpen ? 0 : -1}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile CTA section */}
          <div className="mt-8 pt-6 border-t border-base-300">
            <div className="space-y-3">
              {cta}
            </div>
          </div>
          
          {/* Device info for debugging (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-4 border-t border-base-300 text-xs text-base-content/60">
              Device: {deviceType} • Touch: {isTouchDevice ? 'Yes' : 'No'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
