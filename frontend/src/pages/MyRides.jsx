import { useEffect, useState, useContext, useCallback } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import RideCard from "../components/RideCard";

const MyRides = () => {
  const { user } = useContext(AuthContext);

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
      setRides(res.data);
    } catch (err) {
      setError("Failed to load rides");
    } finally {
      setLoading(false);
    }
  }, [user]);

  /* ===============================
     INITIAL LOAD
  ================================ */
  useEffect(() => {
    fetchMyRides();
  }, [fetchMyRides]);

  /* ===============================
     UI STATES
  ================================ */
  if (loading) {
    return <p className="p-6 text-gray-600">Loading your rides...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Rides</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {rides.length === 0 && !error && (
        <p className="text-gray-600">You have no rides yet.</p>
      )}

      {/* RIDE LIST */}
      <div className="space-y-4">
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
