import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import api from "../lib/api";
import {
  updateSessionInfo,
  logout,
  setCheckingSession,
} from "../store/authSlice";

export const useSessionMonitor = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, sessionId } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated || !sessionId) return;

    const checkSession = async () => {
      try {
        dispatch(setCheckingSession(true));
        const response = await api.get("/auth/session-status");
        dispatch(updateSessionInfo(response.data));
      } catch (error) {
        dispatch(logout());
      } finally {
        dispatch(setCheckingSession(false));
      }
    };

    checkSession(); // Initial check

    const interval = setInterval(checkSession, 30000); // 30s
    return () => clearInterval(interval);
  }, [dispatch, isAuthenticated, sessionId]);
};
