import React from 'react';

type SignificanceLevel = 'HIGH_SIGNIFICANCE' | 'MEDIUM_SIGNIFICANCE' | 'LOW_SIGNIFICANCE' | 'NOT_SIGNIFICANT';

interface SignificanceBadgeProps {
  level: SignificanceLevel;
}

const levelConfig: Record<SignificanceLevel, { label: string; colors: string }> = {
  HIGH_SIGNIFICANCE: { label: 'Alta', colors: 'bg-red-100 text-red-800 border-red-200' },
  MEDIUM_SIGNIFICANCE: { label: 'Media', colors: 'bg-orange-100 text-orange-800 border-orange-200' },
  LOW_SIGNIFICANCE: { label: 'Baja', colors: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  NOT_SIGNIFICANT: { label: 'No Significativo', colors: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export const SignificanceBadge: React.FC<SignificanceBadgeProps> = ({ level }) => {
  const config = levelConfig[level] || levelConfig.NOT_SIGNIFICANT;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.colors}`}>
      {config.label}
    </span>
  );
};
