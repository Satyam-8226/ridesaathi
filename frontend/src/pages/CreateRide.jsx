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
  <div className="glass rounded-2xl p-6 max-w-xl mx-auto">
    {/* HEADER */}
    <h1 className="text-3xl font-bold mb-2">
      Create a Ride
    </h1>

    <p className="text-slate-400 mb-6">
      Share your route and help passengers travel together 🚘
    </p>

    {/* FORM CARD */}
    <div className="glass rounded-xl p-6">
      {error && (
        <p className="text-red-400 text-sm mb-4 text-center">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="from"
          placeholder="From"
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={handleChange}
          required
        />

        <input
          name="to"
          placeholder="To"
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={handleChange}
          required
        />

        <input
          name="date"
          type="date"
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={handleChange}
          required
        />

        <input
          name="availableSeats"
          type="number"
          placeholder="Available seats"
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={handleChange}
          required
        />

        <input
          name="price"
          type="number"
          placeholder="Price per seat (₹)"
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onChange={handleChange}
          required
        />

        <button
          type="submit"
          className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-white py-3 rounded-md transition font-medium"
        >
          Create Ride
        </button>
      </form>
    </div>
  </div>
);
};

export default CreateRide;
