import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

const CreateRide = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    from: "",
    to: "",
    date: "",
    availableSeats: "",
    price: "",
  });

  const [error, setError] = useState("");

  /* ===============================
     AUTH GUARD
  ================================ */
  if (loading) return null;

  if (!user || user.role !== "driver") {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 text-center text-red-500">
        Access denied. Drivers only.
      </div>
    );
  }

  /* ===============================
     HANDLERS
  ================================ */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await API.post("/rides", form);
      navigate("/my-rides");
    } catch (err) {
      setError(err.response?.data?.message || "Ride creation failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-2">Create a Ride</h1>
      <p className="text-gray-600 mb-6">
        Share your route and help passengers travel together 🚘
      </p>

      {/* FORM CARD */}
      <div className="max-w-xl bg-white p-6 rounded-xl shadow">
        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="from"
            placeholder="From"
            className="border p-3 rounded-md w-full"
            onChange={handleChange}
            required
          />

          <input
            name="to"
            placeholder="To"
            className="border p-3 rounded-md w-full"
            onChange={handleChange}
            required
          />

          <input
            name="date"
            type="date"
            className="border p-3 rounded-md w-full"
            onChange={handleChange}
            required
          />

          <input
            name="availableSeats"
            type="number"
            placeholder="Available seats"
            className="border p-3 rounded-md w-full"
            onChange={handleChange}
            required
          />

          <input
            name="price"
            type="number"
            placeholder="Price per seat (₹)"
            className="border p-3 rounded-md w-full"
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition"
          >
            Create Ride
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRide;
