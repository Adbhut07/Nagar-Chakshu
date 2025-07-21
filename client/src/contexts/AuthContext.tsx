// // contexts/AuthContext.tsx
// 'use client';
// import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// import {
//   onAuthStateChanged,
//   signInWithPopup,
//   signOut as firebaseSignOut,
//   User
// } from 'firebase/auth';
// import { auth, googleProvider } from '@/lib/firebase';

// // Types
// interface Location {
//   lat: number;
//   lng: number;
// }

// interface Notifications {
//   enabled: boolean;
//   quietHours: string | null;
// }

// interface Preferences {
//   useCurrentLocation: boolean;
//   manualLocality: string | null;
// }

// interface UserData {
//   uid: string;
//   name: string | null;
//   email: string | null;
//   profilePhotoUrl: string | null;
//   location: Location;
//   radius_km: number;
//   categories: string[];
//   notifications: Notifications;
//   preferences: Preferences;
//   [key: string]: any; // For additional user data
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   isUserRegistered: boolean;
//   registrationLoading: boolean;
//   signInWithGoogle: (additionalUserData?: Partial<UserData>) => Promise<User>;
//   signOut: () => Promise<void>;
//   registerUser: (userData: UserData, token: string) => Promise<any>;
//   checkUserRegistrationStatus: () => Promise<void>;
// }

// interface AuthProviderProps {
//   children: ReactNode;
// }

// interface GeolocationPosition {
//   coords: {
//     latitude: number;
//     longitude: number;
//   };
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = (): AuthContextType => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }: AuthProviderProps) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [isUserRegistered, setIsUserRegistered] = useState<boolean>(false);
//   const [registrationLoading, setRegistrationLoading] = useState<boolean>(false);

//   // Check if user is registered in backend
//   const checkUserRegistrationStatus = async (): Promise<void> => {
//     if (!user) {
//       setIsUserRegistered(false);
//       return;
//     }

//     try {
//       const token = await user.getIdToken();
//       const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-m3fkgk42eq-uc.a.run.app/api";
      
//       const res = await fetch(`${API_BASE_URL}/user/profile`, {
//         method: "GET",
//         headers: {
//           "Authorization": `Bearer ${token}`
//         },
//       });

//       if (res.ok) {
//         setIsUserRegistered(true);
//       } else if (res.status === 404) {
//         // User not found in backend
//         setIsUserRegistered(false);
//       } else {
//         console.error('Error checking registration status:', res.statusText);
//         setIsUserRegistered(false);
//       }
//     } catch (error) {
//       console.error('Error checking user registration:', error);
//       setIsUserRegistered(false);
//     }
//   };

//   // Register user with your backend - using the api.ts file
//   const registerUserBackend = async (userData: UserData, token: string): Promise<any> => {
//     try {
//       setRegistrationLoading(true);
//       // Import the registerUser function from your api.ts
//       const { registerUser } = await import('@/lib/api');
//       const result = await registerUser(userData, token);
//       setIsUserRegistered(true);
//       return result;
//     } catch (error) {
//       console.error('Error registering user:', error);
//       throw error;
//     } finally {
//       setRegistrationLoading(false);
//     }
//   };

//   // Sign in with Google (only authentication, not registration)
//   const signInWithGoogle = async (additionalUserData: Partial<UserData> = {}): Promise<User> => {
//     try {
//       const result = await signInWithPopup(auth, googleProvider);
//       const user = result.user;
      
//       // Don't automatically register here, let the flow handle it
//       return user;
//     } catch (error) {
//       console.error('Error signing in with Google:', error);
//       throw error;
//     }
//   };

//   // Complete user registration with location and additional data
//   const completeUserRegistration = async (additionalUserData: Partial<UserData> = {}): Promise<any> => {
//     if (!user) {
//       throw new Error('No user found');
//     }

//     try {
//       const token = await user.getIdToken();

