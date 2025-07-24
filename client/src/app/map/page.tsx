'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchIncidents } from '@/lib/api';
import InteractiveMap from '@/components/map/InteractiveMap';
import IncidentPanel from '@/components/map/IncidentPanel';
import MapControls from '@/components/map/MapControls';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

interface Filters {
  categories: string[];
  radius: number;
  location: Location | null;
}

export default function MapPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    radius: 10000,
    location: null
  });

  useEffect(() => {
    // Set initial location to Bangalore since that's where we have data
    setFilters(prev => ({
      ...prev,
      location: { lat: 12.9716, lng: 77.5946 } // Bangalore coordinates
    }));
  }, []);

  useEffect(() => {
    const loadIncidents = async () => {
      if (!user || !filters.location) return;
      
      setLoading(true);
      try {
        const token = await user.getIdToken();
        console.log('Fetching incidents for location:', filters.location, 'radius:', filters.radius);
        const data = await fetchIncidents(filters.location, filters.radius, token);
        console.log('Incidents received:', data);
        setIncidents(data.incidents || []);
      } catch (error) {
        console.error('Failed to load incidents:', error);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    loadIncidents();
  }, [user, filters.location, filters.radius]);

  useEffect(() => {
    let filtered = incidents;
    
    if (filters.categories.length > 0) {
      filtered = incidents.filter(incident => 
        incident.categories?.some(cat => filters.categories.includes(cat))
      );
    }
    
    setFilteredIncidents(filtered);
  }, [incidents, filters.categories]);

  const handleIncidentSelect = (incident: Incident | null) => {
    setSelectedIncident(incident);
  };

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (!filters.location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Detecting location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col h-screen">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 sm:p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                Live Incident Map
              </h1>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {filteredIncidents.length} incidents found
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col sm:flex-row">
          <div className="flex-1 relative h-64 sm:h-auto">
            <InteractiveMap
              center={filters.location}
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onIncidentSelect={handleIncidentSelect}
              loading={loading}
            />
            
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10">
              <MapControls
                filters={filters}
                incidents={incidents}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="w-full sm:w-96 bg-white dark:bg-gray-800 border-t sm:border-t-0 sm:border-l border-gray-200 dark:border-gray-700 max-h-64 sm:max-h-none overflow-y-auto">
            <IncidentPanel
              incidents={filteredIncidents}
              selectedIncident={selectedIncident}
              onIncidentSelect={handleIncidentSelect}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}