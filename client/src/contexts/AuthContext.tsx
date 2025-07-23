// contexts/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth, googleProvider, getFCMToken, onForegroundMessage } from '@/lib/firebase';

// Types
interface Location {
  lat: number;
  lng: number;
}

interface Notifications {
  enabled: boolean;
  quietHours: string | null;
}

interface Preferences {
  useCurrentLocation: boolean;
  manualLocality: string | null;
}

interface UserData {
  uid: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
  radius_km?: number;
  categories?: string[];
  notifications: {
    enabled?: boolean;
    quietHours?: any;
  };
  preferences?: {
    useCurrentLocation?: boolean;
    manualLocality?: string | null;
  };
  fcmToken?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isUserRegistered: boolean;
  registrationLoading: boolean;
  fcmToken: string | null;
  userProfile: UserData | null;
  signInWithGoogle: (additionalUserData?: Partial<UserData>) => Promise<User>;
  signOut: () => Promise<void>;
  registerUser: (additionalUserData?: Partial<UserData>) => Promise<any>;
  checkUserRegistrationStatus: () => Promise<void>;
  refreshFCMToken: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
  const [registrationLoading, setRegistrationLoading] = useState<boolean>(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  

  // Initialize FCM token when component mounts
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        console.log('Initializing FCM token...');
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          console.log('FCM token initialized successfully:', token.substring(0, 20) + '...');
        } else {
          console.log('No FCM token received');
        }
      } catch (error) {
        console.error('Error initializing FCM:', error);
      }
    };

    // Add a small delay to ensure the page is fully loaded
    setTimeout(() => {
      initializeFCM();
    }, 1000);

    // Set up foreground message listener
    const unsubscribeFromMessages = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      // Handle foreground notifications here
      // You can show a toast, update UI, etc.
    });

    return unsubscribeFromMessages;
  }, []);

  // Refresh FCM token function
  const refreshFCMToken = async (): Promise<void> => {
    try {
      const newToken = await getFCMToken();
      if (newToken && newToken !== fcmToken) {
        setFcmToken(newToken);
        
        // If user is logged in and registered, update the token in backend
        if (user && isUserRegistered) {
          const authToken = await user.getIdToken();
          const { refreshFCMToken: updateBackendToken } = await import('@/lib/api');
          await updateBackendToken(newToken, authToken);
          console.log('FCM token updated in backend');
        }
      }
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      console.log('Auth state changed:', user?.uid || 'No user');
      setUser(user);
      
      if (user) {
        // Wait a bit for the user token to be ready
        setTimeout(async () => {
          setLoading(false);
          await checkUserRegistrationStatus();
          
          // Handle FCM token for authenticated user
          if (fcmToken) {
            try {
              const authToken = await user.getIdToken();
              const { handleFCMTokenOnLogin } = await import('@/lib/api');
              await handleFCMTokenOnLogin(fcmToken, authToken);
            } catch (error) {
              console.error('Error handling FCM token on login:', error);
            }
          }
        }, 500);
      } else {
        setIsUserRegistered(false);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [fcmToken]);

  // Check if user is registered in backend
  const checkUserRegistrationStatus = async (): Promise<void> => {
    if (!user) {
      setIsUserRegistered(false);
      return;
    }

    try {
      // Wait for the user to be fully authenticated
      const token = await user.getIdToken(true); // Force refresh
      const { getUserProfile } = await import('@/lib/api');
      
      const result = await getUserProfile(token);
      if (result && result.user) {
        setIsUserRegistered(true);
        setUserProfile(result.user);

      } else {
        setIsUserRegistered(false);
      }
    } catch (error: any) {
      console.error('Error checking user registration:', error);
      
      // Handle specific Firebase auth errors
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-user-token') {
        // Force sign out if token is invalid
        await firebaseSignOut(auth);
      }
      
      setIsUserRegistered(false);
    }
  };

  // Register user with your backend - using the api.ts file
  const registerUserBackend = async (userData: UserData, token: string): Promise<any> => {
    try {
      console.log('Registering user with data:', userData);
      setRegistrationLoading(true);
      const { registerUser } = await import('@/lib/api');
      const result = await registerUser(userData, token);
      setIsUserRegistered(true);
      console.log('User registered successfully:', result);
      return result;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    } finally {
      setRegistrationLoading(false);
    }
  };

  // Sign in with Google (only authentication, not registration)
  const signInWithGoogle = async (additionalUserData: Partial<UserData> = {}): Promise<User> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('Google sign in successful:', user.uid);
      
      // Don't check registration status here - let the auth state change handle it
      return user;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Handle specific popup errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked by browser');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection');
      }
      
      throw error;
    }
  };

  // Complete user registration with location and additional data
  const completeUserRegistration = async (additionalUserData: Partial<UserData> = {}): Promise<any> => {
    if (!user) {
      throw new Error('No user found');
    }

    try {
      const token = await user.getIdToken();

      // Get user location (optional)
      let location: Location | null = null;
      if (navigator.geolocation) {
        try {
          const position: GeolocationPosition = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true
            });
          });
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (error) {
          console.log('Location access denied or failed');
        }
      }

      // CRITICAL: Always try to get fresh FCM token during registration
      console.log('Getting FCM token for registration...');
      let currentFcmToken = null;
      
      try {
        // Try to get fresh token (this will ask for permission if not granted)
        currentFcmToken = await getFCMToken();
        if (currentFcmToken) {
          setFcmToken(currentFcmToken);
          console.log('Fresh FCM token obtained for registration:', currentFcmToken.substring(0, 20) + '...');
        } else {
          console.log('No FCM token available - user may have denied notifications');
        }
      } catch (fcmError) {
        console.error('Error getting FCM token during registration:', fcmError);
        // Continue with registration even if FCM fails
      }

      // Prepare user data for registration - match API structure
      const userData: UserData = {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        profilePhotoUrl: user.photoURL || undefined,
        location: location || { lat: 0, lng: 0 },
        radius_km: 2,
        categories: [],
        notifications: {
          enabled: true,
          quietHours: null
        },
        preferences: {
          useCurrentLocation: !!location,
          manualLocality: null
        },
        fcmToken: currentFcmToken || undefined, // This will be null if token generation failed
        ...additionalUserData
      };

      console.log('Registering user with FCM token:', currentFcmToken ? 'Present' : 'Null');
      return await registerUserBackend(userData, token);
    } catch (error) {
      console.error('Error completing user registration:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      // Remove FCM token before signing out
      if (user) {
        try {
          const { handleFCMTokenOnLogout } = await import('@/lib/api');
          const token = await user.getIdToken();
          await handleFCMTokenOnLogout(token);
        } catch (error) {
          console.log('FCM token removal failed:', error);
        }
      }
      
      setIsUserRegistered(false);
      setFcmToken(null); // Clear FCM token on sign out
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Re-check registration status when user changes
  useEffect(() => {
    if (user && !loading) {
      checkUserRegistrationStatus();
    }
  }, [user, loading]);

  const value: AuthContextType = {
    user,
    loading,
    isUserRegistered,
    registrationLoading,
    fcmToken,
    signInWithGoogle,
    signOut,
    userProfile,
    registerUser: completeUserRegistration,
    checkUserRegistrationStatus,
    refreshFCMToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};