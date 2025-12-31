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
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow">
      {/* Logo */}
      <Link to="/search" className="text-xl font-bold tracking-wide">
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
              className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 font-medium transition"
            >
              + Create Ride
            </NavLink>
          )}

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="flex items-center gap-2 bg-blue-500/60 px-3 py-1 rounded-full hover:bg-blue-500 transition"
            >
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs">▾</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-44 bg-white text-gray-800 rounded shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    navigate("/my-rides");
                    setOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  My Rides
                </button>

                {user.role === "driver" && (
                  <button
                    onClick={() => {
                      navigate("/create-ride");
                      setOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Create Ride
                  </button>
                )}

                <div className="border-t" />

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
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
