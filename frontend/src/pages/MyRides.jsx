import { useEffect, useState, useContext, useCallback } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import RideCard from "../components/RideCard";
import toast from "react-hot-toast";

const MyRides = () => {
  const { user } = useContext(AuthContext);

  const [prevRideIds, setPrevRideIds] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ===============================
     FETCH MY RIDES
  ================================ */
  const fetchMyRides = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const endpoint =
        user.role === "driver"
          ? "/rides/my-rides/driver"
          : "/rides/my-rides/passenger";

      const res = await API.get(endpoint);

      if (user.role === "passenger") {
        const currentRideIds = res.data.map((ride) => ride._id);

        if (
          prevRideIds.length > 0 &&
          currentRideIds.length < prevRideIds.length
        ) {
          toast.dismiss();
          toast.error("A ride you joined was cancelled by the driver");
        }

        setPrevRideIds(currentRideIds);
      }

      setRides(res.data);
    } catch {
      setError("Failed to load rides");
    } finally {
      setLoading(false);
    }
  }, [user, prevRideIds]);

  /* ===============================
     INITIAL LOAD
  ================================ */
  useEffect(() => {
    fetchMyRides();
  }, [fetchMyRides]);

  /* ===============================
     LOADING STATE
  ================================ */
  if (loading) {
    return <div className="empty-state">Fetching your rides...</div>;
  }

  return (
    <div className="glass rounded-2xl p-6">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2">
        {user.role === "driver" ? "My Created Rides" : "My Joined Rides"}
      </h1>

      {/* NEW: contextual info banner */}
      <div className="glass-soft p-3 rounded-md mb-4 small text-muted">
        {user.role === "driver" ? (
          <div>
            <div className="kicker mb-1">Driver note</div>
            <div>
              Share live location for passengers to track you in real-time. You
              can cancel a ride anytime — passengers will be notified.
            </div>
          </div>
        ) : (
          <div>
            <div className="kicker mb-1">Passenger note</div>
            <div>
              If the driver shares location, you'll see a live indicator and can
              open the tracker to follow the ride.
            </div>
          </div>
        )}
      </div>

      {error && <div className="empty-state text-red-400 mb-6">{error}</div>}

      {!error && rides.length === 0 && (
        <div className="empty-state">
          {user.role === "driver" ? (
            <>
              <p className="text-lg">You haven’t created any rides yet</p>
              <p className="small mt-2">Create a ride to get started.</p>
            </>
          ) : (
            <>
              <p className="text-lg">You haven’t joined any rides yet</p>
              <p className="small mt-2">Search for rides and join one.</p>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {rides.map((ride) => (
          <RideCard
            key={ride._id}
            ride={ride}
            refresh={fetchMyRides}
            context="myrides"
          />
        ))}
      </div>
    </div>
  );
};

export default MyRides;
