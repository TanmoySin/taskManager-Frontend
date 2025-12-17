import axios from "axios";
import { store } from "../store/store";
import { logout, updateSessionActivity } from "../store/authSlice";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Send cookies with requests
});

// ✅ REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;

    // Add Authorization header (backward compatibility)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Update session activity on every request
    store.dispatch(updateSessionActivity());

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR (Enhanced)
api.interceptors.response.use(
  (response) => {
    // ✅ Check for session warning header
    const sessionWarning = response.headers["x-session-warning"];
    const expiresIn = response.headers["x-session-expires-in"];

    if (sessionWarning === "true") {
      console.warn("⚠️ Session expiring soon:", expiresIn, "ms");
      // Show warning modal (handled by useSessionMonitor hook)
    }

    return response;
  },
  (error) => {
    // ✅ Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.error;

      console.error("❌ 401 Unauthorized:", errorCode);

      // Clear auth state
      store.dispatch(logout());

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to login (only if not already there)
      if (
        !window.location.pathname.includes("/login") &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

// ✅ UPLOAD API (Enhanced)
export const uploadApi = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "multipart/form-data" },
  withCredentials: true,
});

// Add same interceptors to uploadApi
[api, uploadApi].forEach((instance) => {
  instance.interceptors.request.use(
    (config) => {
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      store.dispatch(updateSessionActivity());
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        store.dispatch(logout());
        localStorage.clear();
        sessionStorage.clear();
        if (
          !window.location.pathname.includes("/login") &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/";
        }
      }
      return Promise.reject(error);
    }
  );
});

export default api;
