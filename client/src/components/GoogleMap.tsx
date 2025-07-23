'use client';

import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { useEffect, useRef, useState } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  style?: React.CSSProperties;
  markers?: google.maps.LatLngLiteral[];
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  showHeatmap?: boolean;
  heatmapData?: google.maps.LatLngLiteral[];
}

const MapComponent: React.FC<MapProps> = ({
  center,
  zoom,
  style,
  markers = [],
  onMapClick,
  showHeatmap = false,
  heatmapData = []
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [markerClusterer, setMarkerClusterer] = useState<MarkerClusterer>();
  const [heatmap, setHeatmap] = useState<google.maps.visualization.HeatmapLayer>();

  // Initialize map
  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      if (onMapClick) {
        newMap.addListener('click', onMapClick);
      }

      setMap(newMap);
    }
  }, [ref, map, center, zoom, onMapClick]);

  // Handle markers and clustering
  useEffect(() => {
    if (map && markers.length > 0) {
      // Clear existing clusterer
      if (markerClusterer) {
        markerClusterer.clearMarkers();
      }

      // Create markers
      const mapMarkers = markers.map((position, index) => {
        const marker = new google.maps.Marker({
          position,
          map,
          title: `Report ${index + 1}`,
          icon: {
            url: '/api/placeholder/30/30', // You can customize this
            scaledSize: new google.maps.Size(30, 30),
          }
        });

        // Add click listener for marker details
        marker.addListener('click', () => {
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold">Incident Report</h3>
                <p class="text-sm text-gray-600">Location: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}</p>
              </div>
            `
          });
          infoWindow.open(map, marker);
        });

        return marker;
      });

      // Create marker clusterer
      const clusterer = new MarkerClusterer({
        map,
        markers: mapMarkers,
      });

      setMarkerClusterer(clusterer);
    }
  }, [map, markers, markerClusterer]);

  // Handle heatmap
  useEffect(() => {
    if (map && showHeatmap) {
      // Clear existing heatmap
      if (heatmap) {
        heatmap.setMap(null);
      }

      if (heatmapData.length > 0) {
        const heatmapLayer = new google.maps.visualization.HeatmapLayer({
          data: heatmapData.map(point => new google.maps.LatLng(point.lat, point.lng)),
          map,
          gradient: [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)'
          ],
          opacity: 0.6,
          radius: 20
        });

        setHeatmap(heatmapLayer);
      }
    } else if (heatmap && !showHeatmap) {
      heatmap.setMap(null);
      setHeatmap(undefined);
    }
  }, [map, showHeatmap, heatmapData, heatmap]);

  return <div ref={ref} style={style} className="w-full h-full" />;
};

interface GoogleMapProps extends MapProps {
  apiKey?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ apiKey, ...mapProps }) => {
  const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) {
    return (
      <div className="flex items-center justify-center h-64 bg-yellow-50">
        <p className="text-yellow-600">Google Maps API key not found</p>
      </div>
    );
  }

  const renderMap = (status: Status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-64 bg-red-50">
            <p className="text-red-600">Error loading Google Maps</p>
          </div>
        );
      case Status.SUCCESS:
        return <MapComponent {...mapProps} />;
    }
  };

  return (
    <Wrapper
      apiKey={key}
      render={renderMap}
      libraries={['visualization', 'geometry']}
    >
      <MapComponent {...mapProps} />
    </Wrapper>
  );
};

export default GoogleMap;
