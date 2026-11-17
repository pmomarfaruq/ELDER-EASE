import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SosLocationMapProps {
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
  label?: string;
}

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

const MapInner: React.FC<SosLocationMapProps> = ({ lat, lng, accuracyMeters, label }) => {
  const { t } = useAuth();
  const status = useApiLoadingStatus();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);

  useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [status]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="rounded-2xl bg-[#EEF4FD] border border-[#E6DFD3] p-4 text-sm text-[#14274E] flex flex-col gap-2">
        <div className="flex items-center gap-2 font-bold">
          <MapPin className="w-4 h-4 text-[#C53030]" aria-hidden="true" />
          <span className="font-numeric">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#14274E] underline"
        >
          <span>{t.sos.mapLocationPreview}</span>
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E6DFD3] bg-[#EEF4FD]">
      <div style={{ width: '100%', height: '230px' }}>
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat, lng }}
          center={{ lat, lng }}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker
            ref={markerRef}
            position={{ lat, lng }}
            onClick={() => setInfoOpen(true)}
            title={label || t.sos.mapLocationPreview}
          >
            <Pin background="#C53030" borderColor="#742A2A" glyphColor="#FFFFFF" scale={1.15} />
          </AdvancedMarker>

          {infoOpen && marker && (
            <InfoWindow anchor={marker} onCloseClick={() => setInfoOpen(false)} maxWidth={240}>
              <div className="text-xs text-[#14274E] space-y-1 p-0.5">
                <p className="font-bold">{label || t.sos.locationReady}</p>
                <p className="font-numeric">
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
                {typeof accuracyMeters === 'number' && (
                  <p className="text-[#4A5568]">
                    {t.sos.accuracyLabel}: ±{Math.round(accuracyMeters)}m
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export const SosLocationMap: React.FC<SosLocationMapProps> = (props) => {
  const { language, t } = useAuth();
  const { lat, lng, accuracyMeters } = props;

  if (!MAPS_API_KEY) {
    return (
      <div className="rounded-2xl bg-[#EEF4FD] border border-[#E6DFD3] p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 font-numeric text-sm font-bold text-[#14274E]">
            <MapPin className="w-4 h-4 text-[#C53030]" aria-hidden="true" />
            <span>
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </span>
          </span>
          {typeof accuracyMeters === 'number' && (
            <span className="text-xs font-numeric text-[#4A5568]">
              ±{Math.round(accuracyMeters)}m
            </span>
          )}
        </div>
        <p className="text-xs text-[#4A5568]">{t.sos.noMapFallback}</p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#14274E] underline"
        >
          <span>{t.sos.mapLocationPreview}</span>
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={MAPS_API_KEY}
      libraries={['marker']}
      language={language === 'ml' ? 'ml' : 'en'}
      region="IN"
    >
      <MapInner {...props} />
    </APIProvider>
  );
};
