import { useEffect, useRef } from 'react';
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
}

const VWORLD_API_KEY = '5CF463C1-1C14-3719-B19B-E20276B30F7D';

const MARKER_ICON_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">' +
      '<path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="#dc2626"/>' +
      '<circle cx="14" cy="14" r="7" fill="white"/>' +
      '</svg>',
  );

type BaseMapType = 'graphic' | 'satellite' | 'hybrid';

function createVWorldBaseLayer(type: BaseMapType): TileLayer<XYZ> {
  const layerType = type === 'graphic' ? 'Base' : type === 'satellite' ? 'Satellite' : 'Hybrid';
  return new TileLayer({
    source: new XYZ({
      url: `https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_API_KEY}/${layerType}/{z}/{y}/{x}.png`,
      attributions: '© VWorld',
      crossOrigin: 'anonymous',
      maxZoom: 19,
      minZoom: 5,
    }),
  });
}

export default function VWorldMap({ lat, lng }: VWorldMapProps) {
  console.log("VWorldMap lat =", lat);
  console.log("VWorldMap lng =", lng);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerSourceRef = useRef<VectorSource | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return;

    const baseLayer = createVWorldBaseLayer('graphic');
    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({ source: markerSource });

    const map = new Map({
      target: containerRef.current,
      layers: [baseLayer, markerLayer],
      view: new View({
        center: fromLonLat([lng, lat]),
        zoom: 17,
        maxZoom: 19,
        minZoom: 5,
      }),
    });

    mapRef.current = map;
    markerSourceRef.current = markerSource;

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
      markerSourceRef.current = null;
    };
  }, []);

  // Update center + marker when props change
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

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '450px', borderRadius: '16px' }}
    />
  );
}
