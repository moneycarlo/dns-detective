
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Shield, Mail, Image } from 'lucide-react';
import { DomainResult } from '@/types/domain';

interface ExportButtonProps {
  results: DomainResult[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ results }) => {
  const exportSpfToCsv = () => {
    const csvHeader = 'Domain,SPF Record,Valid,Mechanisms,Includes,Redirects,Lookup Count,Exceeds Limit\n';
    const csvContent = results.map(result => [
      result.domain,
      result.spf.record ? `"${result.spf.record.replace(/"/g, '""')}"` : 'No Record',
      result.spf.valid ? 'Yes' : 'No',
      `"${result.spf.mechanisms.join('; ')}"`,
      `"${result.spf.includes.join('; ')}"`,
      `"${result.spf.redirects.join('; ')}"`,
      result.spf.lookupCount,
      result.spf.exceedsLookupLimit ? 'Yes' : 'No'
    ].join(',')).join('\n');
    
    const csvData = csvHeader + csvContent;
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvData);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'spf-records.csv');
    linkElement.click();
  };

  const exportDmarcToCsv = () => {
    const csvHeader = 'Domain,DMARC Record,Errors,Warnings,v,p,sp,adkim,aspf,pct,fo,rf,ri,rua,ruf\n';
    const csvContent = results.map(result => [
      result.domain,
      result.dmarc.record ? `"${result.dmarc.record.replace(/"/g, '""')}"` : 'No Record',
      result.dmarc.errors.length > 0 ? `"${result.dmarc.errors.join('; ')}"` : '',
      result.dmarc.warnings.length > 0 ? `"${result.dmarc.warnings.join('; ')}"` : '',
      result.dmarc.record ? 'DMARC1' : '',
      result.dmarc.policy || '',
      result.dmarc.subdomainPolicy || '',
      result.dmarc.adkim || 'r',
      result.dmarc.aspf || 'r',
      result.dmarc.percentage || '100',
      result.dmarc.fo || '0',
      result.dmarc.rf || 'afrf',
      result.dmarc.ri || '86400',
      result.dmarc.ruaEmails ? result.dmarc.ruaEmails.join('; ') : '',
      result.dmarc.rufEmails ? result.dmarc.rufEmails.join('; ') : ''
    ].join(',')).join('\n');
    
    const csvData = csvHeader + csvContent;
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvData);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'dmarc-records.csv');
    linkElement.click();
  };

  const exportBimiToCsv = () => {
    const csvHeader = 'Domain,BIMI Record,Valid,Logo URL,Certificate URL,Certificate Expiry,Errors\n';
    const csvContent = results.map(result => [
      result.domain,
      result.bimi.record ? `"${result.bimi.record.replace(/"/g, '""')}"` : 'No Record',
      result.bimi.valid ? 'Yes' : 'No',
      result.bimi.logoUrl || '',
      result.bimi.certificateUrl || '',
      result.bimi.certificateExpiry || '',
      `"${result.bimi.errors.join('; ')}"` || ''
    ].join(',')).join('\n');
    
    const csvData = csvHeader + csvContent;
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvData);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'bimi-records.csv');
    linkElement.click();
  };

  const exportAllToJson = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'dns-security-report.json');
    linkElement.click();
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">Export by Record Type</div>
      
      <Button 
        onClick={exportSpfToCsv} 
        variant="outline" 
        className="w-full"
        disabled={results.length === 0}
      >
        <Shield className="h-4 w-4 mr-2" />
        Export SPF Records
      </Button>
      
      <Button 
        onClick={exportDmarcToCsv} 
        variant="outline" 
        className="w-full"
        disabled={results.length === 0}
      >
        <Mail className="h-4 w-4 mr-2" />
        Export DMARC Records
      </Button>
      
      <Button 
        onClick={exportBimiToCsv} 
        variant="outline" 
        className="w-full"
        disabled={results.length === 0}
      >
        <Image className="h-4 w-4 mr-2" />
        Export BIMI Records
      </Button>

      <div className="border-t pt-3 mt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Export All</div>
        <Button 
          onClick={exportAllToJson} 
          variant="outline" 
          className="w-full"
          disabled={results.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export All (JSON)
        </Button>
      </div>
    </div>
  );
};
