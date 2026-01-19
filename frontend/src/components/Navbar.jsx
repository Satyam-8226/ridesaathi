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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkClass = ({ isActive }) =>
    `px-2 py-1 rounded transition ${
      isActive ? "bg-blue-500 font-semibold" : "hover:bg-blue-500/60"
    }`;

  return (
  <nav className="glass sticky top-0 z-50 px-6 py-3 flex justify-between items-center border-b border-white/10">
    {/* Logo */}
    <Link to="/search" className="text-xl font-bold tracking-wide text-indigo-400">
      RideSaathi
    </Link>

    {user && (
      <div className="flex items-center gap-4">
        {/* Main links */}
        <NavLink to="/search" className={linkClass}>
          Search
        </NavLink>

        <NavLink to="/my-rides" className={linkClass}>
          My Rides
        </NavLink>

        {user.role === "driver" && (
          <NavLink
            to="/create-ride"
            className="px-3 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium transition"
          >
            + Create Ride
          </NavLink>
        )}

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 glass px-3 py-1 rounded-full hover:bg-white/10 transition"
          >
            <span className="text-sm font-medium">
              {user.name}
            </span>
            <span className="text-xs">▾</span>
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-44 glass rounded-xl overflow-hidden z-50">
              <button
                onClick={() => {
                  navigate("/my-rides");
                  setOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-white/10 transition"
              >
                My Rides
              </button>

              {user.role === "driver" && (
                <button
                  onClick={() => {
                    navigate("/create-ride");
                    setOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-white/10 transition"
                >
                  Create Ride
                </button>
              )}

              <div className="border-t border-white/10" />

              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 transition"
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
