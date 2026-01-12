import axios from "axios";
import { store } from "../store/store";
import { logout, setCheckingSession } from "../store/authSlice";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// ✅ UPLOAD API (Enhanced)
export const uploadApi = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Common 401 handler
const handle401Error = async (error: any) => {
  if (error.response?.status === 401) {
    store.dispatch(logout());
    if (
      !window.location.pathname.includes("/login") &&
      window.location.pathname !== "/"
    ) {
      window.location.href = "/";
    }
  }
  return Promise.reject(error);
};

[api, uploadApi].forEach((instance) => {
  instance.interceptors.request.use(
    (config) => {
      store.dispatch(setCheckingSession(false));
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use((response) => {
    const _sessionWarning = response.headers["x-session-warning"];
    if (_sessionWarning === "true") {
      console.warn("⚠️ Session expiring soon");
    }
    return response;
  }, handle401Error);
});

export default api;
