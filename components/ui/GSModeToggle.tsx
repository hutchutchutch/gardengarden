import React from 'react';
import ModeToggle from './mode-toggle';

interface GSModeToggleProps {
  className?: string;
}

export const GSModeToggle: React.FC<GSModeToggleProps> = ({ className }) => {
  return <ModeToggle className={className} />;
};