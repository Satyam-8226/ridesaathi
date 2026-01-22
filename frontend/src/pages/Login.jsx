import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { AuthContext } from "../auth/AuthContext";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState("password"); // "password" | "otp"
  const [form, setForm] = useState({ email: "", password: "" });
  const [contact, setContact] = useState(""); // email or phone for OTP
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(0); // 0 = request, 1 = verify
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // NEW: resend cooldown state
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) {
      clearInterval(cooldownRef.current);
      cooldownRef.current = null;
      return;
    }
    if (!cooldownRef.current) {
      cooldownRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(cooldownRef.current);
            cooldownRef.current = null;
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      // do not clear here to keep timer running across re-renders
    };
  }, [cooldown]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === "driver" ? "/create-ride" : "/search", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!contact) return toast.error("Enter email or phone");
    setLoading(true);
    setError("");
    const type = contact.includes("@") ? "email" : "phone";
    try {
      await API.post("/auth/request-otp", { contact, type });
      toast.success("OTP sent");
      setStep(1);
      // start 60s cooldown for resend
      setCooldown(60);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!contact || !otp) return toast.error("Provide contact and OTP");
    setLoading(true);
    setError("");
    const type = contact.includes("@") ? "email" : "phone";
    try {
      const res = await API.post("/auth/verify-otp", { contact, type, otp });
      login(res.data.user, res.data.token);
      toast.success("Signed in");
      navigate(res.data.user.role === "driver" ? "/create-ride" : "/search", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="glass rounded-2xl p-6 w-full max-w-md animate-fadeInUp">
        <h2 className="text-2xl font-bold mb-2 text-center">RideSaathi Login</h2>
        <p className="small text-muted text-center mb-4">
          Secure sign-in to access rides, live tracking and manage trips.
        </p>

        <div className="flex gap-2 mb-4">
          <button onClick={() => { setMode("password"); setStep(0); }} className={`btn ${mode === "password" ? "btn-primary" : "btn-ghost"} flex-1`}>Password</button>
          <button onClick={() => { setMode("otp"); setStep(0); }} className={`btn ${mode === "otp" ? "btn-primary" : "btn-ghost"} flex-1`}>OTP</button>
        </div>

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        {mode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? "Logging in..." : "Login"}</button>
          </form>
        ) : (
          <div className="space-y-4">
            {step === 0 ? (
              <>
                <input placeholder="Email or phone (include country code for phone)" value={contact} onChange={(e) => setContact(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={requestOtp} disabled={loading || cooldown > 0} className="btn btn-primary flex-1">
                    {loading ? "Sending..." : (cooldown > 0 ? `Resend in ${cooldown}s` : "Request OTP")}
                  </button>
                  <button onClick={() => { setMode("password"); setStep(0); }} className="btn btn-ghost">Back</button>
                </div>
              </>
            ) : (
              <>
                <div className="small text-muted">OTP sent to <strong>{contact}</strong></div>
                <input placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={verifyOtp} disabled={loading} className="btn btn-primary flex-1">{loading ? "Verifying..." : "Verify & Sign in"}</button>
                  <button onClick={() => { if (cooldown === 0) requestOtp(); }} disabled={cooldown > 0} className="btn btn-ghost">
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-sm text-center mt-4 text-muted">
          New user?{" "}
          <span onClick={() => navigate("/register")} className="kicker cursor-pointer">Register</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
