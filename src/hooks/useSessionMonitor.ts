import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  logout,
  setSessionWarning,
  updateSessionExpiry,
} from "../store/authSlice";
import api from "../lib/api";
import { useCallback, useEffect, useRef } from "react";

export function useSessionMonitor() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, sessionExpiry, isSessionWarning } = useAppSelector(
    (state) => state.auth
  );
  const checkIntervalRef = useRef<number | null>(null);
  const warningShownRef = useRef(false);

  // Check session status with server
  const checkSessionStatus = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get("/auth/session-status");
      const { isActive, idleTimeRemaining, shouldWarn } = response.data;

      if (!isActive) {
        // Session expired on server
        handleSessionExpired();
        return;
      }

      // Update expiry in Redux
      const newExpiry = Date.now() + idleTimeRemaining * 1000;
      dispatch(updateSessionExpiry(newExpiry));

      // Show warning if less than 2 minutes remaining
      if (shouldWarn && !warningShownRef.current) {
        dispatch(setSessionWarning(true));
        warningShownRef.current = true;
      } else if (!shouldWarn) {
        warningShownRef.current = false;
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        handleSessionExpired();
      }
    }
  }, [isAuthenticated, dispatch]);

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    dispatch(logout());
    dispatch(setSessionWarning(false));
    navigate("/", { replace: true });

    // Show notification
    alert("Your session has expired. Please login again.");
  }, [dispatch, navigate]);

  // Check session every 5 minutes
  useEffect(() => {
    if (!isAuthenticated) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      return;
    }

    // Initial check
    checkSessionStatus();

    // Check every 5 minutes
    checkIntervalRef.current = setInterval(() => {
      checkSessionStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isAuthenticated, checkSessionStatus]);

  // Local expiry check (backup to server check)
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) return;

    const checkLocalExpiry = setInterval(() => {
      const now = Date.now();
      const timeRemaining = sessionExpiry - now;

      // Show warning at 2 minutes
      if (
        timeRemaining <= 2 * 60 * 1000 &&
        timeRemaining > 0 &&
        !warningShownRef.current
      ) {
        dispatch(setSessionWarning(true));
        warningShownRef.current = true;
      }

      // Expired locally
      if (timeRemaining <= 0) {
        handleSessionExpired();
      }
    }, 10 * 1000); // Check every 10 seconds

    return () => clearInterval(checkLocalExpiry);
  }, [isAuthenticated, sessionExpiry, dispatch, handleSessionExpired]);

  return { isSessionWarning };
}
