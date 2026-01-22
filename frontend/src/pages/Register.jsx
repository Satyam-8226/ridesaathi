import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "passenger",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", form);

      // 🔑 Centralized auth update
      login(res.data.user, res.data.token);

      // 🚦 Role-based redirect
      if (res.data.user.role === "driver") {
        navigate("/create-ride", { replace: true });
      } else {
        navigate("/search", { replace: true });
      }

    } catch (err) {
      if (err.response?.status === 409) {
        setError("User already exists. Redirecting to login...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setError(
          err.response?.data?.message ||
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass rounded-2xl p-6 w-full max-w-3xl animate-fadeInUp">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left promo panel */}
          <div className="hidden md:flex flex-col justify-center px-6">
            <h2 className="text-3xl font-bold mb-2">Create your account</h2>
            <p className="small text-muted mb-4">
              Join RideSaathi — share rides as a driver or travel smart as a passenger.
            </p>

            <div className="glass-soft p-3 rounded-md text-sm text-muted">
              <div className="kicker mb-2">Why join RideSaathi?</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Earn by sharing rides (Drivers)</li>
                <li>Find affordable shared rides (Passengers)</li>
                <li>Secure auth, live tracking, polished UX</li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <div className="p-2">
            {error && (
              <p className="text-red-400 text-sm mb-3 text-center">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={form.phone}
                onChange={handleChange}
                required
              />

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="passenger">Passenger</option>
                <option value="driver">Driver</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? "Registering..." : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
