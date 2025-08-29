import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DkimResult } from '@/types/dkim';

interface DkimExportProps {
  results: DkimResult[];
}

export const DkimExport: React.FC<DkimExportProps> = ({ results }) => {
  const generateCsvContent = () => {
    const headers = ['Selector', 'Domain', 'Full DKIM Host', 'Status', 'Valid', 'Record', 'Error'];
    const rows = results.map(result => [
      result.selector,
      result.domain,
      `${result.selector}._domainkey.${result.domain}`,
      result.status,
      result.valid ? 'Yes' : 'No',
      result.record || '',
      result.error || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const handleExport = () => {
    const csvContent = generateCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dkim-lookup-results-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (results.length === 0) {
    return null;
  }

  return (
    <Button onClick={handleExport} variant="outline" className="w-full">
      <Download className="mr-2 h-4 w-4" />
      Export Results ({results.length} records)
    </Button>
  );
};