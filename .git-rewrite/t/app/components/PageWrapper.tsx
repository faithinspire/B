import { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standard page wrapper component that ensures proper spacing
 * and responsive layout across all pages
 */
export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 pb-24 md:pb-8 ${className}`}>
      {children}
    </div>
  );
}
