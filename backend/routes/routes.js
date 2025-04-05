require("dotenv").config();
const express = require("express");
const router = express.Router();
const PrismaClient = require("../prismaClient");
const prisma = new PrismaClient();
var fetchuser = require("../middleware/fetchuser");
const { body, validationResult } = require("express-validator");
const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACC_SID;
const authToken = process.env.TWILIO_ATUH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PH;

const client = twilio(accountSid, authToken);

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

// Route 2: Add route in DB
router.post("/addroute", fetchuser, async (req, res) => {
  try {
    const { locations } = req.body;

    const newRoute = await prisma.route.create({
      data: {
        locations,
        userId: req.user.id,
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
      data: { locations: newLocations },
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
      });

      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }

      const updatedLocations = route.locations.filter(
        (customer) => customer.id !== customerId
      );

      const updatedRoute = await prisma.route.update({
        where: { id: routeId },
        data: { locations: updatedLocations },
      });

      res
        .status(200)
        .json({ message: "Customer deleted successfully", updatedRoute });
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
    });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    const updatedLocations = route.locations.map((customer) => {
      if (customer.id === customerId) {
        return { ...customer, time: newTime };
      }
      return customer;
    });

    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: { locations: updatedLocations },
    });

    res
      .status(200)
      .json({ message: "Customer time updated successfully", updatedRoute });
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
        const newRoute = await prisma.twRoute.create({
            data: {
                locations,
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
        const routes = await prisma.twRoute.findMany({
            where: { userId: req.user.id },
        });
        res.json(routes);
    } catch (err) {
        console.log(err.message);
        res.status(500).send("Internal Server error");
    }
});

router.delete("/deletetwroute/:id", fetchuser, async (req, res) => {
    try {
        const route = await prisma.twRoute.findUnique({
            where: { id: req.params.id },
        });

        if (!route) {
            return res.status(404).send("Not found");
        }

        if (route.userId !== req.user.id) {
            return res.status(401).send("Not allowed");
        }

        await prisma.twRoute.delete({
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
            const route = await prisma.twRoute.findUnique({
                where: { id: routeId },
            });

            if (!route) {
                return res.status(404).json({ message: "Route not found" });
            }

            // Filter out the customer from the route's locations array
            const updatedLocations = route.locations.filter(
                (customer) => customer.id !== customerId
            );

            // Update the route with the new locations array
            const updatedRoute = await prisma.twRoute.update({
                where: { id: routeId },
                data: { locations: updatedLocations },
            });

            res
                .status(200)
                .json({ message: "Customer deleted successfully", updatedRoute });
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
            const route = await prisma.twRoute.findUnique({
                where: { id: routeId },
            });

            if (!route) {
                return res.status(404).json({ message: "Route not found" });
            }

            const updatedLocations = route.locations.map((customer) => {
                if (customer.id === customerId) {
                    return {
                        ...customer,
                        startTime: newStartTime,
                        endTime: newEndTime,
                    };
                }
                return customer;
            });

            const updatedRoute = await prisma.twRoute.update({
                where: { id: routeId },
                data: { locations: updatedLocations },
            });

            res
                .status(200)
                .json({ message: "Customer time updated successfully", updatedRoute });
        } catch (error) {
            console.error("Error updating customer time:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
);

router.put("/updatetwroute/:id", fetchuser, async (req, res) => {
    const { id } = req.params; // ID of the route
    const { newLocations } = req.body; // New locations array to replace

    try {
        const route = await prisma.twRoute.update({
            where: { id },
            data: { locations: newLocations },
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
