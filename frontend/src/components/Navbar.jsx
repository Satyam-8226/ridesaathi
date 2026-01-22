import { useContext, useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle global blur class when dropdown opens
  useEffect(() => {
    if (open) {
      document.body.classList.add("ui-blur");
    } else {
      document.body.classList.remove("ui-blur");
    }

    return () => {
      document.body.classList.remove("ui-blur");
    };
  }, [open]);

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "nav-link-active" : ""}`;

  const initials = user?.name
    ? user.name.split(" ").map(s => s[0]).slice(0,2).join("").toUpperCase()
    : "";

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-3 flex items-center justify-between border-b border-white/10">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <Link to="/search" className="flex items-center gap-3">
          <div className="nav-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="2" y="6" width="20" height="12" rx="3" fill="url(#g)"></rect>
              <defs>
                <linearGradient id="g" x1="0" x2="1">
                  <stop offset="0" stopColor="#7c5cff"/>
                  <stop offset="1" stopColor="#5eead4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <div className="text-indigo-300 font-bold text-lg">RideSaathi</div>
            <div className="nav-tagline small text-muted">Smart ride sharing</div>
          </div>
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/search" className={linkClass}>Search</NavLink>
            <NavLink to="/my-rides" className={linkClass}>My Rides</NavLink>
            {user.role === "driver" && (
              <NavLink to="/create-ride" className="btn btn-primary">
                + Create Ride
              </NavLink>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(p => !p)}
              className="flex items-center gap-3 glass-soft px-3 py-1 rounded-full hover:scale-[1.01] transition"
              aria-haspopup="true"
              aria-expanded={open}
            >
              <div className="avatar">
                <span className="avatar-initials">{initials}</span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-slate-100">{user.name}</div>
                <div className="text-xs text-muted">{user.role}</div>
              </div>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 drop-panel p-1">
                <button
                  onClick={() => { navigate("/my-rides"); setOpen(false); }}
                  className="block w-full text-left px-4 py-2 hover:bg-white/5 transition"
                >
                  My Rides
                </button>

                {user.role === "driver" && (
                  <button
                    onClick={() => { navigate("/create-ride"); setOpen(false); }}
                    className="block w-full text-left px-4 py-2 hover:bg-white/5 transition"
                  >
                    Create Ride
                  </button>
                )}

                <div className="border-t border-white/10" />

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-400 hover:bg-white/5 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
