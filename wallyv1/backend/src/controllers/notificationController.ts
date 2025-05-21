import { Request, Response } from "express";
import { logError, logInfo } from "../infra/mon/logger";
export async function handleWarpcastWebhook(req: Request, res: Response) {
  const event = req.body.event;

  try {
    switch (event) {
      case "frame_added":
      case "notifications_enabled":
        const { token, url } = req.body.notificationDetails;
        // Save the token and URL to your database
        logInfo(`Notification token added: ${token}`);
        break;

      case "notifications_disabled":
      case "frame_removed":
        // Invalidate the token in your database
        logInfo("Notification token invalidated");
        break;

      default:
        logError("Unhandled event:", event);
    }

    return res.status(200).send("Event processed");
  } catch (error) {
    logError("Error processing webhook:", error);
    return res.status(500).send("Internal Server Error");
  }
}