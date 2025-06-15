
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search } from 'lucide-react';
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
  const [errors, setErrors] = useState<{ [key: number]: string }>({});

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    return domainRegex.test(domain.trim());
  };

  const handleDomainChange = (index: number, value: string) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    onDomainsChange(newDomains);

    // Clear error when user starts typing
    if (errors[index]) {
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const addDomain = () => {
    if (domains.length < 10) {
      onDomainsChange([...domains, '']);
    } else {
      toast({
        title: "Maximum domains reached",
        description: "You can analyze up to 10 domains at once.",
        variant: "destructive"
      });
    }
  };

  const removeDomain = (index: number) => {
    const newDomains = domains.filter((_, i) => i !== index);
    onDomainsChange(newDomains.length > 0 ? newDomains : ['']);
    
    // Remove error for this index
    const newErrors = { ...errors };
    delete newErrors[index];
    setErrors(newErrors);
  };

  const handleLookup = () => {
    const validDomains = domains.filter(domain => domain.trim() !== '');
    const newErrors: { [key: number]: string } = {};
    
    if (validDomains.length === 0) {
      toast({
        title: "No domains entered",
        description: "Please enter at least one domain to analyze.",
        variant: "destructive"
      });
      return;
    }

    // Validate all domains
    let hasErrors = false;
    domains.forEach((domain, index) => {
      if (domain.trim() !== '' && !validateDomain(domain)) {
        newErrors[index] = 'Invalid domain format';
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      toast({
        title: "Invalid domains",
        description: "Please correct the invalid domain formats.",
        variant: "destructive"
      });
      return;
    }

    onLookup(validDomains);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Domains to analyze</Label>
        <Badge variant="outline">
          {domains.filter(d => d.trim() !== '').length}/10
        </Badge>
      </div>

      <div className="space-y-3">
        {domains.map((domain, index) => (
          <div key={index} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder={`Enter domain ${index + 1}`}
                value={domain}
                onChange={(e) => handleDomainChange(index, e.target.value)}
                className={errors[index] ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors[index] && (
                <p className="text-sm text-red-500 mt-1">{errors[index]}</p>
              )}
            </div>
            {domains.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeDomain(index)}
                disabled={isLoading}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={addDomain}
          disabled={domains.length >= 10 || isLoading}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </Button>
      </div>

      <Button
        onClick={handleLookup}
        disabled={isLoading || domains.every(d => d.trim() === '')}
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
