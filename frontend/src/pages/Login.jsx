import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", {
        email,
        password
      });

      // backend should return { token, user }
      login(res.data.user, res.data.token);

      navigate("/search");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
  <div className="min-h-[80vh] flex items-center justify-center">
    <div className="glass rounded-2xl p-8 w-full max-w-md animate-fadeInUp">
      <h2 className="text-2xl font-bold mb-4 text-center">
        RideSaathi Login
      </h2>

      {error && (
        <p className="text-red-400 text-sm mb-3 text-center">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-transparent border border-white/20 p-3 rounded-md text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600/80 hover:bg-indigo-600 
           text-white py-3 rounded-md transition 
           hover:-translate-y-[1px] hover:shadow-lg"
        >
          Login
        </button>
      </form>

      <p className="text-sm text-center mt-4 text-slate-400">
        New user?{" "}
        <span
          onClick={() => navigate("/register")}
          className="text-indigo-400 cursor-pointer hover:underline"
        >
          Register here
        </span>
      </p>
    </div>
  </div>
);
};

export default Login;
