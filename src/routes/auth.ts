import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";

const router = Router();

const accessTokenSecret = `${process.env.ACCESS_TOKEN_SECRET}`;
const refreshTokenSecret = `${process.env.REFRESH_TOKEN_SECRET}`;

router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // Hash the password
    const saltRounds = parseInt(process.env.HASH_SALT || "10", 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      refreshTokens: [], // Changed to `refreshTokens` for consistency
    });

    // Save the user
    await newUser.save();

    res.status(201).send("User created");
  } catch (error) {
    console.error("Error during signup:", error); // More detailed error logging
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
      expiresIn: "1d",
    });
    const refreshToken = jwt.sign({ email }, refreshTokenSecret, {
      expiresIn: "7d",
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await User.updateOne(
      { email },
      {
        $push: {
          refreshTokens: { token: refreshToken, expiresAt },
        },
      }
    );

    const responseData = {
      accessToken,
      refreshToken,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Server error");
  }
});

router.post("/token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    console.error("Refresh token and email are required");
    return res.status(400).send("Refresh token and email are required");
  }

  try {
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded || typeof decoded === "string" || !decoded.email) {
      console.error("Invalid token format");
      return res.status(400).send("Login Again");
    }

    const { email } = decoded;

    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found");
      return res.status(404).send("Login Again");
    }

    // Check if the token exists and is not expired
    const tokenData = user.refreshTokens.find(
      (rt) => rt.token === token && rt.expiresAt > new Date()
    );
    if (!tokenData) {
      console.error("Invalid or expired refresh token");
      return res.status(403).send("Login Again");
    }

    // Verify the refresh token
    jwt.verify(token, refreshTokenSecret, async (err: any, decoded: any) => {
      if (err) {
        // Remove the invalid token from the user's refreshTokens array
        await User.updateOne(
          { email },
          { $pull: { refreshTokens: { token } } }
        );
        // If error in updating, then will be garabage collected when token expires
        console.error("Refresh token expired, Login again");
        return res.status(403).send("Login again");
      }

      // Generate a new access token
      const accessToken = jwt.sign(
        { email: decoded.email },
        accessTokenSecret,
        { expiresIn: "1d" }
      );

      res.status(200).json({ accessToken });
    });
  } catch (error) {
    console.error("Error during token refresh:", error);
    res.status(500).send("Server error");
  }
});

router.post("/logout", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send("Refresh token is required");
  }

  try {
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded || typeof decoded === "string" || !decoded.email) {
      console.error("Invalid token format");
      return res.status(400).send("Invalid token format");
    }

    const { email } = decoded;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const result = await User.updateOne(
      { email },
      { $pull: { refreshTokens: { token } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).send("Token not found or already removed");
    }

    res.status(204).send("Logged out");
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).send("Server error");
  }
});

export default router;
