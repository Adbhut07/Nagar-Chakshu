import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, CheckCircle, AlertCircle } from 'lucide-react';

const MapStatusCheck = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [geoLocationStatus, setGeoLocationStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  useEffect(() => {
    // Check API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
      setApiKeyStatus('valid');
    } else {
      setApiKeyStatus('invalid');
    }

    // Check geolocation
    if (navigator.geolocation) {
      setGeoLocationStatus('available');
    } else {
      setGeoLocationStatus('unavailable');
    }
  }, []);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Map System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Google Maps API</span>
            <div className="flex items-center">
              {apiKeyStatus === 'valid' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">
                    {apiKeyStatus === 'checking' ? 'Checking...' : 'Not configured'}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Location Services</span>
            <div className="flex items-center">
              {geoLocationStatus === 'available' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">Available</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">
                    {geoLocationStatus === 'checking' ? 'Checking...' : 'Unavailable'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapStatusCheck;
