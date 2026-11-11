/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Property, SiteCondition } from '../types/property';
import { getPropertyCoordinates, getPropertyParcelPolygon, parseStreetIndex } from '../utils/geoUtils';
import { PropertyStorageService } from '../services/propertyStorage';
import { MapPin, Layers, Navigation, ExternalLink, Maximize2, Compass } from 'lucide-react';

interface PropertyMapProps {
  property: Property;
  onSelectNeighborProperty?: (neighbor: Property) => void;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
  property,
  onSelectNeighborProperty,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [tileLayerType, setTileLayerType] = useState<'streets' | 'satellite' | 'topo'>('streets');
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);

  const coords = getPropertyCoordinates(property);

  // Get neighboring properties on the same street for context
  const neighbors = React.useMemo(() => {
    const all = PropertyStorageService.getProperties();
    return all
      .filter((p) => p.street_name === property.street_name && p.id !== property.id)
      .slice(0, 24); // Show nearby parcels on same street
  }, [property]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 18,
      zoomControl: true,
      attributionControl: false,
      maxZoom: 20,
      minZoom: 14,
    });

    mapInstanceRef.current = map;

    // Add Tile layer
    const updateTiles = (type: 'streets' | 'satellite' | 'topo') => {
      if (activeTileLayerRef.current) {
        map.removeLayer(activeTileLayerRef.current);
      }

      let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      if (type === 'satellite') {
        url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      } else if (type === 'topo') {
        url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      }

      const layer = L.tileLayer(url, {
        maxZoom: 20,
      }).addTo(map);

      activeTileLayerRef.current = layer;
    };

    updateTiles(tileLayerType);

    // Render neighbor parcels as quiet cadastral outlines
    neighbors.forEach((neighbor) => {
      const neighborPoly = getPropertyParcelPolygon(neighbor);
      const isAbandon = neighbor.site_condition === 'Abandon';
      const poly = L.polygon(neighborPoly, {
        color: isAbandon ? '#f43f5e' : '#94a3b8',
        weight: 1.2,
        fillColor: isAbandon ? '#fecdd3' : '#e2e8f0',
        fillOpacity: 0.35,
        dashArray: '2, 2',
      }).addTo(map);

      poly.bindTooltip(
        `<strong>Unit #${neighbor.house_no}</strong><br/>${neighbor.cadastral_lot_no}<br/><em>${neighbor.site_condition}</em>`,
        { direction: 'top', className: 'text-xs font-sans' }
      );

      poly.on('click', () => {
        if (onSelectNeighborProperty) {
          onSelectNeighborProperty(neighbor);
        }
      });
    });

    // Render Target Property Parcel Polygon (High-intent highlighted cadastral boundary)
    const targetPoly = getPropertyParcelPolygon(property);
    const targetPolygonLayer = L.polygon(targetPoly, {
      color: '#0f172a',
      weight: 3,
      fillColor: property.site_condition === 'Abandon' ? '#f43f5e' : '#10b981',
      fillOpacity: 0.55,
    }).addTo(map);

    targetPolygonLayer.bindPopup(
      `<div class="p-1 text-xs font-sans">
        <strong class="text-sm block">Unit #${property.house_no}</strong>
        <span>${property.street_name}</span><br/>
        <span class="font-mono">${property.cadastral_lot_no}</span><br/>
        <strong>Status:</strong> ${property.site_condition}<br/>
        <strong>Buyer:</strong> ${property.buyer_primary}
      </div>`
    );

    // Custom Marker Pin
    const markerColor =
      property.site_condition === 'Abandon' ? 'bg-rose-600' :
      property.site_condition === 'Occupied' ? 'bg-emerald-600' :
      property.site_condition === 'Renovation' ? 'bg-blue-600' : 'bg-slate-700';

    const customIcon = L.divIcon({
      className: 'custom-property-pin',
      html: `
        <div class="relative -translate-x-1/2 -translate-y-full flex flex-col items-center">
          <div class="${markerColor} text-white font-mono font-bold text-xs px-2 py-0.5 rounded shadow-md border-2 border-white flex items-center gap-1 whitespace-nowrap">
            <span>#${property.house_no}</span>
          </div>
          <div class="w-2 h-2 ${markerColor} rotate-45 -mt-1 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 38],
    });

    L.marker([coords.lat, coords.lng], { icon: customIcon }).addTo(map);

    // Force size recalculation in case modal opened with animation
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timeout);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [property, tileLayerType]);

  const recenterMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 19, { animate: true });
    }
  };

  const zoomToStreet = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 17, { animate: true });
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  return (
    <div className="space-y-3">
      {/* Top Bar for Map Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-slate-500" />
            <span>Taman Seri Gedung Cadastral Plan</span>
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {coords.lat.toFixed(6)}°N, {coords.lng.toFixed(6)}°E
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setTileLayerType('streets')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                tileLayerType === 'streets'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Streets
            </button>
            <button
              onClick={() => setTileLayerType('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                tileLayerType === 'satellite'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setTileLayerType('topo')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                tileLayerType === 'topo'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OSM
            </button>
          </div>

          <button
            onClick={recenterMap}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Recenter on Parcel"
          >
            <Navigation className="w-3 h-3 text-slate-500" />
            <span>Center Parcel</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Open in Google Maps GPS"
          >
            <ExternalLink className="w-3 h-3 text-slate-500" />
            <span>Open GPS</span>
          </a>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-80 sm:h-96 w-full bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Cadastral Legend in Map Corner */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs border border-slate-200/80 rounded-lg p-2.5 shadow-md text-[11px] space-y-1.5 max-w-[200px] pointer-events-auto">
          <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
            Parcel Cadastral Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3 rounded-xs bg-slate-900 border border-white shrink-0" />
            <span className="text-slate-700 font-medium">Unit #{property.house_no} (Selected)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3 rounded-xs bg-rose-200 border border-rose-500 shrink-0" />
            <span className="text-slate-600">Abandoned Parcel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3 rounded-xs bg-slate-200 border border-slate-400 border-dashed shrink-0" />
            <span className="text-slate-600">Neighboring Cadastral Lot</span>
          </div>
        </div>
      </div>

      {/* Spatial Metadata Strip */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[10px] font-sans">Cadastral Lot</span>
          <span className="font-bold text-slate-900">{property.cadastral_lot_no}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-sans">Street Corridor</span>
          <span className="font-bold text-slate-900">{property.street_name}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-sans">Lot Category</span>
          <span className="font-bold text-slate-900">{property.house_type_category || 'Intermediate'}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] font-sans">Administrative Mukim</span>
          <span className="font-bold text-slate-900">Mukim Sungai Petani</span>
        </div>
      </div>
    </div>
  );
};
