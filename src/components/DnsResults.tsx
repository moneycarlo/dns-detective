import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DomainResult, LookupDetail } from '@/types/domain';
import { Shield, Mail, Image, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';

interface DnsResultsProps {
  results: DomainResult[];
}

export const DnsResults: React.FC<DnsResultsProps> = ({ results }) => {
  const getStatusBadge = (status: string, valid?: boolean, hasRecord?: boolean) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Analyzing
        </Badge>;
      case 'error':
        return <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error
        </Badge>;
      case 'completed':
        if (hasRecord === false) {
          return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Not Found
          </Badge>;
        }
        return valid ? (
          <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valid
          </Badge>
        ) : (
          <Badge variant="destructive">
            Issues Found
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderDomainCard = (result: DomainResult, children: React.ReactNode) => (
    <Card key={result.id} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-gray-900">
            {result.domain}
          </span>
           <Badge variant="secondary">{result.lookupType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {result.status === 'pending' ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Analyzing DNS records...</p>
          </div>
        ) : result.status === 'error' ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to analyze this domain. Please check the domain name and try again.
            </AlertDescription>
          </Alert>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
  
  const handleImageLoad = (url: string) => {
    console.log(`✅ BIMI logo loaded successfully: ${url}`);
  };

  const handleImageError = (url: string) => {
    console.log(`❌ BIMI logo failed to load: ${url}`);
  };

  const ExpiryDate: React.FC<{ date: string | null }> = ({ date }) => {
    if (!date) return <span className="text-gray-500">Not Available</span>;
    try {
      const expiry = new Date(date);
      const now = new Date();
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(now.getMonth() + 1);

      let textColor = 'text-green-600 font-medium';
      if (expiry < now) textColor = 'text-red-600 font-medium';
      else if (expiry < oneMonthFromNow) textColor = 'text-yellow-600 font-medium';
      
      return <span className={textColor}>{expiry.toLocaleDateString()}</span>;
    } catch(e) {
      return <span className="text-gray-500">Invalid Date</span>
    }
  };

  const BimiLogo: React.FC<{ logoUrl: string | null; domain: string }> = ({ logoUrl, domain }) => {
    const [hasError, setHasError] = useState(false);
    useEffect(() => { setHasError(false); }, [logoUrl]);
  
    if (!logoUrl || hasError) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
          {domain.charAt(0).toUpperCase()}
        </div>
      );
    }
    return <img src={logoUrl} alt={`${domain} BIMI logo`} className="w-full h-full object-contain" onError={() => setHasError(true)} />;
  };

  const LookupDetails: React.FC<{ details: LookupDetail[] }> = ({ details }) => {
    if (!details?.length) return null;
    return (
      <div className="space-y-2 pt-2">
        {details.map((detail, index) => (
          <div key={`${detail.number}-${index}`} className="ml-4 pl-4 border-l-2">
            <div className="text-sm">
              <span className="font-mono text-gray-500">{detail.number}.</span> {detail.type}: <span className="font-medium">{detail.domain}</span>
            </div>
            {detail.record && <code className="block bg-gray-50 p-1.5 rounded-md text-xs mt-1 ml-4 break-all">{detail.record}</code>}
            {detail
