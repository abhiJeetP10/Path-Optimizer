import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SavedRoutes = () => {
  const [twRoutes, setTwRoutes] = useState([]);
  const [normalRoutes, setNormalRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const [twRes, normalRes] = await Promise.all([
        fetch("http://localhost:3000/api/routes/fetchalltwroutes", {
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }),
        fetch("http://localhost:3000/api/routes/fetchallroutes", {
          headers: {
            "Content-Type": "application/json",
            "auth-token": localStorage.getItem("token"),
          },
        }),
      ]);

      if (!twRes.ok || !normalRes.ok) throw new Error("Fetch error");

      const twData = await twRes.json();
      const normalData = await normalRes.json();

      setTwRoutes(twData);
      setNormalRoutes(normalData);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleDeleteRoute = async (id, isTW) => {
    const confirmDelete = window.confirm("Delete this route?");
    if (!confirmDelete) return;

    const url = isTW
      ? `http://localhost:3000/api/routes/deletetwroute/${id}`
      : `http://localhost:3000/api/routes/deleteroute/${id}`;

    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      });

      const result = await res.json();
      alert(result.Success);

      if (isTW) {
        setTwRoutes((prev) => prev.filter((r) => r.id !== id));
      } else {
        setNormalRoutes((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      alert("Failed to delete route.");
      console.error(error);
    }
  };

  const handleRouteClick = (locations) => {
    navigate("/route-map", { state: { locations } });
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/Login");
  };

  return (
    <>
      <header className="text-gray-600 body-font">
        <div className="container mx-auto flex flex-wrap px-5 py-5 flex-col md:flex-row items-center">
          <a
            href="/"
            className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0"
          >
            <svg
              className="w-10 h-10 text-white p-2 bg-red-500 rounded-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="ml-3 text-xl text-red-500">Path-Optimizer</span>
          </a>
          <div className="md:ml-auto flex gap-3">
            <button
              onClick={logout}
              className="text-red-500 border border-red-500 py-1 px-3 hover:bg-red-100 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="p-5 text-white">
        <h2 className="text-3xl font-bold flex justify-center mb-10">Saved Routes</h2>

        {loading ? (
          <p>Loading routes...</p>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Time-Windowed Routes */}
            <div className="w-full lg:w-1/2 bg-gray-800 p-4 rounded-lg max-h-[70vh] overflow-y-auto shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-red-400">
                Time-Windowed Routes
              </h3>
              {twRoutes.length === 0 ? (
                <p>No time-windowed routes found.</p>
              ) : (
                twRoutes.map((route, index) => (
                  <div
                    key={route.id}
                    className="mb-5 bg-gray-700 p-4 rounded-lg"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => handleRouteClick(route.locations)}
                    >
                      <h4 className="font-medium">Route {index + 1}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoute(route.id, true);
                        }}
                        className="text-red-500 text-xl"
                      >
                        🗑️
                      </button>
                    </div>
                    <table className="w-full mt-3 text-left table-auto">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-4 py-2">Customer Name</th>
                          <th className="px-4 py-2">Mobile</th>
                          <th className="px-4 py-2">Start Time</th>
                          <th className="px-4 py-2">End Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {route.locations.map((loc) => (
                          <tr
                            key={loc.id}
                            className="hover:bg-gray-500 border-b border-gray-500"
                          >
                            <td className="px-4 py-2">{loc.name}</td>
                            <td className="px-4 py-2">{loc.phoneNumber}</td>
                            <td className="px-4 py-2">{loc.startTime}</td>
                            <td className="px-4 py-2">{loc.endTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>

            {/* Non-Time-Windowed Routes */}
            <div className="w-full lg:w-1/2 bg-gray-800 p-4 rounded-lg max-h-[70vh] overflow-y-auto shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-blue-400">
                Deadline-Based Routes
              </h3>
              {normalRoutes.length === 0 ? (
                <p>No normal routes found.</p>
              ) : (
                normalRoutes.map((route, index) => (
                  <div
                    key={route.id}
                    className="mb-5 bg-gray-700 p-4 rounded-lg"
                  >
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => handleRouteClick(route.locations)}
                    >
                      <h4 className="font-medium">Route {index + 1}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRoute(route.id, false);
                        }}
                        className="text-red-500 text-xl"
                      >
                        🗑️
                      </button>
                    </div>
                    <table className="w-full mt-3 text-left table-auto">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="px-4 py-2">Customer Name</th>
                          <th className="px-4 py-2">Mobile</th>
                          <th className="px-4 py-2">Deadline</th>
                        </tr>
                      </thead>
                      <tbody>
                        {route.locations.map((loc) => (
                          <tr
                            key={loc.id}
                            className="hover:bg-gray-500 border-b border-gray-500"
                          >
                            <td className="px-4 py-2">{loc.name}</td>
                            <td className="px-4 py-2">{loc.phoneNumber}</td>
                            <td className="px-4 py-2">{loc.time || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SavedRoutes;
