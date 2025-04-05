// require("dotenv").config();
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
var fetchuser = require("../middleware/fetchuser");
const twilio = require("twilio");

// const accountSid = process.env.TWILIO_ACC_SID;
// const authToken = process.env.TWILIO_ATUH_TOKEN;
// const twilioPhoneNumber = process.env.TWILIO_PH;

// const client = twilio(accountSid, authToken);

// Route 1 : Get all the routes using GET "/api/notes/fetchallnotes".Login required.
router.get("/fetchallroutes", fetchuser, async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: { userId: req.user.id },
      include: { locations: true },
    });
    res.json(routes);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server error");
  }
});

// Route 2: Add route in DB
router.post("/addroute", fetchuser, async (req, res) => {
  try {
    const { locations } = req.body;

    const newRoute = await prisma.route.create({
      data: {
        userId: req.user.id,
        locations: {
          create: locations.map((location) => ({
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            time: location.deadline,
          })),
        },
      },
      include: {
        locations: true,
      },
    });

    res.status(201).json(newRoute);
  } catch (error) {
    console.error("Error adding new route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route 3: Delete a Route By Id
router.delete("/deleteroute/:id", fetchuser, async (req, res) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: req.params.id },
    });

    if (!route) {
      return res.status(404).send("Not found");
    }

    if (route.userId !== req.user.id) {
      return res.status(401).send("Not allowed");
    }

    await prisma.route.delete({
      where: { id: req.params.id },
    });

    res.json({ Success: "Route has been deleted", route });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server error");
  }
});

// Route 4 : Update Route by Adding a new Place
router.put("/updateroute/:id", fetchuser, async (req, res) => {
  const { id } = req.params; // ID of the route
  const { newLocations } = req.body; // New locations array to replace

  try {
    const route = await prisma.route.update({
      where: { id },
      data: {
        locations: {
          create: newLocations.map((newLocation) => ({
            name: newLocation.name,
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          })),
        },
      },
    });

    res.status(200).json({ message: "Route updated successfully", route });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route 5: Delete a customer from a route
router.delete(
  "/deletecustomer/:routeId/:customerId",
  fetchuser,
  async (req, res) => {
    const { routeId, customerId } = req.params;

    try {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: { locations: true },
      });

      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }

      const customerExists = route.locations.some(
        (customer) => customer.id === customerId
      );

      if (!customerExists) {
        return res
          .status(404)
          .json({ message: "Customer not found in this route" });
      }

      await prisma.location.delete({
        where: { id: customerId },
      });

      res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Route 6: Update the time of a customer in a route
router.put("/updatetime/:routeId/:customerId", fetchuser, async (req, res) => {
  const { routeId, customerId } = req.params;
  const { newTime } = req.body;

  try {
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: { locations: true },
    });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const customerExists = route.locations.some(
      (customer) => customer.id === customerId
    );

    if (!customerExists) {
      return res
        .status(404)
        .json({ message: "Customer not found in this route" });
    }

    await prisma.location.update({
      where: { id: customerId },
      data: { time: newTime },
    });

    res.status(200).json({ message: "Customer time updated successfully" });
  } catch (error) {
    console.error("Error updating customer time:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/send-sms", async (req, res) => {
  const { to, message } = req.body;

  try {
    // Send SMS using Twilio
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to,
    });

    console.log("SMS sent successfully:", result.sid);
    res.json({ success: true, message: "SMS sent successfully" });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(500).json({ success: false, error: "Failed to send SMS" });
  }
});

router.post("/addtwroute", fetchuser, async (req, res) => {
  try {
    // Extract route data from the request body
    const { locations } = req.body;

    // Create a new route in the database using Prisma
    const newRoute = await prisma.tWRoute.create({
      data: {
        locations: {
          create: locations.map((location) => ({
            name: location.name,
            latitude: location.lat,
            longitude: location.lng,
            startTime: location.startTime,
            endTime: location.endTime,
            phoneNumber: location.mobile,
          })),
        },
        userId: req.user.id,
      },
    });

    // Send the saved route as a response
    res.status(201).json(newRoute);
  } catch (error) {
    // Handle errors
    console.error("Error adding new route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/fetchalltwroutes", fetchuser, async (req, res) => {
  try {
    const routes = await prisma.tWRoute.findMany({
      where: { userId: req.user.id },
      include: { locations: true },
    });
    res.json(routes);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server error");
  }
});

router.delete("/deletetwroute/:id", fetchuser, async (req, res) => {
  try {
    const route = await prisma.tWRoute.findUnique({
      where: { id: req.params.id },
    });

    if (!route) {
      return res.status(404).send("Not found");
    }

    if (route.userId !== req.user.id) {
      return res.status(401).send("Not allowed");
    }

    await prisma.tWRoute.delete({
      where: { id: req.params.id },
    });

    res.json({ Success: "Route has been deleted", route });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server error");
  }
});

router.delete(
  "/deletetwcustomer/:routeId/:customerId",
  fetchuser,
  async (req, res) => {
    const { routeId, customerId } = req.params;

    try {
      // Find the route by ID
      const route = await prisma.tWRoute.findUnique({
        where: { id: routeId },
        include: { locations: true },
      });

      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }

      const customerExists = route.locations.some(
        (customer) => customer.id === customerId
      );

      if (!customerExists) {
        return res
          .status(404)
          .json({ message: "Customer not found in this route" });
      }

      // Delete the customer from the locations relation
      await prisma.tWLocation.delete({
        where: { id: customerId },
      });

      res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.put(
  "/updatetwtime/:routeId/:customerId",
  fetchuser,
  async (req, res) => {
    const { routeId, customerId } = req.params;
    const { newStartTime, newEndTime } = req.body;

    try {
      const route = await prisma.tWRoute.findUnique({
        where: { id: routeId },
        include: { locations: true },
      });

      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }

      const customerExists = route.locations.some(
        (customer) => customer.id === customerId
      );

      if (!customerExists) {
        return res
          .status(404)
          .json({ message: "Customer not found in this route" });
      }

      await prisma.tWLocation.update({
        where: { id: customerId },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
        },
      });

      res.status(200).json({ message: "Customer time updated successfully" });
    } catch (error) {
      console.error("Error updating customer time:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

router.put("/updatetwroute/:id", fetchuser, async (req, res) => {
  const { id } = req.params;
  const { newLocations } = req.body;

  try {
    // Update the route with nested updates for locations
    const route = await prisma.tWRoute.update({
      where: { id },
      data: {
        locations: {
          deleteMany: {}, // Delete all existing locations for this route
          create: newLocations.map((location) => ({
            name: location.name,
            latitude: location.lat,
            longitude: location.lng,
            startTime: location.startTime,
            endTime: location.endTime,
            phoneNumber: location.mobile,
          })),
        },
      },
      include: { locations: true },
    });

    res.status(200).json({ message: "Route updated successfully", route });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Deadline Routes

// Route 1 : Get all the routes using GET "/api/notes/fetchallnotes".Login required.
router.get("/fetchallroutes", fetchuser, async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: { userId: req.user.id },
    });
    res.json(routes);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server error");
  }
});

module.exports = router;
