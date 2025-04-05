import React from "react";

const Login = () => {
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
        <div className="lg:w-1/3 md:w-1/2 bg-white rounded-lg p-8 flex flex-col w-full mt-10 md:mt-0 relative z-10 shadow-md">
          <h2 className="text-gray-900 text-2xl mb-10 font-bold title-font flex justify-center">
            Login to your account
          </h2>
          {/* <p className="leading-relaxed mb-5 text-gray-600 flex justify-center text-md">
             Hello, Welcome back to your account
          </p> */}
          <div className="relative mb-4">
            <label htmlFor="email" className="leading-7 text-sm text-gray-600">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out text-md"
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
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
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
          <button className="text-white bg-red-500 border-0 py-2 px-6 focus:outline-none hover:bg-red-600 rounded text-sm">
            Login
          </button>
          {/* <p>New User</p> */}
          {/* <p className="text-xs text-gray-500 mt-5 flex justify-center">
            Or SignUp with
          </p>
          <div className="auth-with-g flex justify-between my-5">
            <div className="facebook">facebook</div>
            <div className="google">Google</div>
            <div className="apple">Apple</div>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default Login;
