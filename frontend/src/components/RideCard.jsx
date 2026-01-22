import { useContext, useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import toast from "react-hot-toast";
import { getSocket } from "../socket";
import TrackModal from "./TrackModal";
import PassengersModal from "./PassengersModal";

const RideCard = ({ ride, refresh, context = "search" }) => {
  const { user } = useContext(AuthContext);

  // core UI states
  const [loading, setLoading] = useState(false);

  // optimistic join/leave UI
  const [joined, setJoined] = useState(ride.passengers?.includes(user._id));
  const [localAvailableSeats, setLocalAvailableSeats] = useState(
    typeof ride.availableSeats === "number" ? ride.availableSeats : 0
  );

  // tracking / sharing states
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [passengerSharing, setPassengerSharing] = useState(false);
  const passengerWatchRef = useRef(null);
  const [passengersOpen, setPassengersOpen] = useState(false);

  // socket ref
  const socketRef = useRef(null);

  // live-share indicator
  const [lastUpdate, setLastUpdate] = useState(
    ride?.driverLocationUpdatedAt ? new Date(ride.driverLocationUpdatedAt) : null
  );
  const [liveActive, setLiveActive] = useState(false);

  /* ===============================
     Sync props -> local optimistic state
  ================================ */
  useEffect(() => {
    setJoined(ride.passengers?.includes(user._id));
    setLocalAvailableSeats(typeof ride.availableSeats === "number" ? ride.availableSeats : 0);
    setLastUpdate(ride?.driverLocationUpdatedAt ? new Date(ride.driverLocationUpdatedAt) : null);
  }, [ride, user._id]);

  /* ===============================
     liveActive recency check (90s)
  ================================ */
  useEffect(() => {
    const check = () => {
      if (!lastUpdate) {
        setLiveActive(false);
        return;
      }
      const age = Date.now() - new Date(lastUpdate).getTime();
      setLiveActive(age <= 90_000);
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [lastUpdate]);

  /* ===============================
     Socket subscription for ride updates
  ================================ */
  useEffect(() => {
    try {
      const socket = getSocket();
      socketRef.current = socket;
      socket.emit("joinRoom", ride._id);

      const onLocation = (payload) => {
        if (!payload || payload.rideId !== ride._id) return;
        setLastUpdate(payload.driverLocationUpdatedAt ? new Date(payload.driverLocationUpdatedAt) : new Date());
      };

      const onCancelled = (payload) => {
        if (!payload || payload.rideId !== ride._id) return;
        setLastUpdate(null);
        setLiveActive(false);
      };

      socket.on("ride:location", onLocation);
      socket.on("ride:cancelled", onCancelled);

      return () => {
        socket.emit("leaveRoom", ride._id);
        socket.off("ride:location", onLocation);
        socket.off("ride:cancelled", onCancelled);
      };
    } catch (e) {
      // noop
    }
  }, [ride._id]);

  /* ===============================
     DERIVED STATE (use optimistic flags)
  ================================ */
  const isJoined = joined;
  const isFull = localAvailableSeats === 0;
  const isCancelled = ride.status === "CANCELLED";
  const isOpen = ride.status === "OPEN";

  /* ===============================
     API ACTIONS
  ================================ */
  const joinRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/join`);
      // optimistic update: mark joined and decrement seats immediately
      setJoined(true);
      setLocalAvailableSeats((s) => Math.max(0, s - 1));
      // still call refresh to fully sync backend state
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to join ride");
    } finally {
      setLoading(false);
    }
  };

  const leaveRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/leave`);
      // optimistic update: unmark joined and increment seats immediately
      setJoined(false);
      setLocalAvailableSeats((s) => s + 1);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave ride");
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this ride? All passengers will be removed."
    );

    if (!confirmCancel) return;

    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/cancel`);
      toast.success("Ride cancelled successfully");
      refresh();
    } catch (err) {
      toast.error("Failed to cancel ride");
    } finally {
      setLoading(false);
    }
  };

  // DRIVER: start/stop sharing location via socket
  const toggleSharing = () => {
    if (sharing) {
      // stop
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setSharing(false);
      toast.success("Stopped sharing location");
      return;
    }

    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not available in your browser");
      return;
    }

    const socket = getSocket();

    const success = (pos) => {
      const lat = Number(pos.coords.latitude);
      const lng = Number(pos.coords.longitude);
      socket.emit("driver:location", { rideId: ride._id, lat, lng });
    };

    const err = (e) => {
      console.error("geo error", e);
      toast.error("Unable to get location");
    };

    const id = navigator.geolocation.watchPosition(success, err, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 5000,
    });
    watchIdRef.current = id;
    setSharing(true);
    toast.success("Started sharing location");
  };

  // PASSENGER: toggle sharing their location
  const togglePassengerSharing = () => {
    if (passengerSharing) {
      if (passengerWatchRef.current != null) {
        navigator.geolocation.clearWatch(passengerWatchRef.current);
        passengerWatchRef.current = null;
      }
      setPassengerSharing(false);
      toast.success("Stopped sharing your location");
      return;
    }

    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not available");
      return;
    }

    const socket = getSocket();
    const success = (pos) => {
      const lat = Number(pos.coords.latitude);
      const lng = Number(pos.coords.longitude);
      // emit passenger location
      socket.emit("passenger:location", { rideId: ride._id, lat, lng });
      // optimistic: could also call REST fallback
    };
    const err = (e) => {
      console.error("geo error", e);
      toast.error("Unable to access location");
    };

    const id = navigator.geolocation.watchPosition(success, err, {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 5000,
    });
    passengerWatchRef.current = id;
    setPassengerSharing(true);
    toast.success("Started sharing your location");
  };

  /* ===============================
     STATUS STYLES
  ================================ */
  const statusStyles = {
    OPEN: "badge badge-open",
    FULL: "badge badge-full",
    CANCELLED: "badge badge-cancel",
  };

  return (
    <div className="ride-card">
      {/* TOP: Route + Price */}
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">
          {ride.source} → {ride.destination}
        </h3>

        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-indigo-400">₹{ride.price}</span>

          {/* LIVE indicator */}
          <div title={liveActive ? "Driver sharing live location" : "No live location"} className="flex items-center gap-2">
            <span className={`live-dot ${liveActive ? "active" : ""}`} />
            <span className="small text-muted">{liveActive ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted mb-3">
        <span>📅 {new Date(ride.date).toDateString()}</span>
        <span>💺 {ride.availableSeats} seats left</span>
      </div>

      <div className="mb-3">
        <span className={statusStyles[ride.status] || "badge"}>{ride.status}</span>
        {ride.status === "CANCELLED" && (
          <p className="text-sm text-red-400 mt-2">Driver has cancelled this ride</p>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 mt-2">
        {/* ===== SEARCH PAGE (Passenger) ===== */}
        {user.role === "passenger" && context === "search" && (
          <>
            {!isJoined ? (
              <button
                onClick={joinRide}
                disabled={loading || isFull || isCancelled}
                className="btn btn-primary"
              >
                Join Ride
              </button>
            ) : (
              <button
                onClick={leaveRide}
                disabled={loading || isCancelled}
                className="btn btn-danger"
              >
                Leave Ride
              </button>
            )}
          </>
        )}

        {/* ===== MY RIDES PAGE (Passenger) ===== */}
        {user.role === "passenger" &&
          context === "myrides" &&
          isJoined &&
          ride.status !== "CANCELLED" && (
            <button
              onClick={leaveRide}
              disabled={loading}
              className="btn btn-danger"
            >
              Leave Ride
            </button>
          )}

        {/* driver actions */}
        {user.role === "driver" && isOpen && (
          <>
            <button onClick={cancelRide} disabled={loading} className="btn btn-danger">
              Cancel Ride
            </button>
            {ride.driver && ride.driver.toString() === user._id && (
              <button
                onClick={toggleSharing}
                className={`btn ${sharing ? "btn-ghost" : "btn-primary"}`}
              >
                {sharing ? "Stop Sharing" : "Share Location"}
              </button>
            )}
          </>
        )}

        {/* Driver: view passengers */}
        {user.role === "driver" && (
          <button onClick={() => setPassengersOpen(true)} className="btn btn-ghost">
            Passengers
          </button>
        )}

        {/* Passenger: share location when joined */}
        {user.role === "passenger" && isJoined && (
          <button onClick={togglePassengerSharing} className={`btn ${passengerSharing ? "btn-ghost" : "btn-primary"}`}>
            {passengerSharing ? "Stop sharing" : "Share my location"}
          </button>
        )}
      </div>

      {passengersOpen && (
        <PassengersModal rideId={ride._id} onClose={() => setPassengersOpen(false)} />
      )}

      {/* Track modal (passenger) */}
      {trackingOpen && <TrackModal rideId={ride._id} onClose={() => setTrackingOpen(false)} />}
    </div>
  );
};

export default RideCard;
