// src/components/FCMProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFCMToken, onForegroundMessage, isFCMAvailable } from '@/lib/firebase';

interface FCMContextType {
  token: string | null;
  isSupported: boolean;
  requestPermission: () => Promise<string | null>;
}

const FCMContext = createContext<FCMContextType | undefined>(undefined);

export const useFCM = () => {
  const context = useContext(FCMContext);
  if (context === undefined) {
    throw new Error('useFCM must be used within an FCMProvider');
  }
  return context;
};

interface FCMProviderProps {
  children: React.ReactNode;
}

export const FCMProvider: React.FC<FCMProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isFCMAvailable();
      setIsSupported(supported);
    };

    checkSupport();
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    // Set up foreground message listener
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      
      // Show a notification or update UI
      if (payload.notification) {
        // You can customize this to show in-app notifications
        const { title, body } = payload.notification;
        
        // Example: You could dispatch this to a notification store
        // or show a toast notification
        console.log(`Notification: ${title} - ${body}`);
      }
    });

    return unsubscribe;
  }, [isSupported]);

  const requestPermission = async (): Promise<string | null> => {
    if (!isSupported) {
      console.log('FCM not supported');
      return null;
    }

    try {
      const newToken = await getFCMToken();
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Error requesting FCM permission:', error);
      return null;
    }
  };

  const value: FCMContextType = {
    token,
    isSupported,
    requestPermission,
  };

  return (
    <FCMContext.Provider value={value}>
      {children}
    </FCMContext.Provider>
  );
};

export default FCMProvider;
