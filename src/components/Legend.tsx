
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Mail, Image, Info, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export const Legend: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          DNS Records Guide & Legend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="spf" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="spf">SPF</TabsTrigger>
            <TabsTrigger value="dmarc">DMARC</TabsTrigger>
            <TabsTrigger value="bimi">BIMI</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="spf" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SPF (Sender Policy Framework)
              </h3>
              <p className="text-gray-600 mb-4">
                SPF helps prevent email spoofing by specifying which mail servers are authorized to send email for your domain.
              </p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Common Mechanisms:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">include:</Badge>
                      <span className="text-sm">Include another domain's SPF record</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">a</Badge>
                      <span className="text-sm">Allow domain's A record IPs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">mx</Badge>
                      <span className="text-sm">Allow domain's MX record IPs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">ip4:</Badge>
                      <span className="text-sm">Allow specific IPv4 address</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">~all</Badge>
                      <span className="text-sm">Soft fail for all others</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">-all</Badge>
                      <span className="text-sm">Hard fail for all others</span>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nested Lookups:</strong> When an SPF record includes other domains, we resolve those records too to show the complete authorization chain.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dmarc" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                DMARC (Domain-based Message Authentication, Reporting & Conformance)
              </h3>
              <p className="text-gray-600 mb-4">
                DMARC builds on SPF and DKIM to provide a way for domain owners to specify how to handle emails that fail authentication.
              </p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Policy Values:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">none</Badge>
                      <span className="text-sm">Monitor mode - no action taken on failed emails</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">quarantine</Badge>
                      <span className="text-sm">Failed emails go to spam/junk folder</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">reject</Badge>
                      <span className="text-sm">Failed emails are rejected/blocked</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Key Components:</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>rua:</strong> Aggregate report email address</div>
                    <div><strong>ruf:</strong> Forensic report email address</div>
                    <div><strong>pct:</strong> Percentage of emails to apply policy to</div>
                    <div><strong>sp:</strong> Policy for subdomains</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bimi" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Image className="h-5 w-5" />
                BIMI (Brand Indicators for Message Identification)
              </h3>
              <p className="text-gray-600 mb-4">
                BIMI allows organizations to display their brand logo in email clients for authenticated emails.
              </p>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Requirements:</h4>
                  <div className="space-y-1 text-sm">
                    <div>• DMARC policy must be set to "quarantine" or "reject"</div>
                    <div>• Logo must be in SVG format</div>
                    <div>• Logo must be served over HTTPS</div>
                    <div>• Certificate (VMC) may be required for some email providers</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Components:</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>l:</strong> URL to the brand's logo (SVG format)</div>
                    <div><strong>a:</strong> URL to the Verified Mark Certificate (VMC)</div>
                  </div>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Certificate Validation:</strong> We check VMC expiration dates and validate certificate chains when available.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Status Indicators</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-700 mr-1" />
                    Analyzing
                  </Badge>
                  <span className="text-sm">DNS lookup in progress</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                  <span className="text-sm">Record found and properly configured</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Issues Found
                  </Badge>
                  <span className="text-sm">Record has errors or missing</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Error
                  </Badge>
                  <span className="text-sm">Unable to perform DNS lookup</span>
                </div>
              </div>
              
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> This tool provides DNS record analysis and validation. For production use, always verify results with multiple DNS tools and consult with your email security team.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
