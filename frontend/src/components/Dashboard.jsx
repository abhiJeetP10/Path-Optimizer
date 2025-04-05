import React from "react";
import Navbar from "./Navbar";
import deadline from "../assets/deadline.jpg";
import savedroute from "../assets/savedroute.jpg";
import Time from "../assets/Time.png";

const Dashboard = () => {
  return (
    <>
      <div className="navbar">
        <Navbar />
      </div>
      <div className="bg-black flex justify-center items-center">
        <section className="text-gray-600 body-font">
          <div className="container px-5 py-24 mx-auto">
            <div className="flex flex-wrap -m-4">
              {/* Card 1 */}
              <div className="p-4 md:w-1/3">
                <div className="h-full border-2 border-gray-200 border-opacity-60 rounded-lg overflow-hidden transform transition duration-300 hover:scale-105">
                <img src={Time} alt="deadline" className="lg:h-56 md:h-36 w-full object-contain object-center bg-white/95"/>
                  <div className="p-6 text-center">
                    <h2 className="tracking-widest text-xl title-font font-bold text-gray-400 mb-4">
                      Time Windows
                    </h2>
                    <p className="leading-relaxed mb-3">
                      Photo booth fam kinfolk cold-pressed sriracha leggings
                      jianbing microdosing tousled waistcoat.
                    </p>
                    <div className="flex items-center flex-wrap justify-center">
                      <a
                        className="text-red-500 inline-flex items-center md:mb-2 lg:mb-0"
                        href="/Map1"
                      >
                        Learn More
                        <svg
                          className="w-4 h-4 ml-2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-4 md:w-1/3">
                <div className="h-full border-2 border-gray-200 border-opacity-60 rounded-lg overflow-hidden transform transition duration-300 hover:scale-105">
                {/* <img
                    className="lg:h-48 md:h-36 w-full object-cover object-center"
                    src="https://dummyimage.com/722x402"
                    alt="blog"
                  /> */}
                  <img src={deadline} alt="deadline" className="lg:h-56 md:h-36 w-full object-cover object-center"/>
                  <div className="p-6 text-center">
                    <h2 className="tracking-widest text-xl title-font font-bold text-gray-400 mb-4">
                      Deadlines
                    </h2>
                    <p className="leading-relaxed mb-3">
                      Photo booth fam kinfolk cold-pressed sriracha leggings
                      jianbing microdosing tousled waistcoat.
                    </p>
                    <div className="flex items-center flex-wrap justify-center">
                      <a
                        className="text-red-500 inline-flex items-center md:mb-2 lg:mb-0"
                        href="#"
                      >
                        Learn More
                        <svg
                          className="w-4 h-4 ml-2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-4 md:w-1/3">
                <div className="h-full border-2 border-gray-200 border-opacity-60 rounded-lg overflow-hidden transform transition duration-300 hover:scale-105">
                <img src={savedroute} alt="savedroute" className="lg:h-56 md:h-36 w-full object-cover object-center"/>
                  <div className="p-6 text-center">
                    <h2 className="tracking-widest text-xl title-font font-bold text-gray-400 mb-4">
                      Saved Routes
                    </h2>
                    <p className="leading-relaxed mb-3">
                      Photo booth fam kinfolk cold-pressed sriracha leggings
                      jianbing microdosing tousled waistcoat.
                    </p>
                    <div className="flex items-center flex-wrap justify-center">
                      <a
                        className="text-red-500 inline-flex items-center md:mb-2 lg:mb-0"
                        href="/SavedRoutes"
                      >
                        Learn More
                        <svg
                          className="w-4 h-4 ml-2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14"></path>
                          <path d="M12 5l7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Dashboard;
