import { Report } from "@/types/report";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-m3fkgk42eq-uc.a.run.app/api";
const REPORTS_ENDPOINT = `${API_BASE_URL}/api/reports`;
const AUTH_ENDPOINT = `${API_BASE_URL}`;

// Types
interface UserRegistrationData {
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

interface UserUpdateData {
  name?: string;
  profilePhotoUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius_km?: number;
  categories?: string[];
  notifications?: {
    enabled?: boolean;
    quietHours?: any;
  };
  preferences?: {
    useCurrentLocation?: boolean;
    manualLocality?: string | null;
  };
  fcmToken?: string;
}

interface UserPreferences {
  preferences?: {
    useCurrentLocation?: boolean;
    manualLocality?: string | null;
  };
  notifications?: {
    enabled?: boolean;
    quietHours?: any;
  };
  categories?: string[];
  radius_km?: number;
  fcmToken?: string;
}

// Helper function to create headers with auth token
const createAuthHeaders = (token: string) => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
});

// Existing Reports API
export async function submitReport(data: Report) {
  try {
    console.log('Submitting report to:', REPORTS_ENDPOINT);
    console.log('Report data:', data);
    
    const res = await fetch(REPORTS_ENDPOINT, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to submit report: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log('Report submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('Submit report error:', error);
    throw error;
  }
}

// Register new user
export async function registerUser(userData: UserRegistrationData, token: string) {
  try {
    console.log('Registering user:', userData.email);
    
    console.log('Using auth token:', token);
    const res = await fetch(`${AUTH_ENDPOINT}/register`, {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Registration Error Response:', errorText);
      throw new Error(`Failed to register user: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log('User registered successfully:', result);
    return result;
  } catch (error) {
    console.error('Register user error:', error);
    throw error;
  }
}

// Get user profile (check registration status)
export async function getUserProfile(token: string) {
  try {
    const res = await fetch(`${AUTH_ENDPOINT}/user/profile`, {
      method: "GET",
      headers: createAuthHeaders(token),
    });
    console.log("hello",res);

    if (!res.ok) {
      if (res.status === 404) {
        // User not registered
        return null;
      }
      const errorText = await res.text();
      console.error('Get profile Error Response:', errorText);
      throw new Error(`Failed to get user profile: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
}

// Update user profile
export async function updateUserProfile(userData: UserUpdateData, token: string) {
  try {
    const res = await fetch(`${AUTH_ENDPOINT}/user/profile`, {
      method: "PUT",
      headers: createAuthHeaders(token),
      body: JSON.stringify(userData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Update profile Error Response:', errorText);
      throw new Error(`Failed to update user profile: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
}

// Delete user account
export async function deleteUserAccount(token: string) {
  try {
    const res = await fetch(`${AUTH_ENDPOINT}/user/profile`, {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Delete account Error Response:', errorText);
      throw new Error(`Failed to delete user account: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Delete user account error:', error);
    throw error;
  }
}

// Update user location only
export async function updateUserLocation(location: { lat: number; lng: number }, token: string) {
  try {
    const res = await fetch(`${AUTH_ENDPOINT}/user/location`, {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ location }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Update location Error Response:', errorText);
      throw new Error(`Failed to update user location: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Update user location error:', error);
    throw error;
  }
}

// Update FCM token
export async function updateFCMToken(fcmToken: string, token: string) {
  try {
    console.log('Updating FCM token');
    
    const res = await fetch(`${AUTH_ENDPOINT}/user/fcm-token`, {
      method: "POST",
      headers: createAuthHeaders(token),
      body: JSON.stringify({ fcmToken }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Update FCM token Error Response:', errorText);
      throw new Error(`Failed to update FCM token: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log('FCM token updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Update FCM token error:', error);
    throw error;
  }
}

// Remove FCM token (for logout)
export async function removeFCMToken(token: string) {
  try {
    console.log('Removing FCM token');
    
    const res = await fetch(`${AUTH_ENDPOINT}/user/fcm-token`, {
      method: "DELETE",
      headers: createAuthHeaders(token),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Remove FCM token Error Response:', errorText);
      throw new Error(`Failed to remove FCM token: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    console.log('FCM token removed successfully:', result);
    return result;
  } catch (error) {
    console.error('Remove FCM token error:', error);
    throw error;
  }
}

// Get user preferences
export async function getUserPreferences(token: string) {
  try {
    const res = await fetch(`${AUTH_ENDPOINT}/user/preferences`, {
      method: "GET",
      headers: createAuthHeaders(token),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Get preferences Error Response:', errorText);
      throw new Error(`Failed to get user preferences: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Get user preferences error:', error);
    throw error;
  }
}

// Update user preferences
export async function updateUserPreferences(preferences: UserPreferences, token: string) {
  try {
    const res = await fetch(`${AUTH_ENDPOINT}/user/preferences`, {
      method: "PUT",
      headers: createAuthHeaders(token),
      body: JSON.stringify(preferences),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Update preferences Error Response:', errorText);
      throw new Error(`Failed to update user preferences: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Update user preferences error:', error);
    throw error;
  }
}

// Get user statistics
export async function getUserStats(token: string) {
  try {
    const res = await fetch(`${AUTH_ENDPOINT}/user/stats`, {
      method: "GET",
      headers: createAuthHeaders(token),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Get stats Error Response:', errorText);
      throw new Error(`Failed to get user stats: ${res.status} ${res.statusText}`);
    }
    
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
  }
}

// FCM Token Management Utilities

/**
 * Helper function to handle FCM token registration/update during user login
 * This should be called after successful authentication
 */
export async function handleFCMTokenOnLogin(fcmToken: string, authToken: string) {
  try {
    // First check if user is already registered
    const userProfile = await getUserProfile(authToken);
    
    if (userProfile) {
      // User exists, just update the FCM token
      await updateFCMToken(fcmToken, authToken);
    }
    // If user doesn't exist, FCM token will be handled during registration
    
    return true;
  } catch (error) {
    console.error('Error handling FCM token on login:', error);
    // Don't throw error as FCM token is not critical for app functionality
    return false;
  }
}

/**
 * Helper function to handle FCM token removal during logout
 */
export async function handleFCMTokenOnLogout(authToken: string) {
  try {
    await removeFCMToken(authToken);
    return true;
  } catch (error) {
    console.error('Error removing FCM token on logout:', error);
    // Don't throw error as this is cleanup operation
    return false;
  }
}

/**
 * Helper function to refresh FCM token
 * Call this when you receive a new FCM token from Firebase
 */
export async function refreshFCMToken(newFcmToken: string, authToken: string) {
  try {
    await updateFCMToken(newFcmToken, authToken);
    console.log('FCM token refreshed successfully');
    return true;
  } catch (error) {
    console.error('Error refreshing FCM token:', error);
    return false;
  }
}