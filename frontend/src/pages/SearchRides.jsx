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
      <h1 className="text-3xl font-bold mb-2">Search Rides</h1>

      <div className="glass-soft p-3 rounded-md mb-4">
        <div className="kicker mb-1">Quick tips</div>
        <div className="small text-muted">
          Try exact city names or common spellings. Use the date filter for
          matching trips. Click "Join" to reserve a seat instantly.
        </div>
      </div>

      {user && (
        <p className="small text-muted mb-6">
          {user.role === "driver"
            ? `Welcome, ${user.name}! Create or manage your rides.`
            : `Welcome, ${user.name}! Find and join available rides.`}
        </p>
      )}

      <div className="glass-soft rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            placeholder="From"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />

          <input
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />

          <button
            onClick={searchRides}
            className="btn btn-primary"
          >
            Search
          </button>
        </div>
      </div>

      {loading && <div className="empty-state">Searching rides...</div>}
      {error && <div className="empty-state text-red-400">{error}</div>}

      {!loading && searched && rides.length === 0 && !error && (
        <div className="empty-state">
          <p className="text-lg">No rides found</p>
          <p className="small mt-2">
            Try changing locations or check again later.
          </p>
        </div>
      )}

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
