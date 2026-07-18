import { useEffect, useRef } from "react";

export default function VWorldMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const vw = (window as any).vw;

    const map = new vw.ol3.Map({
      div: mapRef.current,
      mapMode: "2d-map",
      basemapType: vw.ol3.BasemapType.GRAPHIC,
      controlDensity: vw.ol3.DensityType.FULL,
      interactionDensity: vw.ol3.DensityType.BASIC,
      controlsAutoArrange: true,
      homePosition: vw.ol3.CameraPosition,
      initPosition: vw.ol3.CameraPosition,
    });

    return () => {
      map.destroy?.();
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "700px",
        borderRadius: "16px",
      }}
    />
  );
}
