import { useContext, useState } from "react";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

const RideCard = ({ ride, refresh }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const joined =
    user?.role === "passenger" &&
    ride.passengers?.includes(user._id);

  const joinRide = async () => {
    try {
      setLoading(true);
      await API.post(`/rides/${ride._id}/join`);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Join failed");
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
      alert(err.response?.data?.message || "Leave failed");
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
      alert(err.response?.data?.message || "Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  const statusColor =
    ride.status === "OPEN"
      ? "text-green-600"
      : ride.status === "FULL"
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="border rounded-lg p-4 flex justify-between items-center shadow-sm">
      {/* LEFT INFO */}
      <div>
        <p className="font-semibold text-lg">
          {ride.source} → {ride.destination}
        </p>

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
        {/* Passenger actions */}
        {user?.role === "passenger" &&
          ride.status === "OPEN" &&
          !joined && (
            <button
              onClick={joinRide}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Join
            </button>
          )}

        {user?.role === "passenger" && joined && (
          <button
            onClick={leaveRide}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Leave
          </button>
        )}

        {/* Driver action */}
        {user?.role === "driver" && ride.status === "OPEN" && (
          <button
            onClick={cancelRide}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default RideCard;
