import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';
import { performDkimLookup } from '@/services/dkimService';
import { DkimEntry, DkimResult } from '@/types/dkim';

interface TestCase {
  name: string;
  entry: DkimEntry;
  expectedValid: boolean;
}

export const DkimQaTest: React.FC = () => {
  const [results, setResults] = useState<(DkimResult & { testName: string; expectedValid: boolean })[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testCases: TestCase[] = [
    {
      name: 'Good DKIM Record',
      entry: {
        id: 'test-good',
        selector: 'scph1122',
        domain: 'email.allrecipes.com',
        originalInput: 'scph1122:email.allrecipes.com'
      },
      expectedValid: true
    },
    {
      name: 'Bad DKIM Record',
      entry: {
        id: 'test-bad',
        selector: 'scph1123',
        domain: 'xmail.allrecipes.com',
        originalInput: 'scph1123:xmail.allrecipes.com'
      },
      expectedValid: false
    },
    {
      name: 'Entire String Format',
      entry: {
        id: 'test-entire',
        selector: 'scph1122',
        domain: 'email.allrecipes.com',
        originalInput: 'scph1122._domainkey.email.allrecipes.com'
      },
      expectedValid: true
    }
  ];

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      for (const testCase of testCases) {
        const result = await performDkimLookup(testCase.entry);
        setResults(prev => [...prev, {
          ...result,
          testName: testCase.name,
          expectedValid: testCase.expectedValid
        }]);
      }
    } catch (error) {
      console.error('QA test error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestStatus = (result: DkimResult & { expectedValid: boolean }) => {
    if (result.status === 'pending') return 'pending';
    if (result.status === 'error') return 'error';
    
    const actualValid = result.valid && !!result.record;
    return actualValid === result.expectedValid ? 'pass' : 'fail';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'pending':
        return <Badge variant="secondary">PENDING</Badge>;
      default:
        return <Badge variant="destructive">ERROR</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          DKIM QA Test Suite
        </CardTitle>
        <CardDescription>
          Run automated tests on known DKIM records to verify functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          <TestTube className="mr-2 h-4 w-4" />
          {isRunning ? 'Running Tests...' : 'Run QA Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            {results.map((result, index) => {
              const status = getTestStatus(result);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {result.originalInput}
                      </div>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1">
                          {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status)}
                    {result.record && (
                      <Badge variant="outline" className="text-xs">
                        {result.valid ? 'Valid' : 'Invalid'}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};