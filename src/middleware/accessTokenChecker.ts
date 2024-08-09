import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Ensure the environment variable is defined
const accessTokenSecret = `${process.env.ACCESS_TOKEN_SECRET}`;

if (!accessTokenSecret) {
  throw new Error(
    "ACCESS_TOKEN_SECRET is not defined in environment variables"
  );
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).send("Access token required");

  jwt.verify(token, accessTokenSecret as string, (err, user) => {
    if (err) {
      return res.status(401).send(err.message);
    }

    (req as any).user = user; // Optionally, you may need to cast req to any or extend the Request type to include user
    next();
  });
};

export default verifyToken;
