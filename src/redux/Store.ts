// src/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import { messagingApi } from "./features/messagingApi";
import userReducer from "./features/userSlice";
import "./features/followApi"; // Import followApi to register endpoints

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [messagingApi.reducerPath]: messagingApi.reducer,
    user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, messagingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
