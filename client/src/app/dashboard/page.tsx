'use client';

import AuthGuard from '@/components/AuthGuard';
import MapDashboard from '@/components/MapDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Users,
  BarChart3,
  Filter,
  Download,
  Settings
} from 'lucide-react';
import Link from 'next/link';

// Mock data for dashboard metrics
const dashboardStats = {
  totalReports: 1247,
  activeIssues: 156,
  resolvedToday: 43,
  avgResponseTime: '2.5h',
  sentimentScore: 72,
  participatingCitizens: 8934
};

const recentActivity = [
  { id: 1, action: 'New report submitted', area: 'Koramangala', time: '2 min ago', type: 'report' },
  { id: 2, action: 'Issue resolved', area: 'Indiranagar', time: '15 min ago', type: 'resolved' },
  { id: 3, action: 'Authority response', area: 'Jayanagar', time: '32 min ago', type: 'response' },
  { id: 4, action: 'Community update', area: 'Whitefield', time: '1h ago', type: 'update' }
];

export default function DashboardPage() {
  return (
    <AuthGuard requireRegistration={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Nagar Chakshu Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Monitor civic issues and city sentiment in real-time
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Link href="/submit-report">
                  <Button size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Main Map Section - Takes 3 columns */}
            <div className="lg:col-span-3">
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                      Interactive City Map
                    </CardTitle>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Live Data
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <MapDashboard />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="space-y-6">
              
              {/* Key Metrics */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Key Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active Issues</span>
                    </div>
                    <span className="font-semibold text-red-600">{dashboardStats.activeIssues}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Resolved Today</span>
                    </div>
                    <span className="font-semibold text-green-600">{dashboardStats.resolvedToday}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response</span>
                    </div>
                    <span className="font-semibold text-blue-600">{dashboardStats.avgResponseTime}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sentiment Score</span>
                    </div>
                    <span className="font-semibold text-purple-600">{dashboardStats.sentimentScore}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Citizens</span>
                    </div>
                    <span className="font-semibold text-orange-600">{dashboardStats.participatingCitizens.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'report' ? 'bg-red-500' :
                          activity.type === 'resolved' ? 'bg-green-500' :
                          activity.type === 'response' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.action}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span>{activity.area}</span>
                            <span>•</span>
                            <span>{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/submit-report">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <AlertTriangle className="h-4 w-4 mr-3 text-red-600" />
                      Submit New Report
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <BarChart3 className="h-4 w-4 mr-3 text-blue-600" />
                    View Analytics
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Settings className="h-4 w-4 mr-3 text-gray-600" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}