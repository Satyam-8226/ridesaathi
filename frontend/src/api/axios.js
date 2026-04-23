import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: false,
  timeout: 15000, // 15 second timeout
});

/* ===============================
   REQUEST INTERCEPTOR
   Attach JWT safely
================================ */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // Guard against invalid tokens
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

    // Add environment header for debugging
    if (import.meta.env.VITE_ENVIRONMENT) {
      config.headers["X-Environment"] = import.meta.env.VITE_ENVIRONMENT;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ===============================
   RESPONSE INTERCEPTOR
   Auto logout on 401 and error handling
================================ */

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on auth failure
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    // Handle network errors
    if (!error.response) {
      error.message = "Network error. Please check your connection.";
    }

    return Promise.reject(error);
  }
);

export default API;
