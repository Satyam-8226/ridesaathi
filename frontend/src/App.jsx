import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchRides from "./pages/SearchRides";
import MyRides from "./pages/MyRides";
import CreateRide from "./pages/CreateRide";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./auth/AuthContext";
import { useContext } from "react";
import { AuthContext } from "./auth/AuthContext";
import ProtectedRoute from "./layout/ProtectedRoute";
import { Toaster } from "react-hot-toast";

const Layout = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // or spinner

  return (
    <>
      {user && <Navbar />}
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" reverseOrder={false} />
        <Layout>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchRides />} />
            <Route path="/my-rides" element={<MyRides />} />
            <Route
              path="/create-ride"
              element={
                <ProtectedRoute role="driver">
                  <CreateRide />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}


export default App;
