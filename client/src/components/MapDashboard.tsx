'use client';

import { useState, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Report {
  id: string;
  lat: number;
  lng: number;
  category: string;
  title: string;
  status: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

// Mock data for demonstration
const mockReports: Report[] = [
  { id: '1', lat: 12.9716, lng: 77.5946, category: 'Pothole', title: 'Large pothole on MG Road', status: 'Open', severity: 'high', timestamp: new Date('2024-01-15') },
  { id: '2', lat: 12.9758, lng: 77.6012, category: 'Water Logging', title: 'Water logging near Forum Mall', status: 'In Progress', severity: 'medium', timestamp: new Date('2024-01-14') },
  { id: '3', lat: 12.9348, lng: 77.6245, category: 'Streetlight', title: 'Broken streetlight', status: 'Open', severity: 'low', timestamp: new Date('2024-01-13') },
  { id: '4', lat: 12.9698, lng: 77.7499, category: 'Traffic', title: 'Traffic signal not working', status: 'Resolved', severity: 'high', timestamp: new Date('2024-01-12') },
  { id: '5', lat: 12.9279, lng: 77.6271, category: 'Garbage', title: 'Overflowing garbage bin', status: 'Open', severity: 'medium', timestamp: new Date('2024-01-11') },
];

// Mock sentiment data for heatmap
const mockSentimentData = [
  { lat: 12.9716, lng: 77.5946 }, // Negative sentiment areas
  { lat: 12.9758, lng: 77.6012 },
  { lat: 12.9348, lng: 77.6245 },
  { lat: 12.9698, lng: 77.7499 },
  { lat: 12.9279, lng: 77.6271 },
  { lat: 12.9716, lng: 77.5946 }, // Duplicate for intensity
  { lat: 12.9758, lng: 77.6012 },
];

const MapDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'incidents' | 'heatmap'>('incidents');
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [mapCenter] = useState({ lat: 12.9716, lng: 77.5946 }); // Bangalore center

  useEffect(() => {
    // In real app, fetch from API
    setReports(mockReports);
  }, []);

  const filteredReports = selectedCategory === 'all' 
    ? reports 
    : reports.filter(report => report.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const reportMarkers = filteredReports.map(report => ({
    lat: report.lat,
    lng: report.lng
  }));

  const categories = ['all', 'pothole', 'water logging', 'streetlight', 'traffic', 'garbage'];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Open': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full h-full space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'incidents' ? 'default' : 'outline'}
            onClick={() => setViewMode('incidents')}
            size="sm"
          >
            📍 Incident Map
          </Button>
          <Button
            variant={viewMode === 'heatmap' ? 'default' : 'outline'}
            onClick={() => setViewMode('heatmap')}
            size="sm"
          >
            🔥 Mood Heatmap
          </Button>
        </div>

        {viewMode === 'incidents' && (
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className="capitalize"
              >
                {category.replace('_', ' ')}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {viewMode === 'incidents' ? '🗺️ Incident Locations' : '📊 City Mood Heatmap'}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100%-80px)]">
              <GoogleMap
                center={mapCenter}
                zoom={12}
                style={{ width: '100%', height: '100%' }}
                markers={viewMode === 'incidents' ? reportMarkers : []}
                showHeatmap={viewMode === 'heatmap'}
                heatmapData={viewMode === 'heatmap' ? mockSentimentData : []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {viewMode === 'incidents' ? '📋 Recent Reports' : '📈 Sentiment Analytics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(100%-80px)]">
              {viewMode === 'incidents' ? (
                <div className="space-y-3">
                  {filteredReports.slice(0, 10).map(report => (
                    <div key={report.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{report.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getSeverityColor(report.severity)}`}
                        >
                          {report.severity}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600">📍 {report.category}</p>
                        <p className="text-xs text-gray-500">
                          📅 {report.timestamp.toLocaleDateString()}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(report.status)}`}
                        >
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">High Stress Areas</h4>
                    <p className="text-sm text-red-600">MG Road, Forum Mall vicinity</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Moderate Concern</h4>
                    <p className="text-sm text-yellow-600">Koramangala, BTM Layout</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Positive Areas</h4>
                    <p className="text-sm text-green-600">Whitefield, Electronic City</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Sentiment Score</h4>
                    <div className="text-2xl font-bold text-blue-600">6.2/10</div>
                    <p className="text-sm text-blue-600">City-wide average</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{reports.length}</div>
            <p className="text-sm text-gray-600">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {reports.filter(r => r.status === 'Open').length}
            </div>
            <p className="text-sm text-gray-600">Open Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === 'In Progress').length}
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'Resolved').length}
            </div>
            <p className="text-sm text-gray-600">Resolved</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapDashboard;
