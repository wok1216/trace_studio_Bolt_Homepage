import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-3xl border border-gray-100
        shadow-soft
        ${hover ? 'card-hover hover:shadow-soft-lg cursor-pointer' : ''}
        transition-all duration-300 ease-out
        ${className}
      `}
    >
      {children}
    </div>
  );
}
