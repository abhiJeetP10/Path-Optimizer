import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess("Login successful!");
        localStorage.setItem("token", response.data.authtoken);
        setFormData({ email: "", password: "" });
        navigate("/");
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setError(err.response?.data?.msg || "Invalid credentials!");
    }
  };

  return (
    <section className="text-gray-600 body-font relative min-h-screen">
      <div className="absolute inset-0 bg-gray-300">
        <iframe
          width="100%"
          height="100%"
          title="map"
          src="https://maps.google.com/maps?width=100%&amp;height=600&amp;hl=en&amp;q=%C4%B0zmir+(My%20Business%20Name)&amp;ie=UTF8&amp;t=&amp;z=14&amp;iwloc=B&amp;output=embed"
          style={{
            filter: "grayscale(1) contrast(1.2) opacity(0.4)",
          }}
        ></iframe>
      </div>

      <div className="container px-5 py-24 mx-auto flex justify-center items-center">
        <form
          onSubmit={handleSubmit}
          className="lg:w-1/3 md:w-1/2 bg-white rounded-lg p-8 flex flex-col w-full mt-10 md:mt-0 relative z-10 shadow-md"
        >
          <h2 className="text-gray-900 text-2xl mb-10 font-bold title-font flex justify-center">
            Login to your account
          </h2>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm mb-4 text-center">{success}</p>
          )}

          <div className="relative mb-4">
            <label htmlFor="email" className="leading-7 text-sm text-gray-600">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out text-md"
              required
            />
          </div>
          <div className="relative mb-4">
            <label
              htmlFor="password"
              className="leading-7 text-sm text-gray-600"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
              required
            />
          </div>
          <div className="remember flex justify-between mb-5">
            <div className="checkbox flex gap-2 items-center">
              <input
                type="checkbox"
                id="checkbox"
                name="checkbox"
                className="h-4 w-4 rounded-full"
              />
              <label
                htmlFor="remember-me"
                className="leading-7 text-sm text-gray-600"
              >
                Remember me
              </label>
            </div>
            <div className="forgotpass">
              <p className="leading-7 text-sm text-gray-600">
                Forgot Password?
              </p>
            </div>
          </div>
          <button
            type="submit"
            className="text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-sm"
          >
            Login
          </button>
        </form>
      </div>
    </section>
  );
};

export default Login;
