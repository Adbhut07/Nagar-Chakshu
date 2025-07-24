// contexts/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth, googleProvider, fetchToken } from '@/lib/firebase';
import useFcmToken from '@/hooks/useFcmToken';

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
  notificationPermissionStatus: NotificationPermission | null;
  userProfile: UserData | null;
  isTokenReady: boolean; // Add this
  signInWithGoogle: (additionalUserData?: Partial<UserData>) => Promise<User>;
  signOut: () => Promise<void>;
  registerUser: (additionalUserData?: Partial<UserData>) => Promise<any>;
  checkUserRegistrationStatus: () => Promise<void>;
  refreshFCMToken: () => Promise<void>;
  requestTokenManually: () => Promise<string | null>; // Add this
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
  const [userProfile, setUserProfile] = useState<UserData | null>(null);
  
  // Use the FCM token hook for managing notifications
  // This hook handles token generation, permission requests, and message listening
  const { token: fcmToken, notificationPermissionStatus, isTokenReady, requestTokenManually } = useFcmToken();
  

  // Refresh FCM token function - now using fetchToken from updated firebase.ts
  const refreshFCMToken = async (): Promise<void> => {
    try {
      const newToken = await fetchToken();
      if (newToken && newToken !== fcmToken) {
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
        setLoading(false);
      } else {
        setIsUserRegistered(false);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []); // No dependencies needed for auth state listener

  // Handle FCM token when user and token are both available
  useEffect(() => {
    const handleFCMTokenForUser = async () => {
      if (user && fcmToken) {
        try {
          const authToken = await user.getIdToken();
          const { handleFCMTokenOnLogin } = await import('@/lib/api');
          await handleFCMTokenOnLogin(fcmToken, authToken);
        } catch (error) {
          console.error('Error handling FCM token on login:', error);
        }
      }
    };

    handleFCMTokenForUser();
  }, [user, fcmToken]);

  // Check if user is registered in backend
  const checkUserRegistrationStatus = useCallback(async (): Promise<void> => {
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
  }, [user]);

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
  // const completeUserRegistration = async (additionalUserData: Partial<UserData> = {}): Promise<any> => {
  //   if (!user) {
  //     throw new Error('No user found');
  //   }

  //   try {
  //     const token = await user.getIdToken();

  //     // Get user location (optional)
  //     let location: Location | null = null;
  //     if (navigator.geolocation) {
  //       try {
  //         const position: GeolocationPosition = await new Promise((resolve, reject) => {
  //           navigator.geolocation.getCurrentPosition(resolve, reject, {
  //             timeout: 10000,
  //             enableHighAccuracy: true
  //           });
  //         });
  //         location = {
  //           lat: position.coords.latitude,
  //           lng: position.coords.longitude
  //         };
  //       } catch (error) {
  //         console.log('Location access denied or failed');
  //       }
  //     }

  //     // CRITICAL: Always try to get fresh FCM token during registration
  //     console.log('Getting FCM token for registration...');
  //     let currentFcmToken = null;
      
  //     try {
  //       // Try to get fresh token (this will ask for permission if not granted)
  //       currentFcmToken = await getFCMToken();
  //       if (currentFcmToken) {
  //         setFcmToken(currentFcmToken);
  //         console.log('Fresh FCM token obtained for registration:', currentFcmToken.substring(0, 20) + '...');
  //       } else {
  //         console.log('No FCM token available - user may have denied notifications');
  //       }
  //     } catch (fcmError) {
  //       console.error('Error getting FCM token during registration:', fcmError);
  //       // Continue with registration even if FCM fails
  //     }

  //     // Prepare user data for registration - match API structure
  //     const userData: UserData = {
  //       uid: user.uid,
  //       name: user.displayName || '',
  //       email: user.email || '',
  //       profilePhotoUrl: user.photoURL || undefined,
  //       location: location || { lat: 0, lng: 0 },
  //       radius_km: 2,
  //       categories: [],
  //       notifications: {
  //         enabled: true,
  //         quietHours: null
  //       },
  //       preferences: {
  //         useCurrentLocation: !!location,
  //         manualLocality: null
  //       },
  //       fcmToken: currentFcmToken || undefined, // This will be null if token generation failed
  //       ...additionalUserData
  //     };

  //     console.log('Registering user with FCM token:', currentFcmToken ? 'Present' : 'Null');
  //     return await registerUserBackend(userData, token);
  //   } catch (error) {
  //     console.error('Error completing user registration:', error);
  //     throw error;
  //   }
  // };
  
  // Complete user registration with location and additional data
const completeUserRegistration = async (additionalUserData: Partial<UserData> = {}): Promise<any> => {
  if (!user) {
    throw new Error('No user found');
  }

  try {
    console.log('Starting user registration process...');
    
    // Step 1: Get fresh auth token
    console.log('Step 1: Getting fresh auth token...');
    const token = await user.getIdToken(true);
    console.log('Auth token obtained successfully');

    // Step 2: Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log('Device type detected:', isMobile ? 'Mobile' : 'Desktop');

    // Step 3: Get user location
    console.log('Step 3: Attempting to get user location...');
    let location: Location | null = null;
    
    if (navigator.geolocation) {
      try {
        const position: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve, 
            reject, 
            {
              timeout: isMobile ? 15000 : 10000,
              enableHighAccuracy: true,
              maximumAge: 60000
            }
          );
        });
        
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('Location obtained successfully:', location);
      } catch (locationError) {
        console.log('Location access denied or failed:', locationError);
      }
    }

    // Step 4: Handle FCM token - wait for it to be ready or request manually
    console.log('Step 4: Handling FCM token...');
    let currentFcmToken = fcmToken;
    
    // If token is not ready, try to get it manually
    if (!currentFcmToken && !isTokenReady) {
      console.log('FCM token not ready, requesting manually...');
      try {
        currentFcmToken = await requestTokenManually();
      } catch (error) {
        console.error('Manual FCM token request failed:', error);
      }
    }
    
    // Final fallback - try fetchToken directly
    if (!currentFcmToken) {
      console.log('Attempting final FCM token fetch...');
      try {
        currentFcmToken = await fetchToken();
        if (currentFcmToken) {
          console.log('Final fallback FCM token obtained:', currentFcmToken.substring(0, 20) + '...');
        }
      } catch (fcmError) {
        console.error('Final FCM token fetch failed:', fcmError);
      }
    }

    if (currentFcmToken) {
      console.log('FCM token available for registration:', currentFcmToken.substring(0, 20) + '...');
    } else {
      console.log('No FCM token available - proceeding without notifications');
    }

    // Step 5: Prepare user data
    console.log('Step 5: Preparing user data...');
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
      fcmToken: currentFcmToken || undefined,
      ...additionalUserData
    };

    console.log('User data prepared with FCM token:', userData.fcmToken ? 'Present' : 'Not available');

    // Step 6: Register with backend
    console.log('Step 6: Registering user with backend...');
    const result = await registerUserBackend(userData, token);
    console.log('User registration completed successfully:', result);
    return result;

  } catch (error: any) {
    console.error('Error completing user registration:', error);
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
};

// Helper function with timeout support
const fetchWithTimeout = async (url: string, options: any, timeout = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection and try again');
    }
    throw error;
  }
};

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      // Remove FCM token before signing out
      if (user && fcmToken) {
        try {
          const { handleFCMTokenOnLogout } = await import('@/lib/api');
          const token = await user.getIdToken();
          await handleFCMTokenOnLogout(token);
        } catch (error) {
          console.log('FCM token removal failed:', error);
        }
      }
      
      setIsUserRegistered(false);
      setUserProfile(null);
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
  }, [user, loading, checkUserRegistrationStatus]);

  const value: AuthContextType = {
  user,
  loading,
  isUserRegistered,
  registrationLoading,
  fcmToken,
  notificationPermissionStatus,
  signInWithGoogle,
  signOut,
  userProfile,
  registerUser: completeUserRegistration,
  checkUserRegistrationStatus,
  refreshFCMToken,
  isTokenReady, // Add this
  requestTokenManually // Add this
};

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};