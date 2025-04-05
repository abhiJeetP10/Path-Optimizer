require("dotenv").config();
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { TravelTimesSchema } = require("../types/index");

router.post("/get-travel-times", async (req, res) => {
  if (!TravelTimesSchema.safeParse(req.body).success) {
    console.error("Invalid input format");
    return res.status(400).json({ error: "Invalid input format" });
  }
  const { locations, timeWindows, numVehicles, startTime, waitTime } = req.body;
  console.log("Request Body:", req.body);

  if (
    !locations ||
    !Array.isArray(locations) ||
    !timeWindows ||
    !Array.isArray(timeWindows)
  ) {
    console.error("Invalid input format");
    return res.status(400).json({ error: "Invalid input format" });
  }

  try {
    const travelTimes = await getTravelTimes(locations);
    const finalTimeWindows = getTimeDifference(timeWindows, startTime);

    if (!travelTimes || !finalTimeWindows) {
      throw new Error("Failed to process travel times or time windows");
    }

    console.log("Travel Times:", travelTimes);
    console.log("Final Time Windows:", finalTimeWindows);

    const result = await sendToPython(
      travelTimes,
      finalTimeWindows,
      numVehicles,
      waitTime
    );
    res.json(result);
  } catch (error) {
    console.error("Error in processing:", error);
    res.status(500).json({ error: error.message });
  }
});

async function getTravelTimes(locations) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const maxElements = 100;
  const numLocations = locations.length;
  const travelTimes = Array(numLocations)
    .fill(null)
    .map(() => Array(numLocations).fill(null));

  // Helper function to create batches
  // const createBatches = (locations, maxBatchSize) => {
  //   const batches = [];
  //   for (let i = 0; i < locations.length; i += maxBatchSize) {
  //     batches.push(locations.slice(i, i + maxBatchSize));
  //   }
  //   return batches;
  // };
  const createBatches = (locations, maxBatchSize) =>
    Array.from({ length: Math.ceil(locations.length / maxBatchSize) }, (_, i) =>
      locations.slice(i * maxBatchSize, i * maxBatchSize + maxBatchSize)
    );

  // Calculate the maximum batch size for origins and destinations to stay within the maxElements limit
  const maxBatchSize = Math.floor(Math.sqrt(maxElements));

  // Generate batches of locations
  const originBatches = createBatches(locations, maxBatchSize);
  const destinationBatches = createBatches(locations, maxBatchSize);

  // Fetch travel times for each combination of origin and destination batches
  for (const originBatch of originBatches) {
    for (const destinationBatch of destinationBatches) {
      const origins = originBatch
        .map((loc) => `${loc.latitude},${loc.longitude}`)
        .join("|");
      const destinations = destinationBatch
        .map((loc) => `${loc.latitude},${loc.longitude}`)
        .join("|");

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${apiKey}`;

      try {
        const response = await axios.get(url, { timeout: 10000 });

        if (response.data.status !== "OK") {
          console.error("Google Maps API Error:", response.data);
          throw new Error("Error fetching data from Google Maps API");
        }

        // Populate the travelTimes matrix
        originBatch.forEach((origin, i) => {
          response.data.rows[i].elements.forEach((element, j) => {
            travelTimes[locations.indexOf(origin)][
              locations.indexOf(destinationBatch[j])
            ] = element.duration.value / 3600; // Convert seconds to hours
          });
        });
      } catch (error) {
        console.error(
          "Error fetching travel times:",
          error.response?.data || error.message
        );
        throw error;
      }
    }
  }

  return travelTimes;
}

function getTimeDifference(timeWindows, startTime) {
  try {
    const startTimeinHours = timeToHours(startTime);
    for (let i = 0; i < timeWindows.length; i++) {
      try {
        timeWindows[i][0] = timeToHours(timeWindows[i][0]) - startTimeinHours;
        timeWindows[i][1] = timeToHours(timeWindows[i][1]) - startTimeinHours;
      } catch (error) {
        console.error("Error converting time:", error);
        return null;
      }
    }
    return timeWindows;
  } catch (error) {
    console.error("Error in getTimeDifference:", error);
    return null;
  }
}

function timeToHours(time) {
  let [hours, minutes] = time.split(":").map(Number);

  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours >= 24 ||
    minutes < 0 ||
    minutes >= 60
  ) {
    throw new Error("Invalid time format");
  }

  return hours + minutes / 60;
}

async function sendToPython(timeMatrix, timeWindows, numVehicles, waitTime) {
  console.log("Time Matrix Size:", timeMatrix.length);
  console.log("Time Windows Size:", timeWindows.length);
  console.log("Number of Vehicles:", numVehicles);

  try {
    const response = await axios.post(
      `${process.env.PYTHON_URL}/solve-vrp`,
      {
        time_matrix: timeMatrix,
        time_windows: timeWindows,
        num_vehicles: numVehicles,
        waiting_time: waitTime,
      },
      { timeout: 30000 }
    ); // 30 seconds timeout

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending data to Python:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = router;
