import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false, // set true only if you later use httpOnly cookies
});

/* ===============================
   REQUEST INTERCEPTOR
   Attach JWT safely
================================ */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // 🚨 Guard against invalid tokens
    if (
      token &&
      typeof token === "string" &&
      token !== "undefined" &&
      token !== "null" &&
      token.trim() !== ""
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ===============================
   RESPONSE INTERCEPTOR
   Auto logout on 401
================================ */

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // prevent jwt malformed loops
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default API;
