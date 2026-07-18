import { useEffect, useRef, useState } from 'react';

interface VWorldMapProps {
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    vw?: any;
    ol?: any;
  }
}

const VWORLD_API_KEY = '5CF463C1-1C14-3719-B19B-E20276B30F7D';
const VWORLD_DOMAIN = 'localhost';
const VWORLD_SCRIPT_SRC = `https://map.vworld.kr/js/vworldMapInit.js.do?apiKey=${VWORLD_API_KEY}&domain=${VWORLD_DOMAIN}`;

let scriptPromise: Promise<void> | null = null;
let mapInstanceId = 0;

function loadVWorldScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.vw) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      'script[src^="https://map.vworld.kr/js/vworldMapInit.js.do"]',
    ) as HTMLScriptElement | null;

    if (existing) {
      if (window.vw) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('VWorld script load failed')),
      );
      return;
    }

    const script = document.createElement('script');
    script.src = VWORLD_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('VWorld script load failed'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

const MARKER_ICON_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">' +
      '<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="#e74c3c"/>' +
      '<circle cx="12" cy="12" r="6" fill="white"/>' +
      '</svg>',
  );

export default function VWorldMap({ lat, lng }: VWorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const domId = `vworld-map-${++mapInstanceId}`;

    loadVWorldScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.vw || !window.ol) return;

        const vw = window.vw;
        const ol = window.ol;

        containerRef.current.id = domId;

        const map = vw.ol3.Map.create({
          apiKey: VWORLD_API_KEY,
          domId: domId,
          basemapType: vw.ol3.Map.BasemapType.GRAPHIC,
        });

        mapRef.current = map;

        const view = map.getView();
        view.setCenter(ol.proj.transform([lng, lat], 'EPSG:4326', 'EPSG:3857'));
        view.setZoom(17);

        const markerFeature = new ol.Feature({
          geometry: new ol.geom.Point(
            ol.proj.transform([lng, lat], 'EPSG:4326', 'EPSG:3857'),
          ),
        });

        markerFeature.setStyle(
          new ol.style.Style({
            image: new ol.style.Icon({
              src: MARKER_ICON_URL,
              anchor: [0.5, 1.0],
              scale: 1.0,
            }),
          }),
        );

        const vectorLayer = new ol.layer.Vector({
          source: new ol.source.Vector({ features: [markerFeature] }),
        });

        map.addLayer(vectorLayer);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : '지도 로드 실패');
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.setTarget(null);
        } catch {
          // ignore
        }
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  if (error) {
    return (
      <div className="w-full h-[450px] rounded-2xl bg-gray-50 flex items-center justify-center text-[13px] text-gray-400">
        지도를 불러올 수 없습니다: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '450px', borderRadius: '16px' }}
    />
  );
}
