import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  StandaloneSearchBox,
  Marker,
  InfoWindow,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 60px)",
};

const Map2 = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locations, setLocations] = useState([]);
  const [activeInfo, setActiveInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    deadline: "",
  });
  const [presentTime, setPresentTime] = useState(new Date());
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const [cl, setCL] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [optimizeWayPoints, setOptimizeWaypoints] = useState(false);
  const API_KEY = "AIzaSyAH8zoNx77UvZIH0H6xmHIHeNlLlhcuD3s";
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAH8zoNx77UvZIH0H6xmHIHeNlLlhcuD3s",
    libraries: ["places"],
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(coords);
        setLocations([{ ...coords, isCurrent: true }]);
      },
      (error) => {
        console.error("Error getting location: ", error);
        const fallback = { lat: 28.6139, lng: 77.209 };
        setCurrentPosition(fallback);
        setLocations([{ ...fallback, isCurrent: true }]);
      }
    );
  }, []);

  const handleLocateClick = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentPosition(newPosition);
        if (mapRef.current) {
          mapRef.current.panTo(newPosition);
        }
      },
      (error) => {
        console.error("Error getting location: ", error);
      }
    );
  };

  const handlePlacesChanged = () => {
    const places = searchBoxRef.current.getPlaces();
    if (places?.length) {
      const location = places[0].geometry.location;
      const newPosition = {
        lat: location.lat(),
        lng: location.lng(),
      };
      setCurrentPosition(newPosition);
      if (mapRef.current) {
        mapRef.current.panTo(newPosition);
      }
    }
  };

  const handleMapClick = (e) => {
    setSelectedPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
    setFormData({ name: "", mobile: "", deadline: "" });
  };

  const handleAddLocation = () => {
    if (formData.name && formData.mobile && formData.deadline) {
      setLocations((prev) => [
        ...prev,
        {
          ...selectedPosition,
          ...formData,
          isCurrent: false,
        },
      ]);
      console.log("locations", locations);
      setSelectedPosition(null);
    } else {
      alert("Please fill in all fields.");
    }
  };

  const handleSaveRoute = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/routes/addroute",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": `${localStorage.getItem("token")}`, // Include token for authentication
          },
          body: JSON.stringify({
            locations: locations.filter((loc) => !loc.isCurrent), // Exclude the current location
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save the route");
      }

      const data = await response.json();
      alert("Route saved successfully!");
      console.log("Saved Route:", data);
    } catch (error) {
      console.error("Error saving route:", error);
      alert("Failed to save the route. Please try again.");
    }
  };

  const removeLeadingZeros = (time) => {
    return time
      .split(":")
      .map((part) => String(Number(part)))
      .join(":");
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleGetDirections = async () => {
    const latLongArray = locations.map((location) => ({
      latitude: location.lat,
      longitude: location.lng,
    }));
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const currentFormattedTime = removeLeadingZeros(getCurrentTime());
    const timeWindows = [
      [
        removeLeadingZeros(getCurrentTime()), // Current time
        "23:24", // Current time + 3 hours
      ],
      ...locations
        .slice(1)
        .map((location) => ["0:0", removeLeadingZeros(location.deadline)]),
    ];

    console.log("Latitude and Longitude Array:", latLongArray);
    console.log("Time Windows Array:", timeWindows);

    // const requestData = {
    //   locations: latLongArray,
    //   timeWindows: timeWindows,
    //   numVehicles: 1,
    //   startTime: currentFormattedTime,
    //   waitTime:5
    // };
    try {
      // Step 1: Fetch user data to get the wait time
      const userResponse = await fetch(
        "http://localhost:3000/api/auth/userdata",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: localStorage.getItem("token") }),
        }
      );

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await userResponse.json();
      const waitTime = userData.data.waitTime || 5; // Default to 5 if waitTime is not provided

      console.log("User Wait Time:", waitTime);

      // Step 2: Call the get-travel-times API with the fetched wait time
      const requestData = {
        locations: latLongArray,
        timeWindows: timeWindows,
        numVehicles: 1,
        startTime: currentFormattedTime,
        waitTime: 5, // Use the dynamically fetched wait time
      };

      const response = await fetch(
        `http://localhost:3000/helper/get-travel-times`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!data) {
        alert("Optimal path not possible. showing fastest path");
        // Use latLongArray since optimizedRoute is null
        const waypoints = latLongArray
          .slice(1) // Exclude the first point which is the origin
          .map((coordinate) => `${coordinate.latitude},${coordinate.longitude}`)
          .join("|");

        // Call Directions API for shortest path
        const origin = `${latLongArray[0].latitude},${latLongArray[0].longitude}`;
        const destination = `${latLongArray[0].latitude},${latLongArray[0].longitude}`;
        // const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${latLongArray[0].latitude},${latLongArray[0].longitude}&destination=${latLongArray[0].latitude},${latLongArray[0].longitude}&waypoints=optimize:true|${waypoints}&key=${API_KEY}`;

        try {
          const response = await fetch(
            "http://localhost:3000/helper/directions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ origin, destination, waypoints }),
            }
          );
          const data = await response.json();

          if (!data.routes || data.routes.length === 0) {
            throw new Error("No routes found in Directions API response");
          }

          // Extract optimized route from Directions API response
          const newOptimizedRoute = data.routes[0].waypoint_order.map(
            (index) => latLongArray[index + 1]
          );

          // Update optimizedRoute state with the new optimized path
          setOptimizedRoute([latLongArray[0], ...newOptimizedRoute]); // Destination set to origin
          const newarr = [latLongArray[0], ...newOptimizedRoute];
          if (optimizedRoute && optimizedRoute.length > 1) {
            const waypoints = optimizedRoute.slice(1, -1).map((point) => ({
              location: { lat: point.latitude, lng: point.longitude },
              stopover: true,
            }));

            const origin = {
              lat: optimizedRoute[0].latitude,
              lng: optimizedRoute[0].longitude,
            };

            const destination = {
              lat: optimizedRoute[optimizedRoute.length - 1].latitude,
              lng: optimizedRoute[optimizedRoute.length - 1].longitude,
            };

            const directionsService =
              new window.google.maps.DirectionsService();
            directionsService.route(
              {
                origin,
                destination,
                waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                  setDirectionsResponse(result);
                } else {
                  console.error(`Error fetching directions: ${status}`);
                }
              }
            );
          }
        } catch (error) {
          console.error("Error fetching shortest path:", error);
        }

        return;
      }
      alert("Optimal path possible. showing optimal path");
      // Map through the optimized route data
      const optimizedRouteCoordinates = data[0]
        .map((location) => {
          // Return the coordinates for the current location index
          return latLongArray[location.index];
        })
        .slice(0, -1);
      // Store the optimized route coordinates
      setOptimizedRoute(optimizedRouteCoordinates);
      if (optimizedRouteCoordinates && optimizedRouteCoordinates.length > 1) {
        const waypoints = optimizedRouteCoordinates
          .slice(1, -1)
          .map((point) => ({
            location: { lat: point.latitude, lng: point.longitude },
            stopover: true,
          }));

        const origin = {
          lat: optimizedRouteCoordinates[0].latitude,
          lng: optimizedRouteCoordinates[0].longitude,
        };

        const destination = {
          lat: optimizedRouteCoordinates[optimizedRouteCoordinates.length - 1]
            .latitude,
          lng: optimizedRouteCoordinates[optimizedRouteCoordinates.length - 1]
            .longitude,
        };

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin,
            destination,
            waypoints,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirectionsResponse(result);
              console.log(result); // Update the directionsResponse state
            } else {
              console.error(`Error fetching directions: ${status}`);
            }
          }
        );
      }
      console.log("Optimized Route:", optimizedRoute);
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Request timed out");
      } else {
        console.error("Error fetching optimized route:", error);
      }
    } finally {
      setPresentTime(new Date());
    }
  };

  return (
    <div>
      {/* Navbar */}

      <nav>
        <header className="text-gray-600 body-font">
          <div className="w-full flex flex-wrap px-10 py-5 flex-col md:flex-row items-center">
            <a
              className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0"
              href="/"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="w-10 h-10 text-white p-2 bg-red-500 rounded-full"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="ml-3 text-xl text-red-500">Path-Optimizer</span>
            </a>
            <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center">
              {/* Navigation links if needed */}
            </nav>
            <div className="flex gap-3">
              {isLoaded && (
                <div style={{ flex: 1, margin: "0 20px", width: "500px" }}>
                  <StandaloneSearchBox
                    onLoad={(ref) => (searchBoxRef.current = ref)}
                    onPlacesChanged={handlePlacesChanged}
                  >
                    <input
                      type="text"
                      placeholder="Search places..."
                      style={{
                        width: "100%",
                        padding: "10px",
                        border: "1px solid #F44336",
                        borderRadius: "5px",
                        color: "#fff",
                      }}
                    />
                  </StandaloneSearchBox>
                </div>
              )}
              <button
                onClick={handleSaveRoute}
                disabled={locations.length <= 1}
                style={{
                  padding: "10px 15px",
                  backgroundColor: locations.length > 1 ? "#000000" : "#ccc",
                  color: locations.length > 1 ? "#F44336" : "#666",
                  borderRadius: "5px",
                  cursor: locations.length > 1 ? "pointer" : "not-allowed",
                }}
                className="inline-flex items-center text-red-500 border border-red-500 py-1 px-3 focus:outline-none hover:bg-red-100 rounded text-base mt-4 md:mt-0"
              >
                Save Routes
              </button>
              <button
                onClick={handleGetDirections}
                disabled={locations.length <= 1}
                style={{
                  padding: "10px 15px",
                  backgroundColor: locations.length > 1 ? "#000000" : "#ccc",
                  color: locations.length > 1 ? "#F44336" : "#666",
                  borderRadius: "5px",
                  cursor: locations.length > 1 ? "pointer" : "not-allowed",
                }}
                className="inline-flex items-center text-red-500 border border-red-500 py-1 px-3 focus:outline-none hover:bg-red-100 rounded text-base mt-4 md:mt-0"
              >
                Get Directions
              </button>
              <button
                onClick={handleLocateClick}
                style={{
                  top: 10,
                  left: 10,
                  padding: "10px 15px",
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                  zIndex: 10,
                }}
              >
                📍 Current Location
              </button>
            </div>
          </div>
        </header>
      </nav>

      {/* Map */}
      {isLoaded && currentPosition ? (
        <div
          className="flex"
          style={{
            position: "relative",
            height: "calc(100vh - 80px)",
            width: "100%",
          }}
        >
        <div
            style={{
              width: locations.length > 1 ? "70%" : "100%",
              transition: "width 0.3s ease",
            }}
          >
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={currentPosition}
            zoom={14}
            onLoad={(map) => (mapRef.current = map)}
            onClick={handleMapClick}
          >
            {/* Render Directions */}
            {directionsResponse && (
              <DirectionsRenderer directions={directionsResponse} />
            )}
            {/* Markers */}
            {!optimizedRoute &&
              locations.map((loc, idx) => (
                <Marker
                  key={idx}
                  position={{ lat: loc.lat, lng: loc.lng }}
                  onClick={() => setActiveInfo(idx)}
                  icon={
                    loc.isCurrent
                      ? undefined
                      : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                  }
                >
                  {activeInfo === idx && (
                    <InfoWindow onCloseClick={() => setActiveInfo(null)}>
                      <div>
                        {loc.isCurrent ? (
                          <b>Current Location</b>
                        ) : (
                          <>
                            <div>{loc.name}</div>
                          </>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </Marker>
              ))}

            {/* New Marker + Carousel */}
            {selectedPosition && <Marker position={selectedPosition} />}
          </GoogleMap>

          {/* Carousel-style Form */}
          {/* Carousel-style Form */}
          {selectedPosition && (
            <div
              style={{
                  position: "absolute",
                  bottom: "20px", // slightly below navbar
                  left: "10px", // left side
                  backgroundColor: "black",
                  color: "wheat",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  width: "300px",
                  zIndex: 9999,
              }}
            >
              <h4 className="mx-auto flex justify-center text-xl underline underline-offset-2 mb-4">Add Location</h4>
              <input
                type="text"
                placeholder="Customer Name"
                className="flex text-center border rounded-md"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              />
              <input
                type="text"
                placeholder="Mobile Number"
                className="flex text-center border rounded-md"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                style={{ marginBottom: 10, width: "100%", padding: 8}}
              />
              <input
                type="time"
                placeholder="Deadline"
                className="w-full flex justify-center border rounded-md py-2 mb-3"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value , cursor:"pointer"})
                }
                onClick={(e)=> e.target.showPicker()}
              />

              <button
                onClick={handleAddLocation}
                className="bg-red-500"
                  style={{
                    width: "100%",
                    padding: "10px",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    marginBottom: "10px",
                  }}
              >
                Add Location
              </button>
              <button
                onClick={() => setSelectedPosition(null)}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#ccc",
                  color: "#333",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
          </div>

          {/* Sidebar over Map */}
          {/* Sidebar over Map */}
          {locations.length > 1 && (
            <div
              style={{
                width: "30%",
                maxHeight: "100%",
                overflowY: "auto",
                backgroundColor: "black",
                color: "white",
                borderLeft: "1px solid #ddd",
                boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
                padding: "15px",
                zIndex: 10,
              }}
            >
              <h4 className="mx-2 my-2 text-2xl font-semibold text-center underline underline-offset-2">{directionsResponse ? "Directions" : "Customers"}</h4>
              {directionsResponse ? (
                // Show textual directions
                <div className="mx-2 my-2">
                  {directionsResponse.routes[0].legs.map((leg, legIndex) => (
                    <div key={legIndex} style={{ marginBottom: "10px" }}>
                      <div className="border py-2 px-2">
                      <div className="">
                      <div className="text-lg pb-1">Path:- {legIndex+1}</div>
                        <strong>From:</strong> <br /> {leg.start_address}
                        <br />
                      </div>
                      <div className="py-2">
                        <strong>To:</strong>
                        <br /> {leg.end_address}
                        <br />
                      </div>
                      <ul style={{ marginTop: "5px" }}>
                        {leg.steps.map((step, stepIndex) => (
                          <li
                            key={stepIndex}
                            dangerouslySetInnerHTML={{
                              __html: step.instructions,
                            }}
                            style={{ fontSize: "14px", marginBottom: "5px" }}
                            className="text-stone-200"
                          ></li>
                        ))}
                      </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Show added customers
                locations
                  .filter((loc) => !loc.isCurrent)
                  .map((loc, idx) => (
                    <div
                      key={idx}
                      style={{
                        borderBottom: "1px solid #ddd",
                        marginBottom: "8px",
                        paddingBottom: "4px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div className="text-lg mx-2 mt-5 mb-3">
                          <span className="font-semibold">Name:-</span>{" "}
                          {loc.name}
                        </div>
                        <div className="text-md mx-2 mt-3 mb-3">
                          <span className="font-semibold">Time:-</span>{" "}
                          {loc.deadline}
                        </div>
                        <div className="text-md mx-2 mt-3 mb-3">
                          <span className="font-semibold">Mobile No:- </span>
                          {loc.mobile}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const updated = locations.filter(
                            (_, i) => i !== idx + 1
                          ); // +1 to skip current location
                          setLocations(updated);
                        }}
                        style={{
                          border: "none",
                          background: "none",
                          color: "red",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      ) : (
        <p style={{ padding: "20px" }}>Loading Map...</p>
      )}
    </div>
  );
};

export default Map2;
