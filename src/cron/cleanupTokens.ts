import cron from "node-cron";
import User from "../models/User";

// Scheduled job to clean up expired tokens every day
cron.schedule("0 0 * * *", async () => {
  try {
    await User.updateMany(
      { "refreshTokens.expiresAt": { $lt: new Date() } },
      { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } }
    );
    console.log("Expired tokens cleaned up.");
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
  }
});
