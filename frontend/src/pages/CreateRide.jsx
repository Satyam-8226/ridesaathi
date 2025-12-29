import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

const CreateRide = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    from: "",
    to: "",
    date: "",
    availableSeats: "",
    price: ""
  });

  const [error, setError] = useState("");

  if (user.role !== "driver") {
    return (
      <div className="p-6 text-red-500">
        Access denied. Drivers only.
      </div>
    );
  }

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          Create Ride
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">
            {error}
          </p>
        )}

        <input
          name="from"
          placeholder="From"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <input
          name="to"
          placeholder="To"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <input
          name="date"
          type="date"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <input
          name="availableSeats"
          type="number"
          placeholder="Seats"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <input
          name="price"
          type="number"
          placeholder="Price"
          className="border p-2 rounded w-full mb-4"
          onChange={handleChange}
          required
        />

        <button className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700">
          Create Ride
        </button>
      </form>
    </div>
  );
};

export default CreateRide;
