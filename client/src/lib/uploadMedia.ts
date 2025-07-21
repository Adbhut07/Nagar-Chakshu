import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

export const uploadFile = async (file: File): Promise<string> => {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV).');
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Create a unique filename with timestamp and sanitized name
  const timestamp = Date.now();
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
  const fileName = `${timestamp}-${sanitizedName}`;
  
  const fileRef = ref(storage, `reports/${fileName}`);
  const uploadTask = uploadBytesResumable(fileRef, file);

  return new Promise<string>((resolve, reject) => {
    // Set a timeout for the upload (2 minutes)
    const timeoutId = setTimeout(() => {
      uploadTask.cancel();
      reject(new Error('Upload timeout - please check your connection and try again'));
    }, 120000);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Track upload progress
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload progress: ${Math.round(progress)}%`);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Upload error:', error);
        
        // Handle specific Firebase Storage errors
        switch (error.code) {
          case 'storage/retry-limit-exceeded':
            reject(new Error('Upload failed due to network issues. Please check your internet connection and try again.'));
            break;
          case 'storage/invalid-format':
            reject(new Error('Invalid file format. Please upload a supported image or video file.'));
            break;
          case 'storage/unauthorized':
            reject(new Error('Upload not authorized. Please check Firebase Storage rules.'));
            break;
          case 'storage/canceled':
            reject(new Error('Upload was canceled.'));
            break;
          case 'storage/quota-exceeded':
            reject(new Error('Storage quota exceeded. Please contact support.'));
            break;
          case 'storage/unauthenticated':
            reject(new Error('Authentication required for upload.'));
            break;
          case 'storage/server-file-wrong-size':
            reject(new Error('File size mismatch during upload. Please try again.'));
            break;
          default:
            reject(new Error(`Upload failed: ${error.message || 'Unknown error occurred'}`));
        }
      },
      async () => {
        try {
          clearTimeout(timeoutId);
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('File uploaded successfully. Download URL:', url);
          resolve(url);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(new Error('File uploaded but failed to get download URL. Please try again.'));
        }
      }
    );
  });
};
