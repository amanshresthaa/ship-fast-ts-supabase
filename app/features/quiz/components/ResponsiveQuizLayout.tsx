'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useResponsive } from '@/app/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { MobileSidebarToggle } from './MobileSidebarToggle';
import LeftSidebar from './LeftSidebar';
import QuizHeader from './QuizHeader';
import QuizFooter from './QuizFooter';
import { useQuiz } from '../context/QuizContext';

interface ResponsiveQuizLayoutProps {
  children: ReactNode;
  quizId: string;
  className?: string;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  sidebarContent?: ReactNode;
  isSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  user?: any;
  effectiveQuestionTypes?: string[];
  effectiveQuestionType?: string;
}

export const ResponsiveQuizLayout: React.FC<ResponsiveQuizLayoutProps> = ({
  children,
  quizId,
  className,
  headerContent,
  footerContent,
  sidebarContent,
  isSidebarOpen: controlledIsSidebarOpen,
  onSidebarOpenChange,
  user,
  effectiveQuestionTypes,
  effectiveQuestionType,
}) => {
  const { state } = useQuiz();
  const { currentQuestionIndex, questions } = state;
  const { isMobile, isTablet, isDesktop, deviceType } = useResponsive();
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isControlled = typeof controlledIsSidebarOpen !== 'undefined';
  const sidebarOpen = isControlled ? controlledIsSidebarOpen : isMobileSidebarOpen;

  const handleSidebarToggle = () => {
    if (onSidebarOpenChange) {
      onSidebarOpenChange(!sidebarOpen);
    } else {
      setMobileSidebarOpen(!sidebarOpen);
    }
  };

  // Close mobile sidebar when switching to desktop view
  useEffect(() => {
    if (isDesktop && sidebarOpen) {
      if (onSidebarOpenChange) {
        onSidebarOpenChange(false);
      } else {
        setMobileSidebarOpen(false);
      }
    }
  }, [isDesktop, sidebarOpen, onSidebarOpenChange]);

  // Main layout classes
  const layoutClasses = cn(
    'flex flex-col h-screen bg-background',
    className
  );

  // Content area classes
  const contentClasses = cn(
    'flex-1 flex flex-col overflow-hidden',
    'transition-all duration-300 ease-in-out',
    {
      'ml-0': !isDesktop,
      'ml-64': isDesktop && sidebarOpen,
      'md:ml-64': isDesktop, // Always show sidebar on desktop
    }
  );

  // Sidebar classes
  const sidebarClasses = cn(
    'fixed inset-y-0 left-0 z-40 w-64 bg-card shadow-lg transform transition-transform duration-300 ease-in-out',
    'md:relative md:translate-x-0', // Always visible on desktop
    {
      'translate-x-0': sidebarOpen,
      '-translate-x-full': !sidebarOpen,
    }
  );

  return (
    <div className={layoutClasses}>
      {/* Mobile Header with Toggle */}
      <header className="md:hidden border-b border-border">
        <div className="flex items-center justify-between p-4">
          <MobileSidebarToggle quizTitle={state.quiz?.title || 'Quiz'}>
            {sidebarContent || <LeftSidebar quizId={quizId} />}
          </MobileSidebarToggle>
          <h1 className="text-lg font-semibold">{state.quiz?.title || 'Quiz'}</h1>
          <div className="w-8"></div> {/* Spacer for flex alignment */}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={sidebarClasses}>
          <div className="h-full overflow-y-auto">
            {sidebarContent || (
              <LeftSidebar quizId={quizId} />
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className={contentClasses}>
          {/* Desktop Header */}
          <header className="hidden md:block border-b border-border">
            {headerContent || (
              <div className="p-4">
                <QuizHeader 
                  quizId={quizId}
                  user={user}
                  effectiveQuestionTypes={effectiveQuestionTypes}
                  effectiveQuestionType={effectiveQuestionType}
                />
              </div>
            )}
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </div>

          {/* Footer */}
          {footerContent || (
            <footer className="border-t border-border p-4">
              <QuizFooter currentQuestionId={questions[currentQuestionIndex]?.id} />
            </footer>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResponsiveQuizLayout;