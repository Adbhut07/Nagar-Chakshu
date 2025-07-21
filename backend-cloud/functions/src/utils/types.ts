// types.ts - Type definitions for your Firebase Cloud Functions

import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

// Extend Express Request to include user from Firebase token
declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
    }
  }
}

// Location interface
export interface Location {
  lat: number;
  lng: number;
  geohash?: string;
}

// Notification preferences
export interface Notifications {
  enabled: boolean;
  quietHours: string | null;
}

// User preferences
export interface Preferences {
  useCurrentLocation: boolean;
  manualLocality: string | null;
}

// User data for registration
export interface UserRegistrationData {
  uid: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  location: Location;
  radius_km?: number;
  categories?: string[];
  notifications?: Notifications;
  preferences?: Preferences;
}

// Complete user document structure in Firestore
export interface UserDocument extends UserRegistrationData {
  createdAt: FirebaseFirestore.Timestamp;
  lastActiveAt: FirebaseFirestore.Timestamp;
}

// User profile update data
export interface UserUpdateData {
  name?: string;
  profilePhotoUrl?: string;
  location?: Location;
  radius_km?: number;
  categories?: string[];
  notifications?: Notifications;
  preferences?: Preferences;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface UserProfileResponse {
  message: string;
  user: Omit<UserDocument, 'createdAt' | 'lastActiveAt'>;
}

export interface UserStatsResponse {
  message: string;
  stats: {
    registrationDate: FirebaseFirestore.Timestamp;
    lastActive: FirebaseFirestore.Timestamp;
    categoriesCount: number;
    currentRadius: number;
    locationEnabled: boolean;
  };
}

export interface UserPreferencesResponse {
  preferences: Preferences;
  notifications: Notifications;
  categories: string[];
  radius_km: number;
}

// Request body interfaces
export interface RegisterUserRequest {
  uid: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  location: Location;
  radius_km?: number;
  categories?: string[];
  notifications?: Notifications;
  preferences?: Preferences;
}

export interface UpdateLocationRequest {
  location: Location;
}

export interface UpdatePreferencesRequest {
  preferences?: Preferences;
  notifications?: Notifications;
  categories?: string[];
  radius_km?: number;
}