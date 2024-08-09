import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import homeRoutes from "./routes/home";
import connectDB from "./db";

import "./cron/cleanupTokens";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);

app.use("/home", homeRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