//       // Get user location (optional)
//       let location: Location | null = null;
//       if (navigator.geolocation) {
//         try {
//           const position: GeolocationPosition = await new Promise((resolve, reject) => {
//             navigator.geolocation.getCurrentPosition(resolve, reject, {
//               timeout: 10000,
//               enableHighAccuracy: true
//             });
//           });
//           location = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude
//           };
//         } catch (error) {
//           console.log('Location access denied or failed');
//         }
//       }

//       // Prepare user data for registration
//       const userData: UserData = {
//         uid: user.uid,
//         name: user.displayName,
//         email: user.email,
//         profilePhotoUrl: user.photoURL,
//         location: location || { lat: 0, lng: 0 }, // Default location if not available
//         radius_km: 2,
//         categories: [],
//         notifications: {
//           enabled: true,
//           quietHours: null
//         },
//         preferences: {
//           useCurrentLocation: !!location,
//           manualLocality: null
//         },
//         ...additionalUserData
//       };

//       // Register user in your backend
//       return await registerUserBackend(userData, token);
//     } catch (error) {
//       console.error('Error completing user registration:', error);
//       throw error;
//     }
//   };

//   // Sign out
//   const signOut = async (): Promise<void> => {
//     try {
//       setIsUserRegistered(false);
//       await firebaseSignOut(auth);
//     } catch (error) {
//       console.error('Error signing out:', error);
//       throw error;
//     }
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
//       setUser(user);
//       setLoading(false);
      
//       if (user) {
//         // Check if user is registered in backend
//         await checkUserRegistrationStatus();
//       } else {
//         setIsUserRegistered(false);
//       }
//     });

//     return unsubscribe;
//   }, []);

//   // Re-check registration status when user changes
//   useEffect(() => {
//     if (user && !loading) {
//       checkUserRegistrationStatus();
//     }
//   }, [user, loading]);

//   const value: AuthContextType = {
//     user,
//     loading,
//     isUserRegistered,
//     registrationLoading,
//     signInWithGoogle,
//     signOut,
//     registerUser: completeUserRegistration,
//     checkUserRegistrationStatus
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// contexts/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

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
  name: string | null;
  email: string | null;
  profilePhotoUrl: string | null;
  location: Location;
  radius_km: number;
  categories: string[];
  notifications: Notifications;
  preferences: Preferences;
  [key: string]: any; // For additional user data
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isUserRegistered: boolean;
  registrationLoading: boolean;
  signInWithGoogle: (additionalUserData?: Partial<UserData>) => Promise<User>;
  signOut: () => Promise<void>;
  registerUser: (userData: UserData, token: string) => Promise<any>;
  checkUserRegistrationStatus: () => Promise<void>;
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

  // Check if user is registered in backend
  const checkUserRegistrationStatus = async (): Promise<void> => {
    if (!user) {
      setIsUserRegistered(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const { getUserProfile } = await import('@/lib/api');
      
      const result = await getUserProfile(token);
      if (result && result.user) {
        setIsUserRegistered(true);
      } else {
        setIsUserRegistered(false);
      }
    } catch (error) {
      console.error('Error checking user registration:', error);
      setIsUserRegistered(false);
    }
  };

  // Register user with your backend - using the api.ts file
  const registerUserBackend = async (userData: UserData, token: string): Promise<any> => {
    try {
      setRegistrationLoading(true);
      // Import the registerUser function from your api.ts
      const { registerUser } = await import('@/lib/api');
      const result = await registerUser(userData, token);
      setIsUserRegistered(true);
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
      
      // Don't automatically register here, let the flow handle it
      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
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

      // Prepare user data for registration
      const userData: UserData = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        profilePhotoUrl: user.photoURL,
        location: location || { lat: 0, lng: 0 }, // Default location if not available
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
        ...additionalUserData
      };

      // Register user in your backend
      return await registerUserBackend(userData, token);
    } catch (error) {
      console.error('Error completing user registration:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      setIsUserRegistered(false);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Check if user is registered in backend
        await checkUserRegistrationStatus();
      } else {
        setIsUserRegistered(false);
      }
    });

    return unsubscribe;
  }, []);

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
    signInWithGoogle,
    signOut,
    registerUser: completeUserRegistration,
    checkUserRegistrationStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};