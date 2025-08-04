import React from 'react';
import { Repeat } from 'lucide-react';

interface RecurrenceDisplayProps {
  recurrenceType?: 'one-time' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  className?: string;
}

const RecurrenceDisplay: React.FC<RecurrenceDisplayProps> = ({ 
  recurrenceType, 
  className = "" 
}) => {
  if (!recurrenceType || recurrenceType === 'one-time') {
    return null;
  }

  const getDisplayText = () => {
    switch (recurrenceType) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'bi-weekly':
        return 'Bi-weekly';
      case 'monthly':
        return 'Monthly';
      case 'quarterly':
        return 'Quarterly';
      default:
        return recurrenceType;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
      <Repeat className="w-3 h-3 mr-1" />
      {getDisplayText()}
    </span>
  );
};

export default RecurrenceDisplay;