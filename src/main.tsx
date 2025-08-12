// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./redux/Store";
import { ToastContainer } from "react-toastify";

import "./index.css";
import { router } from "./routes/MainRoute";
import "react-toastify/dist/ReactToastify.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <ToastContainer position="top-right" autoClose={2000} />
    <RouterProvider router={router} />
  </Provider>
);
