import { useState, useContext } from "react";
import API from "../api/axios";
import RideCard from "../components/RideCard";
import { AuthContext } from "../auth/AuthContext";

const SearchRides = () => {
  const { user } = useContext(AuthContext);

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
  <div className="glass rounded-2xl p-6">
    {/* HEADER */}
    <h1 className="text-3xl font-bold mb-2">Search Rides</h1>

    {user && (
      <p className="text-slate-400 mb-6">
        {user.role === "driver"
          ? `Welcome, ${user.name}! Create or manage your rides 🚘`
          : `Welcome, ${user.name}! Find and join available rides 🚗`}
      </p>
    )}

    {/* SEARCH CARD */}
    <div className="glass rounded-xl p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          className="bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="From"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          className="bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <button
          onClick={searchRides}
          className="bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-md px-6 py-3 transition font-medium"
        >
          Search
        </button>
      </div>
    </div>

    {/* STATES */}
    {loading && (
      <p className="text-center text-slate-400">
        Searching rides...
      </p>
    )}

    {error && (
      <p className="text-center text-red-400">
        {error}
      </p>
    )}

    {!loading && searched && rides.length === 0 && !error && (
      <div className="text-center text-slate-400 mt-12">
        <p className="text-lg">No rides found 🚫</p>
        <p className="text-sm mt-2">
          Try changing locations or check again later.
        </p>
      </div>
    )}

    {/* RIDES GRID */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
);
};

export default SearchRides;
