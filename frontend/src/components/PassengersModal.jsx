import { useEffect, useState } from "react";
import API from "../api/axios";
import { getSocket } from "../socket";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default icon paths (use CDN assets)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function PassengersModal({ rideId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchPassengers = async () => {
      try {
        const [pRes, liveRes] = await Promise.allSettled([
          API.get(`/rides/${rideId}/passengers`),
          API.get(`/rides/${rideId}/live`),
        ]);

        if (pRes.status === "fulfilled") {
          const list = pRes.value.data.passengers || [];
          if (mounted) setPassengers(list);
        }
        if (liveRes.status === "fulfilled") {
          const ride = liveRes.value.data.ride;
          if (mounted && ride?.driverLocation?.lat != null) {
            setDriverLocation(ride.driverLocation);
          }
        }
      } catch {
        // Non-critical error fetching data
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const socket = getSocket();

    const onUpdate = (payload) => {
      if (!payload || payload.rideId !== rideId) return;
      setPassengers((prev) => {
        const idx = prev.findIndex((p) => p._id === payload.passengerId);
        const item = {
          _id: payload.passengerId,
          name: payload.name,
          phone: payload.phone,
          lastLocation: payload.location ? { location: payload.location, updatedAt: payload.updatedAt } : null,
        };
        if (idx === -1) return [...prev, item];
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...item };
        return copy;
      });
    };

    const onDriverLocation = (payload) => {
      if (!payload || payload.rideId !== rideId) return;
      if (payload.driverLocation && payload.driverLocation.lat != null) {
        setDriverLocation(payload.driverLocation);
      }
    };

    const onClear = (payload) => {
      if (!payload || payload.rideId !== rideId) return;
      setPassengers([]);
      setDriverLocation(null);
    };

    socket.emit("joinRoom", rideId);
    socket.on("ride:passenger_location", onUpdate);
    socket.on("ride:location", onDriverLocation);
    socket.on("ride:passenger_locations_cleared", onClear);
    socket.on("ride:cancelled", onClear);

    fetchPassengers();

    return () => {
      mounted = false;
      socket.emit("leaveRoom", rideId);
      socket.off("ride:passenger_location", onUpdate);
      socket.off("ride:location", onDriverLocation);
      socket.off("ride:passenger_locations_cleared", onClear);
      socket.off("ride:cancelled", onClear);
    };
  }, [rideId]);

  // derive map center
  const center = driverLocation?.lat != null
    ? [driverLocation.lat, driverLocation.lng]
    : passengers.length > 0 && passengers[0].lastLocation?.location
      ? [passengers[0].lastLocation.location.lat, passengers[0].lastLocation.location.lng]
      : [20.5937, 78.9629]; // fallback center (India) — adjust as needed

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={onClose}
      />
      <div className="glass rounded-xl max-w-3xl w-full z-70 p-4 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-muted">✕</button>
        <h3 className="text-lg font-semibold mb-3">Passengers</h3>

        {loading && <div className="empty-state">Loading passengers...</div>}

        {!loading && passengers.length === 0 && (
          <div className="empty-state">No passengers joined yet.</div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-3">
                <strong className="small">Passenger list</strong>
              </div>

              {passengers.map((p) => (
                <div key={p._id} className="glass-soft p-3 rounded-md mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.name || "Passenger"}</div>
                    <div className="small text-muted">{p.phone || "No phone"}</div>
                    {p.lastLocation && p.lastLocation.location && (
                      <div className="small text-muted mt-1">
                        Last seen: {new Date(p.lastLocation.updatedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {p.lastLocation && p.lastLocation.location ? (
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${p.lastLocation.location.lat}&mlon=${p.lastLocation.location.lng}#map=16/${p.lastLocation.location.lat}/${p.lastLocation.location.lng}`}
                        target="_blank" rel="noreferrer"
                        className="btn btn-ghost"
                      >
                        View
                      </a>
                    ) : (
                      <div className="small text-muted">No location</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="mb-3">
                <strong className="small">Map</strong>
              </div>

              <div className="w-full h-64 rounded-md overflow-hidden border border-white/5">
                <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {/* Driver marker */}
                  {driverLocation && driverLocation.lat != null && (
                    <Marker position={[driverLocation.lat, driverLocation.lng]}>
                      <Popup>Driver</Popup>
                    </Marker>
                  )}

                  {/* Passenger markers */}
                  {passengers.map((p) => {
                    const loc = p.lastLocation?.location;
                    if (!loc || loc.lat == null) return null;
                    return (
                      <Marker key={p._id} position={[loc.lat, loc.lng]}>
                        <Popup>
                          <div className="font-semibold">{p.name || "Passenger"}</div>
                          <div className="small">{p.phone || "No phone"}</div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button onClick={onClose} className="btn btn-ghost">Close</button>
        </div>
      </div>
    </div>
  );
}
