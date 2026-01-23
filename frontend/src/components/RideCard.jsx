import { useContext, useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import toast from "react-hot-toast";
import { getSocket } from "../socket";
import TrackModal from "./TrackModal";
import PassengersModal from "./PassengersModal";

const RideCard = ({ ride, refresh, context = "search" }) => {
  const { user } = useContext(AuthContext);

  /* ===============================
     UI + optimistic states
  ================================ */
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(ride.passengers?.includes(user._id));
  const [localSeats, setLocalSeats] = useState(ride.availableSeats ?? 0);

  /* ===============================
     Live tracking state
  ================================ */
  const [sharing, setSharing] = useState(false);
  const [passengerSharing, setPassengerSharing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(
    ride.driverLocationUpdatedAt ? new Date(ride.driverLocationUpdatedAt) : null
  );
  const [liveActive, setLiveActive] = useState(false);

  const driverWatchRef = useRef(null);
  const passengerWatchRef = useRef(null);
  const socketRef = useRef(null);

  const [passengersOpen, setPassengersOpen] = useState(false);

  /* ===============================
     Sync backend → UI
  ================================ */
  useEffect(() => {
    setJoined(ride.passengers?.includes(user._id));
    setLocalSeats(ride.availableSeats ?? 0);
    setLastUpdate(
      ride.driverLocationUpdatedAt ? new Date(ride.driverLocationUpdatedAt) : null
    );
  }, [ride, user._id]);

  /* ===============================
     Live recency check (90s)
  ================================ */
  useEffect(() => {
    const check = () => {
      if (!lastUpdate) return setLiveActive(false);
      const age = Date.now() - new Date(lastUpdate).getTime();
      setLiveActive(age <= 90_000);
    };

    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [lastUpdate]);

  /* ===============================
     Socket room subscription
  ================================ */
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit("joinRoom", ride._id);

    const onLocation = (payload) => {
      if (payload?.rideId === ride._id) {
        setLastUpdate(new Date(payload.driverLocationUpdatedAt || Date.now()));
      }
    };

    socket.on("ride:location", onLocation);

    return () => {
      socket.emit("leaveRoom", ride._id);
      socket.off("ride:location", onLocation);
    };
  }, [ride._id]);

  /* ===============================
     API actions
  ================================ */
  const joinRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/join`);
      setJoined(true);
      setLocalSeats((s) => Math.max(0, s - 1));
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to join ride");
    } finally {
      setLoading(false);
    }
  };

  const leaveRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/leave`);
      setJoined(false);
      setLocalSeats((s) => s + 1);
      refresh();
    } catch {
      toast.error("Failed to leave ride");
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    if (!window.confirm("Cancel this ride? All passengers will be removed."))
      return;

    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/cancel`);
      toast.success("Ride cancelled");
      refresh();
    } catch {
      toast.error("Failed to cancel ride");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Geolocation helpers
  ================================ */
  const geoError = (e) => {
    console.error("geo error", e);
    if (e.code === 1) toast.error("Location permission denied");
    else if (e.code === 2) toast.error("Location unavailable");
    else if (e.code === 3)
      toast.error("Location taking too long. Try moving outdoors");
    else toast.error("Unable to access location");
  };

  /* ===============================
     Driver: toggle live sharing
  ================================ */
  const toggleSharing = () => {
    if (sharing) {
      navigator.geolocation.clearWatch(driverWatchRef.current);
      driverWatchRef.current = null;
      setSharing(false);
      toast.success("Stopped sharing location");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    const socket = getSocket();
    let started = false;

    const success = (pos) => {
      const lat = Number(pos.coords.latitude);
      const lng = Number(pos.coords.longitude);

      socket.emit("driver:location", { rideId: ride._id, lat, lng });

      if (!started) {
        started = true;
        setSharing(true);
        toast.success("Started sharing location");
      }
    };

    driverWatchRef.current = navigator.geolocation.watchPosition(success, geoError, {
      enableHighAccuracy: false,
      timeout: 20_000,
      maximumAge: 10_000,
    });
  };

  /* ===============================
     Passenger: toggle sharing
  ================================ */
  const togglePassengerSharing = () => {
    if (passengerSharing) {
      navigator.geolocation.clearWatch(passengerWatchRef.current);
      passengerWatchRef.current = null;
      setPassengerSharing(false);
      toast.success("Stopped sharing your location");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    const socket = getSocket();

    const success = (pos) => {
      const lat = Number(pos.coords.latitude);
      const lng = Number(pos.coords.longitude);
      socket.emit("passenger:location", { rideId: ride._id, lat, lng });
    };

    passengerWatchRef.current = navigator.geolocation.watchPosition(success, geoError, {
      enableHighAccuracy: false,
      timeout: 20_000,
      maximumAge: 10_000,
    });

    setPassengerSharing(true);
    toast.success("Sharing your location");
  };

  /* ===============================
     Derived flags
  ================================ */
  const isFull = localSeats === 0;
  const isCancelled = ride.status === "CANCELLED";
  const isOpen = ride.status === "OPEN";

  /* ===============================
     Render
  ================================ */
  return (
    <div className="ride-card">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">
          {ride.source} → {ride.destination}
        </h3>

        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-indigo-400">
            ₹{ride.price}
          </span>
          <div className="flex items-center gap-2">
            <span className={`live-dot ${liveActive ? "active" : ""}`} />
            <span className="small text-muted">
              {liveActive ? "Live" : "Offline"}
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted mb-3">
        📅 {new Date(ride.date).toDateString()} • 💺 {localSeats} seats left
      </div>

      <div className="flex gap-3">
        {user.role === "passenger" && context === "search" && !joined && (
          <button
            onClick={joinRide}
            disabled={loading || isFull || isCancelled}
            className="btn btn-primary"
          >
            Join Ride
          </button>
        )}

        {user.role === "passenger" && joined && (
          <button
            onClick={leaveRide}
            disabled={loading}
            className="btn btn-danger"
          >
            Leave Ride
          </button>
        )}

        {user.role === "driver" && isOpen && (
          <>
            <button
              onClick={cancelRide}
              disabled={loading}
              className="btn btn-danger"
            >
              Cancel Ride
            </button>
            <button
              onClick={toggleSharing}
              className={`btn ${sharing ? "btn-ghost" : "btn-primary"}`}
            >
              {sharing ? "Stop Sharing" : "Share Location"}
            </button>
          </>
        )}

        {user.role === "driver" && (
          <button
            onClick={() => setPassengersOpen(true)}
            className="btn btn-ghost"
          >
            Passengers
          </button>
        )}

        {user.role === "passenger" && joined && (
          <button
            onClick={togglePassengerSharing}
            className={`btn ${passengerSharing ? "btn-ghost" : "btn-primary"}`}
          >
            {passengerSharing ? "Stop sharing" : "Share my location"}
          </button>
        )}
      </div>

      {passengersOpen && (
        <PassengersModal
          rideId={ride._id}
          onClose={() => setPassengersOpen(false)}
        />
      )}
    </div>
  );
};

export default RideCard;


