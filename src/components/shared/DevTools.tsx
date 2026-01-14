import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface HealthCheckResult {
  service: string;
  status: 'ok' | 'error' | 'pending';
  message?: string;
}

export function DevTools() {
  const [checks, setChecks] = useState<HealthCheckResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runHealthChecks = async () => {
    setIsLoading(true);
    const results: HealthCheckResult[] = [];

    // Check Backend
    try {
      const response = await fetch('http://localhost:3001');
      results.push({
        service: 'Backend (3001)',
        status: response.ok ? 'ok' : 'error',
        message: response.ok ? 'Running' : `HTTP ${response.status}`
      });
    } catch {
      results.push({
        service: 'Backend (3001)',
        status: 'error',
        message: 'Not reachable'
      });
    }

    // Check localStorage
    const hasToken = !!localStorage.getItem('token');
    results.push({
      service: 'Auth Token',
      status: hasToken ? 'ok' : 'error',
      message: hasToken ? 'Present' : 'Missing'
    });

    // Check sessionStorage
    const hasUserKey = !!sessionStorage.getItem('userKey');
    results.push({
      service: 'User Key',
      status: hasUserKey ? 'ok' : 'error',
      message: hasUserKey ? 'Present' : 'Missing'
    });

    setChecks(results);
    setIsLoading(false);
  };

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    runHealthChecks();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Development Tools</CardTitle>
        <CardDescription>
          Quick checks and utilities for development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runHealthChecks} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Run Health Checks'
            )}
          </Button>
          <Button onClick={clearStorage} variant="outline">
            Clear Storage
          </Button>
        </div>

        {checks.length > 0 && (
          <div className="space-y-2">
            {checks.map((check, index) => (
              <Alert
                key={index}
                variant={check.status === 'error' ? 'destructive' : 'default'}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {check.status === 'ok' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <strong>{check.service}</strong>
                  </div>
                  <Badge variant={check.status === 'ok' ? 'default' : 'destructive'}>
                    {check.message}
                  </Badge>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <Alert>
          <AlertDescription>
            <strong>Backend Command:</strong>
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              cd lavenius-be && npm run build && npm run start:prod
            </code>
          </AlertDescription>
        </Alert>

        <Alert>
          <AlertDescription>
            <strong>Test User:</strong>
            <div className="mt-2 space-y-1 text-sm">
              <div>Email: test@lavenius.com</div>
              <div>Password: Test1234!</div>
              <div>Passphrase: MySecretKey123</div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
