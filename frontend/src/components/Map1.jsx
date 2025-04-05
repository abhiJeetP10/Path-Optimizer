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

const Map1 = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locations, setLocations] = useState([]);
  const [activeInfo, setActiveInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    startTime: "",
    endTime: "",
  });
  const [presentTime, setPresentTime] = useState(new Date());
  const [directionsResponse, setDirectionsResponse] = useState(null);

  const [cl, setCL] = useState(null);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [optimizeWayPoints,setOptimizeWaypoints]=useState(false);
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
    setFormData({ name: "", mobile: "", startTime: "", endTime: "" });
  };

  const handleAddLocation = () => {
    if (formData.name && formData.mobile && formData.startTime && formData.endTime) {
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

  const removeLeadingZeros = (time) => {
    return time.split(":").map((part) => String(Number(part))).join(":");
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
      ...locations.slice(1).map((location) => [
        removeLeadingZeros(location.startTime),
        removeLeadingZeros(location.endTime),
      ]),
    ];

    console.log("Latitude and Longitude Array:", latLongArray);
    console.log("Time Windows Array:", timeWindows);

    const requestData = {
      locations: latLongArray,
      timeWindows: timeWindows,
      numVehicles: 1,
      startTime: currentFormattedTime,
      waitTime:5
    };
    try {
      const response = await fetch(`http://localhost:3000/helper/get-travel-times`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,

      });
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
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${latLongArray[0].latitude},${latLongArray[0].longitude}&destination=${latLongArray[0].latitude},${latLongArray[0].longitude}&waypoints=optimize:true|${waypoints}&key=${API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                throw new Error("No routes found in Directions API response");
            }

            // Extract optimized route from Directions API response
            const newOptimizedRoute = data.routes[0].waypoint_order.map(index => latLongArray[index + 1]);

            // Update optimizedRoute state with the new optimized path
            setOptimizedRoute([latLongArray[0], ...newOptimizedRoute]); // Destination set to origin
            const newarr=[latLongArray[0], ...newOptimizedRoute];
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
                  } else {
                    console.error(`Error fetching directions: ${status}`);
                  }
                }
              );
            }

        } catch (error) {
            console.error("Error fetching shortest path:", error);
      
        }

        return ;
    } 
  (alert("Optimal path possible. showing optimal path"));
// Map through the optimized route data
const optimizedRouteCoordinates = data[0]
  .map((location) => {
   
    // Return the coordinates for the current location index
    return latLongArray[location.index];
  })
  .slice(0, -1);
      // Store the optimized route coordinates
      setOptimizedRoute(optimizedRouteCoordinates);
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
            } else {
              console.error(`Error fetching directions: ${status}`);
            }
          }
        );
      }
      console.log("Optimized Route:", optimizedRoute);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out');
        
      } else {
        console.error("Error fetching optimized route:", error);
        
      }
    }finally{
      setPresentTime(new Date());

    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav
  style={{
    height: "60px",
    backgroundColor: "#1976d2",
    color: "white",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    fontSize: "20px",
    justifyContent: "space-between",
  }}
>
  <div>Route Optimizer</div>

  {isLoaded && (
    <div style={{ flex: 1, margin: "0 20px" }}>
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
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
      </StandaloneSearchBox>
    </div>
  )}

  <button
    disabled={locations.length <= 1}
    style={{
      padding: "10px 15px",
      backgroundColor: locations.length > 1 ? "#fff" : "#ccc",
      color: locations.length > 1 ? "#1976d2" : "#666",
      border: "none",
      borderRadius: "5px",
      cursor: locations.length > 1 ? "pointer" : "not-allowed",
      fontWeight: "bold",
    }}
    onClick={handleGetDirections}
  >
    Get Directions
  </button>
</nav>

      {/* Map */}
      {isLoaded && currentPosition ? (
        <div style={{ position: "relative" }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
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
            {!optimizedRoute && locations.map((loc, idx) => (
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
                    <div >
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
            {selectedPosition && (
              <Marker position={selectedPosition} />
            )}
          </GoogleMap>

          {/* Carousel-style Form */}
          {/* Carousel-style Form */}
          {selectedPosition && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
                width: "300px",
                zIndex: 10,
              }}
            >
              <h4>Add Location</h4>
              <input
                type="text"
                placeholder="Customer Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              />
              <input
                type="text"
                placeholder="Mobile Number"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                style={{ marginBottom: 10, width: "100%", padding: 8 }}
              />
              <input
                type="time"
                placeholder="Start Time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
              <input
                type="time"
                placeholder="End Time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
              <button
                onClick={handleAddLocation}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#1976d2",
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

          {/* Current Location Button */}
          <button
            onClick={handleLocateClick}
            style={{
              position: "absolute",
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

          {/* Sidebar over Map */}
{locations.length > 1 && (
  <div
    style={{
      position: "absolute",
      top: 80,
      right: 20,
      width: "250px",
      maxHeight: "70vh",
      overflowY: "auto",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      padding: "10px",
      zIndex: 10,
    }}
  >
    <h4>Customers</h4>
    {locations
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
            <div><strong>{loc.name}</strong></div>
            <div style={{ fontSize: "12px" }}>{loc.mobile}</div>
          </div>
          <button
            onClick={() => {
              const updated = locations.filter((_, i) => i !== idx + 1); // +1 to skip current location
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
      ))}
  </div>
)}

        </div>
      ) : (
        <p style={{ padding: "20px" }}>Loading Map...</p>
      )}
    </div>
  );
};

export default Map1;
