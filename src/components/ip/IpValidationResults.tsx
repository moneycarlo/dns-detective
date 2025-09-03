import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProcessedIp } from '@/types/ip';

interface IpValidationResultsProps {
  processedIps: ProcessedIp[];
}

export const IpValidationResults: React.FC<IpValidationResultsProps> = ({
  processedIps
}) => {
  const invalidInputs = processedIps.filter(ip => !ip.isValid);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Validation</CardTitle>
        <CardDescription>
          Invalid entries that could not be processed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p><strong>Only invalid entries are shown below</strong></p>
          </div>
          
          {invalidInputs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>✅ All entries are valid</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invalidInputs.map((input, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <span className="font-mono text-sm text-destructive">{input.original}</span>
                  <span className="text-xs text-destructive font-medium">Invalid</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};