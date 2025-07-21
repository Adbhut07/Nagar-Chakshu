// 'use client';

// import { useState, useEffect } from 'react';
// import { toast } from 'sonner';
// import { submitReport } from '@/lib/api';
// import { uploadFile, UploadProgress } from '@/lib/uploadService';
// import { Report } from '@/types/report';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import { Progress } from '@/components/ui/progress';
// import { UploadCloud, X } from 'lucide-react';

// export default function SubmitReport() {
//   const [description, setDescription] = useState('');
//   const [mediaUrl, setMediaUrl] = useState('');
//   const [fileName, setFileName] = useState('');
//   const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
//   const [place, setPlace] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);

//   useEffect(() => {
//     // Fetch user location on mount
//     navigator.geolocation.getCurrentPosition(
//       (position) => {
//         setLocation({
//           latitude: position.coords.latitude,
//           longitude: position.coords.longitude,
//         });
//       },
//       () => toast.error('Could not get location')
//     );
//   }, []);

//   const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
  
//     if (file.size > 10 * 1024 * 1024) {
//       toast.error('File size exceeds 10MB limit');
//       return;
//     }

//     // Validate file type
//     const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
//     if (!validTypes.includes(file.type)) {
//       toast.error('Invalid file type. Please upload an image or video file.');
//       return;
//     }
  
//     try {
//       setUploading(true);
//       setUploadProgress(0);
//       toast.loading('Uploading file...', { id: 'file-upload' });

//       const downloadURL = await uploadFile(file, (progress: UploadProgress) => {
//         setUploadProgress(progress.progress);
//       });

//       setMediaUrl(downloadURL);
//       setFileName(file.name);
      
//       toast.success('File uploaded successfully!', { id: 'file-upload' });
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
//       toast.error(errorMessage, { id: 'file-upload' });
//       console.error('Upload error:', error);
//     } finally {
//       setUploading(false);
//       setUploadProgress(0);
//     }
//   };

//   const removeUploadedFile = () => {
//     setMediaUrl('');
//     setFileName('');
//   };

//   const handleSubmit = async () => {
//     if (!description || !place || !location.latitude) {
//       toast.error('Please fill in all required fields');
//       return;
//     }

//     const payload: Report = {
//       description,
//       mediaUrl,
//       location,
//       place,
//     };

//     try {
//       setLoading(true);
//       await submitReport(payload);
//       toast.success('Report submitted successfully!');
      
//       // Reset form
//       setDescription('');
//       setMediaUrl('');
//       setFileName('');
//       setLocation({ latitude: 0, longitude: 0 });
//       setPlace('');
//     } catch (error) {
//       toast.error('Failed to submit report');
//       console.error(error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="max-w-2xl mx-auto p-6 space-y-6">
//       <h1 className="text-3xl font-semibold text-center">Report an Issue</h1>
//       <p className="text-center text-muted-foreground">
//         Help us improve your city by reporting civic issues
//       </p>

//       <section className="space-y-4 bg-muted/20 rounded-xl p-6 border">
//         <h2 className="text-xl font-medium flex items-center gap-2">
//           📷 Issue Details
//         </h2>

//         <div>
//           <label className="block mb-1 font-medium">Description *</label>
//           <Textarea
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="Describe the issue you want to report..."
//             className="min-h-[120px]"
//           />
//         </div>

//         <div>
//           <label className="block mb-1 font-medium">Photo/Video</label>
          
//           {!mediaUrl ? (
//             <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer text-center text-muted-foreground hover:bg-muted transition">
//               <UploadCloud className="w-8 h-8 mb-2" />
//               <p>Click to upload or drag and drop</p>
//               <p className="text-xs mt-1">Max 1 file, up to 10MB</p>
//               <p className="text-xs text-muted-foreground">Images: JPEG, PNG, GIF, WebP | Videos: MP4, WebM, MOV</p>
//               <Input 
//                 type="file" 
//                 accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime" 
//                 onChange={handleUpload} 
//                 className="hidden" 
//                 disabled={uploading}
//               />
//             </label>
//           ) : (
//             <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-green-700 text-sm font-medium">✓ File uploaded successfully</div>
//                   <div className="text-green-600 text-xs">{fileName}</div>
//                   <a 
//                     href={mediaUrl} 
//                     target="_blank" 
//                     rel="noopener noreferrer"
//                     className="text-blue-600 hover:text-blue-800 text-xs underline"
//                   >
//                     View uploaded file
//                   </a>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   onClick={removeUploadedFile}
//                   className="text-red-500 hover:text-red-700 hover:bg-red-50"
//                 >
//                   <X className="w-4 h-4" />
//                 </Button>
//               </div>
//             </div>
//           )}

//           {uploading && (
//             <div className="mt-2 space-y-2">
//               <div className="flex justify-between text-sm">
//                 <span>Uploading...</span>
//                 <span>{uploadProgress}%</span>
//               </div>
//               <Progress value={uploadProgress} className="w-full" />
//             </div>
//           )}
//         </div>

