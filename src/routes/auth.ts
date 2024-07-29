import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

const router = Router();

const accessTokenSecret = `${process.env.ACCESS_TOKEN_SECRET}`;
const refreshTokenSecret = `${process.env.REFRESH_TOKEN_SECRET}`;

let refreshTokens: string[] = [];

router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(`${process.env.HASH_SALT}`)
    );
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).send("User created");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send("Invalid credentials");
    }

    const accessToken = jwt.sign({ email }, accessTokenSecret, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ email }, refreshTokenSecret);

    refreshTokens.push(refreshToken);

    res.json({
      accessToken,
      refreshToken,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.post("/token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).send("Refresh token is required");
  }

  if (!refreshTokens.includes(token)) {
    return res.status(403).send("Invalid refresh token");
  }

  jwt.verify(token, refreshTokenSecret, (err: any, user: any) => {
    if (err) {
      return res.status(403).send("Invalid refresh token");
    }

    const accessToken = jwt.sign(
      { email: (user as any).email },
      accessTokenSecret,
      { expiresIn: "15m" }
    );

    res.json({ accessToken });
  });
});

router.post("/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.status(204).send("Logged out");
});

export default router;
