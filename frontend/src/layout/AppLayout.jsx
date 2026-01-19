import Navbar from "../components/Navbar";
import { useContext } from "react";
import { AuthContext } from "../auth/AuthContext";

export default function AppLayout({ children }) {
  const { user } = useContext(AuthContext);

  return (
        <div
            className="min-h-screen text-slate-100"
    style={{
            backgroundImage:
                "linear-gradient(rgba(2,6,23,0.75), rgba(2,6,23,0.85)), url('https://images.unsplash.com/photo-1557683316-973673baf926')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            }}
        >
            {/* Ambient glow for depth  */}
            <div className="absolute inset-0 -z-10">
            <div className="absolute top-32 left-1/2 -translate-x-1/2 
                w-175 h-100 
                bg-indigo-500/15 blur-3xl rounded-full
                animate-glow" />
            </div>

            {user && <Navbar />}

            <main className="relative max-w-6xl mx-auto px-4 py-6">
            {children}
            </main>
        </div>
    );
}
