import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CulturalEvent } from '../types';
import { Navigation, Layers, AlertCircle, Maximize2, Globe, MapPin } from 'lucide-react';

interface InteractiveMapProps {
  events: CulturalEvent[];
  selectedEvent: CulturalEvent | null;
  onSelectEvent: (event: CulturalEvent) => void;
  userLocation: { lat: number; lng: number } | null;
  onRequestUserLocation: () => void;
  locationPermissionDenied: boolean;
  activeRouteEvent: CulturalEvent | null;
  onClearRoute: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  userLocation,
  onRequestUserLocation,
  locationPermissionDenied,
  activeRouteEvent,
  onClearRoute,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const hasAutoFittedRef = useRef<boolean>(false);

  const [mapTileStyle, setMapTileStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');

  // Fit bounds or center on user region
  const handleFitAllEvents = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1 });
      return;
    }

    if (events.length === 0) return;

    const points: [number, number][] = events.map((ev) => [ev.lat, ev.lng]);

    if (points.length === 1) {
      map.setView(points[0], 12, { animate: true, duration: 1 });
    } else {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true, duration: 1 });
      if (map.getZoom() < 10) {
        map.setZoom(11);
      }
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng]
        : [-22.865, -47.165]; // Hortolândia / Campinas default

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: userLocation ? 14 : 12,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // CartoDB Dark Matter tile layer
      const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      L.tileLayer(darkTileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);

      // Invalidate size after mount to prevent blank/gray tiles
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Center on user location whenever userLocation resolves or changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.setView([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1 });
  }, [userLocation]);

  // Auto-fit or center on user region once events load
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (!hasAutoFittedRef.current) {
      hasAutoFittedRef.current = true;
      setTimeout(() => {
        handleFitAllEvents();
      }, 400);
    }
  }, [events, userLocation]);

  // Handle Tile layer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    if (mapTileStyle === 'streets') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (mapTileStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: 'Map data &copy; OpenStreetMap',
    }).addTo(map);
  }, [mapTileStyle]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Add User Location Marker if available
    if (userLocation) {
      const userDivIcon = L.divIcon({
        className: 'user-pin-custom',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-sky-400 opacity-75"></span>
            <div class="relative w-6 h-6 rounded-full bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userDivIcon });
      userMarker.bindTooltip('Sua Localização', { permanent: false, direction: 'top' });
      markersGroup.addLayer(userMarker);
    }

    // SVG Icons for different pin categories matching screenshot
    const getIconSvg = (colorKey: string) => {
      switch (colorKey) {
        case 'purple':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
        case 'orange':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
        case 'green':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
        case 'red':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
        case 'blue':
          return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/></svg>`;
        default: // yellow
          return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      }
    };

    const pinBgMap: Record<string, string> = {
      purple: '#a855f7',
      orange: '#f97316',
      green: '#22c55e',
      red: '#ef4444',
      blue: '#3b82f6',
      yellow: '#eab308',
    };

    // Helper to verify if an event has valid geocoded coordinates
    const hasValidLocation = (ev: CulturalEvent) => {
      if (typeof ev.lat !== 'number' || typeof ev.lng !== 'number') return false;
      if (ev.lat === 0 && ev.lng === 0) return false;
      return true;
    };

    // 2. Add Event Pins matching prototype colored pins
    events.forEach((ev) => {
      if (!hasValidLocation(ev)) {
        return;
      }

      const isSelected = selectedEvent?.id === ev.id;
      const bgColor = pinBgMap[ev.pinColor] || pinBgMap.yellow;
      const iconSvg = getIconSvg(ev.pinColor);

      const customDivIcon = L.divIcon({
        className: 'event-pin-custom',
        html: `
          <div style="cursor: pointer; transition: all 0.25s ease; transform: ${isSelected ? 'scale(1.3)' : 'scale(1)'};">
            <div style="
              width: 32px; 
              height: 32px; 
              border-radius: 50%; 
              background-color: ${bgColor}; 
              border: 2.5px solid white; 
              box-shadow: ${isSelected ? '0 0 0 4px #ffffff, 0 8px 20px rgba(0,0,0,0.9)' : '0 4px 10px rgba(0,0,0,0.7)'}; 
              display: flex; 
              align-items: center; 
              justify-content: center;
            ">
              ${iconSvg}
            </div>
            ${ev.isHappeningNow ? '<span style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; background-color: #10b981; border: 2px solid white;"></span>' : ''}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([ev.lat, ev.lng], { icon: customDivIcon });
      
      marker.on('click', () => {
        onSelectEvent(ev);
        map.panTo([ev.lat, ev.lng], { animate: true, duration: 0.6 });
      });

      markersGroup.addLayer(marker);
    });
  }, [events, selectedEvent, userLocation, onSelectEvent]);

  // Handle Route Drawing if requested
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (activeRouteEvent && userLocation) {
      const start: [number, number] = [userLocation.lat, userLocation.lng];
      const end: [number, number] = [activeRouteEvent.lat, activeRouteEvent.lng];

      // Draw a sleek route line
      const routeLine = L.polyline([start, end], {
        color: '#ffffff',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      routeLayerRef.current = routeLine;

      const bounds = L.latLngBounds([start, end]);
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  }, [activeRouteEvent, userLocation]);

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#0b0c0e] overflow-hidden">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Active Route Info Pill */}
      {activeRouteEvent && userLocation && (
        <div className="absolute top-16 left-4 z-10 flex flex-col gap-2 max-w-sm">
          <div className="bg-[#171922]/95 backdrop-blur-md border border-zinc-700 p-3 rounded-xl shadow-2xl text-xs text-white flex items-center justify-between gap-3 animate-fadeIn">
            <div>
              <p className="font-bold text-white">Rota em andamento:</p>
              <p className="text-zinc-200 truncate">{activeRouteEvent.title}</p>
              <p className="text-[11px] text-zinc-400">
                Distância: <span className="text-white font-medium">{activeRouteEvent.distanceKm} km</span> • Tempo: <span className="text-white font-medium">{activeRouteEvent.travelTimeMinutes} min</span>
              </p>
            </div>
            <button
              onClick={onClearRoute}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg text-[11px] border border-zinc-700 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Map View Mode Controls (Bottom Left) */}
      <div className="absolute bottom-6 left-4 z-10 flex items-center gap-1.5 bg-[#12141a]/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-xl">
        <button
          onClick={() => setMapTileStyle('dark')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            mapTileStyle === 'dark' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Escuro
        </button>
        <button
          onClick={() => setMapTileStyle('streets')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            mapTileStyle === 'streets' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Rua
        </button>
        <button
          onClick={() => setMapTileStyle('satellite')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            mapTileStyle === 'satellite' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Satélite
        </button>
      </div>

      {/* Map Recenter Control (Bottom Right) */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-10 flex items-center gap-2">
        <button
          onClick={() => {
            const map = mapInstanceRef.current;
            if (map && userLocation) {
              map.setView([userLocation.lat, userLocation.lng], 13, { animate: true, duration: 1 });
            } else if (map) {
              map.setView([-22.865, -47.165], 13, { animate: true, duration: 1 });
            }
          }}
          className="bg-[#12141a]/90 hover:bg-zinc-800 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-zinc-700/80 shadow-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          title="Centralizar na minha posição"
        >
          <Navigation className="w-4 h-4 text-orange-400" />
          <span className="hidden sm:inline">Minha Posição</span>
        </button>
      </div>
    </div>
  );
};
