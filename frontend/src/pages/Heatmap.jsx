import { useState, useEffect } from "react";
import HeatmapView from "../components/HeatmapView";
import API from "../api/axios";

export default function Heatmap() {
  const [range, setRange] = useState({ start: "", end: "" });
  const [precision, setPrecision] = useState(2);
  const [hotspots, setHotspots] = useState([]);

  useEffect(() => {
    const fetchHotspots = async () => {
      try {
        const res = await API.get("/analytics/hotspots?hours=24&limit=5");
        setHotspots(res.data.hotspots || []);
      } catch {
        setHotspots([]);
      }
    };
    fetchHotspots();
  }, []);

  return (
    <div className="glass rounded-2xl p-6">
      <h1 className="text-3xl font-bold mb-2">Demand Heatmap</h1>
      <p className="text-muted mb-4">See where passenger demand is concentrated for a chosen time window.</p>

      <div className="glass-soft p-3 rounded-md mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="date" value={range.start} onChange={(e) => setRange(r => ({...r, start: e.target.value}))} className="px-3 py-2" />
          <input type="date" value={range.end} onChange={(e) => setRange(r => ({...r, end: e.target.value}))} className="px-3 py-2" />
          <select value={precision} onChange={(e) => setPrecision(Number(e.target.value))} className="px-3 py-2">
            <option value={1}>High precision (~11km)</option>
            <option value={2}>Medium (~1.1km)</option>
            <option value={3}>Fine (~110m)</option>
          </select>
          <div className="small text-muted flex items-center">Adjust precision to change bucket size</div>
        </div>
      </div>

      <div className="glass-soft p-3 rounded-md mb-4">
        <div className="kicker mb-1">Driver hotspot suggestions</div>
        {hotspots.length === 0 ? (
          <div className="small text-muted">No hotspots found right now.</div>
        ) : (
          <ul className="list-disc pl-4 small space-y-1">
            {hotspots.map((h, idx) => (
              <li key={idx}>
                High demand near ({h.lat?.toFixed(3) || "?"}, {h.lng?.toFixed(3) || "?"}) • {h.weight} events
              </li>
            ))}
          </ul>
        )}
      </div>

      <HeatmapView start={range.start} end={range.end} precision={precision} />
    </div>
  );
}