//         <div className="space-y-2">
//           <label className="block font-medium">Location</label>
//           <div className="flex gap-2">
//             <Input
//               value={location.latitude || ''}
//               onChange={(e) =>
//                 setLocation((prev) => ({ ...prev, latitude: Number(e.target.value) || 0 }))
//               }
//               placeholder="Latitude"
//               type="number"
//               step="any"
//             />
//             <Input
//               value={location.longitude || ''}
//               onChange={(e) =>
//                 setLocation((prev) => ({ ...prev, longitude: Number(e.target.value) || 0 }))
//               }
//               placeholder="Longitude"
//               type="number"
//               step="any"
//             />
//           </div>
//           <Button
//             variant="secondary"
//             onClick={() =>
//               navigator.geolocation.getCurrentPosition(
//                 (pos) =>
//                   setLocation({
//                     latitude: pos.coords.latitude,
//                     longitude: pos.coords.longitude,
//                   }),
//                 () => toast.error('Could not fetch location')
//               )
//             }
//             className="w-full"
//           >
//             Use my current location
//           </Button>
//         </div>

//         <div>
//           <label className="block mb-1 font-medium">Place Name *</label>
//           <Input
//             value={place}
//             onChange={(e) => setPlace(e.target.value)}
//             placeholder="e.g. Sector 18, Noida"
//           />
//         </div>

//         <Button
//           onClick={handleSubmit}
//           disabled={loading || uploading}
//           className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
//         >
//           {loading ? 'Submitting...' : uploading ? 'Please wait, file uploading...' : 'Submit Report'}
//         </Button>
//       </section>
//     </main>
//   );
// }



'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { submitReport } from '@/lib/api';
import { uploadFile, UploadProgress } from '@/lib/uploadService';
import { Report } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
// Progress component removed
import { UploadCloud, X } from 'lucide-react';

export default function SubmitReport() {
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Fetch user location on mount
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => toast.error('Could not get location')
    );
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image or video file.');
      return;
    }
  
    try {
      setUploading(true);
      setUploadProgress(0);
      toast.loading('Uploading file...', { id: 'file-upload' });

      const downloadURL = await uploadFile(file, (progress: UploadProgress) => {
        setUploadProgress(progress.progress);
      });

      setMediaUrl(downloadURL);
      setFileName(file.name);
      
      toast.success('File uploaded successfully!', { id: 'file-upload' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      toast.error(errorMessage, { id: 'file-upload' });
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeUploadedFile = () => {
    setMediaUrl('');
    setFileName('');
  };

  const handleSubmit = async () => {
    if (!description || !place || !location.latitude) {
      toast.error('Please fill in all required fields');
      return;
    }

    const payload: Report = {
      description,
      mediaUrl,
      location,
      place,
    };

    try {
      setLoading(true);
      await submitReport(payload);
      toast.success('Report submitted successfully!');
      
      // Reset form
      setDescription('');
      setMediaUrl('');
      setFileName('');
      setLocation({ latitude: 0, longitude: 0 });
      setPlace('');
    } catch (error) {
      toast.error('Failed to submit report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-semibold text-center">Report an Issue</h1>
      <p className="text-center text-muted-foreground">
        Help us improve your city by reporting civic issues
      </p>

      <section className="space-y-4 bg-muted/20 rounded-xl p-6 border">
        <h2 className="text-xl font-medium flex items-center gap-2">
          📷 Issue Details
        </h2>

        <div>
          <label className="block mb-1 font-medium">Description *</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue you want to report..."
            className="min-h-[120px]"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Photo/Video</label>
          
          {!mediaUrl ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer text-center text-muted-foreground hover:bg-muted transition">
              <UploadCloud className="w-8 h-8 mb-2" />
              <p>Click to upload or drag and drop</p>
              <p className="text-xs mt-1">Max 1 file, up to 10MB</p>
              <p className="text-xs text-muted-foreground">Images: JPEG, PNG, GIF, WebP | Videos: MP4, WebM, MOV</p>
              <Input 
                type="file" 
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime" 
                onChange={handleUpload} 
                className="hidden" 
                disabled={uploading}
              />
            </label>
          ) : (
            <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-700 text-sm font-medium">✓ File uploaded successfully</div>
                  <div className="text-green-600 text-xs">{fileName}</div>
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                  >
                    View uploaded file
                  </a>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeUploadedFile}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block font-medium">Location</label>
          <div className="flex gap-2">
            <Input
              value={location.latitude || ''}
              onChange={(e) =>
                setLocation((prev) => ({ ...prev, latitude: Number(e.target.value) || 0 }))
              }
              placeholder="Latitude"
              type="number"
              step="any"
            />
            <Input
              value={location.longitude || ''}
              onChange={(e) =>
                setLocation((prev) => ({ ...prev, longitude: Number(e.target.value) || 0 }))
              }
              placeholder="Longitude"
              type="number"
              step="any"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              navigator.geolocation.getCurrentPosition(
                (pos) =>
                  setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  }),
                () => toast.error('Could not fetch location')
              )
            }
            className="w-full"
          >
            Use my current location
          </Button>
        </div>

        <div>
          <label className="block mb-1 font-medium">Place Name *</label>
          <Input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="e.g. Sector 18, Noida"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          {loading ? 'Submitting...' : uploading ? 'Please wait, file uploading...' : 'Submit Report'}
        </Button>
      </section>
    </main>
  );
}