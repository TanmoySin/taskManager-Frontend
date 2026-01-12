import { useAppDispatch } from "../store/hooks";
import api from "../lib/api";
import { setSession, logout } from "../store/authSlice";
import { useSessionMonitor } from "./useSessionMonitor";

export const useAuthActions = () => {
  const dispatch = useAppDispatch();
  useSessionMonitor();

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    dispatch(
      setSession({
        user: response.data.user,
        sessionId: response.data.sessionId,
      })
    );
  };

  const logoutUser = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      dispatch(logout());
    }
  };

  return { login, logout: logoutUser };
};
