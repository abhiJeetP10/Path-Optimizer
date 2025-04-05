import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SavedRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [isTWRoute, setIsTWRoute] = useState(false); // Toggle for TW Routes
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // React Router's navigation hook

  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          isTWRoute
            ? "http://localhost:3000/api/routes/fetchalltwroutes"
            : "http://localhost:3000/api/routes/fetchallroutes",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "auth-token": `${localStorage.getItem("token")}`, // Include token for authentication
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch routes");
        }

        const data = await response.json();
        setRoutes(data);
      } catch (error) {
        console.error("Error fetching routes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [isTWRoute]); // Refetch routes when the toggle changes

  const handleDeleteRoute = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this route?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        isTWRoute
          ? `http://localhost:3000/api/routes/deletetwroute/${id}`
          : `http://localhost:3000/api/routes/deleteroute/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "auth-token": `${localStorage.getItem("token")}`, // Include token for authentication
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete route");
      }

      const data = await response.json();
      alert(data.Success);

      // Remove the deleted route from the state
      setRoutes((prevRoutes) => prevRoutes.filter((route) => route.id !== id));
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete the route. Please try again.");
    }
  };

  const handleRouteClick = (locations) => {
    // Navigate to the RouteMap component and pass the locations array as state
    navigate("/route-map", { state: { locations } });
  };

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h2>Saved Routes</h2>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Show Time-Windowed Routes</label>
        <input
          type="checkbox"
          checked={isTWRoute}
          onChange={() => setIsTWRoute(!isTWRoute)}
        />
      </div>

      {loading ? (
        <p>Loading routes...</p>
      ) : routes.length === 0 ? (
        <p>No routes found.</p>
      ) : (
        <div
          style={{
            maxHeight: "70vh",
            overflowY: "auto",
            backgroundColor: "#333",
            padding: "10px",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          }}
        >
          {routes.map((route, routeIndex) => (
            <div
              key={route.id}
              style={{
                marginBottom: "20px",
                padding: "10px",
                backgroundColor: "#444",
                borderRadius: "10px",
                cursor: "pointer",
              }}
              onClick={() => handleRouteClick(route.locations)} // Redirect on click
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4>Route {routeIndex + 1}</h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the route click
                    handleDeleteRoute(route.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "red",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  🗑️
                </button>
              </div>
              <ul>
                {route.locations.map((location, locationIndex) => (
                  <li
                    key={location.id}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      backgroundColor: "#555",
                      borderRadius: "5px",
                    }}
                  >
                    <strong>Customer Name:</strong> {location.name}
                    <br />
                    <strong>Mobile:</strong> {location.phoneNumber}
                    <br />
                    {isTWRoute ? (
                      <>
                        <strong>Start Time:</strong> {location.startTime}
                        <br />
                        <strong>End Time:</strong> {location.endTime}
                      </>
                    ) : (
                      <>
                        <strong>Deadline:</strong> {location.time || "N/A"}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedRoutes;