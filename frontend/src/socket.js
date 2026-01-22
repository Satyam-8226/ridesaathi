import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  if (socket) return socket;

  // derive base from VITE_API_BASE_URL by stripping '/api' if present
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const base = apiBase.replace(/\/api\/?$/, "") || window.location.origin;

  const token = localStorage.getItem("token");

  socket = io(base, {
    auth: { token },
    transports: ["websocket"],
    // optional: reconnection settings
    reconnectionAttempts: 5,
  });

  return socket;
}
