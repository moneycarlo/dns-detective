
import React from 'react';
import { Image, AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult } from '@/types/domain';
import { BimiLogo } from './BimiLogo';
import { CertificateDate } from './CertificateDate';
import { EmailClientPreview } from './EmailClientPreview';

interface BimiSectionProps {
  result: DomainResult;
}

export const BimiSection: React.FC<BimiSectionProps> = ({ result }) => {
  return (
    <div>
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Image size={16}/>
        BIMI
      </h3>
      {result.bimi.record ? (
        <div className="mt-2 space-y-4">
          <code className="block bg-gray-100 p-2 rounded-md text-sm break-all">{result.bimi.record}</code>
          {result.bimi.errors.map((e,i) => 
            <Alert key={i} variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{e}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Logo Preview Section */}
            <div>
              <h4 className="font-medium mb-2">Logo Preview</h4>
              {result.bimi.logoUrl ? (
                <div className="space-y-3">
                  <div className="w-24 h-24 mx-auto border-2 border-gray-200 rounded-full overflow-hidden shadow-md">
                    <BimiLogo logoUrl={result.bimi.logoUrl} domain={result.domain} />
                  </div>
                  <div className="text-center">
                    <a 
                      href={result.bimi.logoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1 text-blue-600 text-sm hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Full SVG
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                  <Image className="h-8 w-8" />
                </div>
              )}
            </div>

            {/* Certificate Details Section */}
            <div>
              <h4 className="font-medium mb-2">Certificate Details</h4>
              {!result.bimi.certificateUrl ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>No certificate (`a=`) tag found. A VMC is required by most email providers.</AlertDescription>
                </Alert>
              ) : (
                <div className="text-sm space-y-2 border p-3 rounded-md bg-gray-50">
                  <p><strong>Authority:</strong> <span className="font-mono text-xs">{result.bimi.certificateAuthority || 'Could not determine'}</span></p>
                  <p><strong>Issuer:</strong> <span className="font-mono text-xs">{result.bimi.certificateIssuer || 'Could not determine'}</span></p>
                  <p><strong>Issued:</strong> <CertificateDate date={result.bimi.certificateIssueDate} label="Issued" /></p>
                  <p><strong>Expires:</strong> <CertificateDate date={result.bimi.certificateExpiry} label="Expires" /></p>
                  <a href={result.bimi.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 text-xs hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    View Certificate
                  </a>
                </div>
              )}
            </div>
          </div>

          <EmailClientPreview logoUrl={result.bimi.logoUrl} domain={result.domain} />
        </div>
      ) : (
        <Alert className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{result.bimi.errors[0] || 'No BIMI record found.'}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
