import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className = '', ...props }: BadgeProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
