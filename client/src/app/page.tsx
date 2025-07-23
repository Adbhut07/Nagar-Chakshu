// 'use client';

// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import ProtectedRoute from '@/components/AuthGuard';
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';
// import { 
//   MapPin, 
//   Clock, 
//   AlertTriangle,
//   Wind,
//   Droplets,
//   BarChart3,
//   Shield,
//   Building,
//   TrendingUp,
//   CheckCircle2,
//   ArrowRight,
//   ExternalLink
// } from 'lucide-react';
// import Link from 'next/link';
// import FCMTestComponent from '@/components/CMTestComponent';

// // Realistic mock data
// const cityStats = {
//   activeReports: 156,
//   resolvedToday: 43,
//   avgResponseTime: '2.5h',
//   satisfaction: '94%'
// };

// const newsItems = [
//   {
//     id: 1,
//     title: 'Outer Ring Road Traffic Update: 40% Congestion Detected',
//     source: 'Traffic Control Center',
//     time: '3 min ago',
//     category: 'Traffic',
//     priority: 'high'
//   },
//   {
//     id: 2,
//     title: 'Water Supply Maintenance in JP Nagar - Expected 4 Hour Outage',
//     source: 'BWSSB',
//     time: '12 min ago',
//     category: 'Utilities',
//     priority: 'medium'
//   },
//   {
//     id: 3,
//     title: 'Metro Purple Line: Normal Operations Resumed After Technical Issue',
//     source: 'BMRCL',
//     time: '25 min ago',
//     category: 'Transport',
//     priority: 'low'
//   }
// ];

// const recentReports = [
//   { id: 1, issue: 'Pothole on 100ft Road, Indiranagar', status: 'In Progress', time: '15 min ago', area: 'Indiranagar' },
//   { id: 2, issue: 'Street light outage near Forum Mall', status: 'Resolved', time: '1 hour ago', area: 'Koramangala' },
//   { id: 3, issue: 'Garbage collection missed - Jayanagar 4th Block', status: 'Assigned', time: '2 hours ago', area: 'Jayanagar' },
//   { id: 4, issue: 'Water logging after rain on Bannerghatta Road', status: 'Under Review', time: '4 hours ago', area: 'Bannerghatta' }
// ];

// const weatherData = {
//   temperature: 26,
//   condition: 'Partly Cloudy',
//   humidity: 68,
//   windSpeed: 14,
//   visibility: '10 km',
//   uvIndex: 5
// };

// export default function HomePage() {
// const { user, loading, isUserRegistered } = useAuth();
// const router = useRouter();

// useEffect(() => {
//     if (!loading) {
//       if (!user) {
//         // Not authenticated, redirect to sign in
//         router.push('/signIn');
//       } else if (!isUserRegistered) {
//         // Authenticated but not registered, redirect to registration
//         router.push('/register');
//       } else {
//         // Fully authenticated and registered, redirect to dashboard
//         router.push('/dashboard');
//       }
//     }
//   }, [user, loading, isUserRegistered, router]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//           <p>Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'high': return 'bg-red-100 text-red-800 border-red-200';
//       case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
//       case 'low': return 'bg-green-100 text-green-800 border-green-200';
//       default: return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'Resolved': return 'bg-green-500';
//       case 'In Progress': return 'bg-blue-500';
//       case 'Assigned': return 'bg-yellow-500';
//       case 'Under Review': return 'bg-gray-500';
//       default: return 'bg-gray-400';
//     }
//   };

//   return (      
//     <ProtectedRoute>
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       {/* Hero Section */}
//       <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
//         <div className="max-w-7xl mx-auto px-4 py-12">
//           <div className="text-center mb-12">
//             <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
//               Bengaluru City Dashboard
//             </h1>
//             <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
//               Real-time insights and civic reporting platform for a better Bengaluru
//             </p>
//           </div>

//           {/* Key Metrics */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Reports</p>
//                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{cityStats.activeReports}</p>
//                 </div>
//                 <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
//                   <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved Today</p>
//                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{cityStats.resolvedToday}</p>
//                 </div>
//                 <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
//                   <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
//                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{cityStats.avgResponseTime}</p>
//                 </div>
//                 <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
//                   <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//                 </div>
//               </div>
//             </div>

