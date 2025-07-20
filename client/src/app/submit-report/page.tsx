'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { submitReport } from '@/lib/api';
import { Report } from '@/types/report';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { uploadFile } from "@/lib/uploadMedia";

export default function SubmitReport() {
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [place, setPlace] = useState('');
  const [loading, setLoading] = useState(false);

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
  
    try {
      setLoading(true);
      const uploadedUrl = await uploadFile(file); 
      setMediaUrl(uploadedUrl); 
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description || !mediaUrl || !place || !location.latitude) {
      toast.error('Please fill in all fields');
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
      setDescription('');
      setMediaUrl('');
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
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer text-center text-muted-foreground hover:bg-muted transition">
            <UploadCloud className="w-8 h-8 mb-2" />
            <p>Click to upload or drag and drop</p>
            <p className="text-xs mt-1">Max 1 file, up to 10MB</p>
            <Input type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          </label>
          {mediaUrl && (
            <div className="mt-2 text-green-500 text-sm">File selected ✓</div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block font-medium">Location</label>
          <div className="flex gap-2">
            <Input
              value={location.latitude}
              onChange={(e) =>
                setLocation((prev) => ({ ...prev, latitude: Number(e.target.value) }))
              }
              placeholder="Latitude"
            />
            <Input
              value={location.longitude}
              onChange={(e) =>
                setLocation((prev) => ({ ...prev, longitude: Number(e.target.value) }))
              }
              placeholder="Longitude"
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
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </Button>
      </section>
    </main>
  );
}
