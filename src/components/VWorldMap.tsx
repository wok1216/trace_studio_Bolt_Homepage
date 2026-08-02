import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';

export interface VWorldMapProps {
  lat: number;
  lng: number;
  pnu?: string;
  className?: string;
}

const VWORLD_API_KEY =
  import.meta.env.VITE_VWORLD_API_KEY ?? import.meta.env.VITE_VWORLD_KEY ?? '';

const MARKER_ICON_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">' +
      '<path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="#dc2626"/>' +
      '<circle cx="14" cy="14" r="7" fill="white"/>' +
      '</svg>',
  );

type MapMode = 'graphic' | 'satellite';

function getVWorldWmtsUrl(apiKey: string, mode: MapMode): string {
  const layer = mode === 'satellite' ? 'Satellite' : 'Base';
  const ext = mode === 'satellite' ? 'jpeg' : 'png';
  return `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/${layer}/{z}/{y}/{x}.${ext}`;
}

export default function VWorldMap({ lat, lng, className = '' }: VWorldMapProps) {
  const [mapMode, setMapMode] = useState<MapMode>('graphic');

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const baseSourceRef = useRef<XYZ | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);

  useEffect(() => {
    if (!containerRef.current || !VWORLD_API_KEY) return;

    const markerSource = new VectorSource();
    const baseSource = new XYZ({
      url: getVWorldWmtsUrl(VWORLD_API_KEY, 'graphic'),
      crossOrigin: 'anonymous',
      maxZoom: 19,
      minZoom: 5,
      attributions: '© VWorld',
    });

    const baseLayer = new TileLayer({ source: baseSource, zIndex: 0 });
    const markerLayer = new VectorLayer({ source: markerSource, zIndex: 1 });

    const map = new Map({
      target: containerRef.current,
      layers: [baseLayer, markerLayer],
      view: new View({
        center: fromLonLat([lng, lat]),
        zoom: 18,
        maxZoom: 19,
        minZoom: 5,
      }),
      controls: [],
    });

    mapRef.current = map;
    baseSourceRef.current = baseSource;
    markerSourceRef.current = markerSource;

    requestAnimationFrame(() => map.updateSize());

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      baseSourceRef.current = null;
      markerSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const source = markerSourceRef.current;
    if (!map || !source) return;

    const center = fromLonLat([lng, lat]);
    map.getView().animate({ center, duration: 250 });

    source.clear();
    const marker = new Feature({ geometry: new Point(center) });
    marker.setStyle(
      new Style({
        image: new Icon({
          src: MARKER_ICON_URL,
          anchor: [0.5, 1.0],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction',
          scale: 1.0,
        }),
      }),
    );
    source.addFeature(marker);
  }, [lat, lng]);

  useEffect(() => {
    const baseSource = baseSourceRef.current;
    if (!baseSource || !VWORLD_API_KEY) return;

    baseSource.setUrl(getVWorldWmtsUrl(VWORLD_API_KEY, mapMode));
    baseSource.refresh();
  }, [mapMode]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;

    const observer = new ResizeObserver(() => map.updateSize());
    observer.observe(container);
    map.updateSize();

    return () => observer.disconnect();
  }, []);

  if (!VWORLD_API_KEY) {
    return (
      <div className={`flex flex-col h-full min-h-0 ${className}`.trim()}>
        <div className="flex-1 min-h-[280px] flex items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-[13px] text-red-600 px-4 text-center">
          .env에 VITE_VWORLD_API_KEY가 없습니다. dev 서버를 재시작하세요.
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`.trim()}>
      <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-100 mb-3">
        {(['graphic', 'satellite'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setMapMode(mode)}
            className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
              mapMode === mode
                ? 'bg-white shadow-soft text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {mode === 'graphic' ? '일반' : '위성'}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-[280px] w-full rounded-2xl overflow-hidden border border-gray-100"
      />
    </div>
  );
}
