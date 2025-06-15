
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { DomainResult } from '@/types/domain';

interface ExportButtonProps {
  results: DomainResult[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ results }) => {
  const exportToJson = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'dns-security-report.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportToCsv = () => {
    const csvHeader = 'Domain,SPF Record,SPF Valid,DMARC Record,DMARC Valid,BIMI Record,BIMI Valid\n';
    const csvContent = results.map(result => [
      result.domain,
      result.spf.record ? `"${result.spf.record.replace(/"/g, '""')}"` : 'No Record',
      result.spf.valid ? 'Yes' : 'No',
      result.dmarc.record ? `"${result.dmarc.record.replace(/"/g, '""')}"` : 'No Record',
      result.dmarc.valid ? 'Yes' : 'No',
      result.bimi.record ? `"${result.bimi.record.replace(/"/g, '""')}"` : 'No Record',
      result.bimi.valid ? 'Yes' : 'No'
    ].join(',')).join('\n');
    
    const csvData = csvHeader + csvContent;
    const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvData);
    
    const exportFileDefaultName = 'dns-security-report.csv';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-2">
      <Button 
        onClick={exportToJson} 
        variant="outline" 
        className="w-full"
        disabled={results.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Export JSON
      </Button>
      <Button 
        onClick={exportToCsv} 
        variant="outline" 
        className="w-full"
        disabled={results.length === 0}
      >
        <FileText className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
};
