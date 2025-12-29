import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "passenger"
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await API.post("/auth/register", form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          Register
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-3 text-center">
            {error}
          </p>
        )}

        <input
          name="name"
          placeholder="Name"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Phone"
          className="border p-2 rounded w-full mb-3"
          onChange={handleChange}
          required
        />

        <select
          name="role"
          className="border p-2 rounded w-full mb-4"
          onChange={handleChange}
        >
          <option value="passenger">Passenger</option>
          <option value="driver">Driver</option>
        </select>

        <button className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
