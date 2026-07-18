import { useEffect, useRef } from "react";

interface VWorldMapProps {
  lat: number;
  lng: number;
}

export default function VWorldMap({ lat, lng }: VWorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    console.log("Map Center:", lat, lng);

    // 다음 단계에서 VWorld 지도를 생성할 예정
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "450px",
        borderRadius: "16px",
      }}
    />
  );
}
