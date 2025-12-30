import { useContext, useState } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

const RideCard = ({ ride, refresh, context = "search" }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  /* ===============================
     DERIVED STATE
  ================================ */
  const isJoined = ride.passengers?.includes(user._id);
  const isFull = ride.availableSeats === 0;
  const isCancelled = ride.status === "CANCELLED";
  const isOpen = ride.status === "OPEN";
  console.log("MyRides debug → passengers:", ride.passengers);
  console.log("MyRides debug → user:", user._id);


  /* ===============================
     API ACTIONS
  ================================ */
  const joinRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/join`);
      refresh(); // re-fetch list
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
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave ride");
    } finally {
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/cancel`);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel ride");
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     STATUS COLOR
  ================================ */
  const statusColor = {
    OPEN: "text-green-600",
    FULL: "text-yellow-600",
    CANCELLED: "text-red-600",
  }[ride.status];

  return (
    <div className="border rounded-lg p-4 shadow-sm flex justify-between items-center">
      {/* LEFT INFO */}
      <div>
        <h3 className="font-semibold text-lg">
          {ride.source} → {ride.destination}
        </h3>

        <p className="text-sm text-gray-600">
          {new Date(ride.date).toDateString()}
        </p>

        <p className="text-sm text-gray-600">
          Seats: {ride.availableSeats} | ₹{ride.price}
        </p>

        <p className={`text-sm font-semibold mt-1 ${statusColor}`}>
          {ride.status}
        </p>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-2">
        {/* ===== SEARCH PAGE (Passenger) ===== */}
        {user.role === "passenger" && context === "search" && (
          <button
            onClick={joinRide}
            disabled={loading || isFull || isCancelled}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Join Ride
          </button>
        )}

        {/* ===== MY RIDES PAGE (Passenger) ===== */}
        {user.role === "passenger" && context === "myrides" && isJoined && (
          <button
            onClick={leaveRide}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Leave Ride
          </button>
        )}

        {/* ===== DRIVER ===== */}
        {user.role === "driver" && isOpen && (
          <button
            onClick={cancelRide}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Cancel Ride
          </button>
        )}
      </div>
    </div>
  );
};

export default RideCard;