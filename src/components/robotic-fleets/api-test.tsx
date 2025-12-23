"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCw,
  Terminal
} from "lucide-react";
// Client-side component - uses API routes to avoid importing server-side gRPC code
import { toast } from "sonner";

interface Robot {
  name: string;
  status: string;
}

interface TestResult {
  error?: string;
  code?: string;
  details?: string;
}

export default function APITest() {
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingRobots, setIsTestingRobots] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [authStatus, setAuthStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [robotsStatus, setRobotsStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [exploreStatus, setExploreStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [authResult, setAuthResult] = useState<string>('');
  const [robotsResult, setRobotsResult] = useState<string>('');
  const [exploreResult, setExploreResult] = useState<string>('');

  const testAuthentication = async () => {
    setIsTestingAuth(true);
    setAuthStatus('pending');
    
    try {
      console.log('🔐 Testing Bear Cloud API authentication via server...');
      
      const response = await fetch('/api/test/auth');
      const result = await response.json();
      
      if (result.success) {
        setAuthStatus('success');
        setAuthResult('✅ Authentication successful! Server-side connection to Bear Cloud API established.');
        toast.success('Bear Cloud API authentication successful!');
      } else {
        setAuthStatus('error');
        setAuthResult(`❌ Authentication failed: ${result.message || 'Server-side authentication failed'}`);
        toast.error('Bear Cloud API authentication failed');
      }
    } catch (error) {
      setAuthStatus('error');
      setAuthResult(`❌ Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Authentication error occurred');
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testRobotsFetch = async () => {
    setIsTestingRobots(true);
    setRobotsStatus('pending');
    
    try {
      console.log('🤖 Testing Bear Cloud API robots fetch via server proxy...');
      const response = await fetch('/api/robots');
      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        setRobotsStatus('success');
        setRobotsResult(`✅ Successfully fetched ${result.data.length} robots:\n${result.data.map((r: Robot) => `- ${r.name} (${r.status})`).join('\n')}`);
        toast.success(`Found ${result.data.length} robots!`);
      } else {
        setRobotsStatus('error');
        setRobotsResult('⚠️ No robots found. API returned empty array or failed.');
        toast('⚠️ No robots found in your fleet');
      }
    } catch (error) {
      setRobotsStatus('error');
      setRobotsResult(`❌ Robots fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to fetch robots');
    } finally {
      setIsTestingRobots(false);
    }
  };

  const exploreServiceMethods = async () => {
    setIsExploring(true);
    setExploreStatus('pending');
    
    try {
      console.log('🔍 Exploring Bear Cloud gRPC service methods via server...');
      
      const response = await fetch('/api/test/explore');
      const result = await response.json();
      
      if (result.success) {
        setExploreStatus('success');
        let resultText = '🔍 Service Account Exploration Results:\n\n';
        
        const data = result.data;
        if (data.testResults) {
          Object.entries(data.testResults).forEach(([testName, testResult]: [string, unknown]) => {
            const result = testResult as TestResult;
            resultText += `📋 ${testName}:\n`;
            if (result.error) {
              resultText += `   ❌ Error: ${result.error} (Code: ${result.code || 'unknown'})\n`;
              if (result.details) {
                resultText += `   Details: ${result.details}\n`;
              }
            } else {
              resultText += `   ✅ Success: ${JSON.stringify(result, null, 2)}\n`;
            }
            resultText += '\n';
          });
        }
        
        setExploreResult(resultText);
        toast.success('Service exploration completed!');
      } else {
        setExploreStatus('error');
        setExploreResult(`❌ Exploration failed: ${result.message || 'Service exploration failed'}`);
        toast.error('Service exploration failed');
      }
    } catch (error) {
      setExploreStatus('error');
      setExploreResult(`❌ Exploration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Exploration error occurred');
    } finally {
      setIsExploring(false);
    }
  };

  const runAllTests = async () => {
    await testAuthentication();
    setTimeout(async () => {
      await testRobotsFetch();
    }, 1000);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error', isLoading: boolean) => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Bot className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500 text-white">Success</Badge>;
      case 'error': return <Badge className="bg-red-500 text-white">Failed</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Bear Cloud API Connection Test
          </CardTitle>
          <CardDescription>
            Test the connection to Bear Cloud API and verify robot data access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Configuration Display */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">API Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">API URL:</span>
                <br />
                <code className="text-xs bg-background px-2 py-1 rounded">api.bearrobotics.ai:443</code>
              </div>
              <div>
                <span className="text-muted-foreground">Auth URL:</span>
                <br />
                <code className="text-xs bg-background px-2 py-1 rounded">api-auth.bearrobotics.ai</code>
              </div>
              <div>
                <span className="text-muted-foreground">API Key:</span>
                <br />
                <code className="text-xs bg-background px-2 py-1 rounded">
                  {`8927a329-****-****-****-************`}
                </code>
              </div>
              <div>
                <span className="text-muted-foreground">Scope:</span>
                <br />
                <code className="text-xs bg-background px-2 py-1 rounded">LOCAL_GOAT_LLC</code>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={testAuthentication}
              disabled={isTestingAuth}
              variant="outline"
            >
              {isTestingAuth ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Test Authentication
            </Button>
            
            <Button 
              onClick={testRobotsFetch}
              disabled={isTestingRobots}
              variant="outline"
            >
              {isTestingRobots ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bot className="h-4 w-4 mr-2" />
              )}
              Test Robot Fetch
            </Button>
            
            <Button 
              onClick={exploreServiceMethods}
              disabled={isExploring}
              variant="outline"
              className="border-purple text-purple hover:bg-purple/10"
            >
              {isExploring ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Terminal className="h-4 w-4 mr-2" />
              )}
              Explore Service Account
            </Button>
            
            <Button 
              onClick={runAllTests}
              disabled={isTestingAuth || isTestingRobots}
              className="bg-blue hover:bg-blue text-blue-foreground"
            >
              {(isTestingAuth || isTestingRobots) ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Run All Tests
            </Button>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            {/* Authentication Test Result */}
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(authStatus, isTestingAuth)}
                    <h4 className="font-semibold">Authentication Test</h4>
                  </div>
                  {getStatusBadge(authStatus)}
                </div>
                {authResult && (
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-line">
                    {authResult}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Robots Fetch Test Result */}
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(robotsStatus, isTestingRobots)}
                    <h4 className="font-semibold">Robots Fetch Test</h4>
                  </div>
                  {getStatusBadge(robotsStatus)}
                </div>
                {robotsResult && (
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-line">
                    {robotsResult}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Account Exploration Result */}
            <Card className="border-2 border-purple">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(exploreStatus, isExploring)}
                    <h4 className="font-semibold text-purple">Service Account Exploration</h4>
                  </div>
                  {getStatusBadge(exploreStatus)}
                </div>
                {exploreResult && (
                  <div className="bg-muted p-3 rounded text-sm whitespace-pre-line">
                    {exploreResult}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="bg-info/10 dark:bg-info/5 p-4 rounded-lg">
            <h4 className="font-semibold text-info dark:text-info mb-2">
              🔍 Testing Instructions
            </h4>
            <div className="text-sm text-info/80 dark:text-info/70 space-y-2">
              <p>1. <strong>Test Authentication</strong> - Verifies API key and secret with Bear Cloud</p>
              <p>2. <strong>Test Robot Fetch</strong> - Attempts to retrieve robot data from your fleet</p>
              <p>3. <strong>Run All Tests</strong> - Executes both tests in sequence</p>
              <p className="mt-3 text-xs">
                ⚠️ If tests fail, check your network connection and verify the API credentials are correct.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}