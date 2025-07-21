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

// Auth API Functions

// Register new user
export async function registerUser(userData: UserRegistrationData, token: string) {
  try {
    console.log('Registering user:', userData.email);
    
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