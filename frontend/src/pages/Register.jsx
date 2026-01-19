import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "passenger",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", form);

      // store token
      localStorage.setItem("token", res.data.token);

      // role-based redirect
      if (res.data.user.role === "driver") {
        navigate("/create-ride");
      } else {
        navigate("/search");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="min-h-[80vh] flex items-center justify-center">
    <div className="glass rounded-2xl p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        Create your account
      </h2>

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
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="tel"
          name="phone"
          placeholder="Phone number"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option className="bg-slate-900" value="passenger">
            Passenger
          </option>
          <option className="bg-slate-900" value="driver">
            Driver
          </option>
        </select>

        <button
          disabled={loading}
          className="w-full bg-indigo-600/80 hover:bg-indigo-600 text-white py-3 rounded-md transition font-medium disabled:opacity-50"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  </div>
);
};

export default Register;
