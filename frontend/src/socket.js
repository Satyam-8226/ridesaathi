import { io } from "socket.io-client";

let socket = null;

const getBaseUrl = () => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  return apiBase.replace(/\/api\/?$/, "") || window.location.origin;
};

export function getSocket() {
  if (socket) return socket;

  const base = getBaseUrl();

  socket = io(base, {
    autoConnect: false,
    withCredentials: true,
  });

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

  window.socket = socket;
  return socket;
}

export function connectSocketWithToken(token) {
  const s = getSocket();
  if (!token) return;

  s.auth = { token: token.trim().replace(/^"|"$/g, "") };
  if (!s.connected) s.connect();
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default getSocket;
