import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
      {/* Logo */}
      <Link to="/search" className="text-xl font-bold">
        RideSaathi
      </Link>

      {/* Links */}
      {user && (
        <div className="flex items-center gap-6">
          <Link to="/search" className="hover:underline">
            Search Rides
          </Link>

          <Link to="/my-rides" className="hover:underline">
            My Rides
          </Link>

          {user.role === "driver" && (
            <Link to="/create-ride" className="hover:underline">
              Create Ride
            </Link>
          )}

          <span className="text-sm opacity-90">
            {user.name}
          </span>

          <button
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
