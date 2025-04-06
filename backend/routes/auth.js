require("dotenv").config();
const express = require("express");
const router = express.Router();
const {
  CreateUserSchema,
  AuthenticateUserSchema,
  UpdateUserSchema,
  ResetPasswordSchema,
  UpdatePasswordSchema,
} = require("../types/index");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var fetchuser = require("../middleware/fetchuser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const zxcvbn = require("zxcvbn");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

// ROUTE 1 : Create a User using: POST "/api/auth/createuser". No login required
router.post(
  "/createuser",
  // [
  //   body("name", "Enter a valid name").isLength({ min: 3 }),
  //   body("email", "Enter a valid email").isEmail(),
  //   body("password", "Password must be at least 5 characters").isLength({
  //     min: 5,
  //   }),
  //   body("mobile", "Mobile number must be at least 10 characters").isLength({
  //     min: 10,
  //   }),
  // ],
  async (req, res) => {
    // const errors = validationResult(req);
    // let success = false;
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ success, errors: errors.array() });
    // }

    try {
      let success = false;
      if (!CreateUserSchema.safeParse(req.body).success) {
        return res.status(400).json({ success, error: "Invalid data" });
      }
      let user = await prisma.user.findUnique({
        where: { email: req.body.email },
      });
      if (user) {
        return res.status(400).json({
          success,
          error: "Sorry, a user with this email already exists",
        });
      }

      if (zxcvbn(req.body.password).score < 2) {
        return res
          .status(400)
          .json({ success: false, error: "Password is too weak" });
      }

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      user = await prisma.user.create({
        data: {
          name: req.body.name,
          password: secPass,
          email: req.body.email,
          mobile: req.body.mobile,
          image: "",
          gender: "",
          waitTime: req.body.waitTime,
        },
      });

      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Some error occurred");
    }
  }
);

// ROUTE 2 : Authenticate a User using: POST "/api/auth/login". No login required
router.post(
  "/login",
  // [
  //   body("email", "Enter a valid email").isEmail(),
  //   body("password", "Password cannot be blank").exists(),
  // ],
  async (req, res) => {
    // let success = false;
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    try {
      let success = false;
      if (!AuthenticateUserSchema.safeParse(req.body).success) {
        return res.status(400).json({ success, error: "Invalid data" });
      }
      const { email, password } = req.body;
      let user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        success = false;
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        success = false;
        return res.status(400).json({ success, msg: "Invalid Credentials" });
      }

      const data = {
        user: {
          id: user.id,
        },
      };

      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Internal Server error");
    }
  }
);

// ROUTE 3 : Get logged-in User Details using: POST "/api/auth/getuser". Login required
router.post("/getuser", fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: false, name: true, email: true, mobile: true },
    });
    res.send(user);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server error");
  }
});

router.post("/userdata", async (req, res) => {
  const { token } = req.body;
  try {
    const data = jwt.verify(token, JWT_SECRET);
    const user = data.user;
    const userId = user.id;

    const userData = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userData) {
      return res.status(404).send({ error: "User not found" });
    }
    return res.status(200).send({ status: "Ok", data: userData });
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(401).send({ error: "Invalid token" });
  }
});

router.post("/update-user", async (req, res) => {
  try {
    if (!UpdateUserSchema.safeParse(req.body).success) {
      return res.status(400).json({ error: "Invalid data" });
    }
    const { name, email, mobile, image, gender, waitTime } = req.body;
    await prisma.user.update({
      where: { email },
      data: { name, mobile, image, gender, waitTime },
    });
    res.send({ status: "Ok", data: "Updated" });
  } catch (error) {
    return res.send({ error: error.message });
  }
});



module.exports = router;
