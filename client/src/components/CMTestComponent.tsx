// components/FCMTestComponent.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFCMToken } from '@/lib/firebase';

export default function FCMTestComponent() {
  const { fcmToken, user, refreshFCMToken } = useAuth();
  const [testToken, setTestToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTestFCM = async () => {
    setLoading(true);
    try {
      console.log('Testing FCM token generation...');
      const token = await getFCMToken();
      setTestToken(token);
      
      if (token) {
        console.log('Test FCM Token:', token);
        alert('FCM Token generated! Check console for full token.');
      } else {
        alert('Failed to generate FCM token. Check console for errors.');
      }
    } catch (error) {
      console.error('FCM test error:', error);
      alert('Error generating FCM token: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    setLoading(true);
    try {
      await refreshFCMToken();
      alert('FCM token refresh attempted. Check console for results.');
    } catch (error) {
      console.error('FCM refresh error:', error);
      alert('Error refreshing FCM token: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">FCM Token Testing</h3>
      
      <div className="space-y-3">
        <div>
          <strong>User Status:</strong> {user ? 'Logged In' : 'Not Logged In'}
        </div>
        
        <div>
          <strong>Current FCM Token (from Context):</strong>
          <div className="text-sm bg-white p-2 rounded border mt-1">
            {fcmToken ? `${fcmToken.substring(0, 50)}...` : 'null'}
          </div>
        </div>

        <div>
          <strong>Test FCM Token:</strong>
          <div className="text-sm bg-white p-2 rounded border mt-1">
            {testToken ? `${testToken.substring(0, 50)}...` : 'Not generated yet'}
          </div>
        </div>

        <div className="space-x-2">
          <button
            onClick={handleTestFCM}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Test FCM Token Generation'}
          </button>

          <button
            onClick={handleRefreshToken}
            disabled={loading || !user}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh FCM Token'}
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Note:</strong> Make sure you have:</p>
          <ul className="list-disc list-inside ml-4">
            <li>VAPID key in your .env.local</li>
            <li>firebase-messaging-sw.js in public/ directory</li>
            <li>Notifications permission granted</li>
            <li>HTTPS connection (or localhost)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}