// components/Registration.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface AdditionalUserData {
  radius_km?: number;
  categories?: string[];
  preferences?: {
    useCurrentLocation?: boolean;
  };
  [key: string]: any;
}

const Registration: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState<number>(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['restaurants', 'events']);
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  
  const { user, registerUser } = useAuth();
  const router = useRouter();

  const availableCategories = [
    'Water-Logging',
    'Events',
    'Traffic',
    'Tree Falling',
    'Fire',
    'education',
    'transportation',
    'services'
  ];

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleRegistration = async (): Promise<void> => {
    if (!user) {
      setError('No user found. Please sign in first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const additionalData: AdditionalUserData = {
        radius_km: radius,
        categories: selectedCategories,
        preferences: {
          useCurrentLocation: useCurrentLocation
        }
      };

      await registerUser(additionalData);
      
      // Redirect to dashboard after successful registration
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to complete registration');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in first</p>
          <button
            onClick={() => router.push('/signIn')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Complete Your Registration</h2>
      
      <div className="mb-6 text-center">
        <img 
          src={user.photoURL || ''} 
          alt={user.displayName || 'User'} 
          className="w-16 h-16 rounded-full mx-auto mb-2"
        />
        <h3 className="text-lg font-semibold">{user.displayName}</h3>
        <p className="text-gray-600">{user.email}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Radius Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Radius: {radius} km
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </div>

        {/* Categories Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Interested Categories
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${
                  selectedCategories.includes(category)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Location Preferences */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={useCurrentLocation}
              onChange={(e) => setUseCurrentLocation(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">
              Use my current location
            </span>
          </label>
        </div>

        <button
          onClick={handleRegistration}
          disabled={loading || selectedCategories.length === 0}
          className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            'Complete Registration'
          )}
        </button>
      </div>
    </div>
  );
};

export default Registration;