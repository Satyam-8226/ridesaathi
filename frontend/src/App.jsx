import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SearchRides from "./pages/SearchRides";
import MyRides from "./pages/MyRides";
import CreateRide from "./pages/CreateRide";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./layout/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import AppLayout from "./layout/AppLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Toaster position="top-right" reverseOrder={false} />

          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes (any authenticated user) */}
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <SearchRides />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-rides"
              element={
                <ProtectedRoute>
                  <MyRides />
                </ProtectedRoute>
              }
            />

            {/* Driver-only route */}
            <Route
              path="/create-ride"
              element={
                <ProtectedRoute allowedRoles={["driver"]}>
                  <CreateRide />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
