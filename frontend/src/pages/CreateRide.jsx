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
      <h1 className="text-3xl font-bold mb-2">Create a Ride</h1>

      {/* NEW: checklist */}
      <div className="glass-soft p-3 rounded-md mb-4 small text-muted">
        <div className="kicker mb-1">Before you create</div>
        <ul className="list-disc pl-5 small">
          <li>Confirm accurate date & time</li>
          <li>Set total seats and fair price</li>
          <li>Share live location when en route</li>
        </ul>
      </div>

      <p className="small text-muted mb-6">
        Share your route and help passengers travel together.
      </p>

      <div className="glass-soft rounded-xl p-4">
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="from"
            placeholder="From"
            onChange={handleChange}
            required
          />
          <input
            name="to"
            placeholder="To"
            onChange={handleChange}
            required
          />
          <input
            name="date"
            type="date"
            onChange={handleChange}
            required
          />
          <input
            name="availableSeats"
            type="number"
            placeholder="Available seats"
            onChange={handleChange}
            required
          />
          <input
            name="price"
            type="number"
            placeholder="Price per seat (₹)"
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="btn btn-primary w-full"
          >
            Create Ride
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRide;
