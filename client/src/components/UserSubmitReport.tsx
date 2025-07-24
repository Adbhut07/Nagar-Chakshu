"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { submitReport } from "@/lib/api"
import { uploadFile, type UploadProgress } from "@/lib/uploadService"
import type { Report } from "@/types/report"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { UploadCloud, X, MapPin, Camera } from "lucide-react"

interface UserSubmitReportProps {
  onClose?: () => void
}

export default function UserSubmitReport({ onClose }: UserSubmitReportProps) {
  const [description, setDescription] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 })
  const [place, setPlace] = useState("")
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)


  const successSteps = [
    "Submitting Your Report...",
    "Categorizing the report by Multimodal Intake Agent...",
    "Getting the proper location",
    "Your report is analyzed successfully by agent",
    "It will appear with other reports after 10 minutes.",
    "Thanks for submitting the report.",
  ]


  useEffect(() => {
    // Fetch user location on mount
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })


      },
      () => toast.error("Could not get location"),
    )
  }, [])


  // Success animation sequence
  useEffect(() => {
    if (showSuccess) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < successSteps.length - 1) {
            return prev + 1
          } else {
            clearInterval(interval)
            // Auto close after final message
            setTimeout(() => {
              onClose?.()
            }, 3000)
            return prev
          }
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [showSuccess, onClose, successSteps.length])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit")
      return
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ]
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload an image or video file.")
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)
      toast.loading("Uploading file...", { id: "file-upload" })

      const downloadURL = await uploadFile(file, (progress: UploadProgress) => {
        setUploadProgress(progress.progress)
      })

      setMediaUrl(downloadURL)
      setFileName(file.name)
      toast.success("File uploaded successfully!", { id: "file-upload" })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file"
      toast.error(errorMessage, { id: "file-upload" })
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeUploadedFile = () => {
    setMediaUrl("")
    setFileName("")
  }

  const handleSubmit = async () => {
    if (!description || !place || !location.latitude) {
      toast.error("Please fill in all required fields")
      return
    }

    const payload: Report = {
      description,
      mediaUrl,
      location,
      place,
    }

    try {
      setLoading(true)
      await submitReport(payload)
      setShowSuccess(true)
      setCurrentStep(0)

      // Reset form
      setDescription("")
      setMediaUrl("")
      setFileName("")
      setLocation({ latitude: 0, longitude: 0 })
      setPlace("")
    } catch (error) {
      toast.error("Failed to submit report")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => toast.error("Could not fetch location"),
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-black border border-white/10 rounded-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 sm:p-6 lg:p-8 xl:p-12 flex flex-col items-center justify-center min-h-[350px] sm:min-h-[400px]"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center mb-8">
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
              </div>

              <div className="text-center h-20 flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className={`text-white text-lg font-light ${currentStep === successSteps.length - 1 ? "text-purple-400" : ""
                      }`}
                  >
                    {successSteps[currentStep]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="flex space-x-2 mt-8">
                {successSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index <= currentStep ? "bg-purple-500" : "bg-white/20"
                      }`}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-light text-white">Report an Issue</h2>
                    <p className="text-white/60 text-sm mt-1">Help improve your city</p>
                  </div>
                  {onClose && (
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Form Content */}
              <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)] overflow-y-auto">
                {/* Description */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <label className="block text-white text-sm font-medium mb-2">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue you want to report..."
                    className="min-h-[80px] sm:min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm resize-none"
                  />
                </motion.div>

                {/* File Upload */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <label className="block text-white text-sm font-medium mb-2">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Photo/Video
                  </label>

                  {!mediaUrl ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-lg p-4 sm:p-6 cursor-pointer hover:border-white/30 transition-colors">
                      <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6 text-white/60 mb-2" />
                      <p className="text-white/80 text-xs sm:text-sm">Click to upload or drag and drop</p>
                      <p className="text-white/40 text-xs mt-1">Max 10MB • Images & Videos</p>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                        onChange={handleUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  ) : (
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-green-400 text-sm font-medium">✓ File uploaded</div>
                          <div className="text-green-300/80 text-xs">{fileName}</div>
                          <a
                            href={mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-xs underline"
                          >
                            View file
                          </a>
                        </div>
                        <button onClick={removeUploadedFile} className="text-red-400 hover:text-red-300 p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm text-white/80">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-orange-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Location */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <label className="block text-white text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Location
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      value={location.latitude || ""}
                      onChange={(e) => setLocation((prev) => ({ ...prev, latitude: Number(e.target.value) || 0 }))}
                      placeholder="Latitude"
                      type="number"
                      step="any"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
                    />
                    <Input
                      value={location.longitude || ""}
                      onChange={(e) => setLocation((prev) => ({ ...prev, longitude: Number(e.target.value) || 0 }))}
                      placeholder="Longitude"
                      type="number"
                      step="any"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 text-sm"
                  >
                    Use current location
                  </Button>
                </motion.div>

                {/* Place Name */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <label className="block text-white text-sm font-medium mb-2">
                    Place Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Sector 18, Noida"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || uploading}
                    className="w-full bg-white hover:bg-white/90 text-black font-medium py-2.5 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                        Submitting...
                      </div>
                    ) : uploading ? (
                      "Please wait, file uploading..."
                    ) : (
                      "Submit Report"
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
