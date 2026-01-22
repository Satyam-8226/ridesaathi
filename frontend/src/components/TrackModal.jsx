import { useEffect, useState } from "react";
import { getSocket } from "../socket";

export default function TrackModal({ rideId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [loc, setLoc] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const socket = getSocket();

    const onLocation = (payload) => {
      if (!payload) return;
      setStatus(payload.status || null);
      setLoc(payload.driverLocation || null);
      setUpdatedAt(payload.driverLocationUpdatedAt || null);
      setLoading(false);
    };

    const onCancelled = (payload) => {
      setStatus("CANCELLED");
      setLoading(false);
    };

    socket.emit("joinRoom", rideId);
    socket.on("ride:location", onLocation);
    socket.on("ride:cancelled", onCancelled);

    // fallback: small timeout to avoid perpetual loader
    const t = setTimeout(() => setLoading(false), 4000);

    return () => {
      clearTimeout(t);
      socket.emit("leaveRoom", rideId);
      socket.off("ride:location", onLocation);
      socket.off("ride:cancelled", onCancelled);
    };
  }, [rideId]);

  const renderMapSrc = () => {
    if (!loc || loc.lat == null) return null;
    const lat = loc.lat;
    const lon = loc.lng;
    const zoom = 14;
    const pad = 0.012;
    const bbox = `${lon - pad},${lat - pad},${lon + pad},${lat + pad}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="glass rounded-xl max-w-3xl w-full z-70 p-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted">✕</button>
        <h3 className="text-lg font-semibold mb-2">Live Tracking</h3>

        <div className="small text-muted mb-3">
          Status: <span className="kicker">{status || "Unknown"}</span>
        </div>
        {updatedAt && <div className="small text-muted mb-3">Last update: {new Date(updatedAt).toLocaleTimeString()}</div>}

        {loading && <div className="empty-state">Loading live location...</div>}

        {!loading && !loc && (
          <div className="empty-state">Driver location not available yet.</div>
        )}

        {!loading && loc && (
          <div className="w-full h-72 rounded-md overflow-hidden border border-white/5">
            <iframe
              title="live-map"
              src={renderMapSrc()}
              style={{ width: "100%", height: "100%", border: 0 }}
              loading="lazy"
            />
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button onClick={onClose} className="btn btn-ghost">Close</button>
        </div>
      </div>
    </div>
  );
}