//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction</p>
//                   <p className="text-2xl font-bold text-gray-900 dark:text-white">{cityStats.satisfaction}</p>
//                 </div>
//                 <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
//                   <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

//           <FCMTestComponent />



//           {/* Left Column - Main Content */}
//           <div className="lg:col-span-2 space-y-8">

//             {/* City News & Alerts */}
//             <Card className="shadow-sm border-gray-200 dark:border-gray-700">
//               <CardHeader className="pb-4">
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
//                     Live City Updates
//                   </CardTitle>
//                   <Badge variant="destructive" className="bg-red-500">Live</Badge>
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {newsItems.map((news) => (
//                   <div key={news.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
//                     <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(news.priority)}`}>
//                       {news.category}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
//                         {news.title}
//                       </h3>
//                       <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
//                         <span>{news.source}</span>
//                         <span>•</span>
//                         <span>{news.time}</span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//                 <Button variant="outline" className="w-full mt-4">
//                   View All Updates <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </CardContent>
//             </Card>

//             {/* Report an Issue */}
//             <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
//               <CardContent className="p-8">
//                 <div className="text-center">
//                   <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
//                     <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
//                   </div>
//                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
//                     Report a City Issue
//                   </h2>
//                   <p className="text-gray-600 dark:text-gray-300 mb-6">
//                     Help improve Bengaluru by reporting issues in your area with photos and precise location
//                   </p>
//                   <Link href="/submit-report">
//                     <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3">
//                       Submit Report
//                       <ArrowRight className="ml-2 h-4 w-4" />
//                     </Button>
//                   </Link>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Recent Reports */}
//             <Card className="shadow-sm border-gray-200 dark:border-gray-700">
//               <CardHeader>
//                 <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
//                   Recent Community Reports
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="space-y-4">
//                   {recentReports.map((report) => (
//                     <div key={report.id} className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
//                       <div className={`w-3 h-3 rounded-full ${getStatusColor(report.status)}`}></div>
//                       <div className="flex-1">
//                         <h3 className="font-medium text-gray-900 dark:text-white text-sm">
//                           {report.issue}
//                         </h3>
//                         <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
//                           <span className="flex items-center">
//                             <MapPin className="h-3 w-3 mr-1" />
//                             {report.area}
//                           </span>
//                           <span className="flex items-center">
//                             <Clock className="h-3 w-3 mr-1" />
//                             {report.time}
//                           </span>
//                         </div>
//                       </div>
//                       <Badge variant="outline" className="text-xs">
//                         {report.status}
//                       </Badge>
//                     </div>
//                   ))}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Right Sidebar */}
//           <div className="space-y-6">

//             {/* Weather Widget */}
//             <Card className="shadow-sm border-gray-200 dark:border-gray-700">
//               <CardHeader className="pb-4">
//                 <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
//                   Current Weather
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="text-center mb-4">
//                   <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
//                     {weatherData.temperature}°C
//                   </div>
//                   <p className="text-gray-600 dark:text-gray-300">{weatherData.condition}</p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                   <div className="flex items-center space-x-2">
//                     <Droplets className="h-4 w-4 text-blue-500" />
//                     <div>
//                       <p className="text-gray-500 dark:text-gray-400">Humidity</p>
//                       <p className="font-medium text-gray-900 dark:text-white">{weatherData.humidity}%</p>
//                     </div>
//                   </div>

//                   <div className="flex items-center space-x-2">
//                     <Wind className="h-4 w-4 text-gray-500" />
//                     <div>
//                       <p className="text-gray-500 dark:text-gray-400">Wind</p>
//                       <p className="font-medium text-gray-900 dark:text-white">{weatherData.windSpeed} km/h</p>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Quick Actions */}
//             <Card className="shadow-sm border-gray-200 dark:border-gray-700">
//               <CardHeader>
//                 <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
//                   Quick Actions
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <Button variant="outline" className="w-full justify-between text-left" size="sm">
//                   <div className="flex items-center">
//                     <BarChart3 className="h-4 w-4 mr-3 text-blue-600" />
//                     <span>View Analytics Dashboard</span>
//                   </div>
//                   <ExternalLink className="h-4 w-4" />
//                 </Button>

//                 <Button variant="outline" className="w-full justify-between text-left" size="sm">
//                   <div className="flex items-center">
//                     <Shield className="h-4 w-4 mr-3 text-red-600" />
//                     <span>Emergency Services</span>
//                   </div>
//                   <ExternalLink className="h-4 w-4" />
//                 </Button>

//                 <Button variant="outline" className="w-full justify-between text-left" size="sm">
//                   <div className="flex items-center">
//                     <Building className="h-4 w-4 mr-3 text-green-600" />
//                     <span>Government Portal</span>
//                   </div>
//                   <ExternalLink className="h-4 w-4" />
//                 </Button>
//               </CardContent>
//             </Card>

//             {/* System Status */}
//             <Card className="shadow-sm border-gray-200 dark:border-gray-700">
//               <CardHeader>
//                 <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
//                   System Status
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Data Services</span>
//                   <div className="flex items-center">
//                     <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                     <span className="text-sm font-medium text-green-600">Operational</span>
//                   </div>
//                 </div>

//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Report Processing</span>
//                   <div className="flex items-center">
//                     <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                     <span className="text-sm font-medium text-green-600">Normal</span>
//                   </div>
//                 </div>

//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
//                   <Badge variant="secondary">{"< 200ms"}</Badge>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//     </ProtectedRoute>

//   );
// }


"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import UserSubmitReport from "@/components/UserSubmitReport"
import { Plus, FileText } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { updateUserLocation, fetchProcessedData } from "@/lib/api"
import { toast } from "sonner"
import LiveData from "@/components/LiveData"
import ProtectedRoute from '@/components/AuthGuard';


const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/';

export default function HomePage() {
  const [showReportModal, setShowReportModal] = useState(false)
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 })

  const openModal = () => setShowReportModal(true)
  const closeModal = () => setShowReportModal(false)

  const { user } = useAuth()
  const {userProfile} = useAuth()


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




  async function updateLocation() {
    try {
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken(true);
      if (!token) throw new Error("Auth token missing");

      const result = await updateUserLocation(
        { lat: location.latitude, lng: location.longitude },
        token
      );
      console.log("Location updated:", result);
    } catch (error) {
      console.error("Failed to update location:", error);
      toast.error("Failed to sync location with server");
    }
  }


    async function getProcessedData() {
    try {
      if (!user) throw new Error("User not authenticated");
      const token = await user.getIdToken(true);
      if (!token) throw new Error("Auth token missing");

      const radius = (userProfile?.radius_km || 5)*1000; // Default to 5km if not set

      const result = await fetchProcessedData(
        { lat: location.latitude, lng: location.longitude },
        radius,
        token
      );
      console.log("Processed data:", result);
    } catch (error) {
      console.error("Failed to fetch processed data:", error);
      toast.error("Failed to fetch processed data");
    }
  }


  useEffect(() => {
    if (location.latitude === 0 && location.longitude === 0) return;
    if (!user) return;

    updateLocation();
    getProcessedData();


  }, [location, user, userProfile]);

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Main Content */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white mb-4">
            Nagar
            <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
              Chakshu
            </span>
          </h1>
          <p className="text-white/60 text-lg mb-8">AI-powered civic monitoring platform</p>
        </motion.div>

        {/* Animated Submit Report Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            onClick={openModal}
            className="group relative overflow-hidden bg-gradient-to-r from-purple-500 to-orange-500 text-white font-medium py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Button content */}
            <div className="relative flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-6 h-6"
              >
                <Plus className="w-6 h-6" />
              </motion.div>
              <span className="text-lg">Submit a Report!</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <FileText className="w-5 h-5" />
              </motion.div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </motion.button>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 text-white/40 text-sm"
        >
          <p>Help improve your city by reporting civic issues</p>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-purple-500 rounded-full"
          />
          <motion.div
            animate={{
              y: [0, -15, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-orange-500 rounded-full"
          />
          <motion.div
            animate={{
              y: [0, -25, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
            className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/30 rounded-full"
          />
        </div>
      </div>

      {/* Submit Report Modal */}
      <AnimatePresence>{showReportModal && <UserSubmitReport onClose={closeModal} />}</AnimatePresence>

      <LiveData />
    </div>

    </ProtectedRoute>
  )
}
