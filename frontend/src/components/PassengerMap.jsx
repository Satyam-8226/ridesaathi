import { useMemo, useRef, useState } from "react";
import { useLoadScript, GoogleMap, Autocomplete, Marker, Polyline } from "@react-google-maps/api";

const libraries = ["places"];

export default function PassengerMap({
  onSearch,
  nearbyDrivers = [],
  selectedRide,
  routePath = [],
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [pickup, setPickup] = useState({});
  const [dropoff, setDropoff] = useState({});
  const [error, setError] = useState("");

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

  const center = useMemo(() => {
    if (pickup.lat && pickup.lng) return pickup;
    if (dropoff.lat && dropoff.lng) return dropoff;
    return { lat: 28.7041, lng: 77.1025 };
  }, [pickup, dropoff]);

  const handlePickupChange = () => {
    const place = pickupRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setPickup({ label: place.formatted_address || place.name, lat, lng });
  };

  const handleDropoffChange = () => {
    const place = dropoffRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setDropoff({ label: place.formatted_address || place.name, lat, lng });
  };

  const doSearch = () => {
    if (!pickup.lat || !dropoff.lat) {
      setError("Select both pickup and destination first.");
      return;
    }
    setError("");
    onSearch({
      pickup,
      dropoff,
    });
  };

  if (loadError) return <div className="text-red-400">Map failed to load.</div>;
  if (!isLoaded) return <div className="text-muted">Loading map...</div>;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Autocomplete onLoad={(ac) => (pickupRef.current = ac)} onPlaceChanged={handlePickupChange}>
          <input className="input" placeholder="Pickup location" defaultValue={pickup.label || ""} />
        </Autocomplete>
        <Autocomplete onLoad={(ac) => (dropoffRef.current = ac)} onPlaceChanged={handleDropoffChange}>
          <input className="input" placeholder="Destination location" defaultValue={dropoff.label || ""} />
        </Autocomplete>
        <button className="btn btn-primary" type="button" onClick={doSearch}>Find Rides</button>
      </div>
      {error && <div className="text-red-400 small">{error}</div>}
      <div className="h-[320px] rounded-xl overflow-hidden border border-slate-700">
        <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={center} zoom={12}>
          {pickup.lat && pickup.lng && <Marker position={{ lat: pickup.lat, lng: pickup.lng }} label="P" />}
          {dropoff.lat && dropoff.lng && <Marker position={{ lat: dropoff.lat, lng: dropoff.lng }} label="D" />}
          {routePath?.length > 1 && (
            <Polyline path={routePath} options={{ strokeColor: "#0ea5e9", strokeWeight: 4 }} />
          )}
          {nearbyDrivers.map((drv) => (
            drv.driverLocation?.lat && drv.driverLocation?.lng ? (
              <Marker
                key={`${drv.rideId}-${drv.driverId}`}
                position={{ lat: drv.driverLocation.lat, lng: drv.driverLocation.lng }}
                label={{ text: "🚗", color: "white", fontSize: "10px" }}
              />
            ) : null
          ))}
        </GoogleMap>
      </div>
      {selectedRide && (
        <div className="glass-soft rounded-xl p-3 small">
          <div className="font-semibold">Selected ride route:</div>
          <div>{selectedRide.source} → {selectedRide.destination}</div>
          <div className="text-xs text-muted">Driver: {selectedRide.driverName || "Unknown"}</div>
        </div>
      )}
    </div>
  );
}
