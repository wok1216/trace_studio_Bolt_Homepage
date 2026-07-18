import { useEffect, useRef, useState } from 'react';

interface VWorldMapProps {
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    vw?: any;
  }
}

const VWORLD_API_KEY = '5CF463C1-1C14-3719-B19B-E20276B30F7D';
const VWORLD_DOMAIN = 'localhost';
const VWORLD_SCRIPT_SRC = `https://map.vworld.kr/js/vworldMapInit.js.do?apiKey=${VWORLD_API_KEY}&domain=${VWORLD_DOMAIN}`;

let scriptPromise: Promise<void> | null = null;

function loadVWorldScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.vw) {
      resolve();
      return;
    }

    const existing = document.querySelector(
      `script[src^="https://map.vworld.kr/js/vworldMapInit.js.do"]`,
    ) as HTMLScriptElement | null;

    if (existing) {
      if (window.vw) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('VWorld script load failed')));
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

export default function VWorldMap({ lat, lng }: VWorldMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadVWorldScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.vw) return;

        const vw = window.vw;

        const map = new vw.Map({
          container: containerRef.current,
          center: [lng, lat],
          zoom: 17,
          basemapType: vw.Map.BasemapType.GRAPHIC,
        });

        mapRef.current = map;

        const marker = new vw.Marker({
          coordinates: [lng, lat],
        });
        marker.setMap(map);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : '지도 로드 실패');
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
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

  return <div ref={containerRef} style={{ width: '100%', height: '450px', borderRadius: '16px' }} />;
}
