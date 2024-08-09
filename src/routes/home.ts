import { Router } from "express";
import User from "../models/User";
import verifyToken from "../middleware/accessTokenChecker";

const router = Router();

router.post("/notes", verifyToken, async (req, res) => {
  try {
    const { user } = req as any;
    const response = await User.findOne({ email: user.email });
    if (!response)
      return res.status(401).send("User not found, recheck the token");
    res.json(response.notes);
  } catch (e) {
    console.error("Server error");
    res.status(500).send("Server Error");
  }
});

router.post("/sync", verifyToken, async (req, res) => {
  try {
    const { user } = req as any;
    const { data } = req.body;
    await User.updateOne({ email: user.email }, { $push: { notes: data } });
    res.status(200).send("Synced");
  } catch (e) {
    console.error("Server error");
    res.status(500).send("Server Error");
  }
});

export default router;
