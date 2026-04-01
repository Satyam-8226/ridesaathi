import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import API from "../api/axios";

export default function HeatmapView({ start, end, precision }) {
  const mapRef = useRef(null);
  const heatRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("heatmap-root", {
        center: [20.5937, 78.9629],
        zoom: 5,
        minZoom: 3,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const params = {};
        if (start) params.start = start;
        if (end) params.end = end;
        if (precision) params.precision = precision;
        const res = await API.get("/analytics/demand", { params });
        if (!mounted) return;
        const points = (res.data?.points || []).map(p => [p.lat, p.lng, p.weight]);
        // remove previous heat layer
        if (heatRef.current) {
          heatRef.current.remove();
          heatRef.current = null;
        }
        if (points.length > 0) {
          heatRef.current = L.heatLayer(points, { radius: 25, blur: 30, maxZoom: 12 }).addTo(mapRef.current);
          // adjust view to bounds
          const latlngs = points.map(pt => [pt[0], pt[1]]);
          const bounds = L.latLngBounds(latlngs);
          if (bounds.isValid()) mapRef.current.fitBounds(bounds.pad(0.4));
        }
      } catch {
        // Heatmap load failed; retry later
      }
    };

    load();
    // poll occasionally for near real-time (optional)
    const t = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(t); };
  }, [start, end, precision]);

  return <div id="heatmap-root" style={{ width: "100%", height: "600px" }} className="rounded-md overflow-hidden border border-white/5" />;
}
