// src/redux/features/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  id: number | null;
  username: string;
  email: string | null;
  isAuthenticated: boolean;
  profile?: {
    displayName?: string;
    avatar?: {
      url: string;
    };
  };
}

const initialState: UserState = {
  id: null,
  username: "",
  email: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(
      state,
      action: PayloadAction<{
        id: number;
        username: string;
        email: string;
        profile?: {
          displayName?: string;
          avatar?: {
            url: string;
          };
        };
      }>
    ) {
      state.id = action.payload.id;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.profile = action.payload.profile;
      state.isAuthenticated = true;
    },
    clearUser(state) {
      state.id = null;
      state.username = "";
      state.email = null;
      state.profile = undefined;
      state.isAuthenticated = false;
      // Clear token from localStorage
      localStorage.removeItem("access_token");
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
