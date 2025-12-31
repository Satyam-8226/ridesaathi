import { useContext, useState } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import toast from "react-hot-toast";


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

  /* ===============================
     API ACTIONS
  ================================ */
  const joinRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/join`);
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


  /* ===============================
     STATUS STYLES
  ================================ */
  const statusStyles = {
    OPEN: "text-green-600 bg-green-50",
    FULL: "text-yellow-600 bg-yellow-50",
    CANCELLED: "text-red-600 bg-red-50",
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-4">
      {/* TOP: Route + Price */}
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">
          {ride.source} → {ride.destination}
        </h3>
        <span className="text-lg font-bold text-green-600">
          ₹{ride.price}
        </span>
      </div>

      {/* META INFO */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>📅 {new Date(ride.date).toDateString()}</span>
        <span>💺 {ride.availableSeats} seats left</span>
      </div>

      {/* STATUS */}
      <div>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[ride.status]}`}
        >
          {ride.status}
          {ride.status === "CANCELLED" && (
            <p className="text-sm text-red-500 mt-2">
              Driver has cancelled this ride
            </p>
          )}
        </span>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-3 mt-2">
        {/* ===== SEARCH PAGE (Passenger) ===== */}
        {user.role === "passenger" && context === "search" && (
          <button
            onClick={joinRide}
            disabled={loading || isFull || isCancelled}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 transition"
          >
            Join Ride
          </button>
        )}

        {/* ===== MY RIDES PAGE (Passenger) ===== */}
        {user.role === "passenger" && context === "myrides" && isJoined && ride.status !== "CANCELLED" && (
          <button
            onClick={leaveRide}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50 transition"
          >
            Leave Ride
          </button>
        )}

        {/* ===== DRIVER ===== */}
        {user.role === "driver" && isOpen && (
          <button
            onClick={cancelRide}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition"
          >
            Cancel Ride
          </button>
        )}
      </div>
    </div>
  );
};

export default RideCard;
