const zod = require("zod");
const { z } = zod;

const CreateUserSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(5).max(30),
  mobile: z.string().min(10).max(15),
});

const AuthenticateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(5).max(30),
});

const TravelTimesSchema = z.object({
  locations: z.array(
    z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
  ),
  timeWindows: z.array(z.array(z.string())),
  numVehicles: z.number().positive(),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  waitTime: z.number().nonnegative(),
});

module.exports = { CreateUserSchema, AuthenticateUserSchema, TravelTimesSchema };
