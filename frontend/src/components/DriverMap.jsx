import { useMemo, useRef, useState } from "react";
import { useLoadScript, GoogleMap, Autocomplete, DirectionsRenderer, Marker, Polyline } from "@react-google-maps/api";

const libraries = ["places"];

export default function DriverMap({
  onRouteComputed,
  onSourceChanged,
  onDestinationChanged,
  source,
  destination,
  routePoints,
}) {
  // DriverMap is a reusable map chooser for drivers.
  // It uses Google Places Autocomplete for source/destination and DirectionsService for route generation.
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries,
  });

  const [directions, setDirections] = useState(null);
  const [error, setError] = useState("");
  const autocompleteSourceRef = useRef(null);
  const autocompleteDestRef = useRef(null);

  const center = useMemo(() => {
    if (source?.lat && source?.lng) return { lat: source.lat, lng: source.lng };
    return { lat: 28.7041, lng: 77.1025 };
  }, [source]);

  const generateRoute = async () => {
    setError("");
    if (!source?.lat || !source?.lng || !destination?.lat || !destination?.lng) {
      setError("Select source and destination first.");
      return;
    }

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: { lat: Number(source.lat), lng: Number(source.lng) },
        destination: { lat: Number(destination.lat), lng: Number(destination.lng) },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          const route = result.routes[0];
          const path = route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
          onRouteComputed?.(path);
        } else {
          setError("Unable to compute route. Please try another pair.");
        }
      }
    );
  };

  if (loadError) return <div className="text-red-400">Map failed to load.</div>;
  if (!isLoaded) return <div className="text-muted">Loading map...</div>;

  const onSourcePlaceChanged = () => {
    const place = autocompleteSourceRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    onSourceChanged({ label: place.formatted_address || place.name || "Source", lat, lng });
  };

  const onDestinationPlaceChanged = () => {
    const place = autocompleteDestRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    onDestinationChanged({ label: place.formatted_address || place.name || "Destination", lat, lng });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Autocomplete
          onLoad={(autocomplete) => {
            autocompleteSourceRef.current = autocomplete;
          }}
          onPlaceChanged={onSourcePlaceChanged}
        >
          <input
            className="input"
            placeholder="Pick source"
            defaultValue={source?.label || ""}
          />
        </Autocomplete>

        <Autocomplete
          onLoad={(autocomplete) => {
            autocompleteDestRef.current = autocomplete;
          }}
          onPlaceChanged={onDestinationPlaceChanged}
        >
          <input
            className="input"
            placeholder="Pick destination"
            defaultValue={destination?.label || ""}
          />
        </Autocomplete>
      </div>

      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          type="button"
          onClick={generateRoute}
        >
          Generate route
        </button>
        <div className="small text-muted">Once route appears, use "Create Ride" below.</div>
      </div>

      {error && <div className="text-red-400 small">{error}</div>}

      <div className="h-[350px] rounded-xl overflow-hidden border border-slate-700">
        <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={center} zoom={12}>
          {source?.lat && source.lng && (
            <Marker position={{ lat: source.lat, lng: source.lng }} label="S" />
          )}
          {destination?.lat && destination.lng && (
            <Marker position={{ lat: destination.lat, lng: destination.lng }} label="D" />
          )}

          {directions && <DirectionsRenderer directions={directions} />}

          {!directions && routePoints?.length > 1 && (
            <>
              <Polyline
                path={routePoints}
                options={{ strokeColor: "#0ea5e9", strokeWeight: 4 }}
              />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
