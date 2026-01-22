import { io } from "socket.io-client";

let socket = null;

const getBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  return apiBase.replace(/\/api\/?$/, "") || window.location.origin;
};

export function getSocket() {
  if (socket) return socket;

  const base = getBaseUrl();

  // create socket but do NOT auto-connect
  socket = io(base, {
    autoConnect: false,
    transports: ["websocket"],
  });

  // If a valid token exists in storage, attach and connect
  const token = localStorage.getItem("token");
  if (
    token &&
    typeof token === "string" &&
    token !== "undefined" &&
    token !== "null" &&
    token.trim() !== ""
  ) {
    socket.auth = { token: token.trim().replace(/^"|"$/g, "") };
    socket.connect();
  }

  return socket;
}

// Explicit connect helper (use after login)
export function connectSocketWithToken(token) {
  const s = getSocket();
  if (!token) return;
  s.auth = { token: token.trim().replace(/^"|"$/g, "") };
  if (!s.connected) s.connect();
}

// Explicit disconnect helper (use on logout)
export function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
}

export default getSocket;
