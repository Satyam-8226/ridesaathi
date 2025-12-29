import { useEffect, useState, useContext } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import RideCard from "../components/RideCard";

const MyRides = () => {
  const { user } = useContext(AuthContext);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMyRides = async () => {
    try {
      const url =
        user.role === "driver"
          ? "/rides/my-rides/driver"
          : "/rides/my-rides/passenger";

      const res = await API.get(url);
      setRides(res.data);
    } catch (err) {
      setError("Failed to load rides");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMyRides();
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Rides</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {rides.length === 0 && (
        <p className="text-gray-600">No rides found.</p>
      )}

      {/* ✅ Replaced with RideCard */}
      <div className="space-y-4">
        {rides.map((ride) => (
          <RideCard
            key={ride._id}
            ride={ride}
            refresh={fetchMyRides}
          />
        ))}
      </div>
    </div>
  );
};

export default MyRides;
