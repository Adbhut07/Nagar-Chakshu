// src/components/FCMTestComponent.tsx
'use client';

import React, { useState } from 'react';
import { useFCM } from './FCMProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export const FCMTestComponent: React.FC = () => {
  const { token, isSupported, requestPermission } = useFCM();
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const newToken = await requestPermission();
      console.log('FCM Token:', newToken);
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      alert('Token copied to clipboard!');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Firebase Cloud Messaging Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p><strong>FCM Supported:</strong> {isSupported ? '✅ Yes' : '❌ No'}</p>
        </div>
        
        <div>
          <p><strong>Notification Permission:</strong> {
            typeof window !== 'undefined' 
              ? Notification.permission === 'granted' ? '✅ Granted' : 
                Notification.permission === 'denied' ? '❌ Denied' : '⏳ Not requested'
              : '⏳ Loading...'
          }</p>
        </div>

        <div>
          <p><strong>FCM Token:</strong></p>
          {token ? (
            <div className="mt-2">
              <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                {token}
              </code>
              <Button 
                onClick={copyTokenToClipboard}
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Copy Token
              </Button>
            </div>
          ) : (
            <p className="text-gray-500">No token available</p>
          )}
        </div>

        <div>
          <Button 
            onClick={handleRequestPermission}
            disabled={!isSupported || isLoading}
            className="w-full"
          >
            {isLoading ? 'Requesting...' : 'Request Notification Permission'}
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Click "Request Notification Permission" to get your FCM token</li>
            <li>Copy the token and use it to send test notifications from Firebase Console</li>
            <li>Check browser console for detailed logs</li>
            <li>Make sure you've configured the service worker with your Firebase config</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default FCMTestComponent;
