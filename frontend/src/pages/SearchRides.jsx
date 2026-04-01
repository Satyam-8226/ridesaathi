import { useState, useContext, useEffect } from "react";
import API from "../api/axios";
import { getSocket } from "../socket";
import RideCard from "../components/RideCard";
import { AuthContext } from "../auth/AuthContext";
import PassengerMap from "../components/PassengerMap";

const SearchRides = () => {
  const { user } = useContext(AuthContext);

  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRide, setSelectedRide] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNearby = (payload) => {
      setNearbyDrivers((prev) => {
        const existing = prev.filter((d) => d.rideId !== payload.rideId || d.driverId !== payload.driverId);
        return [...existing, payload];
      });
    };

    socket.on("nearbyDrivers", handleNearby);
    socket.on("driverLocationUpdate", handleNearby);

    return () => {
      socket.off("nearbyDrivers", handleNearby);
      socket.off("driverLocationUpdate", handleNearby);
    };
  }, []);

  const searchRides = async ({ pickup, destination }) => {
    if (!pickup || !destination) {
      setError("Select both pickup and destination.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await API.get(
        `/rides/search?fromLat=${pickup.lat}&fromLng=${pickup.lng}&toLat=${destination.lat}&toLng=${destination.lng}&pickupLat=${pickup.lat}&pickupLng=${pickup.lng}`
      );
      setRides(res.data.rides || []);
      if (res.data.rides?.length > 0) setSelectedRide(res.data.rides[0]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch rides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h1 className="text-3xl font-bold mb-2">Search Rides</h1>
      <div className="glass-soft p-3 rounded-md mb-4">
        <div className="kicker mb-1">Smart matching</div>
        <div className="small text-muted">
          Search by pickup/destination and view nearby drivers on live map.
        </div>
      </div>

      {user && (
        <p className="small text-muted mb-4">
          Welcome, {user.name}! {user.role === "driver" ? "Manage your rides" : "Find route-matching rides"}.
        </p>
      )}

      <div className="glass-soft rounded-xl p-4 mb-4">
        <PassengerMap
          onSearch={({ pickup, dropoff }) => {
            setPickup(pickup);
            setDestination(dropoff);
            searchRides({ pickup, destination: dropoff });
          }}
          nearbyDrivers={nearbyDrivers}
          selectedRide={selectedRide}
          routePath={selectedRide?.routePath || []}
        />
      </div>

      {loading && <div className="empty-state">Searching rides...</div>}
      {error && <div className="empty-state text-red-400">{error}</div>}
      {!loading && !error && rides.length === 0 && (
        <div className="empty-state">
          No rides found. Try moving your pickup or destination points.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {rides.map((ride) => (
          <RideCard
            key={ride._id}
            ride={ride}
            refresh={() => searchRides({ pickup, destination })}
            context="search"
          />
        ))}
      </div>
    </div>
  );
};

export default SearchRides;
