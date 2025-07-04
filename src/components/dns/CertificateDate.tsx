
import React from 'react';

interface CertificateDateProps {
  date: string | null;
  label: string;
}

export const CertificateDate: React.FC<CertificateDateProps> = ({ date, label }) => {
  if (!date) return <span className="text-gray-500">Not Available</span>;
  
  try {
    const certDate = new Date(date);
    const now = new Date();
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(now.getMonth() + 1);

    let textColor = 'text-green-600 font-medium';
    if (label === 'Expires' && certDate < now) textColor = 'text-red-600 font-medium';
    else if (label === 'Expires' && certDate < oneMonthFromNow) textColor = 'text-yellow-600 font-medium';
    else if (label === 'Issued') textColor = 'text-blue-600 font-medium';
    
    return <span className={textColor}>{certDate.toLocaleDateString()}</span>;
  } catch(e) {
    return <span className="text-gray-500">Invalid Date</span>;
  }
};
