
import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DomainResult } from '@/pages/Index';
import { Download, FileText, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExportButtonProps {
  results: DomainResult[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({ results }) => {
  const exportToJSON = () => {
    const completedResults = results.filter(r => r.status === 'completed');
    if (completedResults.length === 0) {
      toast({
        title: "No data to export",
        description: "Complete at least one domain lookup to export results.",
        variant: "destructive"
      });
      return;
    }

    const dataStr = JSON.stringify(completedResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dns-lookup-results-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export successful",
      description: "Results exported as JSON file.",
    });
  };

  const exportToCSV = () => {
    const completedResults = results.filter(r => r.status === 'completed');
    if (completedResults.length === 0) {
      toast({
        title: "No data to export",
        description: "Complete at least one domain lookup to export results.",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Domain',
      'SPF Record',
      'SPF Valid',
      'SPF Errors',
      'DMARC Record',
      'DMARC Valid',
      'DMARC Policy',
      'DMARC Errors',
      'BIMI Record',
      'BIMI Valid',
      'BIMI Logo URL',
      'BIMI Certificate Expiry',
      'BIMI Errors'
    ];

    const csvContent = [
      headers.join(','),
      ...completedResults.map(result => [
        result.domain,
        `"${result.spf.record || ''}"`,
        result.spf.valid,
        `"${result.spf.errors.join('; ')}"`,
        `"${result.dmarc.record || ''}"`,
        result.dmarc.valid,
        result.dmarc.policy,
        `"${result.dmarc.errors.join('; ')}"`,
        `"${result.bimi.record || ''}"`,
        result.bimi.valid,
        result.bimi.logoUrl || '',
        result.bimi.certificateExpiry || '',
        `"${result.bimi.errors.join('; ')}"`
      ].join(','))
    ].join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `dns-lookup-results-${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export successful",
      description: "Results exported as CSV file.",
    });
  };

  const exportToText = () => {
    const completedResults = results.filter(r => r.status === 'completed');
    if (completedResults.length === 0) {
      toast({
        title: "No data to export",
        description: "Complete at least one domain lookup to export results.",
        variant: "destructive"
      });
      return;
    }

    const textContent = completedResults.map(result => {
      return `
DOMAIN: ${result.domain}
${'='.repeat(50)}

SPF RECORD:
${result.spf.record || 'No SPF record found'}
Valid: ${result.spf.valid ? 'Yes' : 'No'}
${result.spf.errors.length > 0 ? 'Errors: ' + result.spf.errors.join(', ') : ''}

NESTED SPF LOOKUPS:
${Object.entries(result.spf.nestedLookups).map(([domain, record]) => `${domain}: ${record}`).join('\n') || 'None'}

DMARC RECORD:
${result.dmarc.record || 'No DMARC record found'}
Valid: ${result.dmarc.valid ? 'Yes' : 'No'}
Policy: ${result.dmarc.policy}
${result.dmarc.errors.length > 0 ? 'Errors: ' + result.dmarc.errors.join(', ') : ''}

BIMI RECORD:
${result.bimi.record || 'No BIMI record found'}
Valid: ${result.bimi.valid ? 'Yes' : 'No'}
Logo URL: ${result.bimi.logoUrl || 'None'}
Certificate Expiry: ${result.bimi.certificateExpiry || 'None'}
${result.bimi.errors.length > 0 ? 'Errors: ' + result.bimi.errors.join(', ') : ''}

`;
    }).join('\n');

    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
    const exportFileDefaultName = `dns-lookup-results-${new Date().toISOString().split('T')[0]}.txt`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export successful",
      description: "Results exported as text file.",
    });
  };

  const completedCount = results.filter(r => r.status === 'completed').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full"
          disabled={completedCount === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Results ({completedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={exportToJSON}>
          <File className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToText}>
          <FileText className="h-4 w-4 mr-2" />
          Export as Text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
