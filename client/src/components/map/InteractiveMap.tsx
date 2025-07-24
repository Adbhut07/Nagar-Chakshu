'use client';

import { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

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

interface MapProps {
  center: Location;
  incidents: Incident[];
  selectedIncident: Incident | null;
  onIncidentSelect: (incident: Incident | null) => void;
  loading: boolean;
}

const getCategoryIcon = (categories: string[]) => {
  if (categories.includes('emergency')) return '🚨';
  if (categories.includes('traffic')) return '🚦';
  if (categories.includes('water-logging')) return '💧';
  if (categories.includes('weather')) return '🌧️';
  if (categories.includes('infrastructure')) return '🚧';
  if (categories.includes('public-transport')) return '�';
  if (categories.includes('events')) return '�';
  if (categories.includes('stampede')) return '�';
  return '📍';
};

const getCategoryColor = (categories: string[]) => {
  if (categories.includes('emergency')) return '#dc2626'; // red-600
  if (categories.includes('traffic')) return '#ea580c'; // orange-600  
  if (categories.includes('water-logging')) return '#2563eb'; // blue-600
  if (categories.includes('weather')) return '#7c3aed'; // violet-600
  if (categories.includes('infrastructure')) return '#ca8a04'; // yellow-600
  if (categories.includes('public-transport')) return '#059669'; // emerald-600
  if (categories.includes('events')) return '#c026d3'; // fuchsia-600
  if (categories.includes('stampede')) return '#b91c1c'; // red-700
  return '#6b7280'; // gray-500
};

const MapComponent = ({ center, incidents, selectedIncident, onIncidentSelect }: MapProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom: 12,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(newMap);
    }
  }, [ref, map, center]);

  useEffect(() => {
    if (map && incidents.length > 0) {
      // Clear existing markers using ref
      markersRef.current.forEach(marker => marker.setMap(null));
      
      const newMarkers = incidents.map((incident) => {
        const icon = getCategoryIcon(incident.categories);
        const color = getCategoryColor(incident.categories);
        
        const svgIcon = `
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
            <text x="20" y="26" text-anchor="middle" font-size="16" fill="white">${icon}</text>
          </svg>
        `;

        const marker = new google.maps.Marker({
          position: incident.coordinates,
          map,
          title: incident.location,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20),
          }
        });

        marker.addListener('click', () => {
          onIncidentSelect(incident);
        });

        return marker;
      });

      markersRef.current = newMarkers;
      setMarkers(newMarkers);
    }
  }, [map, incidents, onIncidentSelect]);

  useEffect(() => {
    if (map && selectedIncident) {
      map.panTo(selectedIncident.coordinates);
      map.setZoom(15);
    }
  }, [map, selectedIncident]);

  return <div ref={ref} className="w-full h-full" />;
};

const InteractiveMap = (props: MapProps) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full bg-yellow-50">
        <p className="text-yellow-600">Google Maps API key not configured</p>
      </div>
    );
  }

  const renderMap = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-full bg-red-50">
            <p className="text-red-600">Error loading Google Maps</p>
          </div>
        );
      case Status.SUCCESS:
        return <MapComponent {...props} />;
    }
  };

  return (
    <Wrapper
      apiKey={apiKey}
      render={renderMap}
      libraries={['places']}
    >
      <MapComponent {...props} />
    </Wrapper>
  );
};

export default InteractiveMap;
