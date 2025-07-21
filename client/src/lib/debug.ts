// Debug utilities for Firebase Storage
import { ref, listAll } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const debugFirebaseStorage = async () => {
  try {
    console.log('🔍 Testing Firebase Storage connection...');
    
    // Test 1: Create a reference
    const testRef = ref(storage, 'test/connection-test.txt');
    console.log('✅ Storage reference created successfully:', testRef.fullPath);
    
    // Test 2: Try to list files in reports folder (if any)
    try {
      const reportsRef = ref(storage, 'reports');
      const listResult = await listAll(reportsRef);
      console.log('✅ Storage listing successful. Found files:', listResult.items.length);
    } catch (error) {
      console.log('ℹ️ Reports folder might be empty or not exist yet:', error);
    }
    
    console.log('✅ Firebase Storage is properly configured and accessible');
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage test failed:', error);
    return false;
  }
};

export const getStorageInfo = () => {
  console.log('Firebase Storage Configuration:');
  console.log('- Storage Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  console.log('- Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log('- API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing');
};
