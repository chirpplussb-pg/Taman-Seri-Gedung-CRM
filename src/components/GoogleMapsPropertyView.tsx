/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Property } from '../types/property';
import { getPropertyCoordinates } from '../utils/geoUtils';
import firebaseConfig from '../../firebase-applet-config.json';
import { MapPin, Navigation, ExternalLink, Compass, ShieldCheck, Layers, Building2 } from 'lucide-react';

interface GoogleMapsPropertyViewProps {
  property: Property;
}

export const GoogleMapsPropertyView: React.FC<GoogleMapsPropertyViewProps> = ({ property }) => {
  const [selectedMarker, setSelectedMarker] = useState(true);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  const coords = getPropertyCoordinates(property);
  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || firebaseConfig.apiKey;

  const pinBackground =
    property.site_condition === 'Abandon' ? '#e11d48' :
    property.site_condition === 'Occupied' ? '#059669' :
    property.site_condition === 'Renovation' ? '#2563eb' : '#475569';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.lat},${coords.lng}`;

  return (
    <div className="space-y-3">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <span>Google Maps Platform™ High-Resolution View</span>
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {coords.lat.toFixed(6)}°N, {coords.lng.toFixed(6)}°E
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Map Type Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                mapType === 'roadmap' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                mapType === 'satellite' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                mapType === 'hybrid' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hybrid
            </button>
          </div>

          <a
            href={streetViewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <ExternalLink className="w-3 h-3 text-slate-500" />
            <span>Street View</span>
          </a>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <Navigation className="w-3 h-3 text-slate-500" />
            <span>Directions</span>
          </a>
        </div>
      </div>

      {/* Google Map Viewport */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs h-80 sm:h-96 w-full bg-slate-100">
        <APIProvider apiKey={mapsApiKey}>
          <Map
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            defaultCenter={{ lat: coords.lat, lng: coords.lng }}
            defaultZoom={19}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            <AdvancedMarker
              position={{ lat: coords.lat, lng: coords.lng }}
              onClick={() => setSelectedMarker(true)}
              title={`Unit #${property.house_no}`}
            >
              <Pin
                background={pinBackground}
                borderColor="#ffffff"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>

            {selectedMarker && (
              <InfoWindow
                position={{ lat: coords.lat, lng: coords.lng }}
                onCloseClick={() => setSelectedMarker(false)}
              >
                <div className="p-1 text-slate-900 text-xs font-sans max-w-[210px]">
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <span>Unit #{property.house_no}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-normal">
                      {property.site_condition}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{property.street_name}</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-1">
                    Lot: {property.cadastral_lot_no}
                  </div>
                  <div className="text-[11px] text-slate-700 mt-1 truncate">
                    Buyer: <strong>{property.buyer_primary}</strong>
                  </div>
                  {property.cukai_pintu_arrears > 0 && (
                    <div className="text-[10px] text-rose-600 font-bold mt-1">
                      Arrears: RM {property.cukai_pintu_arrears.toFixed(2)}
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Key Local Government Authorities in Sungai Petani */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
        <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Sungai Petani Land Regularization Destination Points</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900">Pejabat Tanah & Galian (PTG)</span>
              <p className="text-slate-500 text-[10px]">Daerah Kuala Muda, Jalan Petani</p>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Pejabat+Tanah+dan+Galian+Kuala+Muda+Sungai+Petani"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 font-semibold text-[10px] mt-1.5 hover:underline flex items-center gap-1"
            >
              <span>Geran Verification</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900">Majlis Perbandaran Sungai Petani</span>
              <p className="text-slate-500 text-[10px]">Menara MPSPK, Jalan Patani</p>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Majlis+Perbandaran+Sungai+Petani+Kedah"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 font-semibold text-[10px] mt-1.5 hover:underline flex items-center gap-1"
            >
              <span>Cukai Pintu Settlement</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="p-2 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <span className="font-bold text-slate-900">Mahkamah Majistret Sungai Petani</span>
              <p className="text-slate-500 text-[10px]">Kompleks Mahkamah, Jalan Bakar Arang</p>
            </div>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Mahkamah+Sungai+Petani+Kedah"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 font-semibold text-[10px] mt-1.5 hover:underline flex items-center gap-1"
            >
              <span>Probate / Surat Kuasa</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
