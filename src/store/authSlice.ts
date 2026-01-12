import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  email: string;
  name: string;
  role: "Administrator" | "Manager" | "Employee" | "Client";
  isEmailVerified: boolean;
  avatarUrl?: string;
}

interface SessionInfo {
  isActive: boolean;
  idleTimeRemaining: number;
  absoluteTimeRemaining: number;
  lastActivity: number;
  createdAt: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  sessionInfo: SessionInfo | null;
  isSessionWarning: boolean;
  isCheckingSession: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  sessionId: null,
  sessionInfo: null,
  isSessionWarning: false,
  isCheckingSession: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<{
        user: User;
        sessionId: string;
        sessionInfo?: SessionInfo;
      }>
    ) => {
      state.user = action.payload.user;
      state.sessionId = action.payload.sessionId;
      state.sessionInfo = action.payload.sessionInfo || null;
      state.isAuthenticated = true;
      state.isSessionWarning = false;
    },
    updateSessionInfo: (state, action: PayloadAction<SessionInfo>) => {
      state.sessionInfo = action.payload;
      state.isSessionWarning = action.payload.idleTimeRemaining < 120000; // 2min
    },
    setCheckingSession: (state, action: PayloadAction<boolean>) => {
      state.isCheckingSession = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.sessionId = null;
      state.sessionInfo = null;
      state.isSessionWarning = false;
      state.isCheckingSession = false;
    },
  },
});

export const { setSession, updateSessionInfo, setCheckingSession, logout } =
  authSlice.actions;
export default authSlice.reducer;
