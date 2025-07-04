
import React, { useState, useEffect } from 'react';

interface BimiLogoProps {
  logoUrl: string | null;
  domain: string;
}

export const BimiLogo: React.FC<BimiLogoProps> = ({ logoUrl, domain }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => { 
    setHasError(false); 
    setIsLoading(!!logoUrl);
  }, [logoUrl]);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  if (!logoUrl || hasError) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xl">
        {domain ? domain.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        </div>
      )}
      <img 
        src={logoUrl} 
        alt={`${domain} BIMI logo`} 
        className="w-full h-full object-contain rounded-full" 
        onLoad={handleLoad}
        onError={handleError}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};
