import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import DriverMap from "../components/DriverMap";

const CreateRide = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [source, setSource] = useState({});
  const [destination, setDestination] = useState({});
  const [routePath, setRoutePath] = useState([]);
  const [date, setDate] = useState("");
  const [availableSeats, setAvailableSeats] = useState(1);
  const [price, setPrice] = useState(0);
  const [totalFare, setTotalFare] = useState(0);
  const [pickupPointId, setPickupPointId] = useState("");
  const [pickupPoints, setPickupPoints] = useState([]);
  const [scheduleRide, setScheduleRide] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPickupPoints = async () => {
      try {
        const res = await API.get("/pickup-points");
        setPickupPoints(res.data.pickupPoints || []);
      } catch {
        // Non-critical error loading pickup points
      }
    };
    loadPickupPoints();
  }, []);

  if (loading) return null;

  if (!user || user.role !== "driver") {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center text-red-500">
        Access denied. Drivers only.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!source.lat || !source.lng || !destination.lat || !destination.lng) {
      setError("Please choose valid source and destination from Autocomplete and generate route.");
      return;
    }
    if (!routePath.length) {
      setError("Please generate a route before creating the ride.");
      return;
    }

    try {
      const payload = {
        from,
        to,
        date,
        availableSeats: Number(availableSeats),
        price: Number(price),
        totalFare: totalFare ? Number(totalFare) : Number(price) * Number(availableSeats),
        sourceLat: Number(source.lat),
        sourceLng: Number(source.lng),
        destLat: Number(destination.lat),
        destLng: Number(destination.lng),
        routePath: routePath.map((p) => ({ lat: p.lat, lng: p.lng })),
        pickupPointId,
        isScheduled: scheduleRide,
        scheduledTime: scheduleRide ? scheduledTime : null,
      };
      await API.post("/rides", payload);
      navigate("/my-rides");
    } catch (err) {
      setError(err.response?.data?.message || "Ride creation failed");
    }
  };

  return (
    <div className="glass rounded-2xl p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Create a Real Route Ride</h1>

      <div className="glass-soft rounded-xl p-4 mb-4 text-sm text-muted">
        Use Google Places to select addresses. Generate route and share live location while driving.
      </div>

      {error && <div className="text-red-500 text-sm mb-3">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="input"
            placeholder="From label (e.g. Delhi)"
            value={from}
            required
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            className="input"
            placeholder="To label (e.g. Gurgaon)"
            value={to}
            required
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="glass-soft rounded-xl p-3">
          <DriverMap
            source={source}
            destination={destination}
            routePoints={routePath}
            onSourceChanged={(val) => {
              setSource(val);
              setFrom(val.label || from);
            }}
            onDestinationChanged={(val) => {
              setDestination(val);
              setTo(val.label || to);
            }}
            onRouteComputed={(points) => {
              setRoutePath(points || []);
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            className="input"
            type="number"
            min={1}
            placeholder="Seats"
            value={availableSeats}
            onChange={(e) => setAvailableSeats(e.target.value)}
            required
          />
          <input
            className="input"
            type="number"
            min={1}
            placeholder="Price per seat"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Total fare (optional)"
            value={totalFare}
            onChange={(e) => setTotalFare(e.target.value)}
          />
          <select
            className="input"
            value={pickupPointId}
            onChange={(e) => setPickupPointId(e.target.value)}
          >
            <option value="">Choose pickup point (optional)</option>
            {pickupPoints.map((p) => (
              <option key={p._id} value={p._id}>{p.name} - {p.city}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input id="schedule" type="checkbox" checked={scheduleRide} onChange={(e) => setScheduleRide(e.target.checked)} />
          <label htmlFor="schedule" className="small text-muted">Schedule this ride</label>
        </div>

        {scheduleRide && (
          <input
            className="input"
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            required
          />
        )}

        <button type="submit" className="btn btn-primary w-full">Create Ride with Route</button>
      </form>
    </div>
  );
};

export default CreateRide;
