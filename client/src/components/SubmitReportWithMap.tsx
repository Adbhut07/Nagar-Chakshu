'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { submitReport } from '@/lib/api';
import { uploadFile, UploadProgress } from '@/lib/uploadService';
import { Report } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, X, MapPin, Navigation } from 'lucide-react';
import GoogleMap from '@/components/GoogleMap';

export default function SubmitReport() {
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [place, setPlace] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = [
    'Pothole',
    'Water Logging',
    'Streetlight',
    'Traffic Signal',
    'Garbage',
    'Road Damage',
    'Tree Falling',
    'Other'
  ];

  useEffect(() => {
    // Fetch user location on mount
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedLocation(userLocation);
      },
      () => {
        toast.error('Could not get location. Please select location on map.');
        // Default to Bangalore center
        setSelectedLocation({ lat: 12.9716, lng: 77.5946 });
      }
    );
  }, []);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setSelectedLocation({ lat, lng });
      
      // Reverse geocoding to get address (optional)
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setPlace(results[0].formatted_address);
        }
      });
    }
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedLocation(userLocation);
        toast.success('Location updated to your current position');
      },
      () => toast.error('Could not get current location')
    );
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

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
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setMediaUrl('');
    setFileName('');
    toast.success('File removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    setLoading(true);

    try {
      const reportData: Report = {
        description: description.trim(),
        location: {
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
        },
        place: place || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`,
        mediaUrl: mediaUrl || '',
      };

      await submitReport(reportData);
      
      toast.success('Report submitted successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setSeverity('medium');
      setMediaUrl('');
      setFileName('');
      setPlace('');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Submit a Report</h1>
          <p className="text-gray-600 mt-2">
            Report civic issues in your area to help improve our city
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form Fields */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Report Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief title for the issue"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Severity</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSeverity(level)}
                          className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                            severity === level
                              ? level === 'high' ? 'bg-red-500 text-white' :
                                level === 'medium' ? 'bg-yellow-500 text-white' :
                                'bg-green-500 text-white'
                              : level === 'high' ? 'bg-red-100 text-red-700' :
                                level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={4}
                      required
                    />
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Media (Photo/Video)
                    </label>
                    {!mediaUrl ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleUpload}
                          className="hidden"
                          id="file-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF, MP4 up to 10MB
                          </p>
                        </label>
                        {uploading && (
                          <div className="mt-4">
                            <Progress value={uploadProgress} />
                            <p className="text-sm text-gray-600 mt-2">
                              Uploading... {Math.round(uploadProgress)}%
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-700">{fileName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location Map */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Use Current
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Address Input */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Address</label>
                      <Input
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        placeholder="Click on map or enter address"
                      />
                    </div>

                    {/* Map */}
                    <div className="h-64 border rounded-lg overflow-hidden">
                      <GoogleMap
                        center={selectedLocation || { lat: 12.9716, lng: 77.5946 }}
                        zoom={15}
                        markers={selectedLocation ? [selectedLocation] : []}
                        onMapClick={handleMapClick}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    {selectedLocation && (
                      <div className="text-sm text-gray-600">
                        📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || uploading}
              className="min-w-32"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
