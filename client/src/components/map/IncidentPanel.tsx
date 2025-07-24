'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, AlertTriangle } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface Incident {
  id: string;
  advice: string;
  descriptions: string[];
  coordinates: Location;
  source_city: string;
  geohash: string;
  summary: string;
  occurrences: number;
  categories: string[];
  cluster_id: number;
  location: string;
  distance: number;
  resolution_time?: {
    _seconds: number;
    _nanoseconds: number;
  };
}

interface IncidentPanelProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentSelect: (incident: Incident | null) => void;
  loading: boolean;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'emergency': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'traffic': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'water-logging': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'infrastructure': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'weather': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'public-transport': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const IncidentPanel = ({ incidents, selectedIncident, onIncidentSelect, loading }: IncidentPanelProps) => {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Loading incidents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
          Incidents ({incidents.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {incidents.length === 0 ? (
          <div className="text-center py-4 sm:py-8">
            <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No incidents found in this area</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <Card
              key={incident.id}
              className={`cursor-pointer transition-colors ${
                selectedIncident?.id === incident.id
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
              onClick={() => onIncidentSelect(incident)}
            >
              <CardHeader className="pb-1 sm:pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
                    {incident.location}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {incident.occurrences} reports
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
                  {incident.summary}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                  {incident.categories.map((category) => (
                    <Badge
                      key={category}
                      variant="outline"
                      className={`text-xs ${getCategoryColor(category)}`}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center min-w-0 flex-1">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {incident.distance ? `${(incident.distance / 1000).toFixed(1)} km away` : 'Location unknown'}
                    </span>
                  </div>
                  <div className="flex items-center ml-2 flex-shrink-0">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Active
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedIncident && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="space-y-2 sm:space-y-3">
            <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">Incident Details</h3>
            
            <div className="space-y-1 sm:space-y-2">
              <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Reported Issues:</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {selectedIncident.descriptions.slice(0, 3).map((description, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 sm:mt-2 mr-2 flex-shrink-0"></span>
                    <span className="line-clamp-2">{description}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedIncident.advice && (
              <div className="space-y-1 sm:space-y-2">
                <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Advice:</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 sm:line-clamp-4">
                  {selectedIncident.advice}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentPanel;
