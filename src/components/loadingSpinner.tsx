// components/LoadingSpinner.tsx
import React from 'react';

// Define the props interface
interface LoadingSpinnerProps {
  message?: string; // Optional message to display
  size?: 'small' | 'medium' | 'large'; // Optional size for the spinner
}

export function LoadingSpinner({ message = 'Loading...', size = 'medium' }: LoadingSpinnerProps) {
  // Determine spinner and text sizes based on the 'size' prop
  const spinnerSizeClass = {
    small: 'h-5 w-5 border-2',
    medium: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4',
  }[size];

  const textSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[size];

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${spinnerSizeClass}`}
        role="status">
        <span
          className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
        >Loading...</span>
      </div>
      <span className={`ml-3 text-gray-600 ${textSizeClass}`}>{message}</span>
    </div>
  );
}