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
}, [user]); // ✅ prevRideIds removed



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
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 text-gray-600">
        Fetching your rides...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2">
        {user.role === "driver" ? "My Created Rides" : "My Joined Rides"}
      </h1>

      <p className="text-gray-600 mb-6">
        {user.role === "driver"
          ? "Manage rides you have created."
          : "Rides you have joined as a passenger."}
      </p>

      {/* ERROR */}
      {error && (
        <p className="text-center text-red-500 mb-6">{error}</p>
      )}

      {/* EMPTY STATE */}
      {!error && rides.length === 0 && (
        <div className="text-center text-gray-500 mt-12">
          <p className="text-lg">
            {user.role === "driver"
              ? "You haven’t created any rides yet 🚘"
              : <p>
                  <p>You haven’t joined any rides yet 🚗</p>
                  <p>(Cancelled rides are removed automatically)</p>
                </p>}
          </p>
          <p className="text-sm mt-2">
            {user.role === "driver"
              ? "Create a ride to get started."
              : "Search for rides and join one."}
          </p>
        </div>
      )}

      {/* RIDES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
