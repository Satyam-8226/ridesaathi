import { useState, useContext } from "react";
import API from "../api/axios";
import RideCard from "../components/RideCard";
import { AuthContext } from "../auth/AuthContext";
import Navbar from "../components/Navbar";


const SearchRides = () => {
  const { user } = useContext(AuthContext); // ✅ FIX

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const searchRides = async () => {
    if (!from || !to) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await API.get(`/rides/search?from=${from}&to=${to}`);
      setRides(res.data.rides);
    } catch {
      setError("Failed to fetch rides");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
    <Navbar />
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Search Rides</h1>

      {/* ✅ WELCOME MESSAGE */}
      {user && (
        <h2 className="text-lg text-gray-600 mb-6">
          Welcome, {user.name}! Search and join available rides 🚗
        </h2>
      )}

      {/* Search Box */}
      <div className="flex gap-4 mb-6">
        <input
          className="border p-2 rounded w-full"
          placeholder="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          className="border p-2 rounded w-full"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <button
          onClick={searchRides}
          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* No rides found */}
      {!loading && searched && rides.length === 0 && !error && (
        <p className="text-gray-500 text-center mt-6">
          No rides found for this route 🚫
        </p>
      )}

      {/* Rides list */}
      <div className="space-y-4">
        {rides.map((ride) => (
          <RideCard
            key={ride._id}
            ride={ride}
            refresh={searchRides}
            context="search"
          />
        ))}
      </div>
    </div>
    </>
  );
};

export default SearchRides;
