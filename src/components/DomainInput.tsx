import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LookupType } from '@/types/domain';

interface DomainInputProps {
  onLookup: (domains: string[], lookupType: LookupType) => void;
  isLoading: boolean;
}

export const DomainInput: React.FC<DomainInputProps> = ({ onLookup, isLoading }) => {
  const [domainText, setDomainText] = useState('');
  const [lookupType, setLookupType] = useState<LookupType>('ALL');

  const handleLookupClick = () => {
    const domainList = domainText
      .split('\n')
      .map(domain => domain.trim())
      .filter(domain => domain !== '');
    
    if (domainList.length === 0) {
      toast({ title: "No domains entered", description: "Please enter at least one domain.", variant: "destructive" });
      return;
    }
    onLookup(domainList, lookupType);
  };

  const domainCount = domainText.split('\n').filter(d => d.trim() !== '').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="domain-input" className="text-sm font-medium">Domains to analyze</Label>
        <Badge variant={domainCount > 10 ? "destructive" : "outline"}>{domainCount}/10</Badge>
      </div>
      <Textarea
        id="domain-input"
        placeholder="Enter domains (one per line)&#10;google.com&#10;yahoo.com"
        value={domainText}
        onChange={(e) => setDomainText(e.target.value)}
        disabled={isLoading}
        className="min-h-[120px] resize-none"
        rows={6}
      />
      <div className="flex gap-2">
        <Select value={lookupType} onValueChange={(value) => setLookupType(value as LookupType)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="SPF">SPF</SelectItem>
            <SelectItem value="DMARC">DMARC</SelectItem>
            <SelectItem value="BIMI">BIMI</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleLookupClick} disabled={isLoading || domainCount === 0 || domainCount > 10} className="w-full">
          {isLoading ? 'Analyzing...' : <><Search className="h-4 w-4 mr-2" />Start DNS Lookup</>}
        </Button>
      </div>
    </div>
  );
};
