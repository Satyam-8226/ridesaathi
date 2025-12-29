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

const Layout = ({ children }) => {
  const { user } = useContext(AuthContext);
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
        <Layout>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchRides />} />
            <Route path="/my-rides" element={<MyRides />} />
            <Route path="/create-ride" element={<CreateRide />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
