import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../redux/features/authApi";
import { useDispatch } from "react-redux";
import { setUser } from "../../../redux/features/userSlice";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userData = await login(formData).unwrap();
      dispatch(setUser(userData)); // save user in redux store
      navigate("/"); // redirect to home page
    } catch (err) {
      if (err?.data?.message) {
        setError(err.data.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
        noValidate
      >
        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          Facebook
        </h2>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email address or phone number"
          required
          className="w-full mb-4 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <input
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          placeholder="Password"
          required
          className="w-full mb-6 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 mb-4 text-white font-semibold rounded ${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } transition duration-200`}
        >
          {isLoading ? "Logging in..." : "Log In"}
        </button>

        <div className="text-center">
          <a
            href="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Create New Account
          </a>
        </div>
      </form>
    </div>
  );
}

export default Login;
