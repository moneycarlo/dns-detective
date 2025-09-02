import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { BimiSettings as BimiSettingsType } from '@/services/bimiParser';

interface BimiSettingsProps {
  settings: BimiSettingsType;
  onSettingsChange: (settings: BimiSettingsType) => void;
}

export const BimiSettings: React.FC<BimiSettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">BIMI Settings</CardTitle>
        <CardDescription>
          Configure how BIMI certificates are fetched
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Switch
            id="use-proxy"
            checked={settings.useProxy}
            onCheckedChange={(useProxy) => 
              onSettingsChange({ ...settings, useProxy })
            }
          />
          <div className="flex flex-col">
            <Label htmlFor="use-proxy" className="text-sm font-medium">
              Use Proxy for Certificate Fetch
            </Label>
            <span className="text-xs text-muted-foreground">
              Bypass CORS restrictions using server-side proxy
            </span>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {settings.useProxy ? (
              <span>
                <strong>Proxy Mode:</strong> Certificates will be fetched via server-side proxy.
                Note: Requires Supabase integration to be active.
              </span>
            ) : (
              <span>
                <strong>Direct Mode:</strong> Certificates fetched directly from browser.
                May fail due to CORS restrictions on some certificate URLs.
              </span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};