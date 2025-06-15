
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DomainInputProps {
  domains: string[];
  onDomainsChange: (domains: string[]) => void;
  onLookup: (domains: string[]) => void;
  isLoading: boolean;
}

export const DomainInput: React.FC<DomainInputProps> = ({
  domains,
  onDomainsChange,
  onLookup,
  isLoading
}) => {
  const [domainText, setDomainText] = useState(domains.join('\n'));
  const [errors, setErrors] = useState<string[]>([]);

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain.trim());
  };

  const handleTextChange = (value: string) => {
    setDomainText(value);
    const domainList = value
      .split('\n')
      .map(domain => domain.trim())
      .filter(domain => domain !== '');
    
    onDomainsChange(domainList);
    setErrors([]);
  };

  const handleLookup = () => {
    const domainList = domainText
      .split('\n')
      .map(domain => domain.trim())
      .filter(domain => domain !== '');
    
    if (domainList.length === 0) {
      toast({
        title: "No domains entered",
        description: "Please enter at least one domain to analyze.",
        variant: "destructive"
      });
      return;
    }

    if (domainList.length > 10) {
      toast({
        title: "Too many domains",
        description: "You can analyze up to 10 domains at once.",
        variant: "destructive"
      });
      return;
    }

    // Validate all domains
    const invalidDomains: string[] = [];
    domainList.forEach(domain => {
      if (!validateDomain(domain)) {
        invalidDomains.push(domain);
      }
    });

    if (invalidDomains.length > 0) {
      setErrors(invalidDomains);
      toast({
        title: "Invalid domains",
        description: `Please correct these invalid domains: ${invalidDomains.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    onLookup(domainList);
  };

  const domainCount = domainText
    .split('\n')
    .map(domain => domain.trim())
    .filter(domain => domain !== '').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Domains to analyze</Label>
        <Badge variant={domainCount > 10 ? "destructive" : "outline"}>
          {domainCount}/10
        </Badge>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Enter domains (one per line)&#10;example.com&#10;another-domain.com&#10;third-domain.org"
          value={domainText}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] resize-none"
          rows={6}
        />
        {errors.length > 0 && (
          <div className="text-sm text-red-500">
            <p className="font-medium">Invalid domains:</p>
            <ul className="list-disc list-inside">
              {errors.map((domain, index) => (
                <li key={index}>{domain}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Button
        onClick={handleLookup}
        disabled={isLoading || domainCount === 0 || domainCount > 10}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Analyzing...
          </>
        ) : (
          <>
            <Search className="h-4 w-4 mr-2" />
            Start DNS Lookup
          </>
        )}
      </Button>
    </div>
  );
};
