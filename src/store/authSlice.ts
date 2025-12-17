import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  email: string;
  name: string;
  role: "Administrator" | "Manager" | "Employee" | "Client";
  isEmailVerified: boolean;
  avatarUrl?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  sessionExpiry: number | null;
  lastActivity: number | null;
  isSessionWarning: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  sessionId: null,
  sessionExpiry: null,
  lastActivity: null,
  isSessionWarning: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User; sessionId?: string }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.sessionId = action.payload.sessionId || null;
      state.lastActivity = Date.now();
      state.sessionExpiry = Date.now() + 30 * 60 * 1000;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    // Update session activity
    updateSessionActivity: (state) => {
      state.lastActivity = Date.now();
      state.sessionExpiry = Date.now() + 30 * 60 * 1000;
      state.isSessionWarning = false;
    },
    // Show session warning
    setSessionWarning: (state, action: PayloadAction<boolean>) => {
      state.isSessionWarning = action.payload;
    },
    // Update session expiry from server
    updateSessionExpiry: (state, action: PayloadAction<number>) => {
      state.sessionExpiry = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.sessionId = null;
      state.sessionExpiry = null;
      state.lastActivity = null;
      state.isSessionWarning = false;
    },
  },
});

export const {
  setCredentials,
  updateUser,
  updateSessionActivity,
  setSessionWarning,
  updateSessionExpiry,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
